# Saurav Poudel — Portfolio

A space-themed portfolio for Saurav Poudel’s work in data engineering, applied AI, software, and creative production. The site uses HTML, CSS, vanilla JavaScript, and Canvas. The `dist/` directory contains the complete static site.

## Live site

GitHub Pages serves the portfolio over HTTPS. The `gh-pages` branch contains a snapshot of `dist/` at its root, with `.nojekyll` to serve the files directly. A new snapshot on that branch publishes updates. [Open the live portfolio](https://poudelsv.github.io/portfolio-atlas/)

## Run locally

From the repository root, start a static server with Python 3.

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory dist
```

Open the preview in a browser or in Codex. [Local portfolio](http://127.0.0.1:8765/)

The site runs directly from `dist/`. A modern browser supports the Canvas animations, PDF preview, and interactive galleries. Behance cover images load from the Behance CDN.

## What’s built

| Page or feature | What visitors can do |
| --- | --- |
| [About](dist/index.html) | See the rotating Earth, a full-width Golden Gate portrait with an animated sky, and scrolling company and tool logos. |
| [Résumé](dist/resume.html) | Scrub through a career timeline, browse work history and collaborators, and view or download the PDF résumé. |
| [Projects](dist/projects.html) | Filter work by field, browse project cards, and open case studies with tools, contributions, and reported outcomes. An interactive relationship map connects fields, projects, and tools. |
| [Creative Projects](dist/creative.html) | Explore photography, videography, 3D modeling and animation, and graphic design galleries. Published work links to Behance, and example slides are labeled as sample studies. |
| sapo and Contact | Ask questions about Saurav’s professional work in the shared dock and follow links to the relevant case study, résumé entry, or gallery. |
| `.sapo` companion | Follow a portrait-based character that rides a momo during scrolling and pointer movement, offers occasional speech bubbles, and reacts to clicks. Three quick clicks trigger a ghost animation followed by revival. |

Planetary covers and the starfield are drawn in Canvas. Reduced-motion preferences turn off page morphs, companion following, and automatic résumé playback.

`sapo` fits a browser-based search model to the portfolio’s projects, roles, skills, credentials, creative work, and first-person examples. It repairs common typos, uses the last topic for follow-up questions, and can prioritize sources the visitor opens during the session. Work and tool answers include project-tree links. The browser stores only the selected portfolio links for this preference. Questions stay in the chat, and the site requires no API key, model download, or inference server.

Run `node --test tests/sapo-search.test.cjs` to verify answer routing, privacy handling, and source links.

## Edit the portfolio

| File or directory | What to edit |
| --- | --- |
| [`dist/landing-data.js`](dist/landing-data.js) | Introduction, contact details, work history, skills, and case studies. Keep each project’s field and tool tags current so the relationship map reflects the project data. |
| [`dist/resume.js`](dist/resume.js) | Career timeline and collaborator logo presentation. Replace [the bundled résumé PDF](dist/assets/Saurav-Poudel-Resume.pdf) when updating the downloadable version. |
| [`dist/creative.js`](dist/creative.js) and [`dist/behance-works.js`](dist/behance-works.js) | Gallery content, sample frames, toolsets, and published work links. Place local gallery media in [`dist/assets/creative/`](dist/assets/creative/). |
| [`dist/landing.js`](dist/landing.js) | Chat interface, contact panel, and project case-study dialogs. |
| [`dist/landing-scene.css`](dist/landing-scene.css) and [`dist/landing-showcase.js`](dist/landing-showcase.js) | Landing photo composition and the company and tool rows. |
| [`dist/sapo-profile.js`](dist/sapo-profile.js), [`dist/sapo-language.js`](dist/sapo-language.js), and [`dist/sapo-search.js`](dist/sapo-search.js) | First-person examples, typo and intent matching, portfolio search, and answer links. |
| [`dist/sapo-buddy.js`](dist/sapo-buddy.js) and [`dist/sapo-buddy.css`](dist/sapo-buddy.css) | Companion movement, occasional messages, click reactions, and the momo ride. |
| [`dist/earth.js`](dist/earth.js), [`dist/planets.js`](dist/planets.js), and [`dist/solar.css`](dist/solar.css) | Procedural planetary covers, shared view transitions, and layout. |

## Credits

- League Spartan and PDF.js ship with their license files. [League Spartan Open Font License](dist/fonts/LeagueSpartan-OFL.txt), [PDF.js license](dist/vendor/pdfjs/LICENSE)
- The résumé includes employer and collaborator marks. [University of Cincinnati](https://www.uc.edu/about/marketing-communications/brand-guide/logos-marks.html), [Delta Air Lines](https://commons.wikimedia.org/wiki/File:Delta_logo.svg), [Fiverr](https://commons.wikimedia.org/wiki/File:Fiverr_logo.svg), [Upwork](https://commons.wikimedia.org/wiki/File:Upwork_Logo.svg), [LSG Sky Chefs](https://www.lsgskychefs.com/), [IBM](https://www.ibm.com/design/language/ibm-logos/8-bar/), [Gate Gourmet](https://gategroup.com/our-brands/gategourmet/), [DO & CO](https://www.doco.com/), [Unifi](https://unifiservice.com/services/aviation/), [VRPatients](https://vrpatients.com/about-us/), [Palantir](https://commons.wikimedia.org/wiki/File:Palantir_Technologies_logo.svg), [Salesforce](https://www.salesforce.com/news/salesforce-logo/), [FAA](https://www.faa.gov/), [TSA](https://commons.wikimedia.org/wiki/File:Transportation_Security_Administration_seal.svg)
- The photography and videography sample frames credit their NASA source material in the galleries. The supplied plane-and-clouds reference illustration credits Ryo Takemasa.
- The white Newrest mark is from the company’s media kit. [Newrest press and media library](https://media.newrest.eu/press-and-media-library/)
- The landing scene uses Saurav’s supplied Golden Gate Bridge photograph. The built-in ImageGen tool isolated the sky, and the site composites the resulting foreground over the animated Earth texture. [Landing image](dist/assets/golden-gate-foreground.webp)
- The landing tool rows use branded icons from Devicon and Hugging Face. [Devicon](https://github.com/devicons/devicon), [Hugging Face brand assets](https://huggingface.co/brand)

<details>
<summary>Golden Gate sky extraction prompt</summary>

> Edit target is the supplied landscape photograph of Saurav pointing toward the Golden Gate Bridge. Produce a precise transparent-sky cutout for compositing with a live web animation. Remove only the blue sky above and through the bridge, including sky between the suspension cables and through both red towers. Set only those sky pixels to actual transparent alpha and retain natural anti-aliased silhouettes. Preserve all non-sky areas as faithfully as possible: the same exact person, face, hair strands, finger and pose, bridge and thin cables, hills, every part of the bay water, the fort and plants. Sky is the only part to edit. Keep the original 16:9 horizontal framing and exact geometry. No crop, reframing, recolor, embellishment, new background, or text.

</details>
