'use strict';
/* Source: THM/ZDH Modulhandbuch Ingenieurwesen Maschinenbau, Version 8,
   Prüfungsordnung 2016, Änderungsfassung 11.12.2024.
   Semesterzuordnungen folgen den fachrichtungsspezifischen offiziellen
   Studienverlaufsplänen von StudiumPlus, nicht den allgemeinen Angebotsangaben
   einzelner Modulbeschreibungen. Wahlmodule bleiben freiwillig. */
(function(){
const CATALOG=[{"code":"6002","name":"Allgemeine BWL und Recht für Ingenieure","semesterText":"7. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[7]},{"code":"4005","name":"Automatisierungs- und Regelungstechnik","semesterText":"4. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[4]},{"code":"7011","name":"Bachelor-Kolloquium","semesterText":"7. Semester","ects":3,"total":75,"presence":5,"self":70,"type":"Pflicht","termNumbers":[7]},{"code":"7010","name":"Bachelor-Thesis","semesterText":"7. Semester","ects":12,"total":300,"presence":10,"self":290,"type":"Pflicht","termNumbers":[7]},{"code":"8002","name":"Betriebsethik","semesterText":"3. Semester","ects":4,"total":100,"presence":50,"self":50,"type":"Pflicht","termNumbers":[3]},{"code":"8000","name":"Coaching-Selbstkompetenz","semesterText":"1. + 2. Semester","ects":4,"total":100,"presence":50,"self":50,"type":"Pflicht","termNumbers":[1,2]},{"code":"3003","name":"Elektrotechnik für Maschinenbau","semesterText":"2. / 7. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[2,7]},{"code":"3008","name":"Englisch","semesterText":"4. Semester (Blockmodul)","ects":4,"total":100,"presence":50,"self":50,"type":"Pflicht","termNumbers":[4]},{"code":"4003","name":"Fluidmechanik","semesterText":"4. Semester","ects":6,"total":150,"presence":50,"self":100,"type":"Pflicht","termNumbers":[4]},{"code":"4006","name":"Hygiene Design","semesterText":"4. Semester","ects":6,"total":150,"presence":50,"self":100,"type":"Pflicht","termNumbers":[4]},{"code":"4008","name":"Hygienische Prozesstechnik und Gebäudeausstattung","semesterText":"3. Semester","ects":7,"total":175,"presence":74,"self":101,"type":"Pflicht","termNumbers":[3]},{"code":"3002","name":"Informatik 1","semesterText":"7. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[7]},{"code":"3009","name":"Kältetechnik 1","semesterText":"3. Semester","ects":6,"total":150,"presence":74,"self":76,"type":"Pflicht","termNumbers":[3]},{"code":"6005","name":"Klimatechnik","semesterText":"7. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[7]},{"code":"2007","name":"Konstruktion / CAD","semesterText":"1. Semester","ects":6,"total":150,"presence":74,"self":76,"type":"Pflicht","termNumbers":[1]},{"code":"2004","name":"Maschinenelemente 1","semesterText":"3. Semester","ects":6,"total":150,"presence":74,"self":76,"type":"Pflicht","termNumbers":[3]},{"code":"3004","name":"Maschinenelemente 2","semesterText":"4. Semester","ects":7,"total":175,"presence":74,"self":101,"type":"Pflicht","termNumbers":[4]},{"code":"4007","name":"Maschinensicherheit","semesterText":"3. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[3]},{"code":"1001","name":"Mathematik für Ingenieure 1","semesterText":"1. Semester","ects":6,"total":150,"presence":74,"self":76,"type":"Pflicht","termNumbers":[1]},{"code":"2001","name":"Mathematik für Ingenieure 2","semesterText":"2. Semester","ects":6,"total":150,"presence":74,"self":76,"type":"Pflicht","termNumbers":[2]},{"code":"1002","name":"Naturwissenschaften 1","semesterText":"1. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[1]},{"code":"2002","name":"Naturwissenschaften 2","semesterText":"2. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[2]},{"code":"1000","name":"Praxisphase 1","semesterText":"1./2. Semester","ects":3,"total":75,"presence":10,"self":65,"type":"Pflicht","termNumbers":[1,2]},{"code":"2000","name":"Praxisphase 2","semesterText":"2./3. Semester","ects":3,"total":75,"presence":10,"self":65,"type":"Pflicht","termNumbers":[2,3]},{"code":"3000","name":"Praxisphase 3","semesterText":"3./4. Semester","ects":4,"total":100,"presence":10,"self":90,"type":"Pflicht","termNumbers":[3,4]},{"code":"8004","name":"Projektmanagement","semesterText":"4. Semester (Blockmodul)","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[4]},{"code":"6000","name":"Projektstudium","semesterText":"6. Semester","ects":32,"total":800,"presence":80,"self":720,"type":"Pflicht","termNumbers":[6]},{"code":"8001","name":"Sozialkompetenz","semesterText":"4. oder 5. Semester","ects":4,"total":100,"presence":50,"self":50,"type":"Pflicht","termNumbers":[4,5]},{"code":"1003","name":"Technische Mechanik 1","semesterText":"1. Semester","ects":6,"total":150,"presence":74,"self":76,"type":"Pflicht","termNumbers":[1]},{"code":"2003","name":"Technische Mechanik 2","semesterText":"2. Semester","ects":6,"total":150,"presence":74,"self":76,"type":"Pflicht","termNumbers":[2]},{"code":"1004","name":"Fertigungstechnik","semesterText":"2. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[2]},{"code":"4004","name":"Technische Mechanik 3","semesterText":"3. Semester","ects":6,"total":150,"presence":50,"self":100,"type":"Pflicht","termNumbers":[3]},{"code":"3001","name":"Thermodynamik","semesterText":"3. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[3]},{"code":"3010","name":"Transformationen für Maschinenbau","semesterText":"3. Semester","ects":7,"total":175,"presence":74,"self":101,"type":"Pflicht","termNumbers":[3]},{"code":"3006","name":"Verfahren der Formgebung","semesterText":"3. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[3]},{"code":"1005","name":"Werkstofftechnik","semesterText":"1. Semester","ects":5,"total":125,"presence":62,"self":63,"type":"Pflicht","termNumbers":[1]},{"code":"6008","name":"Alternative Energien","semesterText":"5. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Wahlpflicht","termNumbers":[5]},{"code":"4504","name":"CAX-Technologie","semesterText":"5./7. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Wahlpflicht","termNumbers":[5,7]},{"code":"7058","name":"Fahrzeugtechnik","semesterText":"5. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Wahlpflicht","termNumbers":[5]},{"code":"6003","name":"Finite Elemente","semesterText":"5./7. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Wahlpflicht","termNumbers":[5,7]},{"code":"6006","name":"Integrierte Heiz- und Kühlsysteme","semesterText":"5. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Wahlpflicht","termNumbers":[5]},{"code":"5038","name":"Konstruktionsmethodik","semesterText":"5. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Wahlpflicht","termNumbers":[5]},{"code":"7028","name":"Kunststofftechnik","semesterText":"5. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Wahlpflicht","termNumbers":[5]},{"code":"6007","name":"Rapid Prototyping","semesterText":"5. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Wahlpflicht","termNumbers":[5]},{"code":"7075","name":"Robotik und Automatisierungstechnik","semesterText":"5. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Wahlpflicht","termNumbers":[5]},{"code":"4503","name":"Werkstoffe der Formgebung","semesterText":"4. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Wahlpflicht","termNumbers":[4]},{"code":"4502","name":"Werkzeuge und Fügetechnik der Formgebung","semesterText":"4. Semester","ects":7,"total":175,"presence":72,"self":103,"type":"Wahlpflicht","termNumbers":[4]},{"code":"7029","name":"Werkzeugmaschinen","semesterText":"5. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Wahlpflicht","termNumbers":[5]}];

const $=id=>document.getElementById(id);
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const COMMON={
 1:['2007','1001','1003','1005','1002','8000','1000'],
 2:['2001','2003','1004','2002','8000','2000'],
 6:['6000']
};
const TRACKS={
 allgemein:{label:'Allgemeiner Maschinenbau',url:'https://studiumplus.de/studiengaenge/ingenieurwesen-maschinenbau-2/ingenieurwesen-maschinenbau-allgemeiner-maschinenbau/',required:{
 3:['3010','2004','4004','3001','8002','3000'],
 4:['3004','4003','4005','8004','3008','8001'],
 7:['6002','3003','3002','7010','7011']},slots:{5:{wahlpflicht:5}}}
};
const codes=new Map(CATALOG.map(m=>[m.code,m]));
for(const [key,path] of Object.entries(TRACKS))for(let term=1;term<=7;term++){
 const required=COMMON[term]||path.required[term]||[];
 for(const code of required)if(!codes.has(code))throw Error('Modulcode fehlt im Handbuch: '+key+' '+term+' '+code);
}
const pathway='allgemein';
const studyTermNumber=()=>SEMESTERS.findIndex(t=>t.id===activeTermId())+1;
function getOverview(number){
 const key=pathway,track=TRACKS.allgemein;
 const required=track?(COMMON[number]||track.required[number]||[]):[];
 return {selected:!!track,track:key,label:track?.label||'',sourceUrl:track?.url||'',
  required:required.map(code=>({...codes.get(code),displayName:code==='8000'?'Coaching-Selbstkompetenz · Teil '+number:codes.get(code).name,shared:code==='8000'})),
  slots:track?.slots?.[number]||{},
  candidates:track&&(track.slots?.[number]?.wahl||track.slots?.[number]?.wahlpflicht)
   ?CATALOG.filter(x=>x.type==='Wahlpflicht'&&x.termNumbers.includes(number)):[]
 };
}
function modulePresent(item){
 // Only a module belonging to the selected semester counts as present.
 // Legacy Coaching belongs to both first and second semester via termModules().
 return termModules().some(m=>m.handbookCode===item.code||
  m.name?.trim().toLowerCase()===item.name.toLowerCase()||
  (item.code==='8000'&&db.study?.modules?.some(meta=>meta.id==='s13_5'&&meta.localId===m.id)));
}
function wronglyAssigned(item){
 return db.modules.find(m=>(m.handbookCode===item.code||
  m.name?.trim().toLowerCase()===item.name.toLowerCase())&&
  !termModules().some(x=>x.id===m.id));
}
function importModule(item){
 if(modulePresent(item)||wronglyAssigned(item))return false;
 const plan=termPlan();
 const m={id:uid(),name:item.name,semesterId:activeTermId(),handbookCode:item.code,goal:0,
  color:colors[db.modules.length%colors.length]};
 db.modules.push(m);plan.modules??=[];
 if(!plan.modules.some(x=>x.localId===m.id))
 plan.modules.push({id:'handbook-'+item.code,localId:m.id,handbookCode:item.code,
  name:item.name,ects:item.ects,total:item.total,presence:item.presence,self:item.self,
  source:'Modulhandbuch Version 8; Studienverlauf StudiumPlus',semesterLabel:activeTerm().label});
 return true;
}
function renderHandbook(){
 const root=$('handbookCatalog');if(!root)return;
 const term=studyTermNumber(),overview=getOverview(term);
 const nominalECTS=[33,27,32,31,25,32,30][term-1];
 let html='<div class="st-handbook-intro"><div><h3>Studienverlaufsplan · '+h(activeTerm().label)+'</h3>'+
  '<p class="sub">Allgemeiner Maschinenbau · '+nominalECTS+' ECTS im regulären Studienverlauf dieses Semesters (insgesamt 210 ECTS). Zuordnung nach StudiumPlus, Modulstunden nach dem THM-Modulhandbuch Version 8.</p></div></div>';
 {
  const missing=overview.required.filter(m=>!modulePresent(m));
  const wronglyPlaced=missing.filter(wronglyAssigned),importable=missing.filter(m=>!wronglyAssigned(m));
  const row=m=>{
   const label=m.shared?' · Gesamtes Modul: 4 ECTS für beide Semester':'';
   const originalCode=({8000:'80001/80002',3003:'3003/7026',4007:'4007/7027'})[m.code]||m.code;
   const ownTermCredits=m.shared?2:m.ects;
   const control=modulePresent(m)?'<span class="st-handbook-state">Bereits vorhanden</span>':
    wronglyAssigned(m)?'<span class="st-handbook-state">Anderem Semester zugeordnet – bitte prüfen</span>':
    term===1?'<span class="small muted">Ergänze das Modul über den Studienplan-Import</span>':
    '<button type="button" class="secondary" data-handbook-add="'+h(m.code)+'">+ Übernehmen</button>';
   return '<div class="st-handbook-row"><div><strong>'+h(m.displayName)+
    '</strong><div class="sub small">Modulcode '+h(originalCode)+' · '+ownTermCredits+' ECTS im Semester · '+m.total+' h Modul-Gesamtaufwand · '+
    m.presence+' h Präsenz · '+m.self+' h Selbststudium'+label+'</div></div>'+control+'</div>';
  };
  const slots=overview.slots,wahl=slots.wahl||0,wahlpflicht=slots.wahlpflicht||0;
  const slotsText=[wahl?wahl+' Wahlmodul'+(wahl>1?'e':''):'',wahlpflicht?wahlpflicht+' Wahlpflichtmodul'+(wahlpflicht>1?'e':''):''].filter(Boolean).join(' · ');
  html+='<p class="sub small">Fachrichtung: <strong>'+h(overview.label)+'</strong> · <a href="'+h(overview.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Offizieller Studienverlaufsplan</a></p>'+
   '<details class="st-handbook-details" open><summary>Fest vorgesehene Module ('+overview.required.length+')</summary>'+
   '<div>'+overview.required.map(row).join('')+'</div></details>';
  if(term>1&&importable.length)html+='<button type="button" class="primary" id="handbookImportRequired">Fehlende Pflichtmodule übernehmen ('+importable.length+')</button>';
  if(wronglyPlaced.length)html+='<p class="sub" role="status">Semester-Abgleich: '+wronglyPlaced.length+' Pflichtmodule liegen noch in einem anderen Semester: '+
    wronglyPlaced.map(m=>h(m.name)).join(', ')+'. Sie werden nicht doppelt importiert. Deine bisherigen Lernzeiten und Aufgaben bleiben unverändert.</p>';
  if(slotsText){
   html+='<details class="st-handbook-details" open><summary>Individuelle Modulwahl ('+h(slotsText)+')</summary>'+
   '<p class="sub small">Die Auswahl steht im Studienverlaufsplan ausdrücklich offen. Keines der folgenden Angebote wird automatisch als Pflichtmodul importiert.</p>'+
   (overview.candidates.length?overview.candidates.map(m=>{
    const control=modulePresent(m)?'<span class="st-handbook-state">Vorhanden</span>':
    '<button type="button" class="secondary" data-handbook-add="'+h(m.code)+'">+ Als Wahlmodul übernehmen</button>';
    return '<div class="st-handbook-row"><div><strong>'+h(m.name)+'</strong><div class="sub small">'+
     h(m.code)+' · '+m.ects+' ECTS · '+m.total+' h gesamt · laut Modulbeschreibung '+h(m.semesterText)+
     '</div></div>'+control+'</div>';
   }).join(''):'<p class="sub small">Keine vollständig passenden Wahlangebote im bisherigen digitalen Katalog. Die Wahl erfolgt nach dem tatsächlichen Angebot.</p>')+
   '</details>';
  }
  const imported=db.modules.filter(m=>(m.semesterId||LEGACY_TERM)===activeTermId()&&m.handbookCode);
  const accepted=new Set([...overview.required.map(m=>m.code),...overview.candidates.map(m=>m.code)]);
  const unlisted=imported.filter(m=>!accepted.has(m.handbookCode));
  if(unlisted.length)html+='<p class="sub" role="status">Hinweis: '+unlisted.length+' früher übernommene Module sind in diesem Studienverlaufsplan nicht als feste Pflichtmodule aufgeführt ('+
    unlisted.map(m=>h(m.name)).join(', ')+'). Sie bleiben zur Sicherheit unverändert. Bitte prüfe, ob es deine individuellen Wahlmodule sind.</p>';
  html+='<p class="sub small">Regelstudium Allgemeiner Maschinenbau: 210 ECTS in sieben Semestern. Coaching-Selbstkompetenz zählt 2 ECTS je Semester im Studienverlaufsplan, insgesamt 4 ECTS für das gemeinsame Modul. Das fünfte Semester enthält fünf Wahlpflichtplätze à 5 ECTS. Die Wahlmöglichkeiten sind Angebotsbeispiele, kein verbindlicher Stunden- oder Prüfungsplan. Bereits gespeicherte Module und Lernzeiten werden nicht automatisch verschoben oder gelöscht.</p>';
  root.innerHTML=html;
  root.querySelector('#handbookImportRequired')?.addEventListener('click',()=>{
   const added=importable.filter(importModule);
   if(added.length){persist();notify(added.length+' fehlende Pflichtmodule übernommen')}
  });
  root.querySelectorAll('[data-handbook-add]').forEach(btn=>btn.addEventListener('click',()=>{
   const item=codes.get(btn.dataset.handbookAdd);
   if(item&&importModule(item)){persist();notify(item.name+' übernommen')}
  }));
 }
}
const previousRender=render;
render=function(){previousRender();renderHandbook()};
document.querySelectorAll('[data-tab="semester"]').forEach(b=>b.addEventListener('click',renderHandbook));
window.studyHandbookCatalog={
 modules:CATALOG.map(x=>({...x})),
 tracks:Object.fromEntries(Object.entries(TRACKS).map(([key,x])=>[key,{label:x.label,url:x.url}])),
 getOverview,getPathway:()=>pathway,
 setPathway(){renderHandbook()},
 refresh:renderHandbook
};
renderHandbook();
})();