# Facebook Sort Album Photos

A Tampermonkey/Violentmonkey userscript that numbers photos in the Facebook album edit page so you can track their original sort order and detect when Facebook scrambles them.

## What it does

- Overlays a large number on each photo in the album editor showing its saved position
- **Save Order** — records the current photo sequence to persistent storage keyed by album name
- **Load Order** — re-reads saved order and recolors labels (white = correct position, red = moved)
- **Clear Data** — deletes saved order data
- **Validate** — logs the current image array to the console for debugging
- **Descriptions** — toggles the caption/description textareas to save vertical space
- **Test Selectors** — checks every DOM selector the script relies on and reports pass/fail (see below)

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/)
2. Create a new script and paste in `facebook-sort-album-photos.user.js`
3. Navigate to `https://www.facebook.com/media/set/edit/<your-album-id>`

## Efficient testing workflow (what actually worked)

The reliable workflow is:

1. Start from a realistic fixture, not a simplified one.
   - The regression harness in `run-tests.js` should model the actual Facebook card structure: outer card root, photo button, action row, and description block.
   - This is the important part that caught the earlier bug: the blank space was not being created by the inner text area, but by the outer card/root and the lower action row.
2. Validate the rendered behavior, not just whether a selector exists.
   - Check `display`, `height`, `offsetHeight`, and whether the image remains visible.
   - A node being present or hidden in the DOM is not the same as the page looking correct.
3. Use a small, focused browser-level regression.
   - The strongest tests are the ones that exercise the real layout path: compacting the card root, hiding the action row, keeping the image visible, and reapplying the sort label after a rerender.
4. Keep the regression suite around after the fix.
   - This is the easiest way to prevent “it passes locally but looks wrong in the browser” regressions from coming back.

### Lessons learned the hard way

- The obvious textarea/label area is often not the real spacer.
- The actual visual gap can live higher in the DOM tree, on the outer card wrapper, not the inner caption region.
- Fixing the wrong node can make the selector tests pass while leaving the page visibly wrong.
- Local fixture tests were useful, but they only became trustworthy once they matched the real page structure closely enough to reproduce the layout issue.
- The best signal is the browser-rendered outcome: is the photo still full size and is the white space removed without distorting the sort label?

## When Facebook breaks it (and they will)

The script targets Facebook's React/Comet UI which changes without notice. The first symptom is usually that photos get no sort labels — the log will show `cells=0`.

### Step 1 — Click "Test Selectors"

This button checks every selector the script uses and pops an alert listing which ones returned 0 results. It also logs a detailed pass/fail table to the DevTools console.

### Step 2 — Re-diagnose the new DOM structure

Run this snippet in the browser console while on the album edit page:

```javascript
document.querySelectorAll('img[src*="t39.30808-6"]').forEach((img, i) => {
  let el = img, path = [];
  for (let j = 0; j < 10; j++) {
    if (!el) break;
    let d = el.tagName.toLowerCase();
    if (el.getAttribute('role'))       d += `[role="${el.getAttribute('role')}"]`;
    if (el.getAttribute('aria-label')) d += `[aria-label="${el.getAttribute('aria-label')}"]`;
    if (el.getAttribute('data-key'))   d += `[data-key="${el.getAttribute('data-key')}"]`;
    path.unshift(d); el = el.parentElement;
  }
  console.log(`Photo ${i}: ${path.join(' > ')}`);
});
```

`t39.30808-6` is Facebook's CDN path segment for full-size album photos (as opposed to `t39.30808-1` which is profile pictures). This snippet walks up the DOM from each photo and prints every ancestor's tag, role, aria-label, and data-key — exactly what you need to write new selectors.

### Step 3 — Update the selector helpers

All selectors live in four small functions at the top of `activateEditAlbum`:

| Function | What it finds |
|---|---|
| `getAlbumGridCells()` | One element per photo (the outermost photo container) |
| `getPhotoImgFromCell(cell)` | The actual `<img>` inside a cell |
| `getBlurredBgFromCell(cell)` | The blurred background element to hide |
| `getDescriptionElFromCell(cell)` | The caption/description element |

Update the primary selector in the relevant function. Keep the old selector as a fallback comment or secondary branch.

---

## DOM structure history

### 2024 (original) — List layout

```
div[aria-label="Album Edit Composer"]
  div[role="list"]
    div[role="listitem"]
      div[role="listitem"][data-key]     <- one per photo
        div
          div
            div                          <- imageDiv (child[0])
              img                        <- [0] blurred bg
              img                        <- [1] actual photo
            div                          <- descriptionDiv (child[1])
```

Key attributes: `aria-label="Album Edit Composer"`, `role="listitem"`, `data-key`

### 2025 (current) — Grid layout

```
div[role="grid"][aria-label="Edit album"]
  div[role="row"]
    div[role="gridcell"]                 <- one per photo
      div
        div
          div
            span
              div[role="button"][aria-label="Click anywhere to tag"]
                div
                  div                    <- blurred bg placeholder (hide this)
                  img                    <- [0] blurred bg image
                  img                    <- [1] actual photo
                textarea                 <- caption/description (was a div in 2024)
```

Key attributes: `aria-label="Edit album"`, `role="gridcell"`, `aria-label="Click anywhere to tag"`

Notable changes from 2024:
- `aria-label="Album Edit Composer"` → `aria-label="Edit album"`
- `role="list/listitem"` → `role="grid/row/gridcell"`
- `data-key` attribute removed
- Description is now a `<textarea>` inside the photo button, not a sibling `<div>`
- Two `<img>` tags still present (blurred bg + actual photo), same `[1]` indexing works

---

## Test harness

Run `npm install` once, then use `npm test` to execute `run-tests.js`. The Playwright harness uses a synthetic album fixture and checks rendered card height, image visibility, action-row hiding, sort labels, save/load behavior, and re-render stability.

Personal Facebook page captures, album photos/captions, and archived page copies are local investigation materials and should not be committed to this public repository.

## Working checkpoint / GitHub flow

The working version is the known-good state: the card compaction fix and the Playwright regression tests are both passing. For routine work, commit directly to `main` instead of creating a temporary checkpoint branch. If you want a restore point, use a tag rather than a branch.

Recommended sequence:

```bash
git checkout main
git pull --ff-only origin main
git add .
git commit -m "Fix compact-card spacing in album editor"
git tag v1.2.12
git push origin main --follow-tags
```

This keeps the repo clean and makes the working version easy to find without leaving a dangling branch behind.

Only keep a branch when you are actively doing a larger feature or a multi-step refactor. For the normal workflow here, `main` plus a version tag is the simpler and cleaner default.

## Release note / versioning

Always update the userscript `@version` when you make any code change, even a small fix. A good habit is: change it in `facebook-sort-album-photos.user.js`, then reload the script in Tampermonkey/Violentmonkey so the updated version is obvious in the install list.
