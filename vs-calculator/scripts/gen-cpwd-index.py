#!/usr/bin/env python3
"""Regenerate src/data/cpwdCostIndex.ts from the CPWD Building Cost Index
compilation at nsrcivil.in. CPWD issues new circulars every 1 April / 1 October.

Usage: python3 scripts/gen-cpwd-index.py
"""
import urllib.request

URL = "https://nsrcivil.in/cpwd-building-cost-index-states/"
OUT = "src/data/cpwdCostIndex.ts"
import re, json
req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
s = urllib.request.urlopen(req).read().decode("utf-8")
blocks=re.findall(r"(\w+): \{\s*name: '([^']+)'.*?cols: \[(.*?)\],\s*rows: \[(.*?)\]\s*\}",s,re.S)
q=re.compile(r"'([^']*)'")
STATE={"Chattisgarh":"Chhattisgarh","Andaman & Nicobar":"Andaman and Nicobar Islands","Lakshaweep":"Lakshadweep",
 "Daman & Diu":"Dadra and Nagar Haveli and Daman and Diu","Jammu & Kashmir":"Jammu and Kashmir"}
# CPWD station spelling -> city name used in the estimator's location list
ALIAS={"Trivandrum":"Thiruvananthapuram","Calicut":"Kozhikode","Trichur":"Thrissur","Alleppey":"Alappuzha",
 "Badagara":"Vadakara","Wayanad":"Kalpetta","Idukki":"Painavu","Kalaburgi":"Gulbarga","Shivamogga":"Shimoga",
 "Chikamagalur":"Chikmagalur","Kodagu":"Madikeri","Yadgiri":"Yadgir","Koppala":"Koppal","Northcanara":"Karwar",
 "Pernem":"Panaji","Hyderabad":"Hyderabad"}
out={}
for key,name,cols,rows in blocks:
    labels=re.findall(r"label: '([^']+)', base: '([^']+)'",cols)
    rr=[(n,q.findall(v)) for n,v in re.findall(r"\[\s*'([^']+)'\s*,([^\]]*)\]",rows)]
    num=lambda x: re.fullmatch(r"\d+(\.\d+)?",x.strip()) is not None
    counts=[sum(1 for _,v in rr if i<len(v) and num(v[i])) for i in range(len(labels))]
    ci=max(range(len(labels)),key=lambda i:(counts[i],-i))
    st={}
    for n,v in rr:
        if ci>=len(v) or not num(v[ci]): continue
        val=float(v[ci])
        parts=re.split(r"\s*/\s*|\s*&\s*|\s*\(|\)\s*",n.replace(" District",""))
        for p in parts:
            p=p.strip(" ()")
            if not p or p.lower()=="goa": continue
            st.setdefault(ALIAS.get(p,p),val)
    if "Ernakulam" in st: st.setdefault("Kochi",st["Ernakulam"])
    if "Mangalore" in st: st.setdefault("Dakshina Kannada",st["Mangalore"])
    out[STATE.get(name,name)]={"asOf":labels[ci][0],"base":labels[ci][1],"stations":st}
lines=["// AUTO-GENERATED from CPWD Building Cost Index circulars (compiled at",
"// https://nsrcivil.in/cpwd-building-cost-index-states/). For each state the",
"// single circular column with the widest station coverage is used, so indices",
"// within a state are directly comparable. Do not compare across states: each",
"// CPWD region issues its own circular. Regenerate rather than hand-edit.",
"",
"export interface StateCostIndex {","  asOf: string;","  base: string;","  stations: Record<string, number>;","}","",
"export const CPWD_COST_INDEX: Record<string, StateCostIndex> = {"]
for k in sorted(out):
    v=out[k]
    lines.append(f"  {json.dumps(k)}: {{")
    lines.append(f"    asOf: {json.dumps(v['asOf'])}, base: {json.dumps(v['base'])},")
    lines.append("    stations: {")
    for n,x in sorted(v["stations"].items()):
        lines.append(f"      {json.dumps(n)}: {x:g},")
    lines.append("    },")
    lines.append("  },")
lines.append("};")
open(OUT, 'w').write("\n".join(lines)+"\n")
for k,v in out.items(): print(k,v['asOf'],len(v['stations']))
