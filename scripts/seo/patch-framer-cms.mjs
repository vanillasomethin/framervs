#!/usr/bin/env node
/**
 * Applies scripts/seo/framer-cms-copy.mjs to the self-hosted Framer site:
 *   1. the CMS collection data (public/js/*-chunk-*.framercms + *-indexes-*.framercms),
 *      which Framer renders on client-side navigation;
 *   2. the server-rendered HTML (what Google and first-time visitors see);
 *   3. Framer's site-search indexes (searchIndex*.json).
 *
 * The .framercms format (reverse-engineered, verified by byte-exact round trip):
 *   chunk:   u32 itemCount, then per item: u16 fieldCount, then per field:
 *            u32 nameLen, name, u8 type, payload
 *   types:   0x0c string / 0x0a JSON / 0x07 link (u32 len + bytes), 0x0b rich text (u8 flag, u32 len, JSON),
 *            0x04 date (8 bytes), 0x00 null
 *   indexes: sections at byte ranges declared in the collection module; each section is
 *            u32 len + JSON header, u8 nFields, field names (u32 len + name), u32 n, then per
 *            entry: one value per field + pointer (u16 chunk, u32 itemOffset, u32 itemLength).
 *
 * Changing a string changes item offsets, so pointers and section ranges are rebuilt. New
 * data files get content-hashed names so a visitor holding a cached copy of the old module
 * keeps reading the old (unchanged) files instead of a mismatched mix.
 *
 *   node scripts/seo/patch-framer-cms.mjs          # apply
 *   node scripts/seo/patch-framer-cms.mjs --check  # exit 1 if anything is left to apply
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { REPLACEMENTS } from "./framer-cms-copy.mjs";

const CHECK = process.argv.includes("--check");
const pub = path.resolve(process.cwd(), "public");
const jsDir = path.join(pub, "js");

// ---------- binary helpers ----------
class Reader {
  constructor(buf, pos = 0) { this.b = buf; this.p = pos; }
  u8() { return this.b[this.p++]; }
  u16() { const v = this.b.readUInt16BE(this.p); this.p += 2; return v; }
  u32() { const v = this.b.readUInt32BE(this.p); this.p += 4; return v; }
  bytes(n) { const v = this.b.subarray(this.p, this.p + n); this.p += n; return v; }
  str() { return this.bytes(this.u32()).toString("utf8"); }
}
const u8 = (v) => Buffer.from([v]);
const u16 = (v) => { const b = Buffer.alloc(2); b.writeUInt16BE(v); return b; };
const u32 = (v) => { const b = Buffer.alloc(4); b.writeUInt32BE(v); return b; };
const lstr = (s) => { const b = Buffer.from(s, "utf8"); return Buffer.concat([u32(b.length), b]); };

function readValue(r) {
  const type = r.u8();
  if (type === 0x0c || type === 0x0a || type === 0x07) return { type, text: r.str() };
  if (type === 0x0b) { const flag = r.u8(); return { type, flag, text: r.str() }; }
  if (type === 0x04) return { type, raw: Buffer.from(r.bytes(8)) };
  if (type === 0x00) return { type };
  throw new Error(`Unknown framercms value type 0x${type.toString(16)} at byte ${r.p - 1}`);
}
function writeValue(v) {
  if (v.type === 0x0c || v.type === 0x0a || v.type === 0x07) return Buffer.concat([u8(v.type), lstr(v.text)]);
  if (v.type === 0x0b) return Buffer.concat([u8(v.type), u8(v.flag), lstr(v.text)]);
  if (v.type === 0x04) return Buffer.concat([u8(v.type), v.raw]);
  return u8(v.type);
}

function parseChunk(buf) {
  const r = new Reader(buf);
  const count = r.u32();
  const items = [];
  for (let i = 0; i < count; i++) {
    const offset = r.p;
    const fields = [];
    const n = r.u16();
    for (let f = 0; f < n; f++) fields.push([r.str(), readValue(r)]);
    items.push({ offset, length: r.p - offset, fields });
  }
  if (r.p !== buf.length) throw new Error("chunk: trailing bytes");
  return items;
}
function writeChunk(items) {
  const parts = [u32(items.length)];
  let pos = 4;
  for (const it of items) {
    const body = Buffer.concat([u16(it.fields.length), ...it.fields.map(([name, v]) => Buffer.concat([lstr(name), writeValue(v)]))]);
    it.newOffset = pos; it.newLength = body.length; pos += body.length;
    parts.push(body);
  }
  return Buffer.concat(parts);
}

function parseSection(buf, from, to) {
  const r = new Reader(buf, from);
  const header = r.str();
  const names = Array.from({ length: r.u8() }, () => r.str());
  const n = r.u32();
  const entries = [];
  for (let i = 0; i < n; i++) {
    const values = names.map(() => readValue(r));
    entries.push({ values, chunk: r.u16(), offset: r.u32(), length: r.u32() });
  }
  if (r.p !== to) throw new Error(`index section ${from}-${to} ended at ${r.p}`);
  return { header, names, entries };
}
function writeSection(s) {
  return Buffer.concat([
    lstr(s.header), u8(s.names.length), ...s.names.map(lstr), u32(s.entries.length),
    ...s.entries.map((e) => Buffer.concat([...e.values.map(writeValue), u16(e.chunk), u32(e.offset), u32(e.length)])),
  ]);
}

// ---------- text replacement ----------
const hits = new Map(REPLACEMENTS.map(([from]) => [from, 0]));
const already = new Map(REPLACEMENTS.map(([from]) => [from, 0]));
const jsonInner = (s) => JSON.stringify(s).slice(1, -1);
function replaceIn(text, encode = (s) => s, variants = (s) => [s]) {
  let out = text;
  for (const [from, to] of REPLACEMENTS) {
    for (const f of variants(from)) {
      const ef = encode(f);
      if (out.includes(ef)) { out = out.split(ef).join(encode(to)); hits.set(from, hits.get(from) + 1); }
    }
    if (to.length > 3 && out.includes(encode(to))) already.set(from, already.get(from) + 1);
  }
  return out;
}
const fixValue = (v) => {
  if (v.type === 0x0c) v.text = replaceIn(v.text);
  else if (v.type === 0x0b) v.text = replaceIn(v.text, jsonInner);
};

// ---------- 1. CMS collections ----------
let changedFiles = [];
for (const modName of fs.readdirSync(jsDir).filter((f) => f.endsWith(".mjs"))) {
  const modPath = path.join(jsDir, modName);
  let mod = fs.readFileSync(modPath, "utf8");
  const chunkRefs = [...mod.matchAll(/new URL\("js\/([^"]+-chunk-[^"]+\.framercms)"/g)].map((m) => m[1]);
  if (!chunkRefs.length) continue;
  const indexRefs = [...new Set([...mod.matchAll(/url:new URL\("js\/([^"]+-indexes-[^"]+\.framercms)"/g)].map((m) => m[1]))];
  if (chunkRefs.length !== 1 || indexRefs.length !== 1) { console.log(`skip ${modName}: ${chunkRefs.length} chunks / ${indexRefs.length} index files not supported`); continue; }

  const chunkBuf = fs.readFileSync(path.join(jsDir, chunkRefs[0]));
  const items = parseChunk(chunkBuf);
  if (!writeChunk(parseChunk(chunkBuf)).equals(chunkBuf)) throw new Error(`${chunkRefs[0]}: round trip mismatch`);
  for (const it of items) for (const [, v] of it.fields) fixValue(v);
  const newChunk = writeChunk(items);
  const ptr = new Map(items.map((it) => [`${it.offset}:${it.length}`, it]));

  const idxBuf = fs.readFileSync(path.join(jsDir, indexRefs[0]));
  const rangeRe = /range:\{from:(\d+),to:(\d+)\}/g;
  const ranges = [...mod.matchAll(rangeRe)].map((m) => [Number(m[1]), Number(m[2])]);
  const sections = ranges.map(([a, b]) => parseSection(idxBuf, a, b));
  const parts = []; const newRanges = []; let pos = 0;
  for (const s of sections) {
    for (const e of s.entries) {
      e.values.forEach(fixValue);
      const it = ptr.get(`${e.offset}:${e.length}`);
      if (!it || e.chunk !== 0) throw new Error(`index pointer ${e.chunk}/${e.offset}/${e.length} matches no item`);
      e.offset = it.newOffset; e.length = it.newLength;
    }
    const b = writeSection(s); parts.push(b); newRanges.push([pos, pos + b.length]); pos += b.length;
  }
  const newIdx = Buffer.concat(parts);
  if (newChunk.equals(chunkBuf) && newIdx.equals(idxBuf)) { console.log(`${modName}: CMS already up to date`); continue; }
  if (CHECK) { changedFiles.push(chunkRefs[0]); continue; }

  // Sanity: the rebuilt files parse and every pointer lands on an item start.
  const check = parseChunk(newChunk);
  const starts = new Set(check.map((i) => `${i.offset}:${i.length}`));
  newRanges.forEach(([a, b]) => parseSection(newIdx, a, b).entries.forEach((e) => { if (!starts.has(`${e.offset}:${e.length}`)) throw new Error("bad rebuilt pointer"); }));

  const hash = (b) => crypto.createHash("sha256").update(b).digest("hex").slice(0, 8);
  const rename = (name, buf) => name.replace(/(?:\.v[0-9a-f]{8})?\.framercms$/, `.v${hash(buf)}.framercms`);
  const newChunkName = rename(chunkRefs[0], newChunk), newIdxName = rename(indexRefs[0], newIdx);
  fs.writeFileSync(path.join(jsDir, newChunkName), newChunk);
  fs.writeFileSync(path.join(jsDir, newIdxName), newIdx);
  let i = 0;
  mod = mod.replace(rangeRe, () => { const [a, b] = newRanges[i++]; return `range:{from:${a},to:${b}}`; })
    .split(`js/${chunkRefs[0]}`).join(`js/${newChunkName}`).split(`js/${indexRefs[0]}`).join(`js/${newIdxName}`);
  fs.writeFileSync(modPath, mod);
  // Drop superseded generated versions; the original export files stay for cached old modules.
  for (const f of [chunkRefs[0], indexRefs[0]]) if (/\.v[0-9a-f]{8}\.framercms$/.test(f) && f !== newChunkName && f !== newIdxName) fs.rmSync(path.join(jsDir, f));
  changedFiles.push(modName, newChunkName, newIdxName);
  console.log(`${modName}: CMS rewritten -> ${newChunkName}, ${newIdxName}`);
}

// ---------- 2. Server-rendered HTML and 3. search indexes ----------
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// The HTML went through an earlier em-dash cleanup: " — " became " ,  " and "—" became ", ".
const htmlVariants = (s) => [...new Set([s, s.split(" — ").join(" ,  ").split("—").join(", ")])];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const targets = walk(pub).filter((f) => !/[\\/](admin|onboard|uploads|fr[\\/]images|fr[\\/]assets)[\\/]/.test(f) && (/\.html$/.test(f) || /searchindex[^/\\]*\.json$/i.test(f)));
for (const f of targets) {
  const src = fs.readFileSync(f, "utf8");
  const isJson = f.endsWith(".json");
  let out = isJson ? replaceIn(src, jsonInner) : replaceIn(src, esc, htmlVariants);
  if (!isJson) out = out.split(" ,  ").join(", ");
  if (out !== src) {
    if (CHECK) { changedFiles.push(path.relative(pub, f)); continue; }
    fs.writeFileSync(f, out); changedFiles.push(path.relative(pub, f));
  }
}

const missing = [...hits].filter(([from, n]) => n === 0 && already.get(from) === 0);
for (const [from] of missing) console.log(`WARN replacement not found anywhere: "${from.slice(0, 70)}"`);
if (CHECK) {
  if (changedFiles.length) { console.log(`Framer CMS copy out of date in: ${changedFiles.join(", ")}\nRun node scripts/seo/patch-framer-cms.mjs`); process.exit(1); }
  console.log("Framer CMS copy up to date");
} else {
  console.log(`${changedFiles.length} file(s) updated`);
}
