# Let's Talk Renovation (landing page)

**Name:** the brand is **Let's Talk Renovation** (singular, Pat 2026-11-24); the build fails on "Let's Talk Renovations". The project folder keeps its old name. **Address:** always **www.letstalkrenovation.com**. The page carries a tiny script that sends any visit on the bare domain to www (path, ad tags and #section kept), and `DOMAIN=letstalkrenovation.com node build.mjs` writes `www.letstalkrenovation.com` to CNAME so GitHub Pages also redirects the bare domain at the server. DNS then needs both names: A records for the bare domain to GitHub Pages and a www CNAME to patcollins-14.github.io.

**v4 (2026-11-24):** the Project Ideas gallery is replaced by an "Add an ADU" section that sends people to Let's Talk ADU (four ADU types with photos from letstalkadu.com, lot-check button); the at-a-glance box is gone and the FAQ is 12 questions in a logical order (what it is, the financing, eligibility, the builder, costs, getting started, area, photos).

The third site in the Let's Talk family, built 2026-11-24 on the same method as the other two:

| Site | Job | Ladder stage it feeds |
|---|---|---|
| letstalkadu.com | Add a home: free online lot check, ADU build by Mars Construction | Avatar → Lead (lot check form) |
| **Let's Talk Renovation** (this) | Improve the home: kitchens, baths, additions, whole-home, exterior, pools; Mars Construction builds | Avatar → Suspect (Book a Call) → Prospect (Get Pre-qualified) |
| financemyadu.io | Pay for it: After Renovation Value (ARV) HELOC, no refinance | Prospect → Customer |

**Design (v2, 2026-11-24):** rebuilt on the letstalkadu.com design system at Pat's request: white nav with the menu panel, light sky hero with the highlighted headline, and the same before/after drag slider, here with 6 tabs (kitchen, bath, whole home, exterior, backyard, addition) and a Plan / Financing / Build card under it. Then the usual-way vs 3-in-1 compare (a switch on phones), a sliding "Project Ideas" gallery with arrows and dots, the financing block (Key Advantages, four lists, a worked example, the FinanceMyADU box like the one on letstalkadu.com), the timeline + navy banner, the team cards (Pat and Mars Construction), FAQ, the split final section and the letstalkadu footer. Pat said no "3 sites" card section; the sister sites are linked only from the gallery's last card (ADU), the FinanceMyADU box and the footer. The first design is kept in `brand/v1/`.

Static page, no form (no spam risk, no webhook): every action is "Get Pre-qualified" (LendingPad, same link as financemyadu.io), "Book a Call" (Pat's booking page) or the phone number.

## Live hosting
- **Hostinger Node.js web app** (moved from GitHub Pages on 2026-11-24, at Pat's request): Business plan, site letstalkrenovation.com, framework Express, Node 22.x, npm, entry file `server.js`. Source of truth is the GitHub repo PatCollins-14/letstalkrenovation (branch main).
- **How it was deployed:** "Upload your files" with a zip of the repo, because hPanel was open in *admin access* mode, where Hostinger disables GitHub deployment ("temporarily disabled while managing clients"). **To update the site:** commit and push, run `git archive --format=zip -o letstalkrenovation-site.zip HEAD`, then upload that zip in hPanel → Websites → letstalkrenovation.com → Deployments. **To get auto-deploy on every push** (like letstalkadu.com): log in to hPanel directly as the account owner (not admin access) and connect the GitHub repo in the web app's deployment settings.
- **DNS** (set by Hostinger when the web app was created): ALIAS @ → letstalkrenovation.com.cdn.hstgr.net, CNAME www → www.letstalkrenovation.com.cdn.hstgr.net (plus Hostinger's A ftp record). SSL is Hostinger's.
- On every start, `server.js` runs `build.mjs` (all copy and compliance checks) with DOMAIN=letstalkrenovation.com and serves `dist/`. If a build fails, the last good `dist/` keeps being served and `/api/health` shows `ok: false` with the error. Optional hPanel env vars: DOMAIN, ANALYTICS_ID, APPLY_URL, BOOK_URL.
- www only: the server 301s the bare domain to https://www.letstalkrenovation.com (path and ad tags kept); the page script does the same as a backup.
- Health check: https://www.letstalkrenovation.com/api/health
- Earlier hosting (2026-11-24, a few hours): GitHub Pages with DNS A @ 185.199.108/109/110.153 and CNAME www -> patcollins-14.github.io. The Pages workflow is removed from the repo and the Pages site is deleted.

## Files
- `index.src.html`: the page source (edit this one)
- `build.mjs`: `node build.mjs` writes `index.html` and `dist/` (the deployable site). It fills the links, adds "(ARV)" after every "after renovation", capitalizes Renovation / Remodel, Title-Cases every h2/h3, joins the last two words of every text block (no orphans), and fails on: banned phrases (`config/banned-phrases.json`, copied from adu-geo-build), dollar figures or percentages outside `<article data-scenario>`, the program source company's names, Pat's name outside the footer and advisor card, a CSLB number without "Mars Construction" before it, an application link not reading exactly "Get Pre-qualified", "free" anywhere except Let's Talk ADU's free online lot check, placeholders, and any form or input.
  - Overrides: `APPLY_URL`, `BOOK_URL`, `ANALYTICS_ID` (empty = no analytics and no cookie bar), `DOMAIN` (writes dist/CNAME)
- `serve.mjs`: local preview of `dist/` (`node serve.mjs 5186`; also "renovations-landing" in C:\Users\keine\.claude\launch.json)
- `img/ba/`: the slider pairs (Higgsfield gpt_image_2_6, photo style, 1024 x 688). Each "after" was generated from its "before" as a reference image so the angle lines up.
- `img/gallery/`: 8 photo-style project ideas for the sliding gallery. `pat-collins.webp` is copied from adu-geo-build/landing/img.
- `brand/`: `logo-renovations.png` (560 x 375 master, made from the Let's Talk ADU logo: same bubble, "Let's Talk" and rules, "Renovations" set in bold Times), the ADU source logo, and spare images.
- `server.js` + `package.json`: the Hostinger web app (Express). `npm start` builds and serves; `npm run build` only builds.

Preview artifact (private): https://claude.ai/artifact/M7Dkfy7tg79BqMsiCNREfu

## Open items for Pat
1. **Domain.** None chosen or bought. Suggested: letstalkrenovation.com. Once it exists: GitHub repo + Pages (like financemyadu) or a Hostinger web app (like letstalkadu), then `DOMAIN=... node build.mjs`, and drop `noindex` from the page when you want it in Google.
2. **Reverse links.** Add Let's Talk Renovation to letstalkadu.com and financemyadu.io once the domain is live (not done: those are live sites and the link would have nowhere to go yet).
3. **Mars Construction scope.** The page says Mars "can scope and build your project" and lists pools and outdoor living as a project type. Confirm which types Mars builds in-house (pools usually need a C-53 or Class A) and trim the tiles if needed.
4. **Booking link.** Uses link.theradcrm.com/widget/bookings/appointment-booking-with-pat-collins (same as the ADU PDF). Swap it if the new GHL calendar replaces it.
5. **Analytics.** No GA4/GTM yet. Pass `ANALYTICS_ID=GTM-...` to the build; clicks push `cta_click` with `cta_position`.
6. **Compliance (v3, 2026-11-24).** Reg Z trigger terms are off the page: no interest-only, draw or repayment periods, payment amounts or down payments (the build fails if one comes back outside the example). The one worked example (dollar figures and the 85% / 95% / 125% limits) stays inside `<article data-scenario>`, labeled hypothetical, as on FinanceMyADU; compliance should still sign off on it. If Pat wants the interest-only / draw-period message back, it needs the HELOC ad disclosures (APR, highest possible APR, fees) from the lender first. The footer "Important disclosures" covers lending (EMC + Pat NMLS/DRE, NMLS Consumer Access, not a commitment to lend, pre-qualifying is not approval, HELOC secured by the home), the program, construction (Mars Construction CSLB #1138550, classes, written home improvement contract), separate companies with no tie-in, the hypothetical example, AI-generated images, no government affiliation and the privacy link. The build fails if any of the required lines go missing.
7. **SEO / GEO (v3).** Canonical, Open Graph and Twitter tags, `img/og-image.jpg` (1200 x 630), JSON-LD (Organization, GeneralContractor, FinancialService, WebSite, WebPage, HowTo, FAQPage built from the visible FAQ), a Key Facts box, 12 FAQ answers, robots.txt that welcomes search and AI crawlers, sitemap.xml with the images, and llms.txt (source in the project root). The canonical and schema URLs use `https://www.letstalkrenovation.com` until `DOMAIN` is set; the page stays `noindex` until then.
