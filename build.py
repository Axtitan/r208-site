#!/usr/bin/env python3
# R208 static site generator
import os, json

R = "/data/r208-site"
CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_3I90NgizzgjlxuNMaWCewcniSuv/"
IMG = {
  "hero": CDN+"hf_20260819_192452_576fcd7a-cc31-4abf-b431-b3dd4e61740a.png",
  "room": CDN+"hf_20260819_192736_cd1f6e1d-a8ab-4fca-9dd6-ec3bc34df55a.png",
  "fintech": CDN+"hf_20260819_192736_72ac6c1c-5257-45f2-b690-5d91aa42453f.png",
  "fashion": CDN+"hf_20260819_192736_9ddf0a20-57dc-490a-9101-ba70154012a8.png",
  "cyber": CDN+"hf_20260819_193840_2f85e477-c889-4039-86d1-ff68209e860a.png",
  "sneaker": CDN+"hf_20260819_192736_4348826a-3e73-4ae4-8d83-c58cd4d97bda.png",
  "stationery": CDN+"hf_20260819_192736_48a97497-6e68-43ef-a1da-5e93566ee964.png",
  "ai": CDN+"hf_20260819_194426_62aa79cb-2bca-47f4-9306-6acc742f48d8.png",
}

SERVICES = [
 {"slug":"web-design-development","num":"01","name":"Web Design & Development","cat":"web",
  "tags":"Marketing sites / Web apps / Headless CMS",
  "lede":"Sites that load fast, read clearly and convert. Designed and built in the same room, so nothing gets lost in handoff.",
  "overview":"We design and ship the whole front end: information architecture, interface, motion, and the code that runs it. Every build is component-driven, accessible by default and wired to a CMS your team can actually operate without calling us.",
  "deliv":[("Architecture & wireframes","Sitemap, page templates and content model agreed before a single pixel is coloured."),("Design system","Tokens, components and states in Figma, mapped one-to-one to code."),("Production build","Semantic, responsive, Lighthouse-tuned front end with CMS integration."),("Handover & support","Loom walkthroughs, editor docs and a 30-day fix window after launch.")]},
 {"slug":"ui-ux-design","num":"02","name":"UI/UX Design","cat":"uiux",
  "tags":"Product design / Design systems / Prototyping",
  "lede":"Interfaces people move through without thinking. We design the flow first, then the surface.",
  "overview":"Research, flows, and interface design for products that have to hold up under daily use. We prototype the risky parts early, test them with real users, and leave you with a system that scales past the first release.",
  "deliv":[("Discovery & audit","Stakeholder interviews, journey mapping and a heuristic review of what exists."),("User flows","End-to-end task flows with edge cases and empty states accounted for."),("High-fidelity UI","Pixel-precise screens across breakpoints, light and dark."),("Interactive prototype","Clickable build for testing and stakeholder sign-off.")]},
 {"slug":"graphics-design","num":"03","name":"Graphics Design","cat":"graphics",
  "tags":"Brand identity / Print / Campaign",
  "lede":"Identity systems with enough range to survive contact with the real world.",
  "overview":"Logos, typographic systems, colour, layout rules and the templates that keep it all consistent. We design for the awkward applications too: the invoice, the tote bag, the 40x40 favicon.",
  "deliv":[("Identity system","Primary and secondary marks, clear space, sizing and misuse rules."),("Typography & colour","Type scale, pairings and accessible colour ratios with usage split."),("Collateral","Decks, stationery, social templates and print-ready artwork."),("Brand guidelines","A guide your team and vendors can follow without asking.")]},
 {"slug":"cybersecurity","num":"04","name":"Cybersecurity","cat":"security",
  "tags":"Audits / Pen testing / Hardening",
  "lede":"Find it before someone else does. Practical security for teams that ship weekly.",
  "overview":"We test the way an attacker would, then hand you a ranked list you can actually work through. No 200-page scanner dump. Findings come with reproduction steps, severity, and the fix.",
  "deliv":[("Threat model","Assets, actors and attack surface mapped against your stack."),("Penetration test","Manual testing of auth, access control, injection and business logic."),("Findings report","Severity-ranked issues with proof of concept and remediation steps."),("Hardening & retest","Fix support, CI security gates and a verification pass.")]},
 {"slug":"3d-design","num":"05","name":"3D Design","cat":"3d",
  "tags":"Product viz / WebGL / Motion",
  "lede":"Product renders and real-time 3D that make a thing feel physical before it exists.",
  "overview":"Modelling, lighting, look development and render. When it needs to live in a browser, we optimise the mesh and ship it as WebGL that holds 60fps on a mid-range laptop.",
  "deliv":[("Modelling","Clean, production-ready geometry built to real-world scale."),("Look development","Materials, lighting and camera language matched to your brand."),("Render package","Stills and turntables in every ratio your channels need."),("Real-time export","Compressed glTF plus a WebGL scene, performance budget included.")]},
 {"slug":"video-editing","num":"06","name":"Video Editing","cat":"video",
  "tags":"Brand film / Social / Motion graphics",
  "lede":"Cuts with rhythm. Edits built around the first three seconds and the last call to action.",
  "overview":"Story structure, edit, sound design, grade and graphics. We deliver a master plus every crop and length your channels need, captioned and ready to post.",
  "deliv":[("Edit & structure","Paper edit, assembly and locked cut with two revision rounds."),("Motion graphics","Titles, lower thirds and animated brand elements."),("Sound & grade","Mix, licensed music and a colour pass for consistency."),("Delivery kit","16:9, 9:16 and 1:1 masters plus captions and thumbnails.")]},
 {"slug":"ai-automation","num":"07","name":"AI Automation","cat":"ai",
  "tags":"Workflows / Agents / Integrations",
  "lede":"Take the repetitive work off your team. Automations that fail loudly, not silently.",
  "overview":"We map the process, find the steps worth automating, and build them with logging, human checkpoints and a rollback. Then we document it so it survives staff turnover.",
  "deliv":[("Process map","Current-state workflow with time cost and automation candidates scored."),("Build","Integrations, prompts, retrieval and tooling wired to your stack."),("Evaluation","Test set, accuracy benchmarks and monitoring with alerts."),("Enablement","Runbook, training session and an owner named on your side.")]},
 {"slug":"copywriting","num":"08","name":"Copywriting","cat":"copy",
  "tags":"Messaging / Web copy / Naming",
  "lede":"Words that carry weight. Positioning first, then every line on the page.",
  "overview":"We start with what makes you different and hard to copy, then write the site, the product surface and the launch material in one consistent voice.",
  "deliv":[("Messaging framework","Positioning, value props, proof points and objection handling."),("Voice guide","Tone principles with do and don't examples your team can copy."),("Page copy","Full site copy in a build-ready doc, section by section."),("Product & campaign","UI microcopy, emails and launch assets.")]},
]

PROCESS = [
 ("01","Brief","We get in a room. Goals, constraints, budget, who says yes. You leave with a written scope and a fixed price."),
 ("02","Build","Weekly demos on a live link. You see progress every Friday, not a reveal in week eight."),
 ("03","Test","Real devices, real users, real load. Accessibility, performance and security checked before anyone calls it done."),
 ("04","Ship","Launch, monitor, hand over. Documentation, training and a 30-day window for anything that surfaces."),
]

PROJECTS = [
 {"slug":"novalend","name":"Novalend","cats":"web uiux","cat_label":"Web / UI-UX","year":"2026","client":"Novalend","role":"Design & Build","img":IMG["fintech"],
  "intro":"A lending platform for small businesses that needed to feel like a bank without behaving like one.",
  "challenge":"Novalend had a working product and a 4-step application that 61% of users abandoned. The interface asked for everything up front and explained nothing. Trust signals were buried below the fold.",
  "approach":"We rebuilt the application as a progressive flow: three screens, each asking only for what it needs, with a live eligibility indicator that updates as you type. The marketing site was rewritten around a single promise and one number. Design system delivered in Figma and shipped as a component library.",
  "outcome":"Application completion up 43%. Time to first offer down from 6 minutes to 90 seconds. The team now ships new product pages without design involvement."},
 {"slug":"atelier-noir","name":"Atelier Noir","cats":"uiux web graphics","cat_label":"UI-UX / Web","year":"2026","client":"Atelier Noir","role":"Identity & Commerce","img":IMG["fashion"],
  "intro":"An independent fashion house moving from wholesale to direct, with an editorial voice worth protecting.",
  "challenge":"The existing storefront was a stock theme. Product photography was strong, the interface flattened it. Every collection drop needed a developer.",
  "approach":"A full-bleed editorial commerce layout where imagery leads and chrome disappears. Type set large, navigation reduced to four items, cart as a quiet drawer. We built collection pages as CMS-driven blocks so the team can compose a drop in an afternoon.",
  "outcome":"Average order value up 28%. Collection pages now go live same-day. Bounce rate on drop pages halved."},
 {"slug":"sentinel-bank","name":"Sentinel Bank","cats":"security web","cat_label":"Cybersecurity / Web","year":"2025","client":"Sentinel","role":"Security & Hardening","img":IMG["cyber"],
  "intro":"A regional bank preparing for audit with six months of unreviewed releases behind it.",
  "challenge":"Rapid feature shipping had outpaced review. No threat model existed, access control was inconsistent across three services, and secrets were being passed through CI logs.",
  "approach":"Threat model workshop, then a manual penetration test across auth, session handling and business logic. We found 19 issues, four critical. Each came with reproduction steps and a patch. We then added security gates to CI and paired with their team on the fixes.",
  "outcome":"All critical and high findings closed in three weeks. Audit passed first attempt. Security checks now block merge automatically."},
 {"slug":"kinetic-kicks","name":"Kinetic Kicks","cats":"3d video","cat_label":"3D / Video","year":"2025","client":"Kinetic","role":"3D & Motion","img":IMG["sneaker"],
  "intro":"A sneaker launch with no product in hand and a campaign date already sold to retail.",
  "challenge":"Manufacturing samples were eight weeks out. The campaign needed hero stills, social cutdowns and a configurator for a shoe that physically did not exist yet.",
  "approach":"We modelled the shoe from CAD, developed materials against fabric swatches, and built a lighting rig that matched the brand's studio look. The same asset was compressed to 2.1MB glTF and shipped as a real-time configurator with four colourways.",
  "outcome":"Campaign shipped on the original date. 4 colourways rendered in 6 days. The configurator held 60fps on mid-range mobile."},
 {"slug":"northfield","name":"Northfield","cats":"graphics copy","cat_label":"Graphics / Copy","year":"2025","client":"Northfield Supply","role":"Identity & Messaging","img":IMG["stationery"],
  "intro":"A 40-year-old supply company that had accumulated five logos and no rules.",
  "challenge":"Every regional office had drifted into its own identity. Vendors were guessing at colour. Nothing was documented and the founder's original mark had genuine equity worth keeping.",
  "approach":"We audited every asset in circulation, kept the bones of the original mark and rebuilt it for small sizes and single-colour print. New type scale, a tightened palette, and templates for the twelve items they actually produce. Messaging rewritten around service radius rather than product range.",
  "outcome":"One identity across nine offices. Print vendor errors down to zero. Guidelines adopted without a single follow-up request."},
 {"slug":"flowstate","name":"Flowstate","cats":"ai web","cat_label":"AI Automation / Web","year":"2026","client":"Flowstate","role":"Automation & Build","img":IMG["ai"],
  "intro":"An operations team spending 30 hours a week moving information between four tools.",
  "challenge":"Intake arrived by email, was retyped into a tracker, summarised into a doc, then pasted into Slack. Four handoffs, four chances to lose something, and no audit trail when it went wrong.",
  "approach":"We mapped the workflow and automated the three highest-cost steps: classification, extraction and routing. Every run logs its inputs and confidence, low-confidence cases route to a human queue, and anything can be replayed. Built with a rollback and a named owner on their side.",
  "outcome":"26 hours a week returned to the team. 94% classification accuracy with human review on the rest. Zero silent failures in four months."},
]

CATS = [("all","All"),("web","Web"),("uiux","UI/UX"),("graphics","Graphics"),("security","Security"),("3d","3D"),("video","Video"),("ai","AI"),("copy","Copy")]

TESTI = [
 ("They designed it, built it, secured it and wrote it. One invoice, one point of contact, no finger-pointing when something needed fixing.","Amara E.","Head of Product, Novalend","AE"),
 ("The first agency that pushed back on our brief. They were right, and the site is better for it.","Dario M.","Founder, Atelier Noir","DM"),
 ("We got 26 hours a week back. That is a full-time hire we did not have to make.","Lena K.","Ops Lead, Flowstate","LK"),
]

TEAM = [
 ("Terence","Founder / Design & Build","Sets the standard, runs the room, still writes code on every project."),
 ("Open Seat","Product Designer","For someone who thinks in systems and argues about spacing."),
 ("Open Seat","Security Engineer","For someone who breaks things carefully and documents it well."),
 ("Open Seat","Motion & 3D","For someone who can make a still frame feel like it is about to move."),
]

VALUES = [
 ("01","One room, no handoff","Design, code, security and copy sit together. Nothing gets lost in translation because there is no translation."),
 ("02","Show the work weekly","You see a live link every Friday. No black boxes, no big reveals, no surprises in week eight."),
 ("03","Build it to be handed over","Documented, tested, and operable by your team. We want you to need us less over time."),
]

NAV = [("index.html","Home"),("about.html","About"),("services.html","Services"),("projects.html","Projects"),("contact.html","Contact")]

ARROW = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 13L13 1M13 1H4M13 1V10" stroke="#F4F2EE" stroke-width="1.5"/></svg>'
BIGARROW = '<svg width="18" height="18" viewBox="0 0 14 14" fill="none"><path d="M1 13L13 1M13 1H4M13 1V10" stroke="#D6FF4B" stroke-width="1.5"/></svg>'
LOGO = ('<svg width="34" height="23" viewBox="0 0 34 23" fill="none" aria-hidden="true">'
  '<rect width="10" height="10" fill="#F4F2EE"/><rect x="12" width="10" height="10" fill="#F4F2EE"/>'
  '<rect x="24" width="10" height="10" fill="#D6FF4B"/><rect y="12" width="10" height="10" fill="#F4F2EE"/>'
  '<rect x="12" y="12" width="10" height="10" fill="#F4F2EE"/><rect x="24" y="12" width="10" height="10" fill="#F4F2EE"/></svg>')


def head(title, desc, active):
    nav = ""
    for href, lab in NAV:
        cls = "nav-link is-active" if href == active else "nav-link"
        nav += '<a class="%s" href="%s">%s</a>' % (cls, href, lab)
    return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__TITLE__ — R208 Technologies</title>
<meta name="description" content="__DESC__">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
<script>(function(){try{if(localStorage.getItem('r208-theme')==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}})();</script>
<link rel="stylesheet" href="assets/css/style.css">
<script>
/* Failsafe: if scripts stall or fail (blocked CDN, slow network), reveal all content after 3s. */
(function(){var d=document.documentElement;setTimeout(function(){if(!d.classList.contains('js-ready'))d.classList.add('js-fallback');},3000);})();
</script>
<noscript><style>[data-reveal]{opacity:1!important;transform:none!important}.hero-title,.page-title{opacity:1!important}.hero-title .word>span,.page-title .word>span{transform:none!important}.preloader{display:none!important}</style></noscript>
</head>
<body>
<div class="preloader" aria-hidden="true"><div class="preloader-grid"><span></span><span></span><span></span><span></span><span></span><span></span></div></div>
<header class="site-header">
<a class="brand" href="index.html">__LOGO__<span>R208<span class="reg">®</span></span></a>
<nav class="main-nav">__NAV__<a class="cta-btn" href="contact.html"><span>Start a project</span></a></nav>
<div class="header-side">
<button id="theme-toggle" aria-label="Toggle color theme" aria-pressed="false"><span class="tt-icon"></span></button>
<button class="menu-toggle" aria-label="Menu"><span></span><span></span><span></span></button>
</div>
</header>
<main>""".replace("__TITLE__", title).replace("__DESC__", desc).replace("__NAV__", nav).replace("__LOGO__", LOGO)


def cta_band(t1, t2):
    return """<section class="section cta-band">
<div class="wrap">
<div class="section-kicker" data-reveal><i></i><span class="label">Next step</span></div>
<h2 class="big" data-reveal>__T1__ <span class="accent">__T2__</span></h2>
<div style="display:flex;gap:16px;flex-wrap:wrap" data-reveal data-reveal-delay="1">
<a class="cta-btn" href="contact.html"><span>Start a project</span>__AR__</a>
<a class="cta-btn cta-btn--ghost" href="projects.html"><span>See the work</span></a>
</div>
</div>
</section>""".replace("__T1__", t1).replace("__T2__", t2).replace("__AR__", '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 13L13 1M13 1H4M13 1V10" stroke="#0B0B0A" stroke-width="1.5"/></svg>')


def footer():
    sl = "".join('<a class="f-link" href="service-%s.html">%s</a>' % (s["slug"], s["name"]) for s in SERVICES[:5])
    return """</main>
<footer class="site-footer">
<div class="wrap">
<div class="footer-grid">
<div>
<a class="brand" href="index.html" style="margin-bottom:20px">__LOGO__<span>R208<span class="reg">®</span></span></a>
<p style="color:var(--steel);max-width:34ch">The room where it all gets made. A multidisciplinary agency building digital work end to end.</p>
</div>
<div><h4>Services</h4>__SL__<a class="f-link" href="services.html">All services</a></div>
<div><h4>Agency</h4><a class="f-link" href="about.html">About</a><a class="f-link" href="projects.html">Projects</a><a class="f-link" href="contact.html">Contact</a></div>
<div><h4>Contact</h4><a class="f-link" href="mailto:r208technologies@gmail.com">r208technologies@gmail.com</a><span class="f-link" style="color:var(--steel)">Abuja / Remote</span></div>
</div>
<div class="footer-word">R208</div>
<div class="footer-base">
<span class="label">© <span data-year>2026</span> R208 Technologies</span>
<span class="label">We don't decorate. We build.</span>
</div>
</div>
</footer>
<script defer src="https://unpkg.com/lenis@1.1.14/dist/lenis.min.js"></script>
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script defer src="assets/js/data.js"></script>
<script defer src="assets/js/hero3d.js"></script>
<script defer src="assets/js/main.js"></script>
</body>
</html>""".replace("__LOGO__", LOGO).replace("__SL__", sl)


def page_hero(crumbs, title, accent, lede, ghost=""):
    cr = "".join('<span class="label">%s</span>' % c for c in crumbs)
    g = ghost or (crumbs[1].upper() if len(crumbs) > 1 else "R208")
    return """<section class="page-hero">
<div class="page-hero-ghost" aria-hidden="true">__G__</div>
<div class="wrap">
<div class="crumbs">__CR__</div>
<h1 class="page-title" data-split data-split-accent="__ACC__">__T__</h1>
<p class="page-lede" data-reveal data-reveal-delay="1">__L__</p>
</div>
</section>""".replace("__CR__", cr).replace("__T__", title).replace("__ACC__", accent).replace("__L__", lede).replace("__G__", g)


def service_rows():
    out = '<div class="service-list">'
    for s in SERVICES:
        out += ('<a class="service-row" href="service-%s.html">'
                '<span class="num">%s</span><span class="name">%s</span>'
                '<span class="tags">%s</span><span class="arrow">%s</span></a>'
                ) % (s["slug"], s["num"], s["name"], s["tags"], ARROW)
    return out + "</div>"


def project_cards(items, with_cat=True, src=""):
    out = '<div class="project-grid"%s>' % (' data-src="%s"' % src if src else "")
    for i, p in enumerate(items):
        out += ('<a class="project-card" data-cat="%s" data-cursor="view" href="project-%s.html" data-reveal data-reveal-delay="%d">'
                '<div class="thumb"><img src="%s" alt="%s" loading="lazy"><div class="veil"></div></div>'
                '<div class="meta"><h3>%s</h3><span class="cat">%s</span></div></a>'
                ) % (p["cats"], p["slug"], i % 2 + 1, p["img"], p["name"], p["name"], p["cat_label"] if with_cat else p["year"])
    return out + '</div><p id="filter-empty" class="label" style="display:none;padding:40px 0">No projects in this category yet — but we build here too. <a href="contact.html" style="color:var(--signal-text)">Be the first.</a></p>'


# ---------- index ----------
def build_index():
    h = head("Digital agency", "R208 Technologies is a multidisciplinary agency: web, product design, graphics, cybersecurity, 3D, video, AI automation and copy. One room, end to end.", "index.html")
    marq = "".join('<span class="mq%s">%s<i></i></span>' % (" mq--o" if j % 2 else "", s["name"]) for j, s in enumerate(SERVICES))
    hero = """<section class="hero">
<canvas id="hero-canvas"></canvas>
<div class="hero-meta">
<span class="label">R208 Technologies — Est. 2026</span>
</div>
<h1 class="hero-title" data-split data-split-accent="room">Everything <em class="rot" data-rot="digital.|web.|graphics.|design.|SEO.|creative.|software."><span class="rot-inner">digital.</span></em><br> One room.</h1>
<div class="hero-row">
<p class="hero-sub" data-reveal>Design, code, security, 3D, motion and words — under one roof, on one invoice, with one team accountable from brief to launch.</p>
<div style="display:flex;gap:16px;flex-wrap:wrap" data-reveal data-reveal-delay="1">
<a class="cta-btn" href="contact.html"><span>Start a project</span></a>
<a class="cta-btn cta-btn--ghost" href="projects.html"><span>See the work</span></a>
</div>
</div>
<div class="hero-row" style="margin-top:40px">
<div class="hero-scroll"><span class="label">Scroll</span><span class="line"></span></div>
<span class="label" style="margin-left:auto">The room where it all gets made.</span>
</div>
</section>
<div class="marquee"><div class="marquee-track">__M____M__</div></div>""".replace("__M__", marq)

    who = """<section class="section" id="who">
<div class="wrap">
<div class="about-grid">
<div class="about-media" data-reveal><img src="__ROOM__" alt="Inside the R208 room" loading="lazy"></div>
<div class="about-copy" data-reveal data-reveal-delay="1">
<div class="section-kicker"><i></i><span class="label">Who we are</span></div>
<h2 class="section-title" style="margin-bottom:28px">An agency built like <span class="accent">one team</span>, not five vendors.</h2>
<p>Most agencies specialise and then subcontract the rest. <strong>R208 doesn't.</strong> Designers, engineers, security people, 3D artists and writers work in the same room on the same brief.</p>
<p>That means fewer handoffs, fewer things lost in translation, and one team accountable for the whole outcome — not just their slice of it.</p>
<a class="cta-btn cta-btn--ghost" href="about.html"><span>More about us</span></a>
<div class="stats">
<div class="stat"><div class="num" data-count="8">8</div><span class="label">Disciplines</span></div>
<div class="stat"><div class="num" data-count="40" data-suffix="+">40<em>+</em></div><span class="label">Projects shipped</span></div>
<div class="stat"><div class="num" data-count="6">6</div><span class="label">Industries</span></div>
</div>
</div>
</div>
</div>
</section>""".replace("__ROOM__", IMG["room"])

    serv = """<section class="section" id="services">
<div class="wrap">
<div class="section-head">
<div><div class="section-kicker" data-reveal><i></i><span class="label">Services</span></div>
<h2 class="section-title" data-reveal>Eight disciplines.<br><span class="accent">One standard.</span></h2></div>
<a class="cta-btn cta-btn--ghost" href="services.html" data-reveal><span>All services</span></a>
</div>
__ROWS__
</div>
</section>""".replace("__ROWS__", service_rows())

    proj = """<section class="section" id="projects">
<div class="wrap">
<div class="section-head">
<div><div class="section-kicker" data-reveal><i></i><span class="label">Selected work</span></div>
<h2 class="section-title" data-reveal>Things we <span class="accent">made</span>.</h2></div>
<a class="cta-btn cta-btn--ghost" href="projects.html" data-reveal><span>All projects</span></a>
</div>
__CARDS__
</div>
</section>""".replace("__CARDS__", project_cards(PROJECTS[:4], src="featured"))

    t = "".join(('<figure class="t-slide%s"><div class="quote-mark">\u201c</div><blockquote>%s</blockquote>'
                 '<figcaption><span class="avatar">%s</span><span><span class="name">%s</span><span class="role">%s</span></span></figcaption></figure>'
                 ) % (" is-active" if i == 0 else "", q, ini, nm, ro) for i, (q, nm, ro, ini) in enumerate(TESTI))
    testi = """<section class="section" id="testimonials">
<div class="wrap">
<div class="section-head">
<div><div class="section-kicker" data-reveal><i></i><span class="label">Testimonials</span></div>
<h2 class="section-title" data-reveal>What they <span class="accent">said</span>.</h2></div>
</div>
<div class="testi-slider" data-reveal>
<div class="testi-slides">__T__</div>
<div class="testi-controls">
<button class="t-prev" aria-label="Previous testimonial"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 1L2 6l8 5" stroke="currentColor" stroke-width="1.5"/></svg></button>
<span class="label t-count">01 / 0__N__</span>
<button class="t-next" aria-label="Next testimonial"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 1l8 5-8 5" stroke="currentColor" stroke-width="1.5"/></svg></button>
</div>
<div class="t-progress"><i></i></div>
</div>
</div>
</section>""".replace("__T__", t).replace("__N__", str(len(TESTI)))

    write("index.html", h + hero + who + serv + proj + testi + cta_band("Got something", "worth building?") + footer())


# ---------- services ----------
def build_services():
    h = head("Services", "Web, UI/UX, graphics, cybersecurity, 3D, video, AI automation and copywriting — delivered by one team.", "services.html")
    ph = page_hero(["R208", "Services"], "Everything we make.", "make.",
                   "Eight disciplines held to one standard. Pick one, or hand us the whole thing — the advantage compounds when it all comes from the same room.")
    body = '<section class="section"><div class="wrap">' + service_rows() + "</div></section>"
    steps = "".join(('<div class="process-step" data-reveal><div class="p-num">%s</div>'
                     '<div><h3>%s</h3><p>%s</p></div></div>') % (n, t, d) for n, t, d in PROCESS)
    proc = """<section class="section" style="border-top:1px solid var(--line)">
<div class="wrap">
<div class="section-head"><div><div class="section-kicker" data-reveal><i></i><span class="label">How we work</span></div>
<h2 class="section-title" data-reveal>Four steps. <span class="accent">No mystery.</span></h2></div></div>
__S__
</div>
</section>""".replace("__S__", steps)
    write("services.html", h + ph + body + proc + cta_band("Which one do you", "need first?") + footer())


def build_service_pages():
    for i, s in enumerate(SERVICES):
        h = head(s["name"], s["lede"], "services.html")
        ph = page_hero(["R208", "Services", s["num"]], s["name"], "", s["lede"], ghost=s["num"])
        ov = """<section class="section">
<div class="wrap">
<div class="about-grid">
<div data-reveal><div class="section-kicker"><i></i><span class="label">Overview</span></div>
<h2 class="section-title" style="font-size:clamp(28px,3.4vw,44px)">__NAME__</h2></div>
<div class="about-copy" data-reveal data-reveal-delay="1"><p>__OV__</p>
<a class="cta-btn" href="contact.html"><span>Scope this with us</span></a></div>
</div>
</div>
</section>""".replace("__NAME__", s["name"]).replace("__OV__", s["overview"])
        d = "".join(('<div class="deliverable" data-reveal><div class="d-num">0%d</div><h3>%s</h3><p>%s</p></div>'
                     ) % (j + 1, t, x) for j, (t, x) in enumerate(s["deliv"]))
        dl = """<section class="section" style="border-top:1px solid var(--line)">
<div class="wrap">
<div class="section-head"><div><div class="section-kicker" data-reveal><i></i><span class="label">What you get</span></div>
<h2 class="section-title" data-reveal>Deliverables</h2></div></div>
<div class="deliverables">__D__</div>
</div>
</section>""".replace("__D__", d)
        steps = "".join(('<div class="process-step" data-reveal><div class="p-num">%s</div>'
                         '<div><h3>%s</h3><p>%s</p></div></div>') % (n, t, x) for n, t, x in PROCESS)
        proc = '<section class="section"><div class="wrap"><div class="section-head"><div><div class="section-kicker" data-reveal><i></i><span class="label">Process</span></div><h2 class="section-title" data-reveal>How it runs</h2></div></div>' + steps + "</div></section>"
        rel = [p for p in PROJECTS if s["cat"] in p["cats"].split()][:2] or PROJECTS[:2]
        rl = '<section class="section" style="border-top:1px solid var(--line)"><div class="wrap"><div class="section-head"><div><div class="section-kicker" data-reveal><i></i><span class="label">Related work</span></div><h2 class="section-title" data-reveal>Seen in the wild</h2></div></div>' + project_cards(rel) + "</div></section>"
        nxt = SERVICES[(i + 1) % len(SERVICES)]
        nx = ('<div class="wrap"><a class="next-proj" href="service-%s.html"><div><span class="label">Next service</span>'
              '<div class="n-title">%s</div></div><span class="round-arrow">%s</span></a></div>') % (nxt["slug"], nxt["name"], BIGARROW)
        write("service-%s.html" % s["slug"], h + ph + ov + dl + proc + rl + nx + cta_band("Ready to start", s["name"].lower() + "?") + footer())


# ---------- projects ----------
def build_projects():
    h = head("Projects", "Selected work from R208 Technologies across web, product, brand, security, 3D and automation.", "projects.html")
    ph = page_hero(["R208", "Projects"], "Work, not decks.", "decks.",
                   "Filter by discipline. Every case study includes what was broken, what we did, and what changed.")
    chips = "".join('<button class="chip%s" data-filter="%s">%s</button>' % (" is-active" if c == "all" else "", c, l) for c, l in CATS)
    body = ('<section class="section"><div class="wrap"><div class="filter-bar">' + chips + "</div>" + project_cards(PROJECTS, src="all") + "</div></section>")
    write("projects.html", h + ph + body + cta_band("Your project could be", "next here.") + footer())


def build_project_pages():
    for i, p in enumerate(PROJECTS):
        h = head(p["name"], p["intro"], "projects.html")
        ph = page_hero(["R208", "Projects", p["year"]], p["name"], "", p["intro"], ghost=p["year"])
        media = '<div class="wrap"><div class="proj-hero-media" data-reveal><img src="%s" alt="%s"></div>' % (p["img"], p["name"])
        meta = (('<div class="proj-meta">'
                 '<div><div class="label m-label">Client</div><div>%s</div></div>'
                 '<div><div class="label m-label">Year</div><div>%s</div></div>'
                 '<div><div class="label m-label">Discipline</div><div>%s</div></div>'
                 '<div><div class="label m-label">Role</div><div>%s</div></div>'
                 "</div></div>") % (p["client"], p["year"], p["cat_label"], p["role"]))
        body = ("""<section class="section"><div class="wrap"><div class="proj-body">
<h2 data-reveal>The challenge</h2><p data-reveal>__C__</p>
<h2 data-reveal>Our approach</h2><p data-reveal>__A__</p>
<h2 data-reveal>The outcome</h2><p data-reveal><strong>__O__</strong></p>
</div></div></section>""").replace("__C__", p["challenge"]).replace("__A__", p["approach"]).replace("__O__", p["outcome"])
        nxt = PROJECTS[(i + 1) % len(PROJECTS)]
        nx = ('<div class="wrap"><a class="next-proj" href="project-%s.html"><div><span class="label">Next project</span>'
              '<div class="n-title">%s</div></div><span class="round-arrow">%s</span></a></div>') % (nxt["slug"], nxt["name"], BIGARROW)
        write("project-%s.html" % p["slug"], h + ph + media + meta + body + nx + cta_band("Want results", "like these?") + footer())


# ---------- about ----------
def build_about():
    h = head("About", "R208 Technologies is a multidisciplinary agency in Abuja working remotely worldwide.", "about.html")
    ph = page_hero(["R208", "About"], "The room where it all gets made.", "room",
                   "R208 started from a simple frustration: great work kept dying in the gaps between specialists. So we removed the gaps.")
    intro = """<section class="section">
<div class="wrap"><div class="about-grid">
<div class="about-media" data-reveal><img src="__ROOM__" alt="Inside R208" loading="lazy"></div>
<div class="about-copy" data-reveal data-reveal-delay="1">
<div class="section-kicker"><i></i><span class="label">Who we are</span></div>
<h2 class="section-title" style="font-size:clamp(28px,3.6vw,48px);margin-bottom:28px">Eight disciplines, <span class="accent">one accountable team.</span></h2>
<p>We are a multidisciplinary agency building digital work end to end — <strong>strategy, design, code, security, 3D, motion and words.</strong></p>
<p>The name is a room number. It's where the first project got built, and it still describes how we work: everyone in one place, arguing about the work until it's right.</p>
<p>We're based in Abuja and work with teams anywhere. Small enough that you talk to the people doing the work, structured enough to ship on a date.</p>
</div>
</div>
<div class="stats">
<div class="stat"><div class="num" data-count="8">8</div><span class="label">Disciplines</span></div>
<div class="stat"><div class="num" data-count="40" data-suffix="+">40<em>+</em></div><span class="label">Projects shipped</span></div>
<div class="stat"><div class="num" data-count="6">6</div><span class="label">Industries</span></div>
</div>
</div>
</section>""".replace("__ROOM__", IMG["room"])
    vc = "".join('<div class="value-cell" data-reveal><div class="v-num">%s</div><h3>%s</h3><p>%s</p></div>' % v for v in VALUES)
    vals = ('<section class="section" style="border-top:1px solid var(--line)"><div class="wrap">'
            '<div class="section-head"><div><div class="section-kicker" data-reveal><i></i><span class="label">How we operate</span></div>'
            '<h2 class="section-title" data-reveal>Three rules.</h2></div></div><div class="value-grid">' + vc + "</div></div></section>")
    tiles = "".join("<i></i>" for _ in range(6))
    tc = "".join(('<div class="team-card" data-reveal data-reveal-delay="%d"><div class="t-photo"><div class="mono-tiles">%s</div></div>'
                  '<h3>%s</h3><div class="t-role">%s</div><p style="color:var(--steel);font-size:15px;margin-top:12px">%s</p></div>'
                  ) % (j % 3 + 1, tiles, n, r, b) for j, (n, r, b) in enumerate(TEAM))
    team = ('<section class="section"><div class="wrap"><div class="section-head"><div>'
            '<div class="section-kicker" data-reveal><i></i><span class="label">Meet the team</span></div>'
            '<h2 class="section-title" data-reveal>The people in <span class="accent">the room</span>.</h2></div>'
            '<a class="cta-btn cta-btn--ghost" href="contact.html" data-reveal><span>We\'re hiring</span></a></div>'
            '<div class="team-grid">' + tc + "</div></div></section>")
    write("about.html", h + ph + intro + vals + team + cta_band("Come build", "with us.") + footer())


# ---------- contact ----------
def build_contact():
    h = head("Contact", "Tell R208 Technologies what you're building. We reply within one business day.", "contact.html")
    ph = page_hero(["R208", "Contact"], "Tell us what you're building.", "building.",
                   "Real answers within one business day. If we're not the right fit we'll say so, and point you somewhere better.")
    first = SERVICES[0]["name"]
    opts2 = "".join('<button type="button" class="sel-opt%s" data-value="%s">%s</button>' % (" is-active" if j == 0 else "", s["name"], s["name"]) for j, s in enumerate(SERVICES)) + '<button type="button" class="sel-opt" data-value="Multiple / not sure yet">Multiple / not sure yet</button>'
    body = """<section class="section">
<div class="wrap"><div class="contact-grid">
<div data-reveal>
<div class="contact-info-block"><div class="label" style="margin-bottom:12px">Email</div><a href="mailto:r208technologies@gmail.com">r208technologies@gmail.com</a></div>
<div class="contact-info-block"><div class="label" style="margin-bottom:12px">Based</div><div style="font-size:20px;font-weight:500">Abuja, Nigeria — remote worldwide</div></div>
<div class="contact-info-block"><div class="label" style="margin-bottom:12px">Response time</div><div style="font-size:20px;font-weight:500">Within one business day</div></div>
<div class="cap-box"><div class="label label--signal" style="margin-bottom:12px">Currently booking</div>
<p style="color:var(--steel)">Two project slots open for the next quarter. Retainers and single-discipline engagements also available.</p></div>
</div>
<div data-reveal data-reveal-delay="1">
<form id="contact-form" novalidate>
<div class="form-field"><label for="nm">Your name</label><input id="nm" name="name" type="text" required placeholder="Jane Doe"><span class="err">Please enter your name</span></div>
<div class="form-field"><label for="em">Email</label><input id="em" name="email" type="email" required placeholder="jane@company.com"><span class="err">Please enter a valid email</span></div>
<div class="form-field"><label for="co">Company</label><input id="co" name="company" type="text" placeholder="Optional"></div>
<div class="form-field"><label>What do you need?</label><div class="sel"><button type="button" class="sel-btn" aria-expanded="false"><span class="sel-val">__FIRST__</span><svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1L6 6L11 1" stroke="#8A8880" stroke-width="1.5"/></svg></button><div class="sel-list">__OPTS2__</div><input type="hidden" name="service" value="__FIRST__"></div></div>
<div class="form-field"><label>Budget range</label><div class="pick"><button type="button" class="pick-chip is-active" data-value="Under $5k">Under $5k</button><button type="button" class="pick-chip" data-value="$5k – $15k">$5k – $15k</button><button type="button" class="pick-chip" data-value="$15k – $50k">$15k – $50k</button><button type="button" class="pick-chip" data-value="$50k+">$50k+</button><button type="button" class="pick-chip" data-value="Let's discuss">Let's discuss</button></div><input type="hidden" name="budget" value="Under $5k"></div>
<div class="form-field"><label for="ms">Project details</label><textarea id="ms" name="message" required placeholder="What are you building, and what does done look like?"></textarea><span class="err">Tell us a little about the project</span></div>
<button class="cta-btn" type="submit"><span>Send it</span></button>
</form>
<div class="form-success"><h3>Got it.</h3><p>Thanks — your brief landed. We'll come back to you within one business day, usually with questions. Check your inbox for a confirmation from r208technologies@gmail.com.</p></div>
</div>
</div></div>
</section>""".replace("__OPTS2__", opts2).replace("__FIRST__", first)
    write("contact.html", h + ph + body + footer())


def write(name, html):
    with open(os.path.join(R, name), "w") as f:
        f.write(html)


def build_assets():
    for d in ["assets/css", "assets/js", "assets/img", "assets/fonts", "assets/lottie"]:
        os.makedirs(os.path.join(R, d), exist_ok=True)
    with open(os.path.join(R, "assets/img/favicon.svg"), "w") as f:
        f.write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 23">'
                '<rect width="34" height="23" fill="#0B0B0A"/>'
                '<rect x="1" y="1" width="9" height="9" fill="#F4F2EE"/><rect x="12" y="1" width="9" height="9" fill="#F4F2EE"/>'
                '<rect x="23" y="1" width="9" height="9" fill="#D6FF4B"/><rect x="1" y="12" width="9" height="9" fill="#F4F2EE"/>'
                '<rect x="12" y="12" width="9" height="9" fill="#F4F2EE"/><rect x="23" y="12" width="9" height="9" fill="#F4F2EE"/></svg>')
    # lottie: 6-tile pulse
    layers = []
    pos = [(20, 20), (60, 20), (100, 20), (20, 60), (60, 60), (100, 60)]
    for i, (x, y) in enumerate(pos):
        col = [.839, 1, .294, 1] if i == 2 else [.114, .114, .098, 1]
        layers.append({"ddd": 0, "ind": i + 1, "ty": 4, "nm": "t%d" % i, "sr": 1,
            "ks": {"o": {"a": 1, "k": [
                {"t": i * 8, "s": [35], "e": [100], "i": {"x": [.4], "y": [1]}, "o": {"x": [.6], "y": [0]}},
                {"t": i * 8 + 24, "s": [100], "e": [35], "i": {"x": [.4], "y": [1]}, "o": {"x": [.6], "y": [0]}},
                {"t": i * 8 + 48, "s": [35]}]},
                "r": {"a": 0, "k": 0}, "p": {"a": 0, "k": [x, y, 0]},
                "a": {"a": 0, "k": [0, 0, 0]}, "s": {"a": 0, "k": [100, 100, 100]}},
            "ao": 0, "shapes": [{"ty": "gr", "it": [
                {"ty": "rc", "d": 1, "s": {"a": 0, "k": [32, 32]}, "p": {"a": 0, "k": [0, 0]}, "r": {"a": 0, "k": 0}},
                {"ty": "fl", "c": {"a": 0, "k": col}, "o": {"a": 0, "k": 100}},
                {"ty": "tr", "p": {"a": 0, "k": [0, 0]}, "a": {"a": 0, "k": [0, 0]},
                 "s": {"a": 0, "k": [100, 100]}, "r": {"a": 0, "k": 0}, "o": {"a": 0, "k": 100}}]}],
            "ip": 0, "op": 90, "st": 0, "bm": 0})
    lot = {"v": "5.7.4", "fr": 30, "ip": 0, "op": 90, "w": 120, "h": 80, "nm": "tiles", "ddd": 0, "assets": [], "layers": layers}
    with open(os.path.join(R, "assets/lottie/tiles.json"), "w") as f:
        json.dump(lot, f)
    # proto-CMS data layer
    data = {"services": [{k: s[k] for k in ("slug", "num", "name", "tags", "lede", "cat")} for s in SERVICES],
            "projects": [{k: p[k] for k in ("slug", "name", "cats", "cat_label", "year", "client", "role", "img", "intro")} for p in PROJECTS],
            "categories": [{"slug": c, "label": l} for c, l in CATS],
            "testimonials": [{"quote": q, "name": n, "role": r} for q, n, r, _ in TESTI],
            "team": [{"name": n, "role": r, "bio": b} for n, r, b in TEAM]}
    with open(os.path.join(R, "assets/js/data.js"), "w") as f:
        f.write("/* R208 content layer — single source of truth. Swap for a CMS fetch later. */\nwindow.R208_DATA = ")
        json.dump(data, f, indent=2)
        f.write(";\n")
    with open(os.path.join(R, "images.json"), "w") as f:
        json.dump(IMG, f, indent=2)
    with open(os.path.join(R, "README.md"), "w") as f:
        f.write(README)


README = """# R208 Technologies — Website

Static, dependency-free site. Open `index.html` in a browser or serve the folder:

    python3 -m http.server 8080

## Pages (18)
- `index.html` — hero (Three.js grid field), who we are, services, projects, testimonials, CTA
- `about.html` — agency story, three rules, meet the team
- `services.html` — all eight services + process
- `service-*.html` — 8 detail pages: overview, deliverables, process, related work
- `projects.html` — filterable grid by discipline
- `project-*.html` — 6 case studies: challenge / approach / outcome
- `contact.html` — validated contact form

## Stack
- Vanilla HTML/CSS/JS, no build step
- GSAP + ScrollTrigger (scroll animation), Lenis (smooth scroll), Three.js (hero), Lottie (tile loop) — all via CDN
- Geist (self-hosted woff2) for body/UI, Space Grotesk (Google Fonts) for display

## Editing content
All copy lives in `build.py` (SERVICES, PROJECTS, TESTI, TEAM, VALUES). Run `python3 build.py` to regenerate every page.
`assets/js/data.js` mirrors the same content as JSON — that's the seam for the CMS: replace the static object with a fetch and the grids render from the API.

## Typography switch
Display face is set in one place, `assets/css/style.css`:

    --font-display:'Space Grotesk','Geist',sans-serif;

Change to `'Geist',sans-serif` for a single-family system.

## Notes
- Project imagery is served from a CDN; drop local files into `assets/img/` and update `images.json` + `build.py` to self-host.
- Contact form is front-end only — point it at Formspree, Resend or your endpoint.
- Respects `prefers-reduced-motion`; 3D hero and cursor disable on touch devices.
"""

if __name__ == "__main__":
    build_assets()
    build_index()
    build_services()
    build_service_pages()
    build_projects()
    build_project_pages()
    build_about()
    build_contact()
    n = len([f for f in os.listdir(R) if f.endswith(".html")])
    print("BUILD OK: %d pages" % n)
