import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = __dirname;
const out = path.join(dir, "run-tests.js");

const code = String.raw`// run-tests.js -- node run-tests.js
const { chromium } = require("playwright");
const path = require("path");
const fs   = require("fs");
const SCRIPT_PATH = path.resolve(__dirname, "facebook-sort-album-photos.user.js");
const PAGE_URL = "http://localhost/media/set/edit/test";

function buildHtml(js) {
  const ids = ["test-photo-0","test-photo-1","test-photo-2"];
  const cells = ids.map((id,i) => `+"`"+`
    <div role="gridcell" id="cell-${i}">
      <div><div><div><span>
        <div role="button" aria-label="Click anywhere to tag">
          <div>
            <div></div>
            <img src="https://example.com/t39.30808-6/${id}_n.jpg?t=1" alt="bg${i}" />
            <img src="https://example.com/t39.30808-6/${id}_n.jpg?t=1" alt="photo${i}" />
          </div>
        </div>
      </span></div></div></div>
      <div class="desc-container" style="height:80px">
        <label style="display:flex;height:80px">
          <div><div><textarea>Caption ${i}</textarea></div></div>
        </label>
      </div>
    </div>`+"`"+`).join("");
  return `+"`"+`<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>.desc-container{height:80px;overflow:hidden}</style></head><body>
  <div><span>Album name</span><input type="text" value="Test Album"/></div>
  <div role="grid" aria-label="Edit album"><div role="row">${cells}</div></div>
  <script>
    var _g={};
    function GM_getValue(k,d){return k in _g?_g[k]:d;}
    function GM_setValue(k,v){_g[k]=v;}
    function GM_listValues(){return Object.keys(_g);}
    function GM_deleteValue(k){delete _g[k];}
    if(!self.navigation)self.navigation={addEventListener:function(){}};
  <\/script>
  <script>${js}<\/script>
</body></html>`+"`"+`;
}

(async()=>{
  const userscriptJs=fs.readFileSync(SCRIPT_PATH,"utf8");
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  await page.route(PAGE_URL,r=>r.fulfill({status:200,contentType:"text/html",body:buildHtml(userscriptJs)}));
  await page.route("https://example.com/**",r=>r.fulfill({status:200,contentType:"image/gif",body:Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7","base64")}));
  const logs=[];
  page.on("console",m=>logs.push({type:m.type(),text:m.text()}));
  page.on("pageerror",e=>logs.push({type:"pageerror",text:e.message}));
  await page.goto(PAGE_URL,{waitUntil:"domcontentloaded"});
  await page.waitForTimeout(500);

  function evalChecks(fn){return page.evaluate(fn);}

  const initResult=await evalChecks(()=>{
    const checks=[];function check(l,c,d){checks.push({label:l,pass:!!c,detail:d||""});}
    const cells=document.querySelectorAll("div[role=\\"grid\\"][aria-label=\\"Edit album\\"] div[role=\\"row\\"] div[role=\\"gridcell\\"]");
    check("Grid exists",!!document.querySelector("div[role=\\"grid\\"][aria-label=\\"Edit album\\"]"));
    check("3 gridcells",cells.length===3,"found "+cells.length);
    const xp=document.evaluate("//span[text()=\\"Album name\\"]/following::input",document,null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null);
    check("Album name input (XPath)",xp.snapshotLength>0);
    const spans=document.querySelectorAll(".albumEditSortLabelSpan");
    check("3 spans injected",spans.length===3,"found "+spans.length);
    spans.forEach((s,i)=>{
      check("Span "+i+" id=sortLabel-"+i,s.id==="sortLabel-"+i,"id="+s.id);
      check("Span "+i+" text visible",s.textContent!=="","text="+JSON.stringify(s.textContent));
      check("Span "+i+" text="+i,s.textContent===String(i),"text="+JSON.stringify(s.textContent));
      check("Span "+i+" position=absolute",s.style.position==="absolute","pos="+s.style.position);
    });
    cells.forEach((cell,i)=>{
      const imgs=cell.querySelectorAll("div[role=\\"button\\"][aria-label=\\"Click anywhere to tag\\"] img");
      const img=imgs.length>=2?imgs[1]:imgs[0];
      const wrapper=img?img.parentElement:null;
      const btn=cell.querySelector("div[role=\\"button\\"][aria-label=\\"Click anywhere to tag\\"]");
      const blurred=btn?btn.querySelector(":scope > div > div"):null;
      const descEl=cell.querySelector(".albumEditDescriptionDiv");
      check("Cell "+i+" img found",!!img);
      check("Cell "+i+" sortLabelId=sortLabel-"+i,img&&img.getAttribute("sortLabelId")==="sortLabel-"+i,img?"got "+img.getAttribute("sortLabelId"):"no img");
      check("Cell "+i+" wrapper position=relative",wrapper&&wrapper.style.position==="relative",wrapper?"pos="+wrapper.style.position:"no wrapper");
      check("Cell "+i+" desc container marked",!!descEl,"albumEditDescriptionDiv missing");
      check("Cell "+i+" desc not visible (offsetHeight=0)",descEl&&descEl.offsetHeight===0,descEl?"h="+descEl.offsetHeight:"no descEl");
      check("Cell "+i+" blurred bg hidden",blurred&&blurred.style.display==="none",blurred?"display="+blurred.style.display:"not found");
    });
    const btns=[...document.querySelectorAll(".albumEditGenerated")].map(b=>b.textContent);
    ["Save Order","Load Order","Clear Data","Validate","Descriptions","Test Selectors"].forEach(l=>{check("Button \\""+l+"\\" injected",btns.includes(l));});
    return checks;
  });

  const click=lbl=>page.evaluate(l=>{[...document.querySelectorAll(".albumEditGenerated")].find(b=>b.textContent===l)?.click();},lbl);

  await click("Save Order"); await page.waitForTimeout(100);
  const saveResult=await evalChecks(()=>{
    const checks=[];function check(l,c,d){checks.push({label:l,pass:!!c,detail:d||""});}
    const keys=GM_listValues();const saved=keys[0]?JSON.parse(GM_getValue(keys[0],"{}")):{};
    check("Save: 1 key",keys.length===1,"keys="+JSON.stringify(keys));
    check("Save: key has Test_Album",keys[0]&&keys[0].includes("Test_Album"),"key="+keys[0]);
    check("Save: 3 entries",Object.keys(saved).length===3,"entries="+Object.keys(saved).length);
    document.querySelectorAll("div[role=\\"grid\\"][aria-label=\\"Edit album\\"] div[role=\\"row\\"] div[role=\\"gridcell\\"]").forEach((cell,i)=>{
      const imgs=cell.querySelectorAll("div[role=\\"button\\"][aria-label=\\"Click anywhere to tag\\"] img");
      const img=imgs.length>=2?imgs[1]:imgs[0];if(!img)return;
      const fn=img.src.split("/").pop().split("?")[0];
      check("Save: cell "+i+" -> index "+i,saved[fn]===i,"saved["+fn+"]="+saved[fn]);
    });
    return checks;
  });

  await click("Load Order"); await page.waitForTimeout(100);
  const loadResult=await evalChecks(()=>{
    const checks=[];function check(l,c,d){checks.push({label:l,pass:!!c,detail:d||""});}
    document.querySelectorAll(".albumEditSortLabelSpan").forEach((s,i)=>{check("Load correct: span "+i+" white",s.style.color==="white","color="+s.style.color);});
    return checks;
  });

  const scrambleResult=await evalChecks(()=>{
    const checks=[];function check(l,c,d){checks.push({label:l,pass:!!c,detail:d||""});}
    const cells=document.querySelectorAll("div[role=\\"grid\\"][aria-label=\\"Edit album\\"] div[role=\\"row\\"] div[role=\\"gridcell\\"]");
    const keys=GM_listValues();const saved=keys[0]?JSON.parse(GM_getValue(keys[0],"{}")):{};
    const gi=c=>{const is=c.querySelectorAll("div[role=\\"button\\"][aria-label=\\"Click anywhere to tag\\"] img");return is.length>=2?is[1]:is[0];};
    const f0=gi(cells[0]).src.split("/").pop().split("?")[0];
    const f2=gi(cells[2]).src.split("/").pop().split("?")[0];
    const tmp=saved[f0];saved[f0]=saved[f2];saved[f2]=tmp;
    GM_setValue(keys[0],JSON.stringify(saved));
    [...document.querySelectorAll(".albumEditGenerated")].find(b=>b.textContent==="Load Order")?.click();
    const spans=document.querySelectorAll(".albumEditSortLabelSpan");
    check("Scrambled: cell 0 red",spans[0]&&spans[0].style.color==="red","color="+spans[0]?.style.color);
    check("Scrambled: cell 1 white",spans[1]&&spans[1].style.color==="white","color="+spans[1]?.style.color);
    check("Scrambled: cell 2 red",spans[2]&&spans[2].style.color==="red","color="+spans[2]?.style.color);
    return checks;
  });

  await click("Descriptions"); await page.waitForTimeout(100);
  const descOnResult=await evalChecks(()=>{
    const checks=[];function check(l,c,d){checks.push({label:l,pass:!!c,detail:d||""});}
    const vis=[...document.querySelectorAll(".albumEditDescriptionDiv")].filter(e=>e.offsetHeight>0).length;
    check("Toggle on: 3 desc areas visible",vis===3,"visible="+vis);
    return checks;
  });

  await click("Descriptions"); await page.waitForTimeout(100);
  const descOffResult=await evalChecks(()=>{
    const checks=[];function check(l,c,d){checks.push({label:l,pass:!!c,detail:d||""});}
    const hidn=[...document.querySelectorAll(".albumEditDescriptionDiv")].filter(e=>e.offsetHeight===0).length;
    check("Toggle off: 3 desc areas hidden",hidn===3,"hidden="+hidn);
    return checks;
  });

  await page.evaluate(()=>{
    const grid=document.querySelector("div[role=\\"grid\\"][aria-label=\\"Edit album\\"]");
    const parent=grid.parentElement;const fresh=grid.cloneNode(true);
    fresh.querySelectorAll(".albumEditSortLabelSpan").forEach(el=>el.remove());
    fresh.querySelectorAll(".albumEditDescriptionDiv").forEach(el=>{el.classList.remove("albumEditDescriptionDiv");el.style.display="";el.style.height="80px";});
    fresh.querySelectorAll("[sortLabelId]").forEach(el=>el.removeAttribute("sortLabelId"));
    fresh.querySelectorAll("div[role=\\"button\\"] > div").forEach(el=>el.style.position="");
    fresh.querySelectorAll("div").forEach(el=>{if(el.style.display==="none")el.style.display="";});
    parent.replaceChild(fresh,grid);
  });
  await page.waitForTimeout(500);

  await page.evaluate(()=>{
    document.querySelectorAll(".albumEditDescriptionDiv").forEach(el=>{el.style.display="";el.style.height="80px";});
    const tmp=document.createElement("span");document.body.appendChild(tmp);tmp.remove();
  });
  await page.waitForTimeout(300);

  const reRenderResult=await evalChecks(()=>{
    const checks=[];function check(l,c,d){checks.push({label:l,pass:!!c,detail:d||""});}
    const cells=document.querySelectorAll("div[role=\\"grid\\"][aria-label=\\"Edit album\\"] div[role=\\"row\\"] div[role=\\"gridcell\\"]");
    check("Re-render: 3 cells",cells.length===3,"found "+cells.length);
    check("Re-render: 3 spans",document.querySelectorAll(".albumEditSortLabelSpan").length===3);
    cells.forEach((cell,i)=>{
      const descEl=cell.querySelector(".albumEditDescriptionDiv");
      const btn=cell.querySelector("div[role=\\"button\\"][aria-label=\\"Click anywhere to tag\\"]");
      const blurred=btn?btn.querySelector(":scope > div > div"):null;
      check("Re-render: cell "+i+" has span",!!cell.querySelector(".albumEditSortLabelSpan"));
      check("Re-render: cell "+i+" desc not visible",descEl&&descEl.offsetHeight===0,descEl?"h="+descEl.offsetHeight:"no descEl");
      check("Re-render: cell "+i+" blurred hidden",blurred&&blurred.style.display==="none",blurred?"display="+blurred.style.display:"not found");
    });
    return checks;
  });

  await browser.close();
  const all=[...initResult,...saveResult,...loadResult,...scrambleResult,...descOnResult,...descOffResult,...reRenderResult];
  const passed=all.filter(r=>r.pass).length;const failed=all.filter(r=>!r.pass).length;
  console.log("\\n=== TEST RESULTS ===");
  all.forEach(r=>console.log((r.pass?"✅":"❌")+" "+r.label+(r.detail?"  ->  "+r.detail:"")));
  const errs=logs.filter(l=>l.type==="pageerror");
  if(errs.length){console.log("\\n--- PAGE ERRORS ---");errs.forEach(l=>console.log("  💥 "+l.text));}
  console.log("\\n"+(failed===0?"✅":"❌")+" "+passed+" passed, "+failed+" failed out of "+all.length);
  process.exit(failed>0?1:0);
})();
`;

fs.writeFileSync(out, code, "utf8");
console.log("Written: " + out + " (" + code.length + " bytes)");
