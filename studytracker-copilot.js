/* StudyTracker Copilot Preview: local analysis, planning and PDF -> ChatGPT handoff. */
'use strict';
(()=>{
 const el=id=>document.getElementById(id);
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const dateDays=(a,b)=>Math.round((Date.parse(a+'T12:00:00')-Date.parse(b+'T12:00:00'))/86400000);
 const fmtH=n=>(n/60).toLocaleString('de-DE',{maximumFractionDigits:1})+' h';
 const current=()=>typeof activeTermId==='function'?activeTermId():'ws-2026';
 const modules=()=>typeof termModules==='function'?termModules():[];
 const entries=()=>typeof termEntries==='function'?termEntries():[];
 const plan=()=>typeof termPlan==='function'?termPlan(false):null;
 const tasks=()=>Array.isArray(plan()?.tasks)?plan().tasks:[];
 const events=()=>Array.isArray(plan()?.events)?plan().events:[];
 const credit=()=>window.studyCreditTracker?.summary?.()||null;
 const todayKey=()=>typeof today==='function'?today():new Date().toISOString().slice(0,10);
 const monday=key=>{const d=new Date(key+'T12:00:00');d.setDate(d.getDate()-(d.getDay()+6)%7);return d.toISOString().slice(0,10)};
 const points=()=>tasks().filter(t=>t.kind==='exam'&&!t.done&&t.date>=todayKey()).map(t=>({title:t.title,date:t.date,moduleId:t.moduleId||'',source:'Prüfung',time:t.time||''})).concat(events().filter(e=>e.date>=todayKey()&&/exam|prüfung|klausur/i.test([e.kind,e.type,e.category,e.title,e.name].join(' '))).map(e=>({title:e.title||e.name||'Prüfung',date:e.date,moduleId:e.moduleId||'',source:'Prüfung',time:e.start||''})));
 const upcoming=()=>{const list=tasks().filter(t=>!t.done&&t.date>=todayKey()).map(t=>({title:t.title,date:t.date,kind:t.kind==='exam'?'Prüfung':'Aufgabe',moduleId:t.moduleId||'',time:t.time||''})); for(const e of events().filter(e=>e.date>=todayKey()))list.push({title:e.title||e.name||'Termin',date:e.date,kind:'Termin',moduleId:e.moduleId||'',time:e.start||''});return list.sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'').localeCompare(b.time||''));};
 function insight(){
  const now=todayKey(),week=monday(now),history=entries(),within=history.filter(e=>e.date>=week&&e.date<=now);
  const prevEnd=new Date(week+'T12:00:00');prevEnd.setDate(prevEnd.getDate()-1);
  const prevStart=new Date(prevEnd);prevStart.setDate(prevStart.getDate()-6);
  const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  const lastWeek=history.filter(e=>e.date>=iso(prevStart)&&e.date<=iso(prevEnd));
  const by=modules().map(m=>{const w=within.filter(e=>e.moduleId===m.id).reduce((s,e)=>s+(Number(e.minutes)||0),0);const total=history.filter(e=>e.moduleId===m.id).reduce((s,e)=>s+(Number(e.minutes)||0),0);return {m,w,total,goal:Math.max(0,Number(m.goal)||0)*60};});
  const examinations=points().sort((a,b)=>a.date.localeCompare(b.date));
  const total=within.reduce((s,e)=>s+(Number(e.minutes)||0),0);
  const prev=lastWeek.reduce((s,e)=>s+(Number(e.minutes)||0),0);
  const credits=credit();
  const termEcts=credits?.bySemester?.find(t=>t.id===current())?.ects;
  const ranked=by.map(x=>{const exam=examinations.filter(e=>e.moduleId===x.m.id).sort((a,b)=>a.date.localeCompare(b.date))[0];const days=exam?dateDays(exam.date,now):null;const deficit=Math.max(0,x.goal-x.w);return {...x,exam,days,deficit,score:(days===null?0:days<=7?5:days<=21?3:1)+(x.goal?Math.min(3,deficit/x.goal*3):0)};}).sort((a,b)=>b.score-a.score);
  return {now,total,prev,by,ranked,examinations,calendar:upcoming().slice(0,8),credits,termEcts,week};
 }
 function render(){
  if(!el('copilotCard'))return;
  if(document.body.classList.contains('st-auth-locked'))return;
  const d=insight(),first=d.ranked[0],next=d.examinations[0];
  const examHtml=next?'<b>'+safe(next.title)+'</b> · '+dateDays(next.date,d.now)+' Tage ('+safe(next.date)+')':'Keine bevorstehende Prüfung mit Datum eingetragen';
  el('copilotCard').innerHTML='<div class="title-row"><h2>✦ Lern-Copilot</h2><button class="btn-ghost btn-small" type="button" data-go="copilot">Details ›</button></div>'+
  '<p class="sub">Dein aktueller Studienüberblick – lokal berechnet</p>'+
  '<div class="cp-metrics"><div><small>Diese Woche</small><strong>'+fmtH(d.total)+'</strong></div><div><small>ECTS im Semester</small><strong>'+(d.termEcts===undefined?'–':safe(d.termEcts))+'</strong></div></div>'+
  '<p><strong>Prüfung:</strong> '+examHtml+'</p>'+
  '<p><strong>Lernidee:</strong> '+(first?safe(first.m.name)+' – '+(first.deficit>0?'noch '+fmtH(first.deficit)+' bis zum Wochenziel':'Wiederholung einplanen'):'Noch keine Module vorhanden')+'</p>';
  el('cpStats').innerHTML='<div class="cp-metrics"><div><small>Aktuelle Woche</small><strong>'+fmtH(d.total)+'</strong></div><div><small>Vorwoche</small><strong>'+fmtH(d.prev)+'</strong></div><div><small>ECTS im Semester</small><strong>'+(d.termEcts===undefined?'–':safe(d.termEcts))+'</strong></div></div>';
  el('cpDates').innerHTML=d.calendar.length?d.calendar.map(e=>'<div class="cp-row"><span>'+safe(e.kind)+': <b>'+safe(e.title)+'</b></span><span>'+safe(e.date)+(e.time?' · '+safe(e.time):'')+'</span></div>').join(''):'<p class="sub">Noch keine bevorstehenden Termine hinterlegt.</p>';
  el('cpReview').innerHTML='<p>Diese Woche: <b>'+fmtH(d.total)+'</b> · Vorwoche: <b>'+fmtH(d.prev)+'</b> ('+(d.total>=d.prev?'+':'−')+fmtH(Math.abs(d.total-d.prev))+').</p>'+
   (d.by.length?'<p>Nach Modul: '+d.by.map(x=>safe(x.m.name)+' '+fmtH(x.w)).join(' · ')+'</p>':'<p>Keine Module vorhanden.</p>');
  el('cpRecommendations').innerHTML=d.ranked.length?d.ranked.slice(0,5).map(x=>'<div class="cp-row"><div><b>'+safe(x.m.name)+'</b><p class="sub">'+(x.exam?'Klausur in '+x.days+' Tagen · ':'')+'Woche '+fmtH(x.w)+' / Ziel '+fmtH(x.goal)+'</p></div><button class="secondary cp-start" data-module="'+safe(x.m.id)+'" type="button">Im Timer wählen</button></div>').join(''):'<p class="sub">Erstelle zuerst ein Modul mit einem Wochenziel.</p>';
  el('cpCredits').textContent=d.credits?'Insgesamt erworbene ECTS: '+d.credits.earned+' · Aktuelles Semester: '+(d.termEcts??'nicht verfügbar')+'. Es zählen nur als bestanden verbuchte Leistungen.':'ECTS-Anzeige derzeit nicht verfügbar.';
 }
 document.addEventListener('click',e=>{const btn=e.target.closest('.cp-start');if(!btn)return;const select=el('timerModule');if(select&&[...select.options].some(x=>x.value===btn.dataset.module)){select.value=btn.dataset.module;select.dispatchEvent(new Event('change'));showTab('dashboard');select.focus();}});
 // Bind to the existing renderer so import, timer changes, cloud loads and semester changes refresh the copilot.
 if(typeof render==='function'){} // Keep this module independent of renderer variable names.
 const previousRender=window.render;
 // Global classic-script function declaration is available through window.render.
 if(typeof previousRender==='function')window.render=function(){previousRender();render()};
 document.querySelector('[data-tab="copilot"]')?.addEventListener('click',render);
 document.addEventListener('click',e=>{if(e.target.closest('[data-go="copilot"]'))requestAnimationFrame(render)});
 window.addEventListener('focus',render);document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
 el('cpRefresh')?.addEventListener('click',render);
 el('cpPdfInput')?.addEventListener('change',async event=>{
  const file=event.target.files?.[0],status=el('cpPdfStatus');if(!file)return;
  if(file.type!=='application/pdf'&&!file.name.toLowerCase().endsWith('.pdf')){status.textContent='Bitte eine PDF auswählen.';return}
  if(file.size>30*1024*1024){status.textContent='PDF ist für die lokale Analyse zu groß (max. 30 MB).';return}
  status.textContent='PDF-Text wird lokal ausgelesen …';
  try{
   const pdfjs=await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
   pdfjs.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
   const bytes=new Uint8Array(await file.arrayBuffer()),pdf=await pdfjs.getDocument({data:bytes}).promise;
   let extracted='',pages=0;for(let i=1;i<=Math.min(pdf.numPages,30);i++){const p=await pdf.getPage(i);const c=await p.getTextContent();const lines=c.items.map(x=>x.str||'').join(' ');extracted+='\n[Seite '+i+'] '+lines;pages++}
   const text=extracted.trim().slice(0,18000);
   el('cpPdfText').value=text;status.textContent=text?'Text aus '+pages+' Seiten extrahiert. Die ersten 18.000 Zeichen können für ChatGPT übernommen werden.':'Kein extrahierbarer Text. Bei gescannten PDFs ist OCR erforderlich.';
   await pdf.destroy();
  }catch(error){status.textContent='PDF konnte nicht gelesen werden: '+error.message}
 });
 el('cpCopyQuestions')?.addEventListener('click',async()=>{
  const text=el('cpPdfText').value.trim(),kind=el('cpPdfMode').value;
  if(!text){el('cpPdfStatus').textContent='Bitte zuerst eine PDF mit auslesbarem Text auswählen.';return}
  const instruction=kind==='quiz'?'Erstelle 8 anspruchsvolle Übungsfragen mit Musterlösungen und Erklärungen. Verwende ausschließlich den bereitgestellten Inhalt; markiere Unsicherheiten.':'Fasse die zentralen Konzepte, Definitionen und Formeln lernorientiert zusammen; gib Seitenhinweise an, soweit vorhanden.';
  const value='Ich lerne Maschinenbau. '+instruction+'\n\nSkript-Auszug:\n'+text;
  try{await navigator.clipboard.writeText(value);el('cpPdfStatus').textContent='Aufgabe und Skriptauszug kopiert. Jetzt in ChatGPT einfügen.';}catch{el('cpPdfText').value=value;el('cpPdfText').select();el('cpPdfStatus').textContent='Automatisches Kopieren nicht möglich – Text ist markiert.'}
 });
 render();
})();
