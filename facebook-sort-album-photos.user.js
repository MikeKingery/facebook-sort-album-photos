// ==UserScript==
// @name        Facebook Sort Album Photos
// @namespace   Userscripts
// @match       https://www.facebook.com/media/set/edit/*
// @match       https://www.facebook.com/*
// @version     1.2.13
const scriptVersion = "1.2.13"
// @author      Michael Kingery
// @description Updated selectors for new Facebook album edit UI (grid layout, 2025)
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_listValues
// @grant       GM_deleteValue
// ==/UserScript==

// Handle debug logging to the console
const basicLog = 1;
const detailedLog = 2;
var debugLevel = detailedLog; // 0 = off, 1 = basic, 2 = detailed

// Log the version just at the top
if (debugLevel >= basicLog) {
  console.log("Facebook Sort Album Photos - " + scriptVersion);
}

// https://violentmonkey.github.io/api/matching/
onUrlChange();

if (self.navigation) {
  navigation.addEventListener('navigatesuccess', onUrlChange);
} else {
  let u = location.href;
  new MutationObserver(() => u !== (u = location.href) && onUrlChange())
    .observe(document, { subtree: true, childList: true });
}

function onUrlChange() {
  if (!location.pathname.startsWith('/media/set/edit/')) {
    deactivateEditAlbum();
    return;
  }
  if (debugLevel >= detailedLog) { console.log("Running activateEditAlbum"); }
  activateEditAlbum();
}

function deactivateEditAlbum() {
  if (debugLevel >= basicLog) { console.log("Cleaning up activateEditAlbum"); }
  albumId = null;
  albumEditDictionaryStorageName = null;

  var albumEditGeneratedElements = document.querySelectorAll(".albumEditGenerated");
  if (debugLevel >= basicLog) { console.log(albumEditGeneratedElements); }

  albumEditGeneratedElements.forEach(elementToRemove => {
    if (debugLevel >= basicLog) { console.log("Removing " + elementToRemove.id); }
    elementToRemove.remove();
  });
}


function activateEditAlbum() {
  if (debugLevel >= detailedLog) { console.log("In activateEditAlbum"); }

  (function () {

    var albumId;
    var albumEditDictionaryStorageName;
    // ---------------------------------------------------------------------------
    // Selector helpers — centralised so future Facebook UI changes only need
    // updating here.
    //
    // New DOM structure (2025):
    //   div[role="grid"][aria-label="Edit album"]
    //     div[role="row"]
    //       div[role="gridcell"]            <- one per photo
    //         div                           <- photo wrapper
    //           div
    //             div                       <- image+description area
    //               div                     <- image area
    //                 span
    //                   div[role="button"][aria-label="Click anywhere to tag"]
    //                     div               <- image inner wrapper
    //                       div             <- blurred bg placeholder
    //                       img             <- [0] blurred background
    //                       img             <- [1] actual photo  <- we want this
    //                     textarea          <- caption/description
    //
    // When Facebook changes the UI again, run the "Test Selectors" button to see
    // which selectors stopped returning results, then update the helpers below.
    // Use this console snippet to re-diagnose the new DOM structure:
    //
    //   document.querySelectorAll('img[src*="t39.30808-6"]').forEach((img, i) => {
    //     let el = img, path = [];
    //     for (let j = 0; j < 10; j++) {
    //       if (!el) break;
    //       let d = el.tagName.toLowerCase();
    //       if (el.getAttribute('role'))       d += `[role="${el.getAttribute('role')}"]`;
    //       if (el.getAttribute('aria-label')) d += `[aria-label="${el.getAttribute('aria-label')}"]`;
    //       if (el.getAttribute('data-key'))   d += `[data-key="${el.getAttribute('data-key')}"]`;
    //       path.unshift(d); el = el.parentElement;
    //     }
    //     console.log(`Photo ${i}: ${path.join(' > ')}`);
    //   });
    // ---------------------------------------------------------------------------

    /** Returns the grid cells (one per photo) from the album edit grid. */
    function getAlbumGridCells() {
      // Primary selector: new 2025 grid layout
      var cells = document.querySelectorAll(
        'div[role="grid"][aria-label="Edit album"] div[role="row"] div[role="gridcell"]'
      );
      if (cells.length > 0) return cells;

      // Fallback: old list layout (kept in case Facebook reverts)
      cells = document.querySelectorAll(
        'div[aria-label="Album Edit Composer"] div[role="list"] > div[role="listitem"] > div[role="listitem"][data-key]'
      );
      if (debugLevel >= basicLog && cells.length > 0) {
        console.log("Using legacy list-layout selector");
      }
      return cells;
    }

    /** Returns the actual photo <img> from a gridcell element. */
    function getPhotoImgFromCell(cell) {
      // New layout: second img inside the "Click anywhere to tag" button
      var imgs = cell.querySelectorAll('div[role="button"][aria-label="Click anywhere to tag"] img');
      if (imgs.length >= 2) return imgs[1];
      if (imgs.length === 1) return imgs[0];

      // Fallback: old layout
      var allImgs = cell.querySelectorAll('img');
      if (allImgs.length >= 2) return allImgs[1];
      if (allImgs.length === 1) return allImgs[0];
      return null;
    }

    /** Returns the blurred background element to hide from a gridcell. */
    function getBlurredBgFromCell(cell) {
      var btn = cell.querySelector('div[role="button"][aria-label="Click anywhere to tag"]');
      if (!btn) {
        // Old layout fallback
        return cell.querySelector('div div div');
      }

      // Prefer the actual placeholder element before the live image. In the 2025
      // layout this is a div sibling that holds the blurred background and should
      // never be the main photo or the wrapper that contains it.
      var placeholder = btn.querySelector(':scope > div > div');
      if (placeholder && !placeholder.querySelector('img')) {
        return placeholder;
      }

      var imgs = btn.querySelectorAll('img');
      if (imgs.length >= 2) {
        var firstImg = imgs[0];
        var maybePlaceholder = firstImg.parentElement && firstImg.parentElement.firstElementChild;
        if (maybePlaceholder && maybePlaceholder !== firstImg && !maybePlaceholder.querySelector('img')) {
          return maybePlaceholder;
        }
        return firstImg;
      }

      // If the button only has a single photo image, don't hide it. The user must
      // still see the actual image.
      return null;
    }

    /** Returns the lower metadata block below the photo to hide.
     *  In the 2025 Facebook DOM the visible blank area is usually a parent div
     *  that contains the Description (optional) label, not the inner zero-height
     *  label/textarea subtree itself. We therefore prefer the largest description
     *  container in the cell that is not part of the actual image/button.
     */
    function getDescriptionElFromCell(cell) {
      var imageObj = getPhotoImgFromCell(cell);
      var candidateNodes = [];

      Array.from(cell.querySelectorAll('*')).forEach(function(node) {
        if (!(node instanceof Element)) return;
        if (node.matches('img, video, svg, textarea, input, button')) return;
        if (node.closest('[role="button"][aria-label="Click anywhere to tag"]')) return;
        if (imageObj && (node === imageObj || node.contains(imageObj))) return;
        if (node.querySelector('img, video, svg, .albumEditSortLabelSpan')) return;

        var text = (node.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text || text.indexOf('Description (optional)') === -1) return;

        var height = node.getBoundingClientRect().height || node.offsetHeight || node.clientHeight || 0;
        candidateNodes.push({ node: node, height: height });
      });

      if (candidateNodes.length > 0) {
        candidateNodes.sort(function(a, b) { return b.height - a.height; });
        var selected = candidateNodes[0].node;
        if (!selected.classList.contains('albumEditDescriptionDiv')) {
          selected.classList.add('albumEditDescriptionDiv');
        }
        if (selected.style.display !== 'none') selected.style.display = 'none';
        return selected;
      }

      var labelMatch = Array.from(cell.querySelectorAll('label')).find(function(node) {
        var text = (node.textContent || '').replace(/\s+/g, ' ').trim();
        return text.indexOf('Description (optional)') !== -1;
      });
      if (labelMatch) {
        var hideTarget = labelMatch;
        var current = labelMatch.parentElement;
        while (current && current !== cell && current !== document.body) {
          var currentText = (current.textContent || '').replace(/\s+/g, ' ').trim();
          var hasPhotoNode = !!current.querySelector('img, video, svg');
          var currentHeight = current.getBoundingClientRect().height || current.offsetHeight || current.clientHeight || 0;
          if (!hasPhotoNode && currentText.indexOf('Description (optional)') !== -1 && currentHeight > 0) {
            hideTarget = current;
            break;
          }
          current = current.parentElement;
        }
        if (!hideTarget.classList.contains('albumEditDescriptionDiv')) {
          hideTarget.classList.add('albumEditDescriptionDiv');
        }
        if (hideTarget.style.display !== 'none') hideTarget.style.display = 'none';
        return hideTarget;
      }

      var textareaFallback = cell.querySelector('textarea');
      if (textareaFallback) {
        var parent = textareaFallback.parentElement;
        while (parent && parent !== cell) {
          if (parent.querySelector && parent.querySelector('textarea') === textareaFallback) {
            parent.classList.add('albumEditDescriptionDiv');
            parent.style.display = 'none';
            return parent;
          }
          parent = parent.parentElement;
        }
        textareaFallback.classList.add('albumEditDescriptionDiv');
        textareaFallback.style.display = 'none';
        return textareaFallback;
      }

      return null;
    }

    // ---------------------------------------------------------------------------

    function getImageObjArray() {
      var imageObjArray = [];
      var cells = getAlbumGridCells();
      if (debugLevel >= detailedLog) { console.log("getImageObjArray cells.length = " + cells.length); }

      cells.forEach(function(cell, sortIndex) {
        var imageObj = getPhotoImgFromCell(cell);
        imageObjArray[sortIndex] = imageObj;
      });
      return imageObjArray;
    }

    function addSortLabelSpanToImageObj(imageObj, sortLabelId, sortIndex) {
      var sortLabelSpanObj = document.createElement("span");
      sortLabelSpanObj.id = sortLabelId;
      sortLabelSpanObj.textContent = sortIndex;
      sortLabelSpanObj.classList.add("albumEditSortLabelSpan");
      sortLabelSpanObj.style.position = "absolute";
      sortLabelSpanObj.style.fontSize = "150px";
      sortLabelSpanObj.style.color = "white";
      sortLabelSpanObj.style.textShadow = "5px 0 0 #000, 0 -5px 0 #000, 0 5px 0 #000, -5px 0 0 #000";
      sortLabelSpanObj.style.zIndex = "10";

      // The span is absolutely positioned, so its nearest positioned ancestor
      // must have position:relative. That is the div wrapping the two img tags,
      // which is imageObj.parentElement. Setting it on the img itself does nothing.
      if (imageObj.parentElement) imageObj.parentElement.style.position = 'relative';
      imageObj.after(sortLabelSpanObj);
      return sortLabelSpanObj;
    }

    if (debugLevel >= basicLog) { console.log("Loading buttons"); }
    function addButton(text, onclick, cssObj) {
      cssObj = cssObj || { position: 'absolute', bottom: '7%', left: '4%', 'z-index': 3 }
      let button = document.createElement('button'), btnStyle = button.style
      document.body.appendChild(button)
      button.innerHTML = text
      button.onclick = onclick
      Object.keys(cssObj).forEach(key => btnStyle[key] = cssObj[key])
      return button
    }

    function getFileNameFromUrl(urlPath) { return urlPath.split('/').pop().split('?')[0]; }

    function saveCurrentOrder() {
      var albumImageOrderDictionary = {};
      if (debugLevel >= basicLog) { console.log("Saving Current Order " + albumId); }

      var imageObjArray = getImageObjArray();
      imageObjArray.forEach(function(imageObj, sortIndex) {
        var imageFileName = getFileNameFromUrl(imageObj.src);
        albumImageOrderDictionary[imageFileName] = sortIndex;
        if (debugLevel >= basicLog) { console.log("Save - [" + sortIndex + "] - " + imageFileName); }
      });

      if (debugLevel >= basicLog) { console.log(albumImageOrderDictionary); }

      GM_setValue(albumEditDictionaryStorageName, JSON.stringify(albumImageOrderDictionary));

      loadPreviousOrder();
    }

    function loadPreviousOrder() {
      if (debugLevel >= basicLog) { console.log("Loading Previous Order"); }

      var albumImageOrderDictionary = JSON.parse(GM_getValue(albumEditDictionaryStorageName, "{}"));

      var imageObjArray = getImageObjArray();
      imageObjArray.forEach(function(imageObj, sortIndex) {
        if (!imageObj) return;
        var imageFileName = getFileNameFromUrl(imageObj.src);
        var previousSavedSortIndex = albumImageOrderDictionary[imageFileName];

        var sortLabelId = imageObj.getAttribute("sortLabelId");

        if (debugLevel >= basicLog) { console.log("Load - [" + previousSavedSortIndex + "] - " + imageFileName); }
        var sortLabelSpan = document.querySelector("#" + sortLabelId);
        if (!sortLabelSpan) {
          if (debugLevel >= basicLog) { console.log("Skipping missing sort label for " + imageFileName); }
          return;
        }

        var newSortLabelSpanContent;
        var newSortLabelSpanColor;
        if (!Object.keys(albumImageOrderDictionary).length) {
          // No saved data yet — show current position index in grey so user knows script is running
          newSortLabelSpanContent = sortIndex;
          newSortLabelSpanColor = "grey";
        } else if (previousSavedSortIndex >= 0) {
          // We have saved data — show saved index, color by whether position matches
          newSortLabelSpanContent = previousSavedSortIndex;
          newSortLabelSpanColor = (sortIndex == previousSavedSortIndex) ? "white" : "red";
        } else {
          // Image not in saved data (new photo added since last save)
          newSortLabelSpanContent = "?";
          newSortLabelSpanColor = "red";
        }

        var oldSortLabelSpanContent = (sortLabelSpan) ? sortLabelSpan.textContent : "";
        if (debugLevel >= basicLog) { console.log("----[" + sortLabelId + "] Changing from '" + oldSortLabelSpanContent + "' to '" + newSortLabelSpanContent + "' - " + newSortLabelSpanColor); }

        sortLabelSpan.textContent = newSortLabelSpanContent;
        sortLabelSpan.style.color = newSortLabelSpanColor;
      });
    }

    function clearData() {
      let arrayOfKeys = GM_listValues();
      if (debugLevel >= basicLog) { console.log(arrayOfKeys); }

      arrayOfKeys.forEach(keyForDataToDelete => {
        var albumImageOrderDictionary = JSON.parse(GM_getValue(keyForDataToDelete, "{}"));
        var numberOfImages = Object.keys(albumImageOrderDictionary).length;

        if (confirm("Removing " + keyForDataToDelete + "? [" + numberOfImages + "]")) {
          GM_deleteValue(keyForDataToDelete);
          if (debugLevel >= basicLog) { console.log("Calling loadPreviousOrder from - clearData"); }
          loadPreviousOrder();
        }
      });
    }

    function validateOrder() {
      console.log("getImageObjArray");
      getImageObjArray().forEach(function(imageObj, sortIndex) {
        var sortLabelId = imageObj.getAttribute("sortLabelId");
        console.log("[sortIndex = " + sortIndex + "][" + sortLabelId + "] - [" + getFileNameFromUrl(imageObj.src).substr(-9) + "]");
      });
      console.log("---------------------------------------");
    }

    function toggleDescriptions() {
      if (debugLevel >= basicLog) { console.log("toggleDescriptions"); }

      // User feature: show or hide the description fields so the album card can be
      // more compact while still allowing quick access to the captions when needed.
      var descriptionElements = document.querySelectorAll(".albumEditDescriptionDiv");
      descriptionElements.forEach(elementToShowHide => {
        elementToShowHide.style.display = (elementToShowHide.style.display === "none") ? "" : "none";
      });
    }

    // Tests every named selector used by the helper functions and reports counts.
    // Open DevTools console before clicking — the table prints there.
    // A count of 0 on a primary selector means Facebook changed the UI again.
    function testSelectors() {
      console.log("=== Test Selectors ===");

      var checks = [
        // ---- Album name input ----
        {
          label: "Album name input (aria-label)",
          query: function() { return document.querySelectorAll('label[aria-label="Album name"] input'); },
          note: "XPath fallback used if this is 0"
        },
        {
          label: "Album name input (XPath fallback)",
          query: function() {
            var result = document.evaluate(
              "//span[text()='Album name']/following::input",
              document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
            );
            // Return a fake NodeList-like object with a .length
            return { length: result.snapshotLength, _xpath: true };
          },
          note: "This is the active fallback — must be > 0"
        },
        // ---- Grid cells (photo containers) ----
        {
          label: "Photo grid container [PRIMARY - 2025]",
          query: function() { return document.querySelectorAll('div[role="grid"][aria-label="Edit album"]'); },
          note: "Outer grid wrapper"
        },
        {
          label: "Photo grid rows [PRIMARY - 2025]",
          query: function() { return document.querySelectorAll('div[role="grid"][aria-label="Edit album"] div[role="row"]'); },
          note: ""
        },
        {
          label: "Photo gridcells [PRIMARY - 2025]",
          query: function() { return document.querySelectorAll('div[role="grid"][aria-label="Edit album"] div[role="row"] div[role="gridcell"]'); },
          note: "Should equal number of photos"
        },
        {
          label: "Photo list container [LEGACY fallback]",
          query: function() { return document.querySelectorAll('div[aria-label="Album Edit Composer"]'); },
          note: "Expected 0 in 2025 UI"
        },
        {
          label: "Photo listitems [LEGACY fallback]",
          query: function() { return document.querySelectorAll('div[aria-label="Album Edit Composer"] div[role="list"] > div[role="listitem"] > div[role="listitem"][data-key]'); },
          note: "Expected 0 in 2025 UI"
        },
        // ---- Per-cell selectors (run against first cell only) ----
        {
          label: "Tag button inside first cell [PRIMARY - 2025]",
          query: function() {
            var cell = document.querySelector('div[role="grid"][aria-label="Edit album"] div[role="row"] div[role="gridcell"]');
            if (!cell) return { length: 0 };
            return cell.querySelectorAll('div[role="button"][aria-label="Click anywhere to tag"]');
          },
          note: "Should be 1 per cell"
        },
        {
          label: "Images inside tag button, first cell [PRIMARY - 2025]",
          query: function() {
            var cell = document.querySelector('div[role="grid"][aria-label="Edit album"] div[role="row"] div[role="gridcell"]');
            if (!cell) return { length: 0 };
            return cell.querySelectorAll('div[role="button"][aria-label="Click anywhere to tag"] img');
          },
          note: "Should be 2 (blurred bg + actual photo)"
        },
        {
          label: "Blurred bg div inside tag button, first cell [PRIMARY - 2025]",
          query: function() {
            var cell = document.querySelector('div[role="grid"][aria-label="Edit album"] div[role="row"] div[role="gridcell"]');
            if (!cell) return { length: 0 };
            var btn = cell.querySelector('div[role="button"][aria-label="Click anywhere to tag"]');
            if (!btn) return { length: 0 };
            return btn.querySelectorAll(':scope > div > div');
          },
          note: "Should be >= 1"
        },
        {
          label: "Description textarea inside first cell [PRIMARY - 2025]",
          query: function() {
            var cell = document.querySelector('div[role="grid"][aria-label="Edit album"] div[role="row"] div[role="gridcell"]');
            if (!cell) return { length: 0 };
            return cell.querySelectorAll('textarea');
          },
          note: "Should be 1 per cell"
        },
        // ---- Sort labels (only present after script has run) ----
        {
          label: "Sort label spans (injected by script)",
          query: function() { return document.querySelectorAll('.albumEditSortLabelSpan'); },
          note: "Should equal number of photos after page loads"
        },
      ];

      var passed = 0, failed = 0;
      checks.forEach(function(check) {
        var result = check.query();
        var count = result.length;
        var ok = count > 0;
        if (ok) passed++; else failed++;
        var icon = ok ? "✅" : "❌";
        console.log(icon + " [" + count + "] " + check.label + (check.note ? "  ← " + check.note : ""));
      });

      console.log("--- " + passed + " passed, " + failed + " failed ---");
      console.log("If any PRIMARY selector shows 0, Facebook changed the UI.");
      console.log("Run the diagnosis snippet from the script comments to find the new structure.");

      // Surface the summary without requiring DevTools to be open
      var summary = passed + "/" + (passed + failed) + " selectors found.\n\n";
      var failedChecks = checks.filter(function(check) { return check.query().length === 0; });
      if (failedChecks.length > 0) {
        summary += "MISSING (0 results):\n";
        failedChecks.forEach(function(c) { summary += "  - " + c.label + "\n"; });
        summary += "\nOpen DevTools console for the full report.";
      } else {
        summary += "All selectors found. Open DevTools console for counts.";
      }
      alert(summary);
    }

    function getCellRootForSpacing(cell) {
      if (!cell || !(cell instanceof Element)) return cell;

      var photoButton = cell.querySelector('div[role="button"][aria-label="Click anywhere to tag"]');
      if (photoButton) {
        var photoPanel = photoButton.parentElement;
        if (photoPanel && photoPanel !== cell) {
          var candidate = photoPanel.parentElement;
          if (candidate && candidate !== cell && candidate.querySelector('img, video, svg')) {
            return candidate;
          }
        }
      }

      var directWrappers = Array.from(cell.children).filter(function(node) {
        if (!(node instanceof Element)) return false;
        if (node.matches('img, video, svg, textarea, input, button')) return false;
        return !!node.querySelector('img, video, svg');
      });

      if (directWrappers.length > 0) {
        directWrappers.sort(function(a, b) {
          var aH = a.getBoundingClientRect().height || a.offsetHeight || a.clientHeight || 0;
          var bH = b.getBoundingClientRect().height || b.offsetHeight || b.clientHeight || 0;
          return bH - aH;
        });
        return directWrappers[0];
      }

      return cell;
    }

    function hideLowerActionRow(cell) {
      if (!cell || !(cell instanceof Element)) return;

      var actionRow = cell.querySelector('.albumEditActionRow');
      if (actionRow && actionRow.style.display !== 'none') actionRow.style.display = 'none';

      var selectors = [
        '.albumEditActionRow',
        '[aria-label*="More"]',
        '[aria-label="Tag Friends"]',
        '[aria-label="Edit Location"]'
      ];

      var nodesToHide = new Set();
      selectors.forEach(function(selector) {
        cell.querySelectorAll(selector).forEach(function(node) {
          if (node && node !== cell && !node.closest('div[role="button"][aria-label="Click anywhere to tag"]')) {
            nodesToHide.add(node);
          }
        });
      });

      nodesToHide.forEach(function(node) {
        if (!(node instanceof Element)) return;
        if (node.style.display !== 'none') node.style.display = 'none';
      });
    }

    function compactPhotoCard(cell) {
      if (!cell || !(cell instanceof Element)) return;

      var imageObj = getPhotoImgFromCell(cell);
      var cardRoot = getCellRootForSpacing(cell);
      var photoHeight = imageObj ? (imageObj.getBoundingClientRect().height || imageObj.offsetHeight || imageObj.clientHeight || 0) : 0;

      new Set([cell, cardRoot]).forEach(function(node) {
        if (photoHeight > 0) {
          node.style.height = photoHeight + 'px';
          node.style.maxHeight = photoHeight + 'px';
        }
        node.style.minHeight = '0';
        node.style.overflow = 'hidden';
        node.style.gap = '0';
        node.style.paddingBottom = '0';
        node.style.marginBottom = '0';
      });

      hideLowerActionRow(cell);
    }


    // Add buttons
    addButton('Save Order',    saveCurrentOrder,  { position: 'fixed', bottom: '9%', left: '50px',  'z-index': 3, fontWeight: 'bold', fontSize: '20px' }).classList.add("albumEditGenerated");
    addButton('Load Order',    loadPreviousOrder, { position: 'fixed', bottom: '9%', left: '210px', 'z-index': 3, fontWeight: 'bold', fontSize: '20px' }).classList.add("albumEditGenerated");
    addButton('Clear Data',    clearData,         { position: 'fixed', bottom: '6%', left: '50px',  'z-index': 3 }).classList.add("albumEditGenerated");
    addButton('Validate',      validateOrder,     { position: 'fixed', bottom: '6%', left: '150px', 'z-index': 3 }).classList.add("albumEditGenerated");
    addButton('Descriptions',  toggleDescriptions,{ position: 'fixed', bottom: '6%', left: '250px', 'z-index': 3 }).classList.add("albumEditGenerated");
    addButton('Test Selectors',testSelectors,     { position: 'fixed', bottom: '6%', left: '355px', 'z-index': 3, background: '#1a3a5c', color: '#7ec8f7', border: '1px solid #7ec8f7' }).classList.add("albumEditGenerated");


    // MutationObserver — watches for the album grid to appear/change
    const observer = new MutationObserver(() => {
      applyAlbumGridStateOnMutation();
    });

    function applyAlbumGridState() {
      var albumInputObj = document.querySelector('label[aria-label="Album name"] input');
      if (!albumInputObj) {
        var albumNameSpanXPathResult = document.evaluate(
          "//span[text()='Album name']/following::input",
          document, null, XPathResult.ANY_TYPE, null
        );
        albumInputObj = albumNameSpanXPathResult.iterateNext();
      }
      if (!albumInputObj) { return false; }

      albumId = albumInputObj.value.replace(/[\W_]+/g, "_");
      albumEditDictionaryStorageName = "facebookAlbumIdSortDictionary-" + albumId;

      var cells = getAlbumGridCells();

      var spansInsideCells = 0;
      cells.forEach(function(cell) {
        if (cell.querySelector(".albumEditSortLabelSpan")) spansInsideCells++;
      });
      var gridNeedsSortLabels = (cells.length > 0) && (spansInsideCells < cells.length);
      if (debugLevel >= basicLog) {
        console.log("cells=" + cells.length +
          ", spansInsideCells=" + spansInsideCells +
          ", changed=" + gridNeedsSortLabels);
      }

      cells.forEach(function(cell) {
        cell.querySelectorAll('textarea').forEach(function(textarea) {
          if (textarea.style.display !== 'none') textarea.style.display = 'none';
        });

        var imageObj = getPhotoImgFromCell(cell);
        var blurredBg = getBlurredBgFromCell(cell);
        if (blurredBg && imageObj && (blurredBg === imageObj || blurredBg.contains(imageObj))) {
          blurredBg = null;
        }
        if (blurredBg && blurredBg.style.display !== "none") blurredBg.style.display = "none";

        compactPhotoCard(cell);

        getDescriptionElFromCell(cell);
      });

      if (gridNeedsSortLabels) {
        cells.forEach(function(cell, sortIndex) {
          var imageObj = getPhotoImgFromCell(cell);
          if (!imageObj) {
            if (debugLevel >= basicLog) { console.log("[" + sortIndex + "] No image found in cell"); }
            return;
          }
          if (debugLevel >= basicLog) { console.log("[" + sortIndex + "] = " + imageObj.src); }

          var sortLabelId = "sortLabel-" + sortIndex;
          var sortLabelSpanObj = cell.querySelector(".albumEditSortLabelSpan");

          if (!sortLabelSpanObj) {
            addSortLabelSpanToImageObj(imageObj, sortLabelId, sortIndex);
          } else {
            sortLabelSpanObj.id = sortLabelId;
            sortLabelSpanObj.textContent = sortIndex;
            sortLabelSpanObj.style.color = "white";
          }

          imageObj.setAttribute("sortLabelId", sortLabelId);
        });

        if (debugLevel >= basicLog) { console.log("Calling loadPreviousOrder from - MutationObserver"); }
        loadPreviousOrder();
      }

      return true;
    }

    function applyAlbumGridStateOnMutation() {
      try {
        return applyAlbumGridState();
      } catch (error) {
        console.error("applyAlbumGridState failed:", error);
        return false;
      }
    }

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    applyAlbumGridStateOnMutation();

  })();

}
