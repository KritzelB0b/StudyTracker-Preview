import {navigateToPage} from './pdf-reader.js';
const el=id=>document.getElementById(id),ink=el('stPdfInk');
if(!ink)throw new Error('Anmerkungsfläche fehlt');
const ctx=ink.getContext('2d');
if(!ctx)throw new Error('Canvas-Zeichenfläche ist nicht verfügbar');
let key='',page=1,pen=false,drawing=false,activeStroke=[],data={pages:{}};let inkColor='#000000',inkWidth=3;
const scale=()=>Math.min(window.devicePixelRatio||1,2);
const current=()=>data.pages[page]??(data.pages[page]={strokes:[],notes:[],links:[]});
const save=()=>{if(!key)return;try{localStorage.setItem('st-reader-annotations-v1-'+key,JSON.stringify(data))}catch{status('Speicher voll: Bitte ältere Einträge sichern.')}document.dispatchEvent(new CustomEvent('st-pdf-annotation-change',{detail:{key,data:structuredClone(data)}}))};
const status=s=>el('stPdfMessage').textContent=s;
function list(){const root=el('stAnnotList');root.replaceChildren();el('stReviewPage').textContent='Seite '+page;if(!key)return;const p=current();
 if(!p.notes.length&&!p.links.length){const empty=document.createElement('div');empty.className='st-review-empty';empty.textContent='Noch keine Kommentare oder Sprungmarken auf dieser Seite.';root.append(empty)}
 for(const [i,n] of p.notes.entries()){const card=document.createElement('div');card.className='st-review-comment';const hdr=document.createElement('span');hdr.className='st-review-pagehint';hdr.textContent='Kommentar · Seite '+page;const body=document.createElement('p');body.textContent=n;const actions=document.createElement('div');actions.className='buttons';for(const [label,handler] of [['Bearbeiten',()=>{const text=prompt('Kommentar bearbeiten:',n);if(text===null)return;if(text.trim())p.notes[i]=text.trim().slice(0,2000);else p.notes.splice(i,1);save();list()}],['Löschen',()=>{if(!confirm('Kommentar löschen?'))return;p.notes.splice(i,1);save();list()}]]){const btn=document.createElement('button');btn.className='secondary';btn.textContent=label;btn.onclick=handler;actions.append(btn)}card.append(hdr,body,actions);root.append(card)}
 for(const [i,n] of p.links.entries()){const card=document.createElement('div');card.className='st-review-comment';const label=document.createElement('span');label.className='st-review-pagehint';label.textContent='Sprungmarke · Seite '+page;const b=document.createElement('button');b.className='secondary';b.textContent='↗ '+n.title+' · Seite '+n.target;b.onclick=()=>navigateToPage(n.target);const d=document.createElement('button');d.textContent='Löschen';d.className='secondary';d.onclick=()=>{p.links.splice(i,1);save();list()};card.append(label,document.createElement('p'),b,d);root.append(card)}
}
const dock=el('stReviewDock');dock.append(el('stReviewPane'));
el('stReviewAdd').onclick=()=>{if(!key)return;const field=el('stReviewInput');const text=field.value.trim();if(!text)return;current().notes.push(text.slice(0,2000));field.value='';save();list();status('Kommentar auf Seite '+page+' gespeichert.')};
el('stReviewInput').addEventListener('keydown',e=>{if(e.ctrlKey&&e.key==='Enter')el('stReviewAdd').click()});
el('stPenColor').addEventListener('change',e=>inkColor=e.target.value);
el('stPenWidth').addEventListener('change',e=>inkWidth=Number(e.target.value)||3);
function redraw(){if(!key||!ink.width)return;ctx.clearRect(0,0,ink.width,ink.height);for(const raw of current().strokes){const stroke=Array.isArray(raw)?{points:raw,color:'#e66700',width:3}:raw;if(!stroke?.points||stroke.points.length<2)continue;ctx.beginPath();ctx.strokeStyle=stroke.color||'#e66700';ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=(stroke.width||3)*scale();stroke.points.forEach(([x,y],i)=>{const px=x*ink.width,py=y*ink.height;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py)});ctx.stroke()}}
function point(e){const b=ink.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-b.left)/b.width)),Math.max(0,Math.min(1,(e.clientY-b.top)/b.height))]}
el('stAnnotPen').onclick=()=>{pen=!pen;ink.classList.toggle('st-draw-active',pen);el('stAnnotPen').setAttribute('aria-pressed',String(pen));status(pen?'Stift aktiv: Auf der PDF-Seite zeichnen.':'Stift deaktiviert.')};
ink.addEventListener('pointerdown',e=>{if(!pen||!key)return;drawing=true;activeStroke=[point(e)];ink.setPointerCapture(e.pointerId)});
ink.addEventListener('pointermove',e=>{if(!drawing)return;activeStroke.push(point(e));redraw();ctx.beginPath();ctx.lineWidth=inkWidth*scale();ctx.strokeStyle=inkColor;ctx.lineJoin='round';ctx.lineCap='round';activeStroke.forEach(([x,y],i)=>i?ctx.lineTo(x*ink.width,y*ink.height):ctx.moveTo(x*ink.width,y*ink.height));ctx.stroke()});
function finish(){if(!drawing)return;drawing=false;if(activeStroke.length>1){current().strokes.push({points:activeStroke,color:inkColor,width:inkWidth});save()}activeStroke=[];redraw()}
ink.addEventListener('pointerup',finish);ink.addEventListener('pointercancel',finish);
el('stAnnotNote').onclick=()=>{if(!key)return;el('stReviewInput').focus();el('stReviewInput').scrollIntoView({block:'nearest',behavior:'smooth'})};
el('stAnnotLink').onclick=()=>{if(!key)return;const title=prompt('Bezeichnung der Sprungmarke (z. B. Integraltafel):');if(!title?.trim())return;const dest=Number(prompt('Zu welcher PDF-Seite soll gesprungen werden?'));const total=Number(el('stPdfPageTotal').textContent.replace(/\D/g,''));if(!Number.isInteger(dest)||dest<1||dest>total){status('Ungültige Zielseite.');return}current().links.push({title:title.trim().slice(0,100),target:dest});save();list()};
el('stAnnotUndo').onclick=()=>{if(!key)return;current().strokes.pop();save();redraw()};
el('stAnnotErase').onclick=()=>{if(!key||!confirm('Alle handschriftlichen Striche auf dieser Seite löschen?'))return;current().strokes=[];save();redraw()};
document.addEventListener('st-pdf-open',e=>{key=e.detail.key;try{data=JSON.parse(localStorage.getItem('st-reader-annotations-v1-'+key)||'{"pages":{}}');if(!data.pages||typeof data.pages!=='object')data={pages:{}}}catch{data={pages:{}}}page=1;list()});
document.addEventListener('st-pdf-page',e=>{page=e.detail.page;el('stReviewInput').value='';const ratio=Math.min(devicePixelRatio||1,2);ink.width=Math.floor(e.detail.width*ratio);ink.height=Math.floor(e.detail.height*ratio);ink.style.width=e.detail.width+'px';ink.style.height=e.detail.height+'px';redraw();list()});
document.addEventListener('st-pdf-cloud-loaded',e=>{if(e.detail.key!==key)return;data=e.detail.data;try{localStorage.setItem('st-reader-annotations-v1-'+key,JSON.stringify(data))}catch{}redraw();list()});
document.addEventListener('st-pdf-close',()=>{key='';pen=false;el('stReviewInput').value='';ink.classList.remove('st-draw-active');el('stAnnotPen').setAttribute('aria-pressed','false');ctx.clearRect(0,0,ink.width,ink.height);el('stAnnotList').replaceChildren()});

window.studyPdfAnnotationsReady=true;
document.dispatchEvent(new Event('st-pdf-annotations-ready'));
