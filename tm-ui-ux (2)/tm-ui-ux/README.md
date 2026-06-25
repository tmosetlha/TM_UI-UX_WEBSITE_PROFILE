# TM_UI/UX

The website of Tshiamo Mosetlha — IT solutions, websites and applications built from your designs.

**Born in fire, built in code.**

## Structure

```
tm-ui-ux/
├── index.html        ← splash/intro page (the spiral animation, plays once)
├── home.html          ← home page
├── about.html
├── services.html
├── process.html
├── projects.html
├── contact.html
├── leaving.html       ← exit screen (ash/cooling-embers), triggered by "Leave site"
├── css/
│   └── style.css      ← all design tokens, colors, type, layout
├── js/
│   ├── fire-spiral.js  ← the core fire/spiral animation engine
│   ├── ash-fade.js     ← the ash cooling-embers animation
│   └── nav.js          ← flame menu toggle + leave-site behavior
└── assets/             ← put logo / image files here
```

## How the splash works

`index.html` is the first page a visitor sees. It plays the fire spiral
animation once. There's an "Enter" button, and if it isn't clicked, the
site auto-advances to `home.html` after 8 seconds.

It only plays once per browser session — `sessionStorage` is used to
remember that the splash has been seen, so if someone navigates back to
`index.html` again in the same session, they're sent straight to
`home.html`. Closing the browser tab and reopening the site starts a
new session, so the splash will play again the next time they visit.

## Navigation

Every inner page has a flame-outline icon in the top-right corner.
Clicking it opens a full-screen menu with links to all pages. There's
also a "Leave site" button next to it — clicking that takes the visitor
to `leaving.html`, the ash/cooling-embers exit screen, with a "Return to
site" button to come back.

## Editing the fire animation

The animation lives in `js/fire-spiral.js` as a reusable function:

```js
createFireSpiral(canvasElement, {
  nameText: 'TM_UI/UX',   // text shown in the center
  nameSize: 46,            // font size in px
  loops: 2.5,              // number of spiral loops
  interactive: true        // mouse-reactive particles
});
```

It's used on `index.html` (splash) and `home.html` (hero) with slightly
different sizes. You can reuse it anywhere by adding a `<canvas>` and
calling `createFireSpiral()` on it.

## Contact form

`contact.html` uses a [Formspree](https://formspree.io) form action.
Before going live:

1. Create a free Formspree account.
2. Create a new form and copy your form endpoint (looks like
   `https://formspree.io/f/abcd1234`).
3. In `contact.html`, replace `YOUR_FORM_ID` in the `<form action="...">`
   line with your real endpoint.

## Deploying to GitHub Pages

1. Create a new repository on GitHub (e.g. `tm-ui-ux`).
2. Push this folder's contents to the repository root:
   ```bash
   git init
   git add .
   git commit -m "Initial TM_UI/UX site"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/tm-ui-ux.git
   git push -u origin main
   ```
3. On GitHub, go to **Settings → Pages**.
4. Under **Source**, select the `main` branch and `/ (root)` folder, then
   save.
5. GitHub will give you a live URL, typically:
   `https://YOUR_USERNAME.github.io/tm-ui-ux/`
6. It can take a minute or two to go live after the first push.

Once live, share that URL — that's your real, hosted TM_UI/UX site.

## Adding your logo image

Drop your logo file (e.g. `TM_UI_logo.png`) into the `assets/` folder,
then reference it in any page with:

```html
<img src="assets/TM_UI_logo.png" alt="TM_UI/UX">
```

## Notes

- All colors and type are defined once in `css/style.css` as CSS
  variables at the top of the file — change a value there and it
  updates everywhere.
- The site respects `prefers-reduced-motion` for visitors who have that
  turned on at the OS level.
- No build step, no dependencies — this is plain HTML, CSS, and
  JavaScript, which is exactly why it works cleanly on GitHub Pages.
