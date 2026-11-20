#!/usr/bin/env node
const keyword=process.argv.slice(2).join(" ").trim();
if(!keyword){console.error('Usage: node scripts/seo/content-brief.mjs "target keyword"');process.exit(2);}
console.log(`# Editorial brief: ${keyword}

Brand: Vanilla & Somethin' (architecture and interior design studio, Mangalore, Karnataka).
Primary site: https://www.vanillasometh.in/

## Required research
- Check current primary sources for regulations, approvals, material prices and cost data.
- Cost guides must state date checked, geography, measurement basis, scope included, exclusions and sourced assumptions.
- Never invent project facts, client names, awards, testimonials, ratings, project areas, costs or completion dates.
- Use verified project records and approved photography as the source of truth.

## Suggested outline
1. Direct answer to the searcher's question.
2. Regional context and explicit assumptions.
3. Options, process or cost factors with practical examples.
4. Inclusions, exclusions and limitations.
5. Common mistakes / decision checklist.
6. Relevant studio service and verified case-study links.
7. Genuine FAQs, accurately answered.
8. Author / reviewer credentials and last-reviewed date.

## On-page QA
- One clear page intent and one primary H1.
- Unique title, meta description and canonical URL.
- Descriptive headings, useful internal links and descriptive image alt text.
- Add only schema types that accurately describe visible page content.
- Cite authoritative sources close to factual claims.
- Avoid generic keyword-stuffed or mass-generated copy.

## AI search / GEO clarity
- Give quotable direct answers, clear entity names, regional context and definitions.
- Make evidence, dates, limitations and authorship explicit.
- Link to primary sources and relevant project evidence.
- AI visibility cannot be guaranteed.

Draft status: brief only. Human fact-check and approval required before publication.
`);
