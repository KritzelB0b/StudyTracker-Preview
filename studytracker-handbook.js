'use strict';
/* Source: THM/ZDH Modulhandbuch Ingenieurwesen Maschinenbau, Version 8,
   Prüfungsordnung 2016, Änderungsfassung 11.12.2024.
   Semesterzuordnungen follow the stated "Studiensemester" field.
   Multiple semesters are alternatives/overlapping periods, not duplicate workload.
   This is a planning catalog, not a class timetable. */
(function(){
const CATALOG=[{"code":"6002","name":"Allgemeine BWL und Recht für Ingenieure","semesterText":"7. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[7]},{"code":"4005","name":"Automatisierungs- und Regelungstechnik","semesterText":"4. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[4]},{"code":"7011","name":"Bachelor-Kolloquium","semesterText":"7. Semester","ects":3,"total":75,"presence":5,"self":70,"type":"Pflicht","termNumbers":[7]},{"code":"7010","name":"Bachelor-Thesis","semesterText":"7. Semester","ects":12,"total":300,"presence":10,"self":290,"type":"Pflicht","termNumbers":[7]},{"code":"8002","name":"Betriebsethik","semesterText":"3. Semester","ects":4,"total":100,"presence":50,"self":50,"type":"Pflicht","termNumbers":[3]},{"code":"8000","name":"Coaching-Selbstkompetenz","semesterText":"1. + 2. Semester","ects":4,"total":100,"presence":50,"self":50,"type":"Pflicht","termNumbers":[1,2]},{"code":"3003","name":"Elektrotechnik für Maschinenbau","semesterText":"2. / 7. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[2,7]},{"code":"3008","name":"Englisch","semesterText":"4. Semester (Blockmodul)","ects":4,"total":100,"presence":50,"self":50,"type":"Pflicht","termNumbers":[4]},{"code":"4003","name":"Fluidmechanik","semesterText":"4. Semester","ects":6,"total":150,"presence":50,"self":100,"type":"Pflicht","termNumbers":[4]},{"code":"4006","name":"Hygiene Design","semesterText":"4. Semester","ects":6,"total":150,"presence":50,"self":100,"type":"Pflicht","termNumbers":[4]},{"code":"4008","name":"Hygienische Prozesstechnik und Gebäudeausstattung","semesterText":"3. Semester","ects":7,"total":175,"presence":74,"self":101,"type":"Pflicht","termNumbers":[3]},{"code":"3002","name":"Informatik 1","semesterText":"7. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[7]},{"code":"3009","name":"Kältetechnik 1","semesterText":"3. Semester","ects":6,"total":150,"presence":74,"self":76,"type":"Pflicht","termNumbers":[3]},{"code":"6005","name":"Klimatechnik","semesterText":"7. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[7]},{"code":"2007","name":"Konstruktion / CAD","semesterText":"1. Semester","ects":6,"total":150,"presence":74,"self":76,"type":"Pflicht","termNumbers":[1]},{"code":"2004","name":"Maschinenelemente 1","semesterText":"3. Semester","ects":6,"total":150,"presence":74,"self":76,"type":"Pflicht","termNumbers":[3]},{"code":"3004","name":"Maschinenelemente 2","semesterText":"4. Semester","ects":7,"total":175,"presence":74,"self":101,"type":"Pflicht","termNumbers":[4]},{"code":"4007","name":"Maschinensicherheit","semesterText":"3. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[3]},{"code":"1001","name":"Mathematik für Ingenieure 1","semesterText":"1. Semester","ects":6,"total":150,"presence":74,"self":76,"type":"Pflicht","termNumbers":[1]},{"code":"2001","name":"Mathematik für Ingenieure 2","semesterText":"2. Semester","ects":6,"total":150,"presence":74,"self":76,"type":"Pflicht","termNumbers":[2]},{"code":"1002","name":"Naturwissenschaften 1","semesterText":"1. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[1]},{"code":"2002","name":"Naturwissenschaften 2","semesterText":"2. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[2]},{"code":"1000","name":"Praxisphase 1","semesterText":"1./2. Semester","ects":3,"total":75,"presence":10,"self":65,"type":"Pflicht","termNumbers":[1,2]},{"code":"2000","name":"Praxisphase 2","semesterText":"2./3. Semester","ects":3,"total":75,"presence":10,"self":65,"type":"Pflicht","termNumbers":[2,3]},{"code":"3000","name":"Praxisphase 3","semesterText":"3./4. Semester","ects":4,"total":100,"presence":10,"self":90,"type":"Pflicht","termNumbers":[3,4]},{"code":"8004","name":"Projektmanagement","semesterText":"4. Semester (Blockmodul)","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[4]},{"code":"6000","name":"Projektstudium","semesterText":"6. Semester","ects":32,"total":800,"presence":80,"self":720,"type":"Pflicht","termNumbers":[6]},{"code":"8001","name":"Sozialkompetenz","semesterText":"4. oder 5. Semester","ects":4,"total":100,"presence":50,"self":50,"type":"Pflicht","termNumbers":[4,5]},{"code":"1003","name":"Technische Mechanik 1","semesterText":"1. Semester","ects":6,"total":150,"presence":74,"self":76,"type":"Pflicht","termNumbers":[1]},{"code":"2003","name":"Technische Mechanik 2","semesterText":"2. Semester","ects":6,"total":150,"presence":74,"self":76,"type":"Pflicht","termNumbers":[2]},{"code":"1004","name":"Fertigungstechnik","semesterText":"2. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[2]},{"code":"4004","name":"Technische Mechanik 3","semesterText":"3. Semester","ects":6,"total":150,"presence":50,"self":100,"type":"Pflicht","termNumbers":[3]},{"code":"3001","name":"Thermodynamik","semesterText":"3. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[3]},{"code":"3010","name":"Transformationen für Maschinenbau","semesterText":"3. Semester","ects":7,"total":175,"presence":74,"self":101,"type":"Pflicht","termNumbers":[3]},{"code":"3006","name":"Verfahren der Formgebung","semesterText":"3. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Pflicht","termNumbers":[3]},{"code":"1005","name":"Werkstofftechnik","semesterText":"1. Semester","ects":5,"total":125,"presence":62,"self":63,"type":"Pflicht","termNumbers":[1]},{"code":"6008","name":"Alternative Energien","semesterText":"5. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Wahlpflicht","termNumbers":[5]},{"code":"4504","name":"CAX-Technologie","semesterText":"5./7. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Wahlpflicht","termNumbers":[5,7]},{"code":"7058","name":"Fahrzeugtechnik","semesterText":"5. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Wahlpflicht","termNumbers":[5]},{"code":"6003","name":"Finite Elemente","semesterText":"5./7. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Wahlpflicht","termNumbers":[5,7]},{"code":"6006","name":"Integrierte Heiz- und Kühlsysteme","semesterText":"5. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Wahlpflicht","termNumbers":[5]},{"code":"5038","name":"Konstruktionsmethodik","semesterText":"5. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Wahlpflicht","termNumbers":[5]},{"code":"7028","name":"Kunststofftechnik","semesterText":"5. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Wahlpflicht","termNumbers":[5]},{"code":"6007","name":"Rapid Prototyping","semesterText":"5. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Wahlpflicht","termNumbers":[5]},{"code":"7075","name":"Robotik und Automatisierungstechnik","semesterText":"5. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Wahlpflicht","termNumbers":[5]},{"code":"4503","name":"Werkstoffe der Formgebung","semesterText":"4. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Wahlpflicht","termNumbers":[4]},{"code":"4502","name":"Werkzeuge und Fügetechnik der Formgebung","semesterText":"4. Semester","ects":7,"total":175,"presence":72,"self":103,"type":"Wahlpflicht","termNumbers":[4]},{"code":"7029","name":"Werkzeugmaschinen","semesterText":"5. Semester","ects":5,"total":125,"presence":50,"self":75,"type":"Wahlpflicht","termNumbers":[5]}];
const $=id=>document.getElementById(id);
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function modulePresent(item){
 return db.modules.some(m=>m.handbookCode===item.code||
   (m.name.trim().toLowerCase()===item.name.toLowerCase() &&
     (m.semesterId||LEGACY_TERM)===activeTermId()));
}
function termCodeToNumber(){return SEMESTERS.findIndex(t=>t.id===activeTermId())+1}
function importModule(item){
 if(modulePresent(item))return false;
 const plan=termPlan();
 const module={id:uid(),name:item.name,semesterId:activeTermId(),handbookCode:item.code,goal:0,color:colors[(db.modules.length)%colors.length]};
 db.modules.push(module);
 plan.modules??=[];
 if(!plan.modules.some(m=>m.handbookCode===item.code||m.localId===module.id))
  plan.modules.push({id:'handbook-'+item.code,localId:module.id,handbookCode:item.code,
    name:item.name,ects:item.ects,total:item.total,presence:item.presence,self:item.self,
    source:'Modulhandbuch Version 8',semesterLabel:item.semesterText});
 return true;
}
function renderHandbook(){
 const root=$('handbookCatalog');if(!root)return;
 const n=termCodeToNumber();const catalog=CATALOG.filter(item=>item.termNumbers.includes(n));
 const core=catalog.filter(item=>item.type==='Pflicht'), electives=catalog.filter(item=>item.type==='Wahlpflicht');
 const requiredHere=core.filter(item=>item.termNumbers[0]===n);
 const exists=CATALOG.filter(modulePresent);
 const line=item=>{
  const selected=modulePresent(item),otherTerm=item.termNumbers[0]!==n;
  const meta=item.ects+' ECTS · '+item.total+' h gesamt · '+item.presence+' h Präsenz · '+item.self+' h Selbststudium';
  const action=n===1?'':selected?'<span class="st-handbook-state">Bereits eingetragen</span>':
    '<button type="button" class="secondary" data-handbook-add="'+h(item.code)+'" aria-label="'+h(item.name)+' als Modul hinzufügen">+ Übernehmen</button>';
  return '<div class="st-handbook-row"><div><strong>'+h(item.name)+'</strong><div class="sub small">Modulcode '+h(item.code)+' · '+h(meta)+' · lt. Handbuch: '+h(item.semesterText)+(otherTerm?' (anderer Regelzeitraum möglich)':'')+'</div></div>'+action+'</div>';
 };
 let header='<div class="st-handbook-intro"><div><h3>Modulhandbuch · '+h(activeTerm().label)+'</h3><p class="sub">Verlässliche Planungsdaten aus Version 8: ECTS und Arbeitsaufwand. Keine erfundenen Vorlesungs- oder Prüfungstermine. Übernahme ergänzt nur fehlende Module.</p></div>';
 if(n>1)header+='<button type="button" class="primary" id="handbookImportRequired">Pflichtmodule übernehmen ('+requiredHere.filter(item=>!modulePresent(item)).length+')</button>';
 header+='</div>';
 const sections=section=>section.length?section.map(line).join(''):'<p class="sub">Keine Module in dieser Kategorie für das gewählte Semester.</p>';
 root.innerHTML=header+'<details class="st-handbook-details" open><summary>Pflichtmodule und semesterübergreifende Module ('+core.length+')</summary><div>'+sections(core)+'</div></details>'+
 '<details class="st-handbook-details"><summary>Wahlpflichtmodule – bitte nur deine tatsächliche Auswahl übernehmen ('+electives.length+')</summary><div>'+sections(electives)+'</div></details>'+
 '<p class="sub small">Hinweis: Module mit mehreren möglichen Semestern werden nicht doppelt gezählt. Die tatsächliche Fachrichtung, Wahlpflichtbelegung und Prüfungstermine müssen bei Bedarf mit dem Studienplan abgeglichen werden.</p>';
 const batch=$('handbookImportRequired');if(batch)batch.addEventListener('click',()=>{
  const added=requiredHere.filter(importModule);
  if(added.length){persist();notify(added.length+' Pflichtmodule aus dem Modulhandbuch übernommen')}
  else notify('Alle verfügbaren Pflichtmodule sind bereits eingetragen');
 });
 root.querySelectorAll('[data-handbook-add]').forEach(b=>b.addEventListener('click',()=>{
  const item=CATALOG.find(x=>x.code===b.dataset.handbookAdd);
  if(!item)return;
  if(importModule(item)){persist();notify(item.name+' übernommen')}
  else notify('Dieses Modul ist bereits vorhanden');
 }));
}
const oldRender=render;
render=function(){oldRender();renderHandbook()};
document.querySelectorAll('[data-tab="semester"]').forEach(b=>b.addEventListener('click',renderHandbook));
renderHandbook();
window.studyHandbookCatalog={modules:CATALOG.map(x=>({...x})),refresh:renderHandbook};
})();