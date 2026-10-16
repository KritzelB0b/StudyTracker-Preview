
const g=id=>document.getElementById(id);
const input=g('stPdfInput'), workspace=g('stPdfWorkspace'),msg=g('stPdfMessage'),canvas=g('stPdfCanvas'),layer=g('stPdfLinkLayer');
let cloudDocumentId=null;let pdfjs=null,documentPDF=null,renderTask=null,renderVersion=0,current=1,zoom=1,outline=[],bookmarks=[],docKey='',searchVersion=0,fitWidth=true,fitTimer=null;
const report=s=>msg.textContent=s;
const isOwner=()=>!document.body.classList.contains('st-auth-locked');
async function engine(){
 if(pdfjs)return pdfjs;
 pdfjs=await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
 pdfjs.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
 return pdfjs;
}
function clearDocument(){
 exitReaderFullscreen();
 searchVersion++;renderVersion++;
 if(renderTask){try{renderTask.cancel()}catch{}renderTask=null}
 if(documentPDF){documentPDF.destroy().catch(()=>{});documentPDF=null}
 document.dispatchEvent(new Event('st-pdf-close'));cloudDocumentId=null;current=1;zoom=1;outline=[];bookmarks=[];docKey='';workspace.hidden=true;layer.replaceChildren();g('stPdfOutline').replaceChildren();g('stPdfResults').replaceChildren();g('stPdfBookmarks').replaceChildren();g('stPdfFileLabel').textContent='Noch kein Dokument ausgewählt';g('stPdfClose').disabled=true;g('stPdfFullscreen').disabled=true;input.value='';
}
function leaf(text,depth,fn){
 const b=document.createElement('button');b.type='button';b.textContent=text;b.style.paddingLeft=(8+Math.min(depth,7)*15)+'px';b.addEventListener('click',fn);return b;
}
async function goDest(destination){
 if(!documentPDF)return;
 try{
 const dest=typeof destination==='string'?await documentPDF.getDestination(destination):destination;
 if(!Array.isArray(dest)||!dest.length)return;
 const ref=dest[0],index=typeof ref==='object'?await documentPDF.getPageIndex(ref):ref;
 if(Number.isInteger(index))await showPage(index+1);
 }catch(e){report('Sprungziel konnte nicht geöffnet werden: '+e.message)}
}
function outlineView(){
 const root=g('stPdfOutline');root.replaceChildren();const term=g('stPdfOutlineSearch').value.trim().toLocaleLowerCase('de');
 let count=0;
 function visit(items,depth){for(const item of items){if(count++>3000)return;const descendants=item.items||[];const hasMatch=(node)=>node.title?.toLocaleLowerCase('de').includes(term)||(node.items||[]).some(hasMatch);
 if(!term||hasMatch(item)){root.append(leaf(item.title||'Ohne Titel',depth,()=>goDest(item.dest)));visit(descendants,depth+1)}
 }}
 visit(outline,0);if(!root.children.length)root.textContent='Keine Kapitel vorhanden oder gefunden.';
}
async function drawLinks(page,viewport){
 layer.replaceChildren();
 const annots=await page.getAnnotations({intent:'display'});
 for(const a of annots){
 if(a.subtype!=='Link'||!a.rect)continue;
 const rect=viewport.convertToViewportRectangle(a.rect),x=Math.min(rect[0],rect[2]),y=Math.min(rect[1],rect[3]),w=Math.abs(rect[2]-rect[0]),h=Math.abs(rect[3]-rect[1]);
 if(w<2||h<2)continue;
 const l=document.createElement('a');l.style.left=x+'px';l.style.top=y+'px';l.style.width=w+'px';l.style.height=h+'px';l.setAttribute('aria-label','PDF-Verknüpfung');l.tabIndex=0;
 if(a.dest){l.href='#';l.addEventListener('click',e=>{e.preventDefault();goDest(a.dest)})}
 else if(a.url&&/^https?:\/\//i.test(a.url)){l.href=a.url;l.target='_blank';l.rel='noopener noreferrer';}
 else continue;
 layer.append(l);
 }
}
async function showPage(n){
 if(!documentPDF||!isOwner())return;
 n=Math.max(1,Math.min(documentPDF.numPages,Number(n)||1));current=n;g('stPdfPage').value=n;g('stPdfPageTotal').textContent='/ '+documentPDF.numPages;
 const ticket=++renderVersion;
 if(renderTask){try{renderTask.cancel()}catch{}renderTask=null}
 try{
 const page=await documentPDF.getPage(n);if(ticket!==renderVersion)return;
 const base=page.getViewport({scale:1.4});
 if(fitWidth){const stage=g('stPdfStage'),available=Math.max(210,stage.clientWidth-36);zoom=Math.min(2.5,Math.max(.35,available/base.width));}
 g('stPdfZoomLabel').textContent=Math.round(zoom*100)+' %';
 const viewport=page.getViewport({scale:zoom*1.4});
 const area=Math.max(1,viewport.width*viewport.height),dpr=Math.min(window.devicePixelRatio||1,2,Math.sqrt(16000000/area));
 canvas.width=Math.max(1,Math.floor(viewport.width*dpr));canvas.height=Math.max(1,Math.floor(viewport.height*dpr));canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';
 layer.style.width=viewport.width+'px';layer.style.height=viewport.height+'px';layer.replaceChildren();
 const context=canvas.getContext('2d',{alpha:false});renderTask=page.render({canvasContext:context,viewport,transform:dpr!==1?[dpr,0,0,dpr,0,0]:undefined});
 await renderTask.promise;if(ticket!==renderVersion)return;document.dispatchEvent(new CustomEvent('st-pdf-page',{detail:{page:n,width:viewport.width,height:viewport.height}}));try{await drawLinks(page,viewport)}catch(linkErr){console.warn('PDF-Verlinkungen konnten nicht vollständig geladen werden:',linkErr)}
 }catch(e){if(e?.name!=='RenderingCancelledException')report('PDF-Seite konnte nicht dargestellt werden: '+e.message)}finally{if(ticket===renderVersion)renderTask=null}
}
async function search(){
 if(!documentPDF||!isOwner())return;
 const term=g('stPdfSearch').value.trim().toLocaleLowerCase('de');const result=g('stPdfResults');result.replaceChildren();if(term.length<2){result.textContent='Mindestens zwei Zeichen eingeben.';return}
 const ticket=++searchVersion;result.textContent='Suche läuft …';let matches=[];
 for(let i=1;i<=documentPDF.numPages;i++){
 if(ticket!==searchVersion||!documentPDF||!isOwner())return;
 const p=await documentPDF.getPage(i),tc=await p.getTextContent();const text=tc.items.map(x=>x.str||'').join(' ').toLocaleLowerCase('de');
 if(text.includes(term)){matches.push(i);if(matches.length>=100)break}
 if(i%35===0)result.textContent='Durchsuche Seite '+i+' / '+documentPDF.numPages+' …';
 }
 if(ticket!==searchVersion)return;
 result.replaceChildren();if(!matches.length){result.textContent='Keine Treffer gefunden.';return}
 for(const n of matches)result.append(leaf('Seite '+n,0,()=>showPage(n)));
 report(matches.length+' Seiten mit Treffern gefunden.'+(matches.length===100?' Anzeige auf 100 Seiten begrenzt.':''));
}
async function openLocal(file,cloudId=null){
 if(!isOwner()){report('Bitte zuerst anmelden.');return}
 if(!file)return;
 if(!file.name.toLowerCase().endsWith('.pdf')&&file.type!=='application/pdf'){report('Bitte eine PDF-Datei auswählen.');return}
 if(file.size>160*1024*1024){report('Datei zu groß: Der Reader unterstützt derzeit PDFs bis 160 MB.');return}
 clearDocument();fitWidth=true;g('stPdfFitWidth').setAttribute('aria-pressed','true');report('PDF wird im Browser geladen …');
 try{
 const lib=await engine();const bytes=new Uint8Array(await file.arrayBuffer());documentPDF=await lib.getDocument({data:bytes}).promise;
 cloudDocumentId=cloudId;docKey='st-pdf-bookmarks-'+file.name+'-'+file.size;document.dispatchEvent(new CustomEvent('st-pdf-open',{detail:{key:file.name+'-'+file.size,cloudId}}));
 try{bookmarks=JSON.parse(localStorage.getItem(docKey)||'[]').filter(Number.isInteger)}catch{bookmarks=[]}
 outline=await documentPDF.getOutline()||[];workspace.hidden=false;g('stPdfFileLabel').textContent=file.name;g('stPdfClose').disabled=false;g('stPdfFullscreen').disabled=false;g('stPdfSearch').value='';g('stPdfOutlineSearch').value='';outlineView();drawBookmarks();await showPage(1);report((cloudId?'Cloud-PDF':'Lokale PDF')+' geöffnet · '+documentPDF.numPages+' Seiten · '+outline.length+' Hauptkapitel.');
 }catch(e){clearDocument();report('PDF konnte nicht geöffnet werden: '+e.message)}
}
function drawBookmarks(){
 const root=g('stPdfBookmarks');root.replaceChildren();for(const n of [...new Set(bookmarks)].sort((a,b)=>a-b)){const b=leaf('☆ Seite '+n,0,()=>showPage(n));root.append(b)}
}
function remember(){if(!documentPDF)return;bookmarks=bookmarks.includes(current)?bookmarks.filter(n=>n!==current):[...bookmarks,current];try{localStorage.setItem(docKey,JSON.stringify(bookmarks))}catch{}drawBookmarks();report(bookmarks.includes(current)?'Seite '+current+' gemerkt.':'Lesezeichen entfernt.');document.dispatchEvent(new CustomEvent('st-pdf-bookmarks-change',{detail:{bookmarks:[...bookmarks]}}))}
input.addEventListener('change',e=>openLocal(e.target.files[0]));
g('stPdfClose').addEventListener('click',()=>{clearDocument();report('PDF geschlossen. Keine PDF-Datei wurde gespeichert oder hochgeladen.')});
g('stPdfPrev').addEventListener('click',()=>showPage(current-1));g('stPdfNext').addEventListener('click',()=>showPage(current+1));
g('stPdfPage').addEventListener('change',e=>showPage(e.target.value));
g('stPdfZoomOut').addEventListener('click',()=>{fitWidth=false;g('stPdfFitWidth').setAttribute('aria-pressed','false');zoom=Math.max(.35,zoom-.15);showPage(current)});
g('stPdfZoomIn').addEventListener('click',()=>{fitWidth=false;g('stPdfFitWidth').setAttribute('aria-pressed','false');zoom=Math.min(2.5,zoom+.15);showPage(current)});
const root=g('stPdfReader');
function exitReaderFullscreen(){
 root.classList.remove('st-reader-fullscreen');
 document.body.classList.remove('st-document-fullscreen');
 g('stPdfFullscreen').textContent='⛶ Vollbild';
 g('stPdfFullscreen').setAttribute('aria-pressed','false');
}
function refreshFit(){if(!fitWidth||!documentPDF||!isOwner())return;clearTimeout(fitTimer);fitTimer=setTimeout(()=>showPage(current),100)}
g('stPdfFullscreen').addEventListener('click',()=>{
 if(!documentPDF)return;
 const active=root.classList.toggle('st-reader-fullscreen');
 document.body.classList.toggle('st-document-fullscreen',active);
 g('stPdfFullscreen').textContent=active?'⤢ Fenster':'⛶ Vollbild';
 g('stPdfFullscreen').setAttribute('aria-pressed',String(active));
 if(active&&window.innerWidth<721){
  root.classList.add('st-reader-sidebar-hidden','st-reader-notes-hidden');
  g('stPdfSidebarToggle').setAttribute('aria-pressed','false');
  g('stPdfNotesToggle').setAttribute('aria-pressed','false');
 }
 requestAnimationFrame(refreshFit);
});
g('stPdfSidebarToggle').addEventListener('click',()=>{
 const hidden=root.classList.toggle('st-reader-sidebar-hidden');
 g('stPdfSidebarToggle').setAttribute('aria-pressed',String(!hidden));
 requestAnimationFrame(refreshFit);
});
g('stPdfNotesToggle').addEventListener('click',()=>{
 const hidden=root.classList.toggle('st-reader-notes-hidden');
 g('stPdfNotesToggle').setAttribute('aria-pressed',String(!hidden));
 requestAnimationFrame(refreshFit);
});
g('stPdfFitWidth').addEventListener('click',()=>{fitWidth=true;g('stPdfFitWidth').setAttribute('aria-pressed','true');refreshFit()});
document.addEventListener('keydown',event=>{
 if(!documentPDF||!root.classList.contains('st-reader-fullscreen'))return;
 if(event.key==='Escape'){event.preventDefault();exitReaderFullscreen();requestAnimationFrame(refreshFit);return}
 const target=event.target;
 if(target?.closest?.('input,textarea,select,button,[contenteditable="true"],[role="menu"]'))return;
 if(event.key==='ArrowRight'||event.key==='PageDown'){event.preventDefault();showPage(current+1)}
 if(event.key==='ArrowLeft'||event.key==='PageUp'){event.preventDefault();showPage(current-1)}
});
window.addEventListener('resize',refreshFit);
g('stPdfBookmark').addEventListener('click',remember);
g('stPdfOutlineSearch').addEventListener('input',outlineView);
g('stPdfSearchBtn').addEventListener('click',search);
g('stPdfSearch').addEventListener('keydown',e=>{if(e.key==='Enter')search()});
document.addEventListener('visibilitychange',()=>{if(!isOwner()&&documentPDF){clearDocument();report('Reader aus Sicherheitsgründen geschlossen.')}});
document.querySelectorAll('.nav .tab').forEach(b=>b.addEventListener('click',()=>{if(!isOwner()&&documentPDF)clearDocument()}));

export async function openCloudPdf(file,id){return openLocal(file,id)}
export function setCloudBookmarks(items){if(!documentPDF)return;bookmarks=[...new Set(items.filter(n=>Number.isInteger(n)&&n>=1&&n<=documentPDF.numPages))];try{localStorage.setItem(docKey,JSON.stringify(bookmarks))}catch{}drawBookmarks()}
export function navigateToPage(n){return showPage(n)}
export function getPdfPage(){return current}
