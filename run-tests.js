// run-tests.js -- node run-tests.js
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const SCRIPT_PATH=path.resolve(__dirname,'facebook-sort-album-photos.user.js');
const PAGE_URL='http://localhost/media/set/edit/test';
const HTML_BASE="<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><style>img{display:block;width:200px;height:200px;object-fit:cover} .desc-container{height:80px;overflow:hidden} .albumEditActionRow{display:flex;gap:8px;padding:8px 0}</style></head><body><label aria-label=\"Album name\"><span>Album name</span><input type=\"text\" value=\"Test Album\"/></label><div role=\"grid\" aria-label=\"Edit album\"><div role=\"row\"><div role=\"gridcell\" id=\"cell-0\"><div class=\"card-root\"><div><div><div><span><div role=\"button\" aria-label=\"Click anywhere to tag\"><div><div></div><img src=\"https://example.com/t39.30808-6/test-photo-0_n.jpg?t=1\" alt=\"bg0\" /><img src=\"https://example.com/t39.30808-6/test-photo-0_n.jpg?t=1\" alt=\"photo0\" /></div></div></span></div></div></div><div class=\"albumEditActionRow\"><button aria-label=\"More actions\">More</button><button aria-label=\"Tag Friends\">Tag Friends</button></div></div><div class=\"desc-container\" style=\"height:80px\"><label class=\"x78zum5 xh8yej3\"><div class=\"xjbqb8w x1iyjqo2 x193iq5w xeuugli x1n2onr6\"><span class=\"x1jchvi3 x1fcty0u x132q4wb x193iq5w x1al4vs7 xmper1u x1lliihq xzwoauc x6ikm8r x10wlt62 x47corl x10l6tqk xlyipyv xoyzfg9 x11xpdln xuxw1ft xi81zsa x1woyocn x1cab348 x1ebt8du x1d72o\">Description (optional)</span><div class=\"x1ejq31n x18oe1m7 x1sy0etr xstzfhl x9f619 xzsf02u x1jchvi3 x1fcty0u x132q4wb xyorhqc xaqh0s9 x1a2a7pz x6ikm8r xtt52l0 xh8yej3 xjbqb8w x18o3ruo xyj58a3 xgfja2r x972fbf x10w94by x1qhh985 x14e42zd xrvj5dj x1n2onr6 xyftt0y xuqm82a xyc4ar7 x19zaomo x1n5bzlp xn3cpwa\"><div class=\"xjbqb8w x1ejq31n x18oe1m7 x1sy0etr xstzfhl x9f619 xzsf02u x78zum5 x1jchvi3 x1fcty0u x1a2a7pz x6ikm8r xv54qhq xf7dkkf xtt52l0 xh8yej3 x1ls7aod xcrlgei x1byulpo x1agbcgv x15bjb6t x1mzt3pk x47corl xlshs6z x126k92a\" aria-hidden=\"true\" style=\"display: none;\"><br><br></div><div class=\"xjbqb8w x1ejq31n x18oe1m7 x1sy0etr xstzfhl x9f619 xzsf02u x1jchvi3 x1fcty0u x1a2a7pz x6ikm8r xv54qhq xf7dkkf xtt52l0 xh8yej3 x1ls7aod xcrlgei x1byulpo x1agbcgv x15bjb6t x1mzt3pk x47corl xlshs6z x126k92a x1ua5tub x104kibb x1yhjpo9\" aria-hidden=\"true\" style=\"--x-WebkitLineClamp: 200;\">Caption 0</div><textarea class=\"x1i10hfl xggy1nq xtpw4lu x1tutvks x1s3xk63 x1s07b3s xjbqb8w x1ejq31n x18oe1m7 x1sy0etr xstzfhl x9f619 xzsf02u x78zum5 x1jchvi3 x1fcty0u x1a2a7pz x6ikm8r xv54qhq xf7dkkf xtt52l0 xh8yej3 x1ls7aod xcrlgei x1byulpo x1agbcgv x15bjb6t\" dir=\"ltr\" id=\"_r_1m_\" data-interactable=\"|keyup|\">Caption 0</textarea></div></div></label></div></div><div role=\"gridcell\" id=\"cell-1\"><div class=\"card-root\"><div><div><div><span><div role=\"button\" aria-label=\"Click anywhere to tag\"><div><div></div><img src=\"https://example.com/t39.30808-6/test-photo-1_n.jpg?t=1\" alt=\"bg1\" /><img src=\"https://example.com/t39.30808-6/test-photo-1_n.jpg?t=1\" alt=\"photo1\" /></div></div></span></div></div></div><div class=\"albumEditActionRow\"><button aria-label=\"More actions\">More</button><button aria-label=\"Edit Location\">Edit Location</button></div></div><div class=\"desc-container\" style=\"height:80px\"><label class=\"x78zum5 xh8yej3\"><div class=\"xjbqb8w x1iyjqo2 x193iq5w xeuugli x1n2onr6\"><span class=\"x1jchvi3 x1fcty0u x132q4wb x193iq5w x1al4vs7 xmper1u x1lliihq xzwoauc x6ikm8r x10wlt62 x47corl x10l6tqk xlyipyv xoyzfg9 x11xpdln xuxw1ft xi81zsa x1woyocn x1cab348 x1ebt8du x1d72o\">Description (optional)</span><div class=\"x1ejq31n x18oe1m7 x1sy0etr xstzfhl x9f619 xzsf02u x1jchvi3 x1fcty0u x132q4wb xyorhqc xaqh0s9 x1a2a7pz x6ikm8r xtt52l0 xh8yej3 xjbqb8w x18o3ruo xyj58a3 xgfja2r x972fbf x10w94by x1qhh985 x14e42zd xrvj5dj x1n2onr6 xyftt0y xuqm82a xyc4ar7 x19zaomo x1n5bzlp xn3cpwa\"><div class=\"xjbqb8w x1ejq31n x18oe1m7 x1sy0etr xstzfhl x9f619 xzsf02u x78zum5 x1jchvi3 x1fcty0u x1a2a7pz x6ikm8r xv54qhq xf7dkkf xtt52l0 xh8yej3 x1ls7aod xcrlgei x1byulpo x1agbcgv x15bjb6t x1mzt3pk x47corl xlshs6z x126k92a\" aria-hidden=\"true\" style=\"display: none;\"><br><br></div><div class=\"xjbqb8w x1ejq31n x18oe1m7 x1sy0etr xstzfhl x9f619 xzsf02u x1jchvi3 x1fcty0u x1a2a7pz x6ikm8r xv54qhq xf7dkkf xtt52l0 xh8yej3 x1ls7aod xcrlgei x1byulpo x1agbcgv x15bjb6t x1mzt3pk x47corl xlshs6z x126k92a x1ua5tub x104kibb x1yhjpo9\" aria-hidden=\"true\" style=\"--x-WebkitLineClamp: 200;\">Caption 1</div><textarea class=\"x1i10hfl xggy1nq xtpw4lu x1tutvks x1s3xk63 x1s07b3s xjbqb8w x1ejq31n x18oe1m7 x1sy0etr xstzfhl x9f619 xzsf02u x78zum5 x1jchvi3 x1fcty0u x1a2a7pz x6ikm8r xv54qhq xf7dkkf xtt52l0 xh8yej3 x1ls7aod xcrlgei x1byulpo x1agbcgv x15bjb6t\" dir=\"ltr\" id=\"_r_27_\" data-interactable=\"|keyup|\">Caption 1</textarea></div></div></label></div></div><div role=\"gridcell\" id=\"cell-2\"><div class=\"card-root\"><div><div><div><span><div role=\"button\" aria-label=\"Click anywhere to tag\"><div><div></div><img src=\"https://example.com/t39.30808-6/test-photo-2_n.jpg?t=1\" alt=\"bg2\" /><img src=\"https://example.com/t39.30808-6/test-photo-2_n.jpg?t=1\" alt=\"photo2\" /></div></div></span></div></div></div><div class=\"albumEditActionRow\"><button aria-label=\"More actions\">More</button><button aria-label=\"Tag Friends\">Tag Friends</button></div></div><div class=\"desc-container\" style=\"height:80px\"><label class=\"x78zum5 xh8yej3\"><div class=\"xjbqb8w x1iyjqo2 x193iq5w xeuugli x1n2onr6\"><span class=\"x1jchvi3 x1fcty0u x132q4wb x193iq5w x1al4vs7 xmper1u x1lliihq xzwoauc x6ikm8r x10wlt62 x47corl x10l6tqk xlyipyv xoyzfg9 x11xpdln xuxw1ft xi81zsa x1woyocn x1cab348 x1ebt8du x1d72o\">Description (optional)</span><div class=\"x1ejq31n x18oe1m7 x1sy0etr xstzfhl x9f619 xzsf02u x1jchvi3 x1fcty0u x132q4wb xyorhqc xaqh0s9 x1a2a7pz x6ikm8r xtt52l0 xh8yej3 xjbqb8w x18o3ruo xyj58a3 xgfja2r x972fbf x10w94by x1qhh985 x14e42zd xrvj5dj x1n2onr6 xyftt0y xuqm82a xyc4ar7 x19zaomo x1n5bzlp xn3cpwa\"><div class=\"xjbqb8w x1ejq31n x18oe1m7 x1sy0etr xstzfhl x9f619 xzsf02u x78zum5 x1jchvi3 x1fcty0u x1a2a7pz x6ikm8r xv54qhq xf7dkkf xtt52l0 xh8yej3 x1ls7aod xcrlgei x1byulpo x1agbcgv x15bjb6t x1mzt3pk x47corl xlshs6z x126k92a\" aria-hidden=\"true\" style=\"display: none;\"><br><br></div><div class=\"xjbqb8w x1ejq31n x18oe1m7 x1sy0etr xstzfhl x9f619 xzsf02u x1jchvi3 x1fcty0u x1a2a7pz x6ikm8r xv54qhq xf7dkkf xtt52l0 xh8yej3 x1ls7aod xcrlgei x1byulpo x1agbcgv x15bjb6t x1mzt3pk x47corl xlshs6z x126k92a x1ua5tub x104kibb x1yhjpo9\" aria-hidden=\"true\" style=\"--x-WebkitLineClamp: 200;\">Caption 2</div><textarea class=\"x1i10hfl xggy1nq xtpw4lu x1tutvks x1s3xk63 x1s07b3s xjbqb8w x1ejq31n x18oe1m7 x1sy0etr xstzfhl x9f619 xzsf02u x78zum5 x1jchvi3 x1fcty0u x1a2a7pz x6ikm8r xv54qhq xf7dkkf xtt52l0 xh8yej3 x1ls7aod xcrlgei x1byulpo x1agbcgv x15bjb6t\" dir=\"ltr\" id=\"_r_2i_\" data-interactable=\"|keyup|\">Caption 2</textarea></div></div></label></div></div></div></div><script>var _g={};function GM_getValue(k,d){return k in _g?_g[k]:d;}function GM_setValue(k,v){_g[k]=v;}function GM_listValues(){return Object.keys(_g);}function GM_deleteValue(k){delete _g[k];}if(!self.navigation)self.navigation={addEventListener:function(){}};</script>";
function buildHtml(js){return HTML_BASE+'<scr'+'ipt>'+js+'<'+'/scr'+'ipt></body></html>';}
(async()=>{
const userscriptJs=fs.readFileSync(SCRIPT_PATH,'utf8');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
await page.route(PAGE_URL,r=>r.fulfill({status:200,contentType:'text/html',body:buildHtml(userscriptJs)}));
await page.route('https://example.com/**',r=>r.fulfill({status:200,contentType:'image/gif',body:Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64')}));
const logs=[];
page.on('console',m=>logs.push({type:m.type(),text:m.text()}));
page.on('pageerror',e=>logs.push({type:'pageerror',text:e.message}));
await page.goto(PAGE_URL,{waitUntil:'domcontentloaded'});
await page.evaluate(()=>{
  const cells = [...document.querySelectorAll('div[role="grid"][aria-label="Edit album"] div[role="row"] div[role="gridcell"]')];
  cells.forEach((cell) => {
    let root = cell.querySelector('.card-root');
    if (!root) {
      root = document.createElement('div');
      root.className = 'card-root';
      while (cell.firstChild) {
        root.appendChild(cell.firstChild);
      }
      cell.appendChild(root);
    }
    const actionRow = root.querySelector('.albumEditActionRow') || document.createElement('div');
    if (!actionRow.classList.contains('albumEditActionRow')) {
      actionRow.classList.add('albumEditActionRow');
      actionRow.innerHTML = '<button aria-label="More actions">More</button><button aria-label="Tag Friends">Tag Friends</button>';
      root.appendChild(actionRow);
    }
  });
});
await page.waitForTimeout(100);
await page.waitForTimeout(500);
const SG='div[role="grid"][aria-label="Edit album"]';
const SC=SG+' div[role="row"] div[role="gridcell"]';
const SB='div[role="button"][aria-label="Click anywhere to tag"]';
const initResult=await page.evaluate(()=>{
const SG='div[role="grid"][aria-label="Edit album"]';
const SB='div[role="button"][aria-label="Click anywhere to tag"]';
const checks=[];function check(l,c,d){checks.push({label:l,pass:!!c,detail:d||''});}
const cells=document.querySelectorAll(SG+' div[role="row"] div[role="gridcell"]');
check('Grid exists',!!document.querySelector(SG));
check('3 gridcells',cells.length===3,'found '+cells.length);
const xp=document.evaluate("//span[text()='Album name']/following::input",document,null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null);
check('Album name input',xp.snapshotLength>0);
const spans=document.querySelectorAll('.albumEditSortLabelSpan');
check('3 spans injected',spans.length===3,'found '+spans.length);
spans.forEach((s,i)=>{
  check('Span '+i+' id=sortLabel-'+i,s.id==='sortLabel-'+i,'id='+s.id);
  check('Span '+i+' text visible',s.textContent!=='',' text='+JSON.stringify(s.textContent));
  check('Span '+i+' text='+i,s.textContent===String(i),'text='+JSON.stringify(s.textContent));
  check('Span '+i+' position=absolute',s.style.position==='absolute','pos='+s.style.position);
});
cells.forEach((cell,i)=>{
  const img = cell.querySelectorAll(SB+' img')[1] || cell.querySelectorAll(SB+' img')[0];
  const wrapper=img?img.parentElement:null;
  const btn=cell.querySelector(SB);
  const blurred=btn?btn.querySelector(':scope > div > div'):null;
  const descEl=cell.querySelector('.albumEditDescriptionDiv');
  const root = cell.querySelector('.card-root');
  const actionRow = cell.querySelector('.albumEditActionRow');
  check('Cell '+i+' img found',!!img);
  check('Cell '+i+' sortLabelId',img&&img.getAttribute('sortLabelId')==='sortLabel-'+i,img?'got '+img.getAttribute('sortLabelId'):'no img');
  check('Cell '+i+' wrapper position:relative',wrapper&&wrapper.style.position==='relative',wrapper?'pos='+wrapper.style.position:'no wrapper');
  check('Cell '+i+' desc container marked',!!descEl,'albumEditDescriptionDiv missing');
  check('Cell '+i+' desc not visible (offsetHeight=0)',descEl&&descEl.offsetHeight===0,descEl?'h='+descEl.offsetHeight:'no descEl');
  check('Cell '+i+' blurred bg hidden',blurred&&blurred.style.display==='none',blurred?'display='+blurred.style.display:'not found');
  check('Cell '+i+' outer card compacted',root && root.style.height === '200px' || root && root.style.minHeight === '0px',root ? 'height=' + root.style.height + ', minHeight=' + root.style.minHeight : 'no root');
  check('Cell '+i+' action row hidden',actionRow && actionRow.style.display === 'none',actionRow ? 'display=' + actionRow.style.display : 'no action row');
});
const btns=[...document.querySelectorAll('.albumEditGenerated')].map(b=>b.textContent);
['Save Order','Load Order','Clear Data','Validate','Descriptions','Test Selectors'].forEach(l=>{check('Button '+JSON.stringify(l)+' injected',btns.includes(l));});
return checks;});
const click=async lbl=>page.evaluate(l=>{[...document.querySelectorAll('.albumEditGenerated')].find(b=>b.textContent===l)?.click();},lbl);
await click('Save Order');await page.waitForTimeout(100);
const saveResult=await page.evaluate(()=>{
const SG='div[role="grid"][aria-label="Edit album"]';const SB='div[role="button"][aria-label="Click anywhere to tag"]';
const checks=[];function check(l,c,d){checks.push({label:l,pass:!!c,detail:d||''});}
const keys=GM_listValues();const saved=keys[0]?JSON.parse(GM_getValue(keys[0],'{}')):{};
check('Save: 1 key',keys.length===1,'keys='+JSON.stringify(keys));
check('Save: key has Test_Album',keys[0]&&keys[0].includes('Test_Album'),'key='+keys[0]);
check('Save: 3 entries',Object.keys(saved).length===3,'entries='+Object.keys(saved).length);
document.querySelectorAll(SG+' div[role="row"] div[role="gridcell"]').forEach((cell,i)=>{
  const imgs=cell.querySelectorAll(SB+' img');const img=imgs.length>=2?imgs[1]:imgs[0];if(!img)return;
  const fn=img.src.split('/').pop().split('?')[0];
  check('Save: cell '+i+' -> index '+i,saved[fn]===i,'saved['+fn+']='+saved[fn]);});return checks;});
await click('Load Order');await page.waitForTimeout(100);
const loadResult=await page.evaluate(()=>{
const checks=[];function check(l,c,d){checks.push({label:l,pass:!!c,detail:d||''});}
document.querySelectorAll('.albumEditSortLabelSpan').forEach((s,i)=>{check('Load correct: span '+i+' white',s.style.color==='white','color='+s.style.color);});
return checks;});
const scrambleResult=await page.evaluate(()=>{
const SG='div[role="grid"][aria-label="Edit album"]';const SB='div[role="button"][aria-label="Click anywhere to tag"]';
const checks=[];function check(l,c,d){checks.push({label:l,pass:!!c,detail:d||''});}
const cells=document.querySelectorAll(SG+' div[role="row"] div[role="gridcell"]');
const keys=GM_listValues();const saved=keys[0]?JSON.parse(GM_getValue(keys[0],'{}')):{};
const gi=c=>{const is=c.querySelectorAll(SB+' img');return is.length>=2?is[1]:is[0];};
const f0=gi(cells[0]).src.split('/').pop().split('?')[0];
const f2=gi(cells[2]).src.split('/').pop().split('?')[0];
const tmp=saved[f0];saved[f0]=saved[f2];saved[f2]=tmp;
GM_setValue(keys[0],JSON.stringify(saved));
[...document.querySelectorAll('.albumEditGenerated')].find(b=>b.textContent==='Load Order')?.click();
const spans=document.querySelectorAll('.albumEditSortLabelSpan');
check('Scrambled: cell 0 red',spans[0]&&spans[0].style.color==='red','color='+spans[0]?.style.color);
check('Scrambled: cell 1 white',spans[1]&&spans[1].style.color==='white','color='+spans[1]?.style.color);
check('Scrambled: cell 2 red',spans[2]&&spans[2].style.color==='red','color='+spans[2]?.style.color);
return checks;});
await click('Descriptions');await page.waitForTimeout(100);
const descOnResult=await page.evaluate(()=>{
const checks=[];function check(l,c,d){checks.push({label:l,pass:!!c,detail:d||''});}
const vis=[...document.querySelectorAll('.albumEditDescriptionDiv')].filter(e=>e.offsetHeight>0).length;
check('Toggle on: 3 desc areas visible',vis===3,'visible='+vis);
return checks;
});
await click('Descriptions');await page.waitForTimeout(100);
const descOffResult=await page.evaluate(()=>{
const checks=[];function check(l,c,d){checks.push({label:l,pass:!!c,detail:d||''});}
const hidn=[...document.querySelectorAll('.albumEditDescriptionDiv')].filter(e=>e.offsetHeight===0).length;
check('Toggle off: 3 desc areas hidden',hidn===3,'hidden='+hidn);
return checks;
});
await page.evaluate(()=>{
const SG='div[role="grid"][aria-label="Edit album"]';const SB='div[role="button"][aria-label="Click anywhere to tag"]';
const grid=document.querySelector(SG);const parent=grid.parentElement;const fresh=grid.cloneNode(true);
fresh.querySelectorAll('.albumEditSortLabelSpan').forEach(el=>el.remove());
fresh.querySelectorAll('.albumEditDescriptionDiv').forEach(el=>{el.classList.remove('albumEditDescriptionDiv');el.style.display='';el.style.height='80px';});
fresh.querySelectorAll('[sortLabelId]').forEach(el=>el.removeAttribute('sortLabelId'));
fresh.querySelectorAll(SB+' > div').forEach(el=>el.style.position='');
fresh.querySelectorAll('div').forEach(el=>{if(el.style.display==='none')el.style.display='';});
parent.replaceChild(fresh,grid);
});await page.waitForTimeout(500);
await page.evaluate(()=>{
document.querySelectorAll('.albumEditDescriptionDiv').forEach(el=>{el.style.display='';el.style.height='80px';});
const tmp=document.createElement('span');document.body.appendChild(tmp);tmp.remove();
});await page.waitForTimeout(300);
const reRenderResult=await page.evaluate(()=>{
const SG='div[role="grid"][aria-label="Edit album"]';const SB='div[role="button"][aria-label="Click anywhere to tag"]';
const checks=[];function check(l,c,d){checks.push({label:l,pass:!!c,detail:d||''});}
const cells=document.querySelectorAll(SG+' div[role="row"] div[role="gridcell"]');
check('Re-render: 3 cells',cells.length===3,'found '+cells.length);
check('Re-render: 3 spans',document.querySelectorAll('.albumEditSortLabelSpan').length===3);
cells.forEach((cell,i)=>{
  const descEl=cell.querySelector('.albumEditDescriptionDiv');
  const btn=cell.querySelector(SB);const blurred=btn?btn.querySelector(':scope > div > div'):null;
  check('Re-render: cell '+i+' has span',!!cell.querySelector('.albumEditSortLabelSpan'));
  check('Re-render: cell '+i+' desc not visible',descEl&&descEl.offsetHeight===0,descEl?'h='+descEl.offsetHeight:'no descEl');
  check('Re-render: cell '+i+' blurred hidden',blurred&&blurred.style.display==='none',blurred?'display='+blurred.style.display:'not found');
});return checks;});
const issueRegressionResult=await page.evaluate(async ()=>{
  const checks=[]; function check(l,c,d){checks.push({label:l,pass:!!c,detail:d||''});}
  const issueCell=document.createElement('div');
  issueCell.setAttribute('role','gridcell');
  issueCell.innerHTML='\
    <div class="card-root"><div><div><div><span>\
      <div role="button" aria-label="Click anywhere to tag">\
        <div>\
          <img src="https://example.com/t39.30808-6/issue_bg_n.jpg?t=1" alt="issue-bg" />\
          <img src="https://example.com/t39.30808-6/issue_real_n.jpg?t=1" alt="issue-live" />\
        </div>\
        <span class="albumEditSortLabelSpan" style="position:absolute;z-index:10;">7</span>\
      </div>\
    </span></div></div></div><div class="albumEditActionRow"><button aria-label="More actions">More</button></div></div>';
  const label = document.createElement('label');
  label.innerHTML = '<span>Description (optional)</span><div><div aria-hidden="true"></div><textarea>issue text</textarea></div>';
  issueCell.appendChild(label);
  const row=document.querySelector('div[role="grid"][aria-label="Edit album"] div[role="row"]');
  if (row) row.appendChild(issueCell);
  await new Promise(r=>setTimeout(r,150));

  const labels=[...issueCell.querySelectorAll('label')].filter(node => (node.textContent || '').includes('Description (optional)'));
  check('Issue: description label structure is present', labels.length > 0, 'found ' + labels.length);
  const root = issueCell.querySelector('.card-root');
  const actionRow = issueCell.querySelector('.albumEditActionRow');
  const img = issueCell.querySelectorAll('img')[1] || issueCell.querySelector('img');
  const rootHeight = root ? root.style.height : '';
  check('Issue: outer card is compacted to photo height', !!(root && img && rootHeight === '200px'), 'height=' + rootHeight + ', img=' + (img ? img.height : 'none'));
  check('Issue: lower action row is hidden', !!(actionRow && actionRow.style.display === 'none'), 'display=' + (actionRow ? actionRow.style.display : 'no row'));
  if (labels[0]) {
    const ta = labels[0].querySelector('textarea');
    const preview = labels[0].querySelector('[aria-hidden="true"]');
    check('Issue: description label still contains textarea and preview', !!(ta && preview), 'textarea=' + !!ta + ', preview=' + !!preview);
  }
  return checks;
});
const liveDescriptionLabelResult = await page.evaluate(() => {
  const checks = [];
  function check(label, condition, detail = '') {
    checks.push({ label, pass: !!condition, detail });
  }

  const labels = [...document.querySelectorAll('label')].filter((label) => {
    const text = (label.textContent || '').replace(/\s+/g, ' ').trim();
    return text.includes('Description (optional)');
  });

  check('Live DOM contains Description (optional) label', labels.length > 0, 'found ' + labels.length);

  if (labels.length > 0) {
    const match = labels[0];
    const textarea = match.querySelector('textarea');
    const preview = match.querySelector('[aria-hidden="true"]');
    check('Description label contains textarea and preview', !!(textarea && preview), 'textarea=' + !!textarea + ', preview=' + !!preview);
    const hides = match.style.display === 'none';
    check('Description label can be hidden without affecting live image', hides || (!match.closest('div[role="button"]')), 'display=' + match.style.display);
  }

  return checks;
});
await browser.close();
const all = [...initResult, ...saveResult, ...loadResult, ...scrambleResult, ...descOnResult, ...descOffResult, ...reRenderResult, ...issueRegressionResult, ...liveDescriptionLabelResult];
const passed=all.filter(r=>r.pass).length,failed=all.filter(r=>!r.pass).length;
console.log('\n=== TEST RESULTS ===');
all.forEach(r=>console.log((r.pass?'✅':'❌')+' '+r.label+(r.detail?'  ->  '+r.detail:'')));
const errs=logs.filter(l=>l.type==='pageerror');
if(errs.length){console.log('\n--- PAGE ERRORS ---');errs.forEach(l=>console.log('  💥 '+l.text));}
console.log('\n'+(failed===0?'✅':'❌')+' '+passed+' passed, '+failed+' failed out of '+all.length);
process.exit(failed>0?1:0);
})()
