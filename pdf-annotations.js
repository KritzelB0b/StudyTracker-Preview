import {navigateToPage} from './pdf-reader.js?v=6';

const el=id=>document.getElementById(id);
const ink=el('stPdfInk'),stage=el('stPdfStage'),root=el('stPdfReader');
if(!ink)throw Error('Anmerkungsfläche fehlt');
const ctx=ink.getContext('2d');
if(!ctx)throw Error('Canvas-Zeichenfläche ist nicht verfügbar');

let key='',page=1,mode='pointer',drawing=false,pointerId=null,activeStroke=[],gestureModified=false;
let inkColor='#000000',inkWidth=3,data={pages:{}};
let scrollGesture=null;
const strokeHistory=new Map();
const historyLimit=20;
const toolButtons={pointer:el('stToolPointer'),hand:el('stToolHand'),pen:el('stAnnotPen'),highlight:el('stToolHighlight'),eraser:el('stToolEraser')};
const status=s=>{el('stPdfMessage').textContent=s};
const toolStatus=s=>{const target=el('stToolStatus');if(target)target.textContent=s};
const pixelsPerCss=()=>ink.width/Math.max(1,ink.getBoundingClientRect().width||Number.parseFloat(ink.style.width)||1);
function ensureData(value){
 if(!value||typeof value!=='object'||!value.pages||typeof value.pages!=='object'||Array.isArray(value.pages))return {pages:{}};
 return value;
}
function current(){
 const pages=data.pages;
 const item=pages[page]??(pages[page]={strokes:[],notes:[],links:[]});
 if(!Array.isArray(item.strokes))item.strokes=[];
 if(!Array.isArray(item.notes))item.notes=[];
 if(!Array.isArray(item.links))item.links=[];
 return item;
}
function save(){
 if(!key)return;
 try{localStorage.setItem('st-reader-annotations-v1-'+key,JSON.stringify(data))}
 catch{status('Lokaler Speicher voll. Bitte ältere Einträge sichern.')}
 document.dispatchEvent(new CustomEvent('st-pdf-annotation-change',{detail:{key,data:JSON.parse(JSON.stringify(data))}}));
}
function backupStrokes(){
 const old=strokeHistory.get(page)||[];
 old.push(JSON.parse(JSON.stringify(current().strokes)));
 if(old.length>historyLimit)old.shift();
 strokeHistory.set(page,old);
 el('stAnnotUndo').disabled=false;
}
function updateUndo(){el('stAnnotUndo').disabled=!(strokeHistory.get(page)||[]).length}
function strokeValue(raw){
 if(Array.isArray(raw))return {points:raw,color:'#e66700',width:3,opacity:1,tool:'pen'};
 return {points:raw?.points||[],color:raw?.color||'#e66700',width:Number(raw?.width)||3,opacity:raw?.tool==='highlight'?(Number(raw?.opacity)||0.29):Math.min(1,Number(raw?.opacity)||1),tool:raw?.tool||'pen'};
}
function drawStroke(stroke){
 if(!stroke.points.length)return;
 const ratio=pixelsPerCss();
 ctx.save();ctx.globalAlpha=stroke.opacity;
 ctx.beginPath();ctx.strokeStyle=stroke.color;ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=stroke.width*ratio;
 for(const [i,p] of stroke.points.entries()){
  const x=p[0]*ink.width,y=p[1]*ink.height;
  if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
 }
 if(stroke.points.length===1){
  const [x,y]=stroke.points[0];ctx.lineTo(x*ink.width+.1,y*ink.height+.1);
 }
 ctx.stroke();ctx.restore();
}
function redraw(){
 if(!key||!ink.width)return;
 ctx.clearRect(0,0,ink.width,ink.height);
 for(const item of current().strokes)drawStroke(strokeValue(item));
 if(drawing&&mode!=='eraser'&&activeStroke.length)drawStroke({points:activeStroke,color:inkColor,width:inkWidth,opacity:mode==='highlight'?.29:1});
}
function point(event){
 const rect=ink.getBoundingClientRect();
 return [Math.max(0,Math.min(1,(event.clientX-rect.left)/Math.max(1,rect.width))),
 Math.max(0,Math.min(1,(event.clientY-rect.top)/Math.max(1,rect.height)))];
}
function distanceSq(px,py,ax,ay,bx,by){
 const dx=bx-ax,dy=by-ay;
 const t=dx*dx+dy*dy?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy))):0;
 return (px-ax-t*dx)**2+(py-ay-t*dy)**2;
}
function eraseAt(normalized){
 const p=current(),w=ink.getBoundingClientRect().width||1,h=ink.getBoundingClientRect().height||1;
 const x=normalized[0]*w,y=normalized[1]*h;
 for(let i=p.strokes.length-1;i>=0;i--){
  const item=strokeValue(p.strokes[i]),points=item.points;
  if(!Array.isArray(points)||!points.length)continue;
  const margin=Math.max(11,item.width*.55+7),limit=margin*margin;
  for(let j=0;j<points.length;j++){
   const x0=points[j][0]*w,y0=points[j][1]*h;
   const next=points[Math.min(j+1,points.length-1)],x1=next[0]*w,y1=next[1]*h;
   if(distanceSq(x,y,x0,y0,x1,y1)<=limit){
    if(!gestureModified)backupStrokes();
    p.strokes.splice(i,1);gestureModified=true;redraw();return true;
   }
  }
 }
 return false;
}
function setColor(color){
 inkColor=color;el('stPenColor').value=color;
 document.querySelectorAll('[data-ink-color]').forEach(button=>{
  const selected=button.dataset.inkColor===color;
  button.classList.toggle('is-selected',selected);
  button.setAttribute('aria-pressed',String(selected));
 });
 toolStatus('Farbe: '+(el('stPenColor').selectedOptions[0]?.textContent||color)+(mode==='pointer'?' · Zeiger aktiv':' · '+modeLabel(mode)));
}
const modeLabels={pointer:'Zeiger',hand:'Hand',pen:'Stift',highlight:'Textmarker',eraser:'Radierer'};
const modeHelp={pointer:'Zeiger aktiv: PDF-Links öffnen und ganz normal scrollen.',hand:'Hand aktiv: PDF mit der Maus greifen und verschieben.',pen:'Stift aktiv: Auf der PDF zeichnen; Farbe und Stärke links auswählen.',highlight:'Textmarker aktiv: Freihand-Markierungen direkt auf die PDF setzen.',eraser:'Radierer aktiv: Einzelne gezeichnete oder markierte Striche entfernen.'};
const modeLabel=selected=>modeLabels[selected]||selected;
function setMode(next){
 if(!toolButtons[next])return;
 if(drawing)finishStroke();
 mode=next;
 const draw=['pen','highlight','eraser'].includes(mode);
 ink.classList.toggle('st-draw-active',draw);
 ink.classList.toggle('st-eraser-active',mode==='eraser');
 stage.classList.toggle('st-mode-hand',mode==='hand');
 stage.classList.remove('st-hand-grabbing');
 for(const [name,button] of Object.entries(toolButtons)){
  button.setAttribute('aria-pressed',String(name===mode));
  button.classList.toggle('st-tool-active',name===mode);
 }
 if(mode==='highlight'&&inkColor==='#000000')setColor('#f4c430');
 if(mode==='highlight'&&inkWidth<=6){inkWidth=14;el('stPenWidth').value='14'}
 if(mode==='pen'&&inkWidth>=14){inkWidth=3;el('stPenWidth').value='3'}
 toolStatus(modeHelp[mode]);
}
function list(){
 const target=el('stAnnotList');target.replaceChildren();
 el('stReviewPage').textContent='Seite '+page;
 if(!key)return;
 const p=current();
 if(!p.notes.length&&!p.links.length){
  const empty=document.createElement('div');empty.className='st-review-empty';
  empty.textContent='Noch keine Kommentare oder Sprungmarken auf dieser Seite.';
  target.append(empty);
 }
 for(const [index,note] of p.notes.entries()){
  const card=document.createElement('div');card.className='st-review-comment';
  const heading=document.createElement('span');heading.className='st-review-pagehint';heading.textContent='Kommentar · Seite '+page;
  const body=document.createElement('p');body.textContent=note;
  const actions=document.createElement('div');actions.className='buttons';
  for(const [label,handler] of [
   ['Bearbeiten',()=>{
    const value=prompt('Kommentar bearbeiten:',note);if(value===null)return;
    if(value.trim())p.notes[index]=value.trim().slice(0,2000);
    else p.notes.splice(index,1);
    save();list();
   }],
   ['Löschen',()=>{if(!confirm('Kommentar löschen?'))return;p.notes.splice(index,1);save();list()}]
  ]){
   const button=document.createElement('button');button.type='button';button.className='secondary';button.textContent=label;button.addEventListener('click',handler);actions.append(button);
  }
  card.append(heading,body,actions);target.append(card);
 }
 for(const [index,item] of p.links.entries()){
  const card=document.createElement('div');card.className='st-review-comment';
  const heading=document.createElement('span');heading.className='st-review-pagehint';heading.textContent='Sprungmarke · Seite '+page;
  const jump=document.createElement('button');jump.type='button';jump.className='secondary';
  jump.textContent='↗ '+item.title+' · Seite '+item.target;jump.addEventListener('click',()=>navigateToPage(item.target));
  const del=document.createElement('button');del.type='button';del.className='secondary';del.textContent='Löschen';
  del.addEventListener('click',()=>{p.links.splice(index,1);save();list()});
  card.append(heading,document.createElement('p'),jump,del);target.append(card);
 }
}
function focusNotes(){
 if(!key){status('Bitte zuerst eine PDF öffnen.');return}
 if(root.classList.contains('st-reader-notes-hidden'))el('stPdfNotesToggle').click();
 const input=el('stReviewInput');input.focus();input.scrollIntoView({block:'nearest',behavior:'smooth'});
 toolStatus('Kommentar: Text rechts im Notizfeld schreiben und speichern.');
}
const dock=el('stReviewDock');dock.append(el('stReviewPane'));
el('stReviewAdd').addEventListener('click',()=>{
 if(!key)return;const input=el('stReviewInput'),content=input.value.trim();
 if(!content)return;
 current().notes.push(content.slice(0,2000));input.value='';save();list();
 status('Kommentar auf Seite '+page+' gespeichert.');
});
el('stReviewInput').addEventListener('keydown',event=>{if(event.ctrlKey&&event.key==='Enter')el('stReviewAdd').click()});
el('stPenColor').addEventListener('change',event=>setColor(event.target.value));
document.querySelectorAll('[data-ink-color]').forEach(button=>button.addEventListener('click',()=>setColor(button.dataset.inkColor)));
el('stPenWidth').addEventListener('change',event=>{inkWidth=Number(event.target.value)||3;toolStatus('Linienstärke: '+event.target.selectedOptions[0]?.textContent)});
for(const [name,button] of Object.entries(toolButtons))button.addEventListener('click',()=>setMode(name));
el('stAnnotNote').addEventListener('click',focusNotes);
for(const id of ['stAnnotNote','stAnnotLink','stAnnotUndo','stAnnotErase'])el(id).removeAttribute('aria-pressed');

let jumpDialog=null;
function addJump(){
 if(!key){status('Bitte zuerst eine PDF öffnen.');return}
 if(!jumpDialog){
  jumpDialog=document.createElement('dialog');jumpDialog.className='st-jump-dialog';
  jumpDialog.setAttribute('aria-labelledby','stJumpTitle');
  jumpDialog.innerHTML='<form method="dialog" id="stJumpForm"><h3 id="stJumpTitle">Sprungmarke anlegen</h3><label for="stJumpName">Bezeichnung</label><input id="stJumpName" type="text" maxlength="100" placeholder="z. B. Integraltafel" required><label for="stJumpTarget">Zielseite</label><input id="stJumpTarget" type="number" min="1" required><div class="st-jump-actions"><button type="button" class="secondary" id="stJumpCancel">Abbrechen</button><button type="submit" class="primary">Sprungmarke speichern</button></div><p class="st-jump-error" role="alert" id="stJumpError"></p></form>';
  document.body.append(jumpDialog);
  el('stJumpCancel').addEventListener('click',()=>jumpDialog.close());
  el('stJumpForm').addEventListener('submit',event=>{
   event.preventDefault();if(!key)return;
   const name=el('stJumpName').value.trim(),target=Number(el('stJumpTarget').value);
   const total=Number(el('stPdfPageTotal').textContent.replace(/\D/g,''));
   if(!name||!Number.isInteger(target)||target<1||target>total){el('stJumpError').textContent='Bitte einen Titel und eine gültige Seite zwischen 1 und '+total+' eingeben.';return}
   current().links.push({title:name.slice(0,100),target});save();list();jumpDialog.close();
   status('Sprungmarke zu Seite '+target+' gespeichert.');
  });
 }
 const total=Number(el('stPdfPageTotal').textContent.replace(/\D/g,''));
 el('stJumpName').value='';el('stJumpTarget').value=String(Math.min(total,page+1));
 el('stJumpTarget').max=String(total);el('stJumpError').textContent='';
 jumpDialog.showModal();el('stJumpName').focus();
}
el('stAnnotLink').addEventListener('click',addJump);
el('stAnnotUndo').addEventListener('click',()=>{
 if(!key)return;
 const entries=strokeHistory.get(page)||[];
 if(!entries.length){toolStatus('Keine Zeichenaktion zum Rückgängigmachen.');return}
 current().strokes=entries.pop();
 save();redraw();updateUndo();toolStatus('Letzte Zeichenaktion rückgängig gemacht.');
});
el('stAnnotErase').addEventListener('click',()=>{
 if(!key||!current().strokes.length)return;
 if(!confirm('Alle handschriftlichen Striche und Markierungen auf dieser Seite löschen? Kommentare und Sprungmarken bleiben erhalten.'))return;
 backupStrokes();current().strokes=[];save();redraw();
 toolStatus('Zeichnungen und Markierungen auf Seite '+page+' gelöscht. Rückgängig ist möglich.');
});
ink.addEventListener('pointerdown',event=>{
 if(!key||!['pen','highlight','eraser'].includes(mode))return;
 if(event.pointerType==='mouse'&&event.button!==0)return;
 event.preventDefault();drawing=true;gestureModified=false;pointerId=event.pointerId;
 activeStroke=[point(event)];try{ink.setPointerCapture(event.pointerId)}catch{}
 if(mode==='eraser')eraseAt(activeStroke[0]);
 else redraw();
});
ink.addEventListener('pointermove',event=>{
 if(!drawing||event.pointerId!==pointerId)return;
 event.preventDefault();
 const next=point(event);
 if(mode==='eraser')eraseAt(next);
 else{activeStroke.push(next);redraw()}
});
function finishStroke(){
 if(!drawing)return;
 drawing=false;
 try{if(pointerId!==null&&ink.hasPointerCapture(pointerId))ink.releasePointerCapture(pointerId)}catch{}
 if(mode==='eraser'){
  if(gestureModified){save();toolStatus('Ausgewählte Striche entfernt. Mit Rückgängig wiederherstellbar.')}
 }else if(activeStroke.length&&key){
  backupStrokes();
  const pts=activeStroke.length===1?[activeStroke[0],activeStroke[0]]:activeStroke;
  current().strokes.push({points:pts,color:inkColor,width:inkWidth,tool:mode,opacity:mode==='highlight'?.29:1});
  save();
 }
 pointerId=null;activeStroke=[];gestureModified=false;redraw();updateUndo();
}
ink.addEventListener('pointerup',finishStroke);
ink.addEventListener('pointercancel',finishStroke);
ink.addEventListener('lostpointercapture',finishStroke);
stage.addEventListener('pointerdown',event=>{
 if(mode!=='hand'||!key||event.button!==0||event.pointerType==='touch')return;
 if(event.target.closest?.('a,button,input,textarea,select'))return;
 scrollGesture={id:event.pointerId,startX:event.clientX,startY:event.clientY,left:stage.scrollLeft,top:stage.scrollTop};
 stage.classList.add('st-hand-grabbing');
 try{stage.setPointerCapture(event.pointerId)}catch{}
});
stage.addEventListener('pointermove',event=>{
 if(!scrollGesture||event.pointerId!==scrollGesture.id)return;
 event.preventDefault();
 stage.scrollLeft=scrollGesture.left-(event.clientX-scrollGesture.startX);
 stage.scrollTop=scrollGesture.top-(event.clientY-scrollGesture.startY);
});
function stopHand(event){
 if(!scrollGesture||event.pointerId!==scrollGesture.id)return;
 scrollGesture=null;stage.classList.remove('st-hand-grabbing');
 try{if(stage.hasPointerCapture(event.pointerId))stage.releasePointerCapture(event.pointerId)}catch{}
}
stage.addEventListener('pointerup',stopHand);
stage.addEventListener('pointercancel',stopHand);
stage.addEventListener('lostpointercapture',stopHand);
document.addEventListener('st-pdf-open',event=>{
 key=event.detail.key;
 try{data=ensureData(JSON.parse(localStorage.getItem('st-reader-annotations-v1-'+key)||'{"pages":{}}'))}
 catch{data={pages:{}}}
 page=1;strokeHistory.clear();setMode('pointer');list();updateUndo();
});
document.addEventListener('st-pdf-page',event=>{
 page=event.detail.page;el('stReviewInput').value='';
 const ratio=Math.min(window.devicePixelRatio||1,2,Math.sqrt(16000000/Math.max(1,event.detail.width*event.detail.height)));
 ink.width=Math.max(1,Math.floor(event.detail.width*ratio));
 ink.height=Math.max(1,Math.floor(event.detail.height*ratio));
 ink.style.width=event.detail.width+'px';ink.style.height=event.detail.height+'px';
 redraw();list();updateUndo();
});
document.addEventListener('st-pdf-cloud-loaded',event=>{
 if(event.detail.key!==key)return;
 data=ensureData(event.detail.data);strokeHistory.clear();
 try{localStorage.setItem('st-reader-annotations-v1-'+key,JSON.stringify(data))}catch{}
 redraw();list();updateUndo();
});
document.addEventListener('st-pdf-close',()=>{
 key='';drawing=false;pointerId=null;activeStroke=[];gestureModified=false;data={pages:{}};strokeHistory.clear();
 el('stReviewInput').value='';ctx.clearRect(0,0,ink.width,ink.height);
 el('stAnnotList').replaceChildren();setMode('pointer');updateUndo();
 if(jumpDialog?.open)jumpDialog.close();
});
setMode('pointer');updateUndo();
window.studyPdfAnnotationsReady=true;
document.dispatchEvent(new Event('st-pdf-annotations-ready'));
