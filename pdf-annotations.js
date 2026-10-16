import {navigateToPage} from './pdf-reader.js';
const el=id=>document.getElementById(id),ink=el('stPdfInk');
if(!ink)throw new Error('Anmerkungsfläche fehlt');
const ctx=ink.getContext('2d');
if(!ctx)throw new Error('Canvas-Zeichenfläche ist nicht verfügbar');
let key='',page=1,pen=false,drawing=false,activeStroke=[],data={pages:{}};
const scale=()=>Math.min(window.devicePixelRatio||1,2);
const current=()=>data.pages[page]??(data.pages[page]={strokes:[],notes:[],links:[]});
const save=()=>{if(!key)return;try{localStorage.setItem('st-reader-annotations-v1-'+key,JSON.stringify(data))}catch{status('Speicher voll: Bitte ältere Einträge sichern.')}};
const status=s=>el('stPdfMessage').textContent=s;
function list(){const root=el('stAnnotList');root.replaceChildren();if(!key)return;const p=current();
 for(const [i,n] of p.notes.entries()){const b=document.createElement('button');b.className='st-annotation-note';b.textContent='Notiz: '+n.slice(0,65);b.title='Klicken zum Bearbeiten';b.onclick=()=>{const t=prompt('Seitennotiz bearbeiten (leer = löschen):',n);if(t===null)return;if(t.trim())p.notes[i]=t.trim().slice(0,2000);else p.notes.splice(i,1);save();list()};root.append(b)}
 for(const [i,n] of p.links.entries()){const b=document.createElement('button');b.className='st-annotation-note';b.textContent='↗ '+n.title+' · S. '+n.target;b.onclick=()=>navigateToPage(n.target);root.append(b);const d=document.createElement('button');d.textContent='×';d.className='st-annotation-note';d.title='Sprungmarke entfernen';d.onclick=()=>{p.links.splice(i,1);save();list()};root.append(d)}
}
function redraw(){if(!key||!ink.width)return;ctx.clearRect(0,0,ink.width,ink.height);for(const stroke of current().strokes){if(stroke.length<2)continue;ctx.beginPath();ctx.strokeStyle='#e66700';ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=3*scale();stroke.forEach(([x,y],i)=>{const px=x*ink.width,py=y*ink.height;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py)});ctx.stroke()}}
function point(e){const b=ink.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-b.left)/b.width)),Math.max(0,Math.min(1,(e.clientY-b.top)/b.height))]}
el('stAnnotPen').onclick=()=>{pen=!pen;ink.classList.toggle('st-draw-active',pen);el('stAnnotPen').setAttribute('aria-pressed',String(pen));status(pen?'Stift aktiv: Auf der PDF-Seite zeichnen.':'Stift deaktiviert.')};
ink.addEventListener('pointerdown',e=>{if(!pen||!key)return;drawing=true;activeStroke=[point(e)];ink.setPointerCapture(e.pointerId)});
ink.addEventListener('pointermove',e=>{if(!drawing)return;activeStroke.push(point(e));redraw();ctx.beginPath();ctx.lineWidth=3*scale();ctx.strokeStyle='#e66700';ctx.lineJoin='round';ctx.lineCap='round';activeStroke.forEach(([x,y],i)=>i?ctx.lineTo(x*ink.width,y*ink.height):ctx.moveTo(x*ink.width,y*ink.height));ctx.stroke()});
function finish(){if(!drawing)return;drawing=false;if(activeStroke.length>1){current().strokes.push(activeStroke);save()}activeStroke=[];redraw()}
ink.addEventListener('pointerup',finish);ink.addEventListener('pointercancel',finish);
el('stAnnotNote').onclick=()=>{if(!key)return;const text=prompt('Notiz zu Seite '+page+':');if(!text?.trim())return;current().notes.push(text.trim().slice(0,2000));save();list()};
el('stAnnotLink').onclick=()=>{if(!key)return;const title=prompt('Bezeichnung der Sprungmarke (z. B. Integraltafel):');if(!title?.trim())return;const dest=Number(prompt('Zu welcher PDF-Seite soll gesprungen werden?'));const total=Number(el('stPdfPageTotal').textContent.replace(/\D/g,''));if(!Number.isInteger(dest)||dest<1||dest>total){status('Ungültige Zielseite.');return}current().links.push({title:title.trim().slice(0,100),target:dest});save();list()};
el('stAnnotUndo').onclick=()=>{if(!key)return;current().strokes.pop();save();redraw()};
el('stAnnotErase').onclick=()=>{if(!key||!confirm('Alle handschriftlichen Striche auf dieser Seite löschen?'))return;current().strokes=[];save();redraw()};
document.addEventListener('st-pdf-open',e=>{key=e.detail.key;try{data=JSON.parse(localStorage.getItem('st-reader-annotations-v1-'+key)||'{"pages":{}}');if(!data.pages||typeof data.pages!=='object')data={pages:{}}}catch{data={pages:{}}}page=1;list()});
document.addEventListener('st-pdf-page',e=>{page=e.detail.page;const ratio=Math.min(devicePixelRatio||1,2);ink.width=Math.floor(e.detail.width*ratio);ink.height=Math.floor(e.detail.height*ratio);ink.style.width=e.detail.width+'px';ink.style.height=e.detail.height+'px';redraw();list()});
document.addEventListener('st-pdf-close',()=>{key='';pen=false;ink.classList.remove('st-draw-active');el('stAnnotPen').setAttribute('aria-pressed','false');ctx.clearRect(0,0,ink.width,ink.height);el('stAnnotList').replaceChildren()});

window.studyPdfAnnotationsReady=true;
document.dispatchEvent(new Event('st-pdf-annotations-ready'));
