# Let's Talk Renovations (landing page)

The third site in the Let's Talk family, built 2026-11-24 on the same method as the other two:

| Site | Job | Ladder stage it feeds |
|---|---|---|
| letstalkadu.com | Add a home: free online lot check, ADU build by Mars Construction | Avatar → Lead (lot check form) |
| **Let's Talk Renovations** (this) | Improve the home: kitchens, baths, additions, whole-home, exterior, pools; Mars Construction builds | Avatar → Suspect (Book a Call) → Prospect (Get Pre-qualified) |
| financemyadu.io | Pay for it: After Renovation Value (ARV) HELOC, no refinance | Prospect → Customer |

The page links to both sister sites (hero nudge, financing "more" link, the "One Team, Three Ways In" section, footer). The ladder line under that section ("start with one project, come back for the next") is the Customer → Client hook: a kitchen this year, an ADU later, same team.

Static page, no form (no spam risk, no webhook): every action is "Get Pre-qualified" (LendingPad, same link as financemyadu.io), "Book a Call" (Pat's booking page) or the phone number.

## Files
- `index.src.html`: the page source (edit this one)
- `build.mjs`: `node build.mjs` writes `index.html` and `dist/` (the deployable site). It fills the links, adds "(ARV)" after every "after renovation", capitalizes Renovation / Remodel, Title-Cases every h2/h3, joins the last two words of every text block (no orphans), and fails on: banned phrases (`config/banned-phrases.json`, copied from adu-geo-build), dollar figures or percentages outside `<article data-scenario>`, the program source company's names, Pat's name outside the footer and advisor card, a CSLB number without "Mars Construction" before it, an application link not reading exactly "Get Pre-qualified", "free" anywhere except Let's Talk ADU's free online lot check, placeholders, and any form or input.
  - Overrides: `APPLY_URL`, `BOOK_URL`, `ANALYTICS_ID` (empty = no analytics and no cookie bar), `DOMAIN` (writes dist/CNAME)
- `serve.mjs`: local preview of `dist/` (`node serve.mjs 5186`; also "renovations-landing" in C:\Users\keine\.claude\launch.json)
- `img/`: Higgsfield images (gpt_image_2_6). Hero is a photo-style kitchen; tiles are 3D architectural-model renders in the FinanceMyADU style. `reno-kitchen`, `buy-remodel` and `pat-collins` are copied from adu-geo-build/landing/img.
- `brand/`: `logo-renovations.png` (560 x 375 master, made from the Let's Talk ADU logo: same bubble, "Let's Talk" and rules, "Renovations" set in bold Times), the ADU source logo, and spare images.
- `.github/workflows/pages.yml`: GitHub Pages deploy (build, then publish dist/). Not pushed anywhere yet.

Preview artifact (private): https://claude.ai/artifact/M7Dkfy7tg79BqMsiCNREfu

## Open items for Pat
1. **Domain.** None chosen or bought. Suggested: letstalkrenovations.com. Once it exists: GitHub repo + Pages (like financemyadu) or a Hostinger web app (like letstalkadu), then `DOMAIN=... node build.mjs`, and drop `noindex` from the page when you want it in Google.
2. **Reverse links.** Add Let's Talk Renovations to letstalkadu.com and financemyadu.io once the domain is live (not done: those are live sites and the link would have nowhere to go yet).
3. **Mars Construction scope.** The page says Mars "can scope and build your project" and lists pools and outdoor living as a project type. Confirm which types Mars builds in-house (pools usually need a C-53 or Class A) and trim the tiles if needed.
4. **Booking link.** Uses link.theradcrm.com/widget/bookings/appointment-booking-with-pat-collins (same as the ADU PDF). Swap it if the new GHL calendar replaces it.
5. **Analytics.** No GA4/GTM yet. Pass `ANALYTICS_ID=GTM-...` to the build; clicks push `cta_click` with `cta_position`.
6. **Compliance.** Same open items as FinanceMyADU (docs/PAT-INPUTS.md there): interest-only 10-year draw / 20-year repayment wording, the "5% down" example and the 85% / 95% / 125% figures (Reg Z trigger terms), and AI-generated illustrations (the footer says images are illustrations).
