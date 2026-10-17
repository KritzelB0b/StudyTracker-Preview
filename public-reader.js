/* StudyTracker Preview 3.3: server-projected public data + standalone handbook; never read private account data in visitor rendering. */
(()=>{
 'use strict';
 const API='https://studytracker-api-production-7134.up.railway.app';
 const $=id=>document.getElementById(id);
 const esc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const num=x=>Number(x||0).toLocaleString('de-DE',{maximumFractionDigits:1});
 const hr=x=>num(x)+' h';
 const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 const parse=d=>new Date(d+'T12:00:00');
 const date=d=>parse(d).toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit'});
 const palette=['#e97812','#dba563','#87b4a1','#b09dbe','#d59a89','#9bb7bf'];
 const map={dashboard:'dashboard',topics:'modules',semester:'calendar',planner:'calendar',history:'cockpit'};
 const cats={exam:'Prüfung',lecture:'Vorlesung',exercise:'Übung',tutorial:'Tutorium',practical:'Praktikum',coaching:'Coaching',task:'Aufgabe',study:'Lernblock'};
 let data=null,active='dashboard',selected=iso(new Date()),selectedModule='',error='';
 const TERMS=[
 {id:'ws-2026',label:'Wintersemester 2026/27',start:'2026-10-01',end:'2027-03-31'},
 {id:'ss-2027',label:'Sommersemester 2027',start:'2027-04-01',end:'2027-09-30'},
 {id:'ws-2027',label:'Wintersemester 2027/28',start:'2027-10-01',end:'2028-03-31'},
 {id:'ss-2028',label:'Sommersemester 2028',start:'2028-04-01',end:'2028-09-30'},
 {id:'ws-2028',label:'Wintersemester 2028/29',start:'2028-10-01',end:'2029-03-31'},
 {id:'ss-2029',label:'Sommersemester 2029',start:'2029-04-01',end:'2029-09-30'},
 {id:'ws-2029',label:'Wintersemester 2029/30',start:'2029-10-01',end:'2030-03-31'}
 ];
 const firstTerm='ws-2026';
 let termId=firstTerm, catalogFilter='',monthOffset=0,weekOffset=0;
 const term=()=>TERMS.find(t=>t.id===termId)||TERMS[0];
 const termNumber=()=>TERMS.findIndex(t=>t.id===termId)+1;
 const isLegacy=()=>termId===firstTerm;
 const canShow=field=>!!data?.fields?.includes(field);
 const publicHandbook=()=>Array.isArray(window.studyHandbookCatalog?.modules)?window.studyHandbookCatalog.modules:[];
 const catalog=()=>publicHandbook().filter(m=>m.termNumbers.includes(termNumber()));
 function termPicker(){return '<div class="st-public-term"><label for="publicSemester">Semester</label><select id="publicSemester" aria-label="Semester im Lesemodus auswählen">'+TERMS.map(t=>'<option value="'+esc(t.id)+'" '+(t.id===termId?'selected':'')+'>'+esc(t.label)+'</option>').join('')+'</select><span class="sub small">Öffentlicher Überblick aus Modulhandbuch Version 8</span></div>'}
 function info(text){return '<p class="st-public-info">'+esc(text)+'</p>'}
 function handbook(){
  const ms=catalog(),choices=ms.filter(m=>m.type==='Wahlpflicht'),regular=ms.filter(m=>m.type==='Pflicht');
  const opts='<option value="">Alle Module ('+ms.length+')</option>'+ms.map(m=>'<option value="'+esc(m.code)+'" '+(catalogFilter===m.code?'selected':'')+'>'+esc(m.name)+'</option>').join('');
  function part(items,title){const show=items.filter(m=>!catalogFilter||m.code===catalogFilter);
   return '<section class="st-public-handbook-section"><h4>'+title+' ('+show.length+')</h4>'+(
   show.length?show.map(m=>'<div class="st-public-handbook-row"><strong>'+esc(m.name)+'</strong><span class="sub small">Code '+esc(m.code)+' · '+m.ects+' ECTS · '+m.total+' h gesamt · '+m.presence+' h Präsenz · '+m.self+' h Selbststudium · laut Handbuch: '+esc(m.semesterText)+'</span></div>').join(''):'<p class="sub small">Keine passenden Module.</p>')+'</section>';
  }
  return '<section class="card st-public-handbook"><div class="title-row"><div><h2>Modulhandbuch · '+esc(term().label)+'</h2><p class="sub">Allgemeiner Modulkatalog – unabhängig von privaten Lerndaten. Mehrfach aufgeführte Semester bedeuten alternative Belegungszeiträume.</p></div><span class="pill">Nur lesen</span></div><div class="field"><label for="publicHandbookFilter">Modul filtern</label><select id="publicHandbookFilter">'+opts+'</select></div>'+part(regular,'Pflichtmodule')+part(choices,'Wahlpflichtangebote')+'<p class="sub small">Wahlpflichtmodule sind Angebote, nicht automatisch Teil deines individuellen Studienplans. Echte Stundenplan- und Prüfungstermine sind im Modulhandbuch nicht enthalten.</p></section>';
 }
 function setTerm(id){if(!TERMS.some(t=>t.id===id))return;termId=id;monthOffset=0;weekOffset=0;selected=(iso(new Date())>=term().start&&iso(new Date())<=term().end)?iso(new Date()):term().start;selectedModule='';catalogFilter='';render()}

 function events(d){
  if(!isLegacy())return [];
  const result=[];
  if(canShow('calendar')){
   for(const e of data?.events||[])if(e.date===d)result.push({type:kind(e.kind+' '+e.title),title:e.title,start:e.start,end:e.end});
   for(const e of data?.study_blocks||[])if(e.date===d)result.push({type:'study',title:e.title,start:'',end:''});
  }
  for(const [field,type] of [['tasks','task'],['exams','exam']])if(canShow(field))
   for(const e of data?.[field]||[])if(e.date===d)result.push({type,title:e.title,start:'',end:''});
  return result;
 }
 function kind(s){s=String(s||'').toLowerCase();
  const valid=['exam','lecture','exercise','tutorial','practical','coaching','task','study'];
  for(const item of valid)if(s.split(/\W+/).includes(item))return item;
  if(/prüfung|klausur|exam/.test(s))return 'exam';
  if(/übung|uebung/.test(s))return 'exercise';
  if(/tutor/.test(s))return 'tutorial';
  if(/praktik|labor/.test(s))return 'practical';
  if(/coach/.test(s))return 'coaching';
  if(/lernblock|selbststudium/.test(s))return 'study';
  return 'lecture';
 }
 function chips(items,compressed=false){return items.map(x=>`<span class="${compressed?'sem-tag':'event-block'} ev-${x.type}">${compressed?esc(cats[x.type]||x.type):esc((x.start?x.start+' ':'')+x.title)}</span>`).join('')}

 const chartPalette=['#ee7d22','#eab264','#80b7a1','#cfa18c','#b9a3d1','#91b2c8','#e2c878','#b1aba2'];
 function safeHours(value){const n=Number(value);return Number.isFinite(n)?Math.max(0,n):0}
 function halfRing(){
  const logged=Array.isArray(data?.by_module)?data.by_module:[];
  const pieces=logged.map(item=>({name:String(item.name||'Ohne Modul'),hours:safeHours(item.hours)})).filter(item=>item.hours>0).sort((a,b)=>b.hours-a.hours);
  const accounted=pieces.reduce((a,b)=>a+b.hours,0),all=safeHours(data?.summary?.hours);
  if(all>accounted+0.05)pieces.push({name:'Nicht zugeordnet',hours:Math.max(0,all-accounted)});
  const total=pieces.reduce((a,b)=>a+b.hours,0);
  const head='<div class="st-history-viz-head"><div><h3>Lernzeiten nach Fach</h3><p class="sub small">Verteilung der freigegebenen Lernzeiten · gesamte Zeit</p></div><span class="st-history-total">'+hr(total)+' gesamt</span></div>';
  if(total===0)return '<div class="st-history-viz-card st-public-semiring">'+head+'<p class="empty">Noch keine Lernzeiten vorhanden.</p></div>';
  const xy=angle=>[(160+126*Math.cos(angle)).toFixed(2),(160-126*Math.sin(angle)).toFixed(2)];
  let used=0,arcs='';
  for(const [i,item] of pieces.entries()){
   const fraction=item.hours/total;
   const from=Math.PI*(1-used),to=Math.PI*(1-used-fraction);
   used+=fraction;
   const gap=Math.min(.008,(from-to)/9),a=from-gap,b=to+gap;
   if(a<=b)continue;
   const p=xy(a),q=xy(b);
   const path='M '+p.join(' ')+' A 126 126 0 0 1 '+q.join(' ');
   arcs+='<path d="'+path+'" fill="none" stroke="'+chartPalette[i%chartPalette.length]+'" stroke-width="27"><title>'+esc(item.name)+': '+hr(item.hours)+' ('+num(fraction*100)+' %)</title></path>';
  }
  const legend=pieces.map((item,i)=>'<div class="st-history-legend-row"><span class="st-history-legend-dot" style="background:'+chartPalette[i%chartPalette.length]+'"></span><span>'+esc(item.name)+'</span><strong>'+hr(item.hours)+' · '+num(item.hours/total*100)+' %</strong></div>').join('');
  const svg='<svg viewBox="0 0 320 180" role="img" aria-label="Lernzeiten nach Fach: '+esc(pieces.map(item=>item.name+' '+hr(item.hours)).join(', '))+'"><path d="M 34 160 A 126 126 0 0 1 286 160" fill="none" stroke="#44403b" stroke-width="27"/>'+arcs+'<text x="160" y="124" text-anchor="middle" fill="#f4f0eb" font-size="31" font-weight="750">'+hr(total)+'</text><text x="160" y="147" text-anchor="middle" fill="#bbb2a8" font-size="12">Lernzeit gesamt</text></svg>';
  return '<div class="st-history-viz-card st-public-semiring">'+head+'<div class="st-history-viz-layout">'+svg+'<div class="st-history-legend">'+legend+'</div></div></div>';
 }
 function stats(){const a=data?.summary||{},by=data?.by_day||[],today=iso(new Date()),last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return {date:iso(d),label:d.toLocaleDateString('de-DE',{weekday:'short'})}}),vals=last7.map(x=>Number(by.find(y=>y.date===x.date)?.hours||0)),weekHours=(()=>{const monday=new Date();monday.setDate(monday.getDate()-(monday.getDay()+6)%7);const start=iso(monday);return by.filter(x=>x.date>=start&&x.date<=today).reduce((total,x)=>total+safeHours(x.hours),0)})(),max=Math.max(1,...vals);let mods=data?.by_module||[],meta=data?.modules||[],hand=data?.workload||[];
 const goalRows=mods.map((m,i)=>{const work=hand.find(x=>x.moduleId===m.moduleId),goal=Number(work?.self??meta.find(x=>x.id===m.moduleId)?.self??0),color=palette[i%palette.length],pct=goal?Math.min(100,Math.max(0,Number(m.hours)/goal*100)):0;return `<div class="goal"><div class="goal-head"><span class="goal-title"><i class="dot" style="background:${color}"></i> ${esc(m.name)}</span><strong>${hr(m.hours)} / ${goal?hr(goal):'–'}</strong></div><div class="progress" role="progressbar" aria-label="${esc(m.name)} Lernfortschritt" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><div class="reader-goal-fill" style="width:${pct}%;background-color:${color};"></div></div></div>`}).join('');
 const bars=vals.map((h,i)=>`<div class="chart-item"><div class="chart-bar-container"><div class="chart-bar" style="height:${Math.round(h/max*100)}%"></div></div>${esc(last7[i].label)}</div>`).join('');

 const moduleRows=mods.length?mods.map((m,i)=>'<div class="module-row"><span class="module-name"><span class="dot" style="background:'+palette[i%palette.length]+'"></span>'+esc(m.name)+'</span><strong>'+hr(safeHours(m.hours))+'</strong></div>').join(''):'<div class="empty">Keine freigegebenen Module.</div>';
 const recentDays=by.filter(x=>safeHours(x.hours)>0).slice(-8).reverse();
 const recentRows=recentDays.length?recentDays.map(x=>'<div class="entry"><strong>'+esc(date(x.date))+'</strong><strong>'+hr(safeHours(x.hours))+'</strong></div>').join(''):'<div class="empty">Noch keine Lerntage vorhanden.</div>';
 const hasGoals=goalRows&&(hand.length>0||meta.some(m=>safeHours(m.self)>0));
 const objective=hasGoals?goalRows:'<p class="sub">Keine Wochenziele für die öffentliche Ansicht verfügbar.</p>';
 const cockpit='<div class="statsmini"><div><span class="sub">Lerneinheiten</span><strong>'+Number(a.sessions||0)+'</strong></div><div><span class="sub">Aktive Lerntage</span><strong>'+by.filter(x=>safeHours(x.hours)>0).length+'</strong></div><div><span class="sub">Öffentliche Ansicht</span><strong>Lesemodus</strong></div></div>';
 return '<div class="stack st-public-dashboard">'+info('Diese freigegebene Gesamtstatistik wird von der aktuellen öffentlichen API noch nicht nach Semestern getrennt. Die Semester-Auswahl findest du unter Module & Themen oder Studienplan.')+'<div class="grid3 st-public-metrics">'+
 '<div class="metric"><div class="sub">Heute gelernt</div><div class="num">'+hr(safeHours(by.find(x=>x.date===today)?.hours))+'</div><div class="small muted">Erfasste Lernzeit</div></div>'+
 '<div class="metric"><div class="sub">Diese Woche</div><div class="num">'+hr(weekHours)+'</div><div class="small muted">Montag bis Sonntag</div></div>'+
 '<div class="metric"><div class="sub">Gesamte Lernzeit</div><div class="num">'+hr(a.hours)+'</div><div class="small muted">'+Number(a.sessions||0)+' Lerneinheiten</div></div></div>'+
 '<div class="main"><div class="stack"><section class="card st-public-chart-card">'+halfRing()+'</section>'+
 '<section class="card"><div class="title-row"><div><h2>Lernstunden der letzten 7 Tage</h2><div class="sub">Nur tatsächlich erfasste Lernzeit</div></div></div><div class="chart">'+bars+'</div></section>'+
 '<section class="card"><h2>Letzte Lerntage</h2>'+recentRows+'</section></div>'+
 '<div class="stack"><section class="card"><div class="title-row"><div><h2>Modulübersicht</h2><div class="sub">Gesamte Lernzeit je Fach</div></div><span class="pill">Lesemodus</span></div>'+moduleRows+'</section>'+
 '<section class="card"><div class="title-row"><div><h2>Wochenziele & Lernfortschritt</h2><div class="sub">Nur freigegebene Ziele</div></div></div>'+objective+'</section>'+
 '<section class="card"><h2>Dein Lerncockpit</h2>'+cockpit+'</section></div></div></div>';
}
 function modules(){
 const ms=isLegacy()&&canShow('modules')?(data.modules||[]):[];
 if(!ms.some(m=>m.id===selectedModule))selectedModule=ms[0]?.id||'';
 const m=ms.find(x=>x.id===selectedModule),ts=(data?.topics||[]).filter(t=>t.moduleId===selectedModule);
 const work=(data?.workload||[]).find(x=>x.moduleId===m?.id),hours=(data?.by_module||[]).find(x=>x.moduleId===m?.id)?.hours||0;
 const selector=ms.length?'<div class="field"><label for="publicModule">Freigegebenes Modul auswählen</label><select id="publicModule">'+ms.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===selectedModule?'selected':'')+'>'+esc(x.name)+'</option>').join('')+'</select></div>':'';
 const details=m?'<div class="statsmini"><div><div class="sub">ECTS</div><strong>'+esc(work?.ects??m.ects??'–')+'</strong></div><div><div class="sub">Selbststudium-Soll</div><strong>'+(work?.self??m?.self)+'</strong> h</div><div><div class="sub">Freigegeben gelernt</div><strong>'+hr(hours)+'</strong></div></div><h3>Themen & Wissensstand</h3><div class="scroll-section">'+(ts.map(t=>'<div class="topic '+(t.parentId?'topic-indent':'')+'"><div class="topic-top"><strong>'+esc(t.parentId?'↳ '+t.name:t.name)+'</strong><span class="chip">'+esc(t.mastery)+'/5</span></div></div>').join('')||'<p class="sub">Keine Themen freigegeben.</p>')+'</div>':'';
 const note=!isLegacy()?'Für dieses spätere Semester veröffentlicht die aktuelle öffentliche API noch keine individuellen Themen oder Lernstände. Der Modulkatalog unten ist trotzdem verfügbar.':!canShow('modules')?'Individuelle Themen und Wissensstände sind nicht öffentlich freigegeben.':'Freigegebene Module und Themen, ohne Bearbeitungsmöglichkeit.';
 return '<div class="stack">'+termPicker()+'<section class="card"><div class="title-row"><h2>Themen & Wissensstand</h2><span class="pill">Lesemodus</span></div>'+info(note)+selector+details+'</section>'+handbook()+'</div>';
 }
 function workload(){
  if(!isLegacy())return '';
  const m=canShow('calendar')||canShow('cockpit')?(data?.workload||[]):[];
  if(!m.length)return '';
  const logs=canShow('cockpit')||canShow('dashboard')?data?.by_module||[]:[];
  return '<section class="card"><h2>Freigegebener Soll-Ist-Workload</h2><p class="sub">Die öffentliche API liefert derzeit nur den bisherigen Studienplan. Zukünftige Semester werden ausschließlich als Handbuch-Katalog angezeigt.</p><div class="st-public-table"><table class="sem-table"><thead><tr><th>Modul</th><th>ECTS</th><th>Gesamt</th><th>Präsenz</th><th>Selbststudium</th><th>Ist</th></tr></thead><tbody>'+m.map(x=>{
   const h=logs.find(l=>l.moduleId===x.moduleId)?.hours;
   return '<tr><td>'+esc(x.name)+'</td><td>'+esc(x.ects??'–')+'</td><td>'+hr(x.total)+'</td><td>'+hr(x.presence)+'</td><td>'+hr(x.self)+'</td><td>'+(h===undefined?'Nicht freigegeben':hr(h))+'</td></tr>';
  }).join('')+'</tbody></table></div></section>';
 }
 function calendar(){
  const termInfo=term(),base=parse(termInfo.start);
  base.setMonth(base.getMonth()+monthOffset,1);
  const monthStart=new Date(base),first=new Date(base);first.setDate(1-(first.getDay()+6)%7);
  const days=Array.from({length:42},(_,i)=>{const d=new Date(first);d.setDate(first.getDate()+i);return d});
  if(selected<termInfo.start||selected>termInfo.end)selected=termInfo.start;
  const dayItems=events(selected);
  const legend=Object.entries(cats).map(([k,v])=>'<span class="event-pill ev-'+k+'">'+v+'</span>').join('');
  const prevDisabled=monthOffset===0?'disabled':'',nextDisabled=monthOffset>=5?'disabled':'';
  const calendarNote=isLegacy()&&canShow('calendar')?'Hier erscheinen nur Termine, die für die öffentliche Ansicht freigegeben wurden.':'Für das gewählte Semester ist kein individueller Stundenplan öffentlich freigegeben. Das Modulhandbuch darunter ist unabhängig davon lesbar.';
  const dateCells=days.map(d=>{
   const key=iso(d),within=key>=termInfo.start&&key<=termInfo.end,month=d.getMonth()===base.getMonth();
   const ev=within?events(key):[],types=[...new Set(ev.map(x=>x.type))];
   const dots=types.map(k=>'<span class="st-public-event-dot ev-'+k+'" aria-hidden="true"></span>').join('');
   const summary=ev.length?ev.map(x=>cats[x.type]||x.type).join(', '):'Keine freigegebenen Termine';
   return '<button type="button" class="reader-day '+(!month?'offmonth ':'')+(key===selected?'active ':'')+(!within?'outterm':'')+'" data-select-day="'+key+'" '+(!within?'disabled':'')+' aria-label="'+esc(date(key)+': '+summary)+'"><strong>'+d.getDate()+'</strong><span class="st-public-dot-row" aria-hidden="true">'+dots+'</span></button>';
  }).join('');
  const details=dayItems.map(e=>'<div class="sem-event ev-'+e.type+'"><span class="event-pill ev-'+e.type+'">'+esc(cats[e.type]||'Termin')+'</span><b>'+esc((e.start?e.start+'–'+e.end+' · ':'')+e.title)+'</b></div>').join('')||'<p class="sub">Keine öffentlich freigegebenen Termine für diesen Tag.</p>';
  return '<div class="stack">'+termPicker()+workload()+'<section class="card st-public-calendar"><div class="st-public-cal-head"><h2>Kalender</h2><div class="st-public-month-nav"><button type="button" class="secondary" data-cal-prev aria-label="Vorheriger Monat" '+prevDisabled+'>←</button><strong>'+base.toLocaleDateString('de-DE',{month:'long',year:'numeric'})+'</strong><button type="button" class="secondary" data-cal-next aria-label="Nächster Monat" '+nextDisabled+'>→</button></div></div>'+info(calendarNote)+'<div class="filter-line" aria-label="Farblegende der Veranstaltungstypen">'+legend+'</div><div class="sem-calendar st-public-cal-grid">'+dateCells+'</div><h3>'+esc(parse(selected).toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long',year:'numeric'}))+'</h3>'+details+'</section>'+handbook()+'</div>';
 }
 function planner(){
  const t=term(),anchor=iso(new Date()),d=parse(anchor>=t.start&&anchor<=t.end?anchor:t.start);
  d.setDate(d.getDate()-(d.getDay()+6)%7+weekOffset*7);
  const dayObjs=Array.from({length:7},(_,i)=>{const x=new Date(d);x.setDate(d.getDate()+i);return x});
  const days=dayObjs.map(iso),prevDisabled=days[0]<=t.start?'disabled':'',nextDisabled=days[6]>=t.end?'disabled':'';
  const cells=days.map(day=>{
    const within=day>=t.start&&day<=t.end,ev=within?events(day):[];
    return '<div class="planday '+(within?'':'st-outterm')+'"><h3>'+date(day)+'</h3>'+ev.map(e=>'<span class="event-block ev-'+e.type+'"><small>'+esc(cats[e.type]||'Termin')+'</small>'+esc((e.start?e.start+'–'+e.end+' · ':'')+e.title)+'</span>').join('')+'</div>';
  }).join('');
  const tasks=isLegacy()&&canShow('tasks')?(data?.tasks||[]):[],exams=isLegacy()&&canShow('exams')?(data?.exams||[]):[];
  const taskRows=(items,empty)=>items.length?items.map(e=>'<div class="taskrow">'+esc(e.title)+' <span class="chip">'+esc(e.date)+'</span></div>').join(''):'<p class="sub">'+empty+'</p>';
  return '<div class="stack">'+termPicker()+'<section class="card"><div class="st-public-cal-head"><h2>Wochenplan</h2><div class="st-public-month-nav"><button type="button" class="secondary" data-week-prev '+prevDisabled+'>←</button><strong>'+date(days[0])+' – '+date(days[6])+'</strong><button type="button" class="secondary" data-week-next '+nextDisabled+'>→</button></div></div>'+info('Termine erscheinen nur, wenn sie ausdrücklich freigegeben wurden. Kein Bearbeiten im Lesemodus.')+'<div class="st-public-week-scroll"><div class="planweek">'+cells+'</div></div></section><div class="list-grid"><section class="card"><h2>Aufgaben & Abgaben</h2>'+taskRows(tasks,'Keine freigegebenen Aufgaben.')+'</section><section class="card"><h2>Prüfungsvorbereitung</h2>'+taskRows(exams,'Keine freigegebenen Prüfungen.')+'</section></div>'+handbook()+'</div>';
 }
 function history(){
 const days=Array.isArray(data?.by_day)?data.by_day:[];
 const rows=days.length?days.slice().reverse().map(d=>'<div class="entry"><strong>'+esc(d.date)+'</strong><strong>'+hr(safeHours(d.hours))+'</strong></div>').join(''):'<p class="sub">Noch keine Lerntage vorhanden.</p>';
 const summary='<div class="statsmini"><div><span class="sub">Gesamte Lernzeit</span><strong>'+hr(data?.summary?.hours)+'</strong></div><div><span class="sub">Lerneinheiten</span><strong>'+Number(data?.summary?.sessions||0)+'</strong></div><div><span class="sub">Aktive Lerntage</span><strong>'+days.filter(x=>safeHours(x.hours)>0).length+'</strong></div></div>';
 return '<div class="stack st-public-history">'+info('Das öffentliche Lernprotokoll zeigt den freigegebenen Gesamtstand, nicht einzelne Semester.')+'<section class="card st-public-chart-card">'+halfRing()+'</section>'+
 '<div class="st-public-history-columns"><section class="card"><h2>Lerncopilot</h2>'+summary+'</section>'+
 '<section class="card"><h2>Lerntage</h2><div class="scroll-box">'+rows+'</div></section></div>'+workload()+'</div>';
}
 function viewAllowed(tab){
  if(tab==='settings')return true;
  if(['topics','semester','planner'].includes(tab))return true; // Static public handbook.
  if(error)return false;
  return !!data?.fields?.includes(map[tab]);
 }
 function render(){
  if(!document.body.classList.contains('st-auth-locked'))return;
  if(!viewAllowed(active))active=['semester','topics','planner','dashboard','history'].find(viewAllowed)||'settings';
  const el=$('publicView');
  if(active==='settings'){
   document.body.classList.remove('reader-browsing');el.hidden=true;
   document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('hidden',p.id!=='settings'));
   for(const b of document.querySelectorAll('.nav .tab')){
    b.hidden=b.dataset.tab==='practice'||b.dataset.tab==='files'||!viewAllowed(b.dataset.tab);
    b.classList.toggle('active',b.dataset.tab==='settings');
   }
   return;
  }
  document.body.classList.add('reader-browsing');
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.add('hidden'));
  el.hidden=false;
  const pages={dashboard:stats,topics:modules,semester:calendar,planner,history};
  const banner=error?'<section class="st-public-alert" role="status">Die private öffentliche Freigabe ist zurzeit nicht verfügbar: '+esc(error)+'. Der Modulhandbuch-Katalog bleibt unabhängig davon zugänglich. <button type="button" class="secondary" id="readerRetry">Erneut versuchen</button></section>':'';
  el.innerHTML=banner+(pages[active]?.()||'');
  for(const b of document.querySelectorAll('.nav .tab')){
   b.hidden=b.dataset.tab==='practice'||b.dataset.tab==='files'||!viewAllowed(b.dataset.tab);
   b.classList.toggle('active',b.dataset.tab===active);
  }
  el.querySelector('#readerRetry')?.addEventListener('click',load);
  el.querySelector('#publicSemester')?.addEventListener('change',e=>setTerm(e.target.value));
  el.querySelector('#publicModule')?.addEventListener('change',e=>{selectedModule=e.target.value;render()});
  el.querySelector('#publicHandbookFilter')?.addEventListener('change',e=>{catalogFilter=e.target.value;render()});
  el.querySelector('[data-cal-prev]')?.addEventListener('click',()=>{if(monthOffset>0){monthOffset--;selected=iso(new Date(Number(term().start.slice(0,4)),Number(term().start.slice(5,7))-1+monthOffset,1));render()}});
  el.querySelector('[data-cal-next]')?.addEventListener('click',()=>{if(monthOffset<5){monthOffset++;selected=iso(new Date(Number(term().start.slice(0,4)),Number(term().start.slice(5,7))-1+monthOffset,1));render()}});
  el.querySelectorAll('[data-select-day]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.selectDay;render()}));
  el.querySelector('[data-week-prev]')?.addEventListener('click',()=>{weekOffset--;render()});
  el.querySelector('[data-week-next]')?.addEventListener('click',()=>{weekOffset++;render()});
 }
 async function load(){
  try{
   const resp=await fetch(API+'/public/view',{cache:'no-store'});
   if(!resp.ok)throw Error(resp.status===404?'nicht aktiviert':'Serverantwort '+resp.status);
   const body=await resp.json();
   if(!body||!Array.isArray(body.fields))throw Error('Unerwartetes öffentliches Datenformat');
   data=body;error='';
  }catch(e){data={fields:[]};error=e.message}
  render();
 }
 function open(){render()}
 function close(){
  document.body.classList.remove('reader-browsing');$('publicView').hidden=true;
  for(const b of document.querySelectorAll('.nav .tab'))b.hidden=false;
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('hidden'));
 }
 function settings(){active='settings';render()}
 function tab(t){if(!viewAllowed(t))return;active=t;render()}
 window.studyReader={open,close,settings,tab};
 load();
})();

