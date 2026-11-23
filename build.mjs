// Builds the Let's Talk Renovations landing page.
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
// Run: node build.mjs            (DOMAIN=letstalkrenovations.com node build.mjs adds a CNAME file to dist/)
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
html = html.split('{{APPLY_URL}}').join(APPLY_URL).split('{{BOOK_URL}}').join(BOOK_URL).split('{{ANALYTICS_ID}}').join(ANALYTICS_ID);

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
if (/\[PAT:|DRAFT/i.test(textOf(html))) problems.push('visible placeholder or DRAFT text');
if (/\{\{\w+\}\}/.test(html)) problems.push('leftover template field: ' + html.match(/\{\{\w+\}\}/)[0]);
if (/<form[\s>]|<input[\s>]|<textarea[\s>]|<select[\s>]/i.test(html)) problems.push('a form or input is on the page (this page collects nothing)');
if (problems.length) { console.error('BUILD FAILED\n - ' + problems.join('\n - ')); process.exit(1); }

fs.writeFileSync(path.join(here, 'index.html'), html);

// ---- 5. dist/: only the page and the files it loads ----
const dist = path.join(here, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'index.html'), html);
for (const dir of ['img', 'assets']) fs.cpSync(path.join(here, dir), path.join(dist, dir), { recursive: true });
fs.copyFileSync(path.join(here, 'assets/favicon-48.png'), path.join(dist, 'favicon.png'));
fs.writeFileSync(path.join(dist, 'robots.txt'), 'User-agent: *\nAllow: /\n');
fs.writeFileSync(path.join(dist, '404.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Let\'s Talk Renovations</title><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=/"></head><body><p><a href="/">Go to Let\'s Talk Renovations</a></p></body></html>');
fs.writeFileSync(path.join(dist, '.nojekyll'), '');
if (process.env.DOMAIN) fs.writeFileSync(path.join(dist, 'CNAME'), process.env.DOMAIN);
const files = fs.readdirSync(dist, { recursive: true }).length;
console.log('index.html written,', Math.round(html.length / 1024), 'KB; checks passed; dist/ has', files, 'entries');
