// ==UserScript==
// @name        Facebook Sort Album Photos
// @namespace   Violentmonkey Scripts
// @match       https://www.facebook.com/media/set/edit/*
// @match       https://www.facebook.com/*
// @version     1.0
// @author      Michael Kingery
// @description 9/26/2024, 10:54:00 PM
// @require https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_listValues
// @grant       GM_deleteValue
// ==/UserScript==

// Handle debug logging to the console
const alwaysLog = -1;
const noLog = 0;
const basicLog = 1;
const detailedLog = 2;
var debugLevel = noLog; // 0 = off, 1 = basic, 2 = detailed

// https://violentmonkey.github.io/api/matching/
onUrlChange();

if (self.navigation) {
  navigation.addEventListener('navigatesuccess', onUrlChange);
} else {
  let u = location.href;
  new MutationObserver(() => u !== (u = location.href) && onUrlChange())
    .observe(document, {subtree: true, childList: true});
}

function onUrlChange() {
  if (!location.pathname.startsWith('/media/set/edit/')) {
    deactivateEditAlbum();
    return;
  }
  if (debugLevel >= detailedLog){ console.log("Running activateEditAlbum"); }
  activateEditAlbum();
}

function deactivateEditAlbum(){
  if (debugLevel >= basicLog){ console.log("Cleaning up activateEditAlbum"); }
  albumId = null;
  albumEditDictionaryStorageName = null;

  var albumEditGeneratedElements = document.querySelectorAll(".albumEditGenerated");
  if (debugLevel >= basicLog){ console.log(albumEditGeneratedElements); }

  albumEditGeneratedElements.forEach(elementToRemove => {
    if (debugLevel >= basicLog){ console.log("Removing " + elementToRemove.id); }
    elementToRemove.remove();
  });
}


function activateEditAlbum(){
  if (debugLevel >= detailedLog){ console.log("In activateEditAlbum"); }

(function() {

var albumId;
var albumEditDictionaryStorageName;
var imagesFound = 0;

function getImageObjArray(){
  // Reset the global array; we won't need the global array once we integrate this function
  var imageObjArray = [];
  const listItemsInAlbumEditComposerDiv = document.querySelectorAll('div[aria-label="Album Edit Composer"] div[role="list"]>div[role="listitem"]>div[role="listitem"][data-key]');
  if (debugLevel >= detailedLog){ console.log("listItemsInAlbumEditComposerDiv.length = " + listItemsInAlbumEditComposerDiv.length); }

  listItemsInAlbumEditComposerDiv.forEach(function callback(albumListItem, sortIndex) {
    var descriptionAndImageDivChildArray = albumListItem.querySelector('div:first-child').querySelector('div:first-child').querySelectorAll(':scope > div');
    if (debugLevel >= detailedLog){ console.log("descriptionAndImageDivChildArray.length = " + descriptionAndImageDivChildArray.length); }
    var imageDiv = descriptionAndImageDivChildArray[0];

    // It's the second image, so grab the second one
    var imageObj = imageDiv.querySelectorAll(':scope img')[1];
    imageObjArray[sortIndex] = imageObj;
  });
  return imageObjArray;
}

function addSortLabelSpanToImageObj(imageObj, sortLabelId, sortIndex){
  // Create the span that will hold the number and drop the sortIndex in by default as it's the initial order (we may change this later to always grab the last sort order, who knows?)
    // https://css-tricks.com/text-blocks-over-image/
  var sortLabelSpanObj = document.createElement("span");
  sortLabelSpanObj.id = sortLabelId;
  sortLabelSpanObj.textContent = sortIndex;
  sortLabelSpanObj.classList.add("albumEditSortLabelSpan");
  sortLabelSpanObj.style.position = "absolute";
  sortLabelSpanObj.style.fontSize = "150px";
  sortLabelSpanObj.style.color = "white";
  sortLabelSpanObj.style.textShadow = "5px 0 0 #000, 0 -5px 0 #000, 0 5px 0 #000, -5px 0 0 #000";
  sortLabelSpanObj.style.zIndex = "10";

  imageObj.after(sortLabelSpanObj);
  return sortLabelSpanObj;
}

if (debugLevel >= basicLog){ console.log("Loading buttons");; }
function addButton(text, onclick, cssObj) {
    cssObj = cssObj || {position: 'absolute', bottom: '7%', left:'4%', 'z-index': 3}
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
  if (debugLevel >= basicLog){ console.log("Saving Current Order " + albumId);; }

  // Loop through and put the URL in an array we can save for this albumId
  var imageObjArray = getImageObjArray();
  imageObjArray.forEach(function callback(imageObj, sortIndex) {
    var imageFileName = getFileNameFromUrl(imageObj.src);
    albumImageOrderDictionary[imageFileName] = sortIndex;
    if (debugLevel >= basicLog){ console.log("Save - [" + sortIndex + "] - " + imageFileName); }
   });

  if (debugLevel >= basicLog){ console.log(albumImageOrderDictionary); }

  // Now save it based on the albumId
  GM_setValue(albumEditDictionaryStorageName, JSON.stringify(albumImageOrderDictionary));

  // Now go ahead and re-read it to set the numbers and validate that it's been saved
  loadPreviousOrder();
}

function loadPreviousOrder() {
  if (debugLevel >= basicLog){ console.log("Loading Previous Order"); }

  // Grab the last order of images based on the albumId
  var albumImageOrderDictionary = JSON.parse(GM_getValue(albumEditDictionaryStorageName, "{}"));

  // Now loop the images and see if we have a reference for the imageFileName
  var imageObjArray = getImageObjArray();
  imageObjArray.forEach(function callback(imageObj, sortIndex) {
    var imageFileName = getFileNameFromUrl(imageObj.src);
    var previousSavedSortIndex = albumImageOrderDictionary[imageFileName];

    // See if we can get the sortLabelId from the imageObj itself
    var sortLabelId = imageObj.getAttribute("sortLabelId");

    if (debugLevel >= basicLog){ console.log("Load - [" + previousSavedSortIndex + "] - " + imageFileName); }
    // Now update the label with the previousSavedSortIndex for that image
    var sortLabelSpan = document.querySelector("#" + sortLabelId);

    // Figure out what to put for the textContent; show nothing if there's nothing in the dictionary
    // If we have a previousSavedSortIndex show the number, otherwise put a question mark
    var newSortLabelSpanContent = "?";
    if (!Object.keys(albumImageOrderDictionary).length){
      newSortLabelSpanContent = "";
    } else if (previousSavedSortIndex >= 0){
      newSortLabelSpanContent = previousSavedSortIndex;
    }
    // If it matches the previousSavedSortIndex make it white, otherwise read so we know we need to move the image
    var newSortLabelSpanColor = (sortIndex == previousSavedSortIndex) ? "white" : "red";

    // First, if the image doesn't already have an albumEditSortLabelSpan add one - I don't think we need this naymore
    //if (!sortLabelSpan){
    //  sortLabelSpan = addSortLabelSpanToImageObj(imageObj, sortLabelId, sortIndex); }

    var oldSortLabelSpanContent = (sortLabelSpan) ? sortLabelSpan.textContent: "";
    if (debugLevel >= basicLog){ console.log("----[" + sortLabelId + "] Changing from ''" + oldSortLabelSpanContent + "' to '" + newSortLabelSpanContent + "' - " + newSortLabelSpanColor); }

    sortLabelSpan.textContent = newSortLabelSpanContent;
    sortLabelSpan.style.color = newSortLabelSpanColor;
   });
}

function clearData(){
  let arrayOfKeys = GM_listValues();
  if (debugLevel >= basicLog){ console.log(arrayOfKeys); }

  arrayOfKeys.forEach(keyForDataToDelete => {
    // Load the data so that we can find out how many keys are there
    var albumImageOrderDictionary = JSON.parse(GM_getValue(keyForDataToDelete, "{}"));
    var numberOfImages = Object.keys(albumImageOrderDictionary).length;

    if (confirm("Removing " + keyForDataToDelete + "? [" + numberOfImages + "]")){
      GM_deleteValue(keyForDataToDelete);
      if (debugLevel >= basicLog){ console.log("Calling loadPreviousOrder from - clearData"); }
      loadPreviousOrder();
    }
  });
}

function validateOrder() {
  console.log("getImageObjArray");
  getImageObjArray().forEach(function callback(imageObj, sortIndex) {
    var sortLabelId = imageObj.getAttribute("sortLabelId");
    console.log("[sortIndex = "+sortIndex+"]["+sortLabelId+"] - ["+getFileNameFromUrl(imageObj.src).substr(-9)+"]");
  });
  console.log("---------------------------------------");
  // Now loop through the labels and make sure we have exactly the right amount
}

function toggleDescriptions() {
  if (debugLevel >= basicLog){ console.log("toggleDescriptions"); }

  var descriptionElements = document.querySelectorAll(".albumEditDescriptionDiv");

  descriptionElements.forEach(elementToShowHide => {
    elementToShowHide.style.display = (elementToShowHide.style.display === "none") ? "block" : "none";
  });
}

// Add buttons to saveCurrentOrder and loadPreviousOrder
addButton('Save Order', saveCurrentOrder, {position: 'absolute', bottom: '9%', left:'50px', 'z-index': 3, fontWeight:'bold', fontSize:'20px'}).classList.add("albumEditGenerated");
addButton('Load Order', loadPreviousOrder, {position: 'absolute', bottom: '9%', left:'210px', 'z-index': 3, 'font-weight':'bold', fontSize:'20px'}).classList.add("albumEditGenerated");
addButton('Clear Data', clearData, {position: 'absolute', bottom: '6%', left:'50px', 'z-index': 3}).classList.add("albumEditGenerated");
addButton('Validate', validateOrder, {position: 'absolute', bottom: '6%', left:'150px', 'z-index': 3}).classList.add("albumEditGenerated");
addButton('Descriptions', toggleDescriptions, {position: 'absolute', bottom: '6%', left:'250px', 'z-index': 3}).classList.add("albumEditGenerated");




VM.observe(document.body, () => {
  // Try to find the Album Name input; it used to have an aria-label but it doesn't anymore - try first anyhow
  var albumInputObj = document.querySelector('label[aria-label="Album Name"] input');
  if (!albumInputObj) {
    // Try to find it using XPath
    var albumNameSpanXPathResult = document.evaluate("//span[text()='Album Name']/following::input", document, null, XPathResult.ANY_TYPE, null );
    albumInputObj = albumNameSpanXPathResult.iterateNext();
  }
  if (debugLevel >= detailedLog){ console.log("Checking albumInputObj = " + (albumInputObj ? "True" : "False")); }
  if (!albumInputObj) { return false; }
  // Replace everything that it not a character with an underscore
  albumId = albumInputObj.value.replace(/[\W_]+/g,"_");
  albumEditDictionaryStorageName = "facebookAlbumIdSortDictionary-" + albumId;
  if (debugLevel >= basicLog){ console.log('Observing albumId = ' + albumId); }

  // Find the target node
  const listItemsInAlbumEditComposerDiv = document.querySelectorAll('div[aria-label="Album Edit Composer"] div[role="list"]>div[role="listitem"]>div[role="listitem"][data-key]');
  if (debugLevel >= detailedLog){ console.log("listItemsInAlbumEditComposerDiv.length = " + listItemsInAlbumEditComposerDiv.length); }

  // What's happening when we reorder the images is that the number of images doesn't change, BUT the listItems reloads and we lose the sortLabel
  // So, what we need to do is enhance the check to see if the listItemsInAlbumChanged by checking both for new images AND to make sure there's the same number of albumEditSortLabelSpan as images
  var albumEditSortLabelSpansFound = document.querySelectorAll(".albumEditSortLabelSpan");
  var listItemsInAlbumChanged = ((listItemsInAlbumEditComposerDiv.length > imagesFound) || (listItemsInAlbumEditComposerDiv.length > albumEditSortLabelSpansFound.length));
  if (debugLevel >= basicLog){ console.log("listItems=" + listItemsInAlbumEditComposerDiv.length + ", imagesFound=" + imagesFound + ", sortLabelSpans=" + albumEditSortLabelSpansFound.length + ", changed = " + listItemsInAlbumChanged); }

  // We wrap inside here the action we want to take when we feel the DOM is ready
  if (listItemsInAlbumEditComposerDiv && (listItemsInAlbumEditComposerDiv.length > 0) && listItemsInAlbumChanged) {
    // Log how many images we found so that when the DOM changes we only refresh if more images were found, otherwise the DOM change could be unrelated
    if (debugLevel >= basicLog){ console.log("imagesFound went from " + imagesFound + " to " + listItemsInAlbumEditComposerDiv.length); }
    imagesFound = listItemsInAlbumEditComposerDiv.length;

    // Iterate through albumListItem, find the descriptionLabelDiv and hide it to save space
    listItemsInAlbumEditComposerDiv.forEach(function callback(albumListItem, sortIndex) {
      var descriptionAndImageDivChildArray = albumListItem.querySelector('div:first-child').querySelector('div:first-child').querySelectorAll(':scope > div');
      if (debugLevel >= detailedLog){ console.log("descriptionAndImageDivChildArray.length = " + descriptionAndImageDivChildArray.length); }
      var imageDiv = descriptionAndImageDivChildArray[0];
      var descriptionDiv = descriptionAndImageDivChildArray[1];
      // Set a class so that we can easily toggle these later, then hide it
      descriptionDiv.classList.add("albumEditDescriptionDiv");
      descriptionDiv.style.display = "none";

      // There are two images; the first is the larger, outer box which is a blurred image. The second is the smaller inner image which you see. The blurred one is used for the clipped areas between protrait and landscape (useless)
        // It would be better if I can just crop the images square like Apple, but that's for another day. For now, we just hide it
      var blurredImageDiv = imageDiv.querySelector(':scope div div');
      blurredImageDiv.style.display = "none";

      // For the imageDiv, print out the data-key attribute and the image URL
      // It's the second image, so grab the second one
      var imageObj = imageDiv.querySelectorAll(':scope img')[1];
      if (debugLevel >= basicLog){ console.log("[" + sortIndex + "] = " + imageObj.src); }

      // Now we'll prep for the span which will hold the number in it
      // IF we don't already have a span to hold the number, add one with a specific ID so that we can reference it easily
      var sortLabelId = "sortLabel-" + sortIndex;
      var sortLabelSpanObj = imageDiv.querySelector(":scope .albumEditSortLabelSpan");

      // First, if the image doesn't already have an albumEditSortLabelSpan add one
      if (!sortLabelSpanObj){
        addSortLabelSpanToImageObj(imageObj, sortLabelId, sortIndex);
        /*
        // Create the span that will hold the number and drop the sortIndex in by default as it's the initial order (we may change this later to always grab the last sort order, who knows?)
          // https://css-tricks.com/text-blocks-over-image/
        sortLabelSpanObj = document.createElement("span");
        sortLabelSpanObj.id = sortLabelId;
        sortLabelSpanObj.textContent = sortIndex;
        sortLabelSpanObj.classList.add("albumEditSortLabelSpan");
        sortLabelSpanObj.style.position = "absolute";
        sortLabelSpanObj.style.fontSize = "150px";
        sortLabelSpanObj.style.color = "white";
        sortLabelSpanObj.style.textShadow = "5px 0 0 #000, 0 -5px 0 #000, 0 5px 0 #000, -5px 0 0 #000";
        sortLabelSpanObj.style.zIndex = "10";

        imageObj.after(sortLabelSpanObj);
        */
      }
      // If we do have one, make sure that the id, textContent, and color are reset
      else {
        sortLabelSpanObj.id = sortLabelId;
        sortLabelSpanObj.textContent = sortIndex;
        sortLabelSpanObj.style.color = "white";
      }

      // Set the sortLabelId on the imageObj so that we can track it later
      imageObj.setAttribute("sortLabelId",sortLabelId);

      // Make the image relatively positioned
      imageObj.style.position = 'relative';
    });

    // Go head and load the previous order if one is found
    if (debugLevel >= basicLog){ console.log("Calling loadPreviousOrder from - VM.observe"); }
    loadPreviousOrder();
  }
  });

}) ();

}
