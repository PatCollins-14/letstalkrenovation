// Builds the Let's Talk Renovation landing page.
// Source: index.src.html  ->  index.html (preview) and dist/ (the deployable site).
// Same rules as the FinanceMyADU landing (adu-geo-build/landing/build.mjs), plus the Let's Talk rules:
//  1. fills {{APPLY_URL}} (LendingPad application), {{BOOK_URL}} (Pat's booking page), {{ANALYTICS_ID}} (empty = no analytics, no cookie bar)
//  2. adds "(ARV)" after every "after renovation" in the page text (not inside data-no-arv elements)
//  2b. capitalizes every "Renovation" and "Remodel" (plurals, -ed, -ing too) in text, title, description, alt and labels
//  2c. puts every h2 and h3 in Title Case
//  3. joins the last two words of every text block with a no-break space (no orphan words)
//  4. fails on: banned phrases (config/banned-phrases.json; dollar figures and percentages only inside <article data-scenario>),
//     the program source company's names, Pat's name outside the footer and the advisor card, a missing "(ARV)",
//     a lowercase renovation/remodel, a CSLB number without "Mars Construction" right before it, an application
//     link whose text is not exactly "Get Pre-qualified", "free" anywhere except the ADU site's free online lot check,
//     a leftover {{...}}, any visible placeholder, and any form or input (this page collects nothing)
// Run: node build.mjs            (DOMAIN=letstalkrenovation.com node build.mjs adds a CNAME file to dist/)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
let html = fs.readFileSync(path.join(here, 'index.src.html'), 'utf8');

// Runs fn on the page's text only: never inside tags (attributes), scripts, styles or comments
const SPLIT = /(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->|<[^>]+>)/;
const onText = (h, fn) => h.split(SPLIT).map((part, i) => (i % 2 ? part : fn(part))).join('');

// ---- 1. links ----
// E Mortgage Capital LendingPad application (same link as financemyadu.io and the LTHM check funnel)
const APPLY_URL = process.env.APPLY_URL || 'https://prod.lendingpad.com/emci/38d77370-2060-489a-a024-4bdc8db0a865/pos#/';
// Pat's booking page (same as the Book links and the QR on the Let's Talk ADU blueprint PDF)
const BOOK_URL = process.env.BOOK_URL || 'https://link.theradcrm.com/widget/bookings/appointment-booking-with-pat-collins';
const ANALYTICS_ID = process.env.ANALYTICS_ID || '';
// Domain: until DOMAIN is set the page stays noindex and the canonical/OG tags point at the planned address
const DOMAIN = (process.env.DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/+$/, '').replace(/^www\./i, '').toLowerCase();
const APEX = DOMAIN || 'letstalkrenovation.com';
const WWW_HOST = 'www.' + APEX;
const SITE_URL = 'https://' + WWW_HOST;
const ROBOTS = DOMAIN ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' : 'noindex, nofollow';
const MODIFIED = new Date().toISOString().slice(0, 10);
html = html.split('{{APPLY_URL}}').join(APPLY_URL).split('{{BOOK_URL}}').join(BOOK_URL).split('{{ANALYTICS_ID}}').join(ANALYTICS_ID)
  .split('{{SITE_URL}}').join(SITE_URL).split('{{ROBOTS}}').join(ROBOTS).split('{{APEX_HOST}}').join(APEX);

// ---- 2. (ARV) after every "after renovation" ----
const AFTER_RENO = /\b(after(?:-|&#8209;|‑|&nbsp;| )renovation)((?:\s|&nbsp;)+value)?(?!(?:\s|&nbsp;)*\(ARV\))(?!(?:\s|&nbsp;)+value(?:\s|&nbsp;)*\(ARV\))/gi;
const NO_ARV = /<(\w+)\b[^>]*\sdata-no-arv\b[^>]*>[\s\S]*?<\/\1>/g;
const keptAsIs = [];
html = html.replace(NO_ARV, m => { keptAsIs.push(m); return `\u0000NOARV${keptAsIs.length - 1}\u0000`; });
html = onText(html, t => t.replace(AFTER_RENO, (m, a, v) => `${a}${v || ''}&nbsp;(ARV)`));
html = html.replace(/\u0000NOARV(\d+)\u0000/g, (m, i) => keptAsIs[+i]);

// ---- 2b. "Renovation" and "Remodel" always capitalized (Pat's rule) ----
const RENO_WORDS = /\b(renovations?|remodel(?:s|ed|ing)?)\b/gi;
const capWord = w => w.charAt(0).toUpperCase() + w.slice(1);
html = html.split(SPLIT).map((part, i) => i % 2
  ? (part.startsWith('<script') || part.startsWith('<style') ? part
    : part.replace(/\b(content|alt|aria-label|title)="([^"]*)"/g, (a, k, v) => k + '="' + v.replace(RENO_WORDS, capWord) + '"'))
  : part.replace(RENO_WORDS, capWord)).join('');

// ---- 2c. Title Case for every h2 and h3 ----
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'off', 'on', 'or', 'per', 'the', 'to', 'up', 'via', 'vs', 'vs.']);
function titleCase(text, state) {
  return text.replace(/&#?\w+;|[A-Za-z][A-Za-z'’.]*(?:(?:-|&#8209;)[A-Za-z][A-Za-z'’]*)*/g, word => {
    if (word.startsWith('&')) return word;
    const first = state.first; state.first = false;
    return word.split(/(-|&#8209;)/).map((part, i) => {
      if (i % 2) return part;
      if (!first && i === 0 && SMALL.has(part.toLowerCase())) return part.toLowerCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join('');
  });
}
html = html.replace(/(<h([23])\b[^>]*>)([\s\S]*?)(<\/h\2>)/g, (m, open, lvl, inner, close) => {
  const state = { first: true };
  const segs = inner.split(/(<[^>]+>)/).map((p, i) => (i % 2 ? p : titleCase(p, state)));
  for (let i = segs.length - 1; i >= 0; i -= 1) {
    if (i % 2 || !/[A-Za-z]/.test(segs[i].replace(/&#?\w+;/g, ''))) continue;
    segs[i] = segs[i].replace(/\b([a-z]+)(?=(?:[^A-Za-z&]|&#?\w+;)*$)/, w => w.charAt(0).toUpperCase() + w.slice(1));
    break;
  }
  return open + segs.join('') + close;
});

// ---- 3. no orphan words ----
const parts = html.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>)/);
const TAGS = 'h1|h2|h3|h4|p|li|button|summary|figcaption|blockquote|dt|dd|a|span|small|div|em|strong|b';
const WORD = '(?:[^\\s<>&;]|&#\\d+;)+';
const lastTwo = new RegExp('(' + WORD + ') (' + WORD + ')(</(?:' + TAGS + ')>)', 'g');
for (let i = 0; i < parts.length; i += 2) parts[i] = parts[i].replace(lastTwo, '$1&nbsp;$2$3');
html = parts.join('');

// ---- 3b. structured data (JSON-LD) for search and AI answers; the FAQ part is read from the visible questions ----
const plain = h => h.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&#8209;/g, '-').replace(/&#8211;/g, '–').replace(/&amp;/g, '&')
  .replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/&middot;/g, '·').replace(/\s+/g, ' ').trim();
const faqBlock = (html.match(/<div class="faq">([\s\S]*?)\n    <\/div>/) || [])[1] || '';
const faq = [...faqBlock.matchAll(/<details><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)].map(m => ({ q: plain(m[1]), a: plain(m[2]) }));
const steps = [...html.matchAll(/<div class="tl"><span class="n">\d<\/span><h3>([\s\S]*?)<\/h3><p>([\s\S]*?)<\/p><\/div>/g)].map(m => ({ name: plain(m[1]), text: plain(m[2]) }));
const COUNTIES = ['Los Angeles County, CA', 'Orange County, CA', 'Riverside County, CA', 'San Bernardino County, CA', 'San Diego County, CA', 'Ventura County, CA'];
const areaServed = COUNTIES.map(name => ({ '@type': 'AdministrativeArea', name }));
const SERVICES = [
  ['Kitchen Remodel', 'New layouts, cabinets, counters, islands, lighting and plumbing moves.'],
  ['Bathroom Remodel', 'Tub-to-shower conversions, vanities, tile and fixtures.'],
  ['Room Addition', 'A new bedroom, office or family room built onto the house.'],
  ['Whole-Home Interior Remodel', 'Opening walls, smoothing ceilings, new floors, lighting and finishes.'],
  ['Exterior Renovation', 'Roofing, stucco and siding, windows, covered entries and landscaping.'],
  ['Backyard and Outdoor Living', 'Patios, pergolas, outdoor kitchens and pools.']
];
const ld = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': SITE_URL + '/#org', name: "Let's Talk Renovation", url: SITE_URL + '/', logo: SITE_URL + '/img/logo.png', telephone: '+1-949-787-2662', areaServed,
      description: 'Southern California home Renovations planned, financed and built by one team: construction by Mars Construction (CSLB #1138550) and the After Renovation Value (ARV) HELOC through E Mortgage Capital Inc. (NMLS #1416824).',
      knowsAbout: ['Kitchen Remodeling', 'Bathroom Remodeling', 'Room additions', 'Whole-home Renovation', 'Renovation financing', 'Home equity lines of credit', 'After Renovation Value (ARV) HELOC'],
      hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Home Renovation services and financing', itemListElement: [
        ...SERVICES.map(([name, description]) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name, description, serviceType: 'Home Renovation', provider: { '@id': 'https://marsx.construction/#mars' }, areaServed } })),
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'After Renovation Value (ARV) HELOC', serviceType: 'Home equity line of credit',
          description: 'A second-lien home equity line sized on the appraised as-finished value of the home, so the first mortgage stays in place. Primary residences and second homes, 1-2 units. Subject to credit, income, property and underwriting approval.',
          provider: { '@id': SITE_URL + '/#lender' }, areaServed } },
        { '@type': 'Offer', url: 'https://www.letstalkadu.com/', itemOffered: { '@type': 'Service', name: 'Accessory Dwelling Unit (ADU)', serviceType: 'ADU design, financing and construction',
          description: "Detached ADUs, garage conversions, attached ADUs and junior ADUs through the sister site Let's Talk ADU, built by Mars Construction.", provider: { '@id': 'https://marsx.construction/#mars' }, areaServed } }
      ] } },
    { '@type': 'GeneralContractor', '@id': 'https://marsx.construction/#mars', name: 'Mars Construction Industries Corp', alternateName: 'MARS Construction', url: 'https://marsx.construction/', telephone: '+1-949-787-2662', areaServed,
      hasCredential: { '@type': 'EducationalOccupationalCredential', credentialCategory: 'license', name: 'California contractor license #1138550 (Classes A, B, C-36, C-20)',
        recognizedBy: { '@type': 'Organization', name: 'Contractors State License Board', url: 'https://www.cslb.ca.gov/' } } },
    { '@type': 'FinancialService', '@id': SITE_URL + '/#lender', name: 'E Mortgage Capital Inc.', identifier: { '@type': 'PropertyValue', propertyID: 'NMLS', value: '1416824' }, telephone: '+1-949-787-2662',
      address: { '@type': 'PostalAddress', streetAddress: '3750 S. Susan Street', addressLocality: 'Santa Ana', addressRegion: 'CA', postalCode: '92704', addressCountry: 'US' },
      employee: { '@type': 'Person', name: 'Pat Collins', jobTitle: 'Mortgage Professional', identifier: [{ '@type': 'PropertyValue', propertyID: 'NMLS', value: '1628553' }, { '@type': 'PropertyValue', propertyID: 'California DRE', value: '02143449' }] } },
    { '@type': 'WebSite', '@id': SITE_URL + '/#website', url: SITE_URL + '/', name: "Let's Talk Renovation", publisher: { '@id': SITE_URL + '/#org' }, inLanguage: 'en-US' },
    { '@type': 'WebPage', '@id': SITE_URL + '/#webpage', url: SITE_URL + '/', name: plain((html.match(/<title[^>]*>([^<]*)<\/title>/) || [])[1] || ''),
      description: plain((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || ''), inLanguage: 'en-US', dateModified: MODIFIED,
      isPartOf: { '@id': SITE_URL + '/#website' }, about: { '@id': SITE_URL + '/#org' }, publisher: { '@id': SITE_URL + '/#org' },
      primaryImageOfPage: { '@type': 'ImageObject', url: SITE_URL + '/img/og-image.jpg', width: 1200, height: 630 } },
    { '@type': 'HowTo', '@id': SITE_URL + '/#howto', name: 'How a Let\'s Talk Renovation project works, from first call to final inspection', isPartOf: { '@id': SITE_URL + '/#webpage' },
      step: steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text })) },
    { '@type': 'FAQPage', '@id': SITE_URL + '/#faq', isPartOf: { '@id': SITE_URL + '/#webpage' },
      mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }
  ]
};
html = html.replace('{{JSON_LD}}', JSON.stringify(ld).replace(/</g, '\\u003c'));

// ---- 4. checks ----
const textOf = h => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&middot;/g, '·').replace(/&amp;/g, '&').replace(/&#8209;/g, '-').replace(/&#?\w+;/g, ' ').replace(/\s+/g, ' ');
const scenarioFree = html.replace(/<article[^>]*data-scenario[^>]*>[\s\S]*?<\/article>/g, ' ');
const SCENARIO_ONLY = ['dollar-amount', 'percent'];
const banned = JSON.parse(fs.readFileSync(path.join(here, 'config/banned-phrases.json'), 'utf8'));
let body = textOf(html), bodyNoScenario = textOf(scenarioFree);
for (const ok of banned.allowedExact) { body = body.split(ok).join(' '); bodyNoScenario = bodyNoScenario.split(ok).join(' '); }
const problems = [];
for (const p of banned.patterns) {
  const hay = SCENARIO_ONLY.includes(p.id) ? bodyNoScenario : body;
  const m = hay.match(new RegExp(p.re, 'i'));
  if (m) problems.push(`${p.id}: "${m[0]}"`);
}
const SOURCE_NAMES = /reno\s*-?fi\b|quorum|qfcu|federal credit union|powered by|partners\.\w+\.org/i;
const hit = html.match(SOURCE_NAMES);
if (hit) problems.push(`source company name: "${hit[0]}"`);
// Pat's name only in the footer and the advisor card
const noFooter = html.replace(/<footer[\s\S]*?<\/footer>/, ' ').replace(/<section[^>]*aria-labelledby="advisor-title"[\s\S]*?<\/section>/, ' ').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, ' ');
const pat = noFooter.match(/[^<>"]{0,40}\b(Pat|Collins)\b[^<>"]{0,40}/);
if (pat) problems.push(`Pat's name outside the footer and advisor card: "${pat[0].trim()}"`);
const missingArv = textOf(html.replace(NO_ARV, ' ')).match(/after[- ]renovation(?! value \(ARV\))(?! \(ARV\))[^.]{0,20}/i);
if (missingArv) problems.push(`"after renovation" without (ARV): "${missingArv[0]}"`);
const lowerReno = (textOf(html) + ' ' + (html.match(/<title[^>]*>[^<]*|content="[^"]*"|alt="[^"]*"|aria-label="[^"]*"/g) || []).join(' ')).match(/\b(renovations?|remodel(?:s|ed|ing)?)\b/);
if (lowerReno) problems.push(`lowercase "${lowerReno[0]}" (Pat's rule: Renovation / Remodel)`);
// Every CSLB mention carries Mars Construction's name right before it (Pat's rule)
const allText = textOf(html) + ' ' + (html.match(/content="[^"]*"|alt="[^"]*"|aria-label="[^"]*"/g) || []).join(' ');
for (const m of allText.matchAll(/.{0,40}CSLB/g)) if (!/Mars Construction\s*$/.test(m[0].replace(/CSLB$/, ''))) problems.push(`CSLB without "Mars Construction" before it: "${m[0]}"`);
// Every application link reads exactly "Get Pre-qualified" (Pat's rule)
const applyRe = new RegExp('<a\\b[^>]*href="' + APPLY_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[^>]*>([\\s\\S]*?)</a>', 'g');
for (const m of html.matchAll(applyRe)) { const t = textOf(m[1]).trim(); if (t !== 'Get Pre-qualified') problems.push(`application link text "${t}" (must be exactly "Get Pre-qualified")`); }
// "free" only for Let's Talk ADU's online lot check; never for a visit, walk, consult or call
const freeHit = body.replace(/free online lot check/gi, ' ').match(/.{0,30}\bfree\b.{0,30}/i);
if (freeHit) problems.push(`"free" outside the online lot check: "${freeHit[0]}"`);
// Regulation Z trigger terms stay off the page (no APR or fee disclosures yet): payment terms, repayment periods, down payments
const trigger = bodyNoScenario.match(/.{0,30}(\binterest[- ]only\b|\b\d+[- ]?(?:year|yr|month)s?\b(?! old)|\bdraw period of\b|\b(?:minimum )?monthly payments?\b|\bdown payment of\b|\d+\s?% down).{0,30}/i);
if (trigger) problems.push(`Reg Z trigger term outside the example: "${trigger[0]}"`);
// Structured data must be valid JSON, and the FAQ schema must cover every visible question
try { const g = JSON.parse(html.match(/<script type="application\/ld\+json" id="ld">([\s\S]*?)<\/script>/)[1]); const f = g['@graph'].find(x => x['@type'] === 'FAQPage');
  if (!f || f.mainEntity.length !== faq.length || faq.length < 5) problems.push('FAQ structured data does not match the visible FAQ');
  if (steps.length !== 4) problems.push('HowTo steps not found'); } catch (e) { problems.push('structured data is not valid JSON: ' + e.message); }
// Required disclosures are on the page
for (const need of ['This is not a commitment to lend', 'NMLS #1416824', 'NMLS #1628553', 'DRE #02143449', 'Equal Housing Opportunity', 'separate, independent companies', 'AI-generated illustrations', 'NMLS Consumer Access', 'Pre-qualifying is not a loan approval'])
  if (!body.includes(need)) problems.push(`missing disclosure: "${need}"`);
if (/Let(?:'|&#39;|’)s Talk Renovations/i.test(html)) problems.push('brand must read "Let\'s Talk Renovation" (singular)');
if (!html.includes("location.replace('https://www.'")) problems.push('the www redirect script is missing from the page');
if (/\[PAT:|DRAFT/i.test(textOf(html))) problems.push('visible placeholder or DRAFT text');
if (/\{\{\w+\}\}/.test(html)) problems.push('leftover template field: ' + html.match(/\{\{\w+\}\}/)[0]);
// The only input allowed is the before/after slider's range control (keyboard and screen-reader access); it collects nothing
const inputs = (html.match(/<input\b[^>]*>/gi) || []).filter(t => !/type="range"/.test(t) || !/class="ba-range"/.test(t));
if (/<form[\s>]|<textarea[\s>]|<select[\s>]/i.test(html) || inputs.length) problems.push('a form or input is on the page (this page collects nothing)');
if (problems.length) { console.error('BUILD FAILED\n - ' + problems.join('\n - ')); process.exit(1); }

fs.writeFileSync(path.join(here, 'index.html'), html);

// ---- 5. dist/: only the page and the files it loads ----
const dist = path.join(here, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'index.html'), html);
for (const dir of ['img', 'assets']) fs.cpSync(path.join(here, dir), path.join(dist, dir), { recursive: true });
fs.copyFileSync(path.join(here, 'assets/favicon-48.png'), path.join(dist, 'favicon.png'));
// robots.txt: search and AI crawlers welcome (same list as letstalkadu.com); the page's own meta tag decides indexing
const BOTS = ['*', 'Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended'];
fs.writeFileSync(path.join(dist, 'robots.txt'), "# Let's Talk Renovation: search and AI crawlers are welcome.\n" + BOTS.map(b => `User-agent: ${b}\nAllow: /\n`).join('\n') + `\nSitemap: ${SITE_URL}/sitemap.xml\n`);
// sitemap.xml with the slider and ADU images
const imgs = [...new Set([...html.matchAll(/(?:src|href)="(img\/(?:ba\/[a-z]+-after|adu\/[a-z-]+)\.webp)"/g)].map(m => m[1]))];
const ALL_BA = ['kitchen', 'bath', 'living', 'exterior', 'backyard', 'addition'].map(k => `img/ba/${k}-after.webp`);
const imgList = [...new Set([...ALL_BA, ...imgs])];
const xmlEsc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
fs.writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${MODIFIED}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
${imgList.map(i => `    <image:image><image:loc>${SITE_URL}/${i}</image:loc><image:title>${xmlEsc(i.replace(/^img\/(ba|adu)\//, '').replace(/\.webp$/, '').replace(/-/g, ' '))} (AI illustration)</image:title></image:image>`).join('\n')}
  </url>
</urlset>
`);
// llms.txt: a plain-language summary for AI assistants (same idea as letstalkadu.com/llms.txt)
fs.writeFileSync(path.join(dist, 'llms.txt'), fs.readFileSync(path.join(here, 'llms.txt'), 'utf8').split('{{SITE_URL}}').join(SITE_URL).split('{{MODIFIED}}').join(MODIFIED));
if (fs.existsSync(path.join(here, 'brand/og-image.jpg'))) fs.copyFileSync(path.join(here, 'brand/og-image.jpg'), path.join(dist, 'img/og-image.jpg'));
fs.writeFileSync(path.join(dist, '404.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Let\'s Talk Renovation</title><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=/"></head><body><p><a href="/">Go to Let\'s Talk Renovation</a></p></body></html>');
fs.writeFileSync(path.join(dist, '.nojekyll'), '');
// GitHub Pages: with the www host in CNAME (and DNS for both names), Pages itself redirects the bare domain to www
if (DOMAIN) fs.writeFileSync(path.join(dist, 'CNAME'), WWW_HOST);
const files = fs.readdirSync(dist, { recursive: true }).length;
console.log('index.html written,', Math.round(html.length / 1024), 'KB; checks passed; dist/ has', files, 'entries');
