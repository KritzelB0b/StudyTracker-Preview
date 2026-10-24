'use strict';
/* ECTS tracking: only credits explicitly confirmed after a completed assessment count.
   No automatic credit awards from learning hours, attendance or semester selection.
   Data is stored on existing db.modules / db.study so the existing JSON backup and
   revision-aware cloud sync preserve it without a schema migration. */
(function(){
 const $e=id=>document.getElementById(id);
 const catalog=()=>Array.isArray(window.studyHandbookCatalog?.modules)?window.studyHandbookCatalog.modules:[];
 const validEcts=n=>Number.isFinite(n)&&n>0&&n<=60&&Math.round(n*2)===n*2;
 const creditText=n=>Number(n).toLocaleString('de-DE',{maximumFractionDigits:1});
 const knownTerm=id=>SEMESTERS.some(t=>t.id===id);
 const semesterOf=m=>knownTerm(m.semesterId)?m.semesterId:LEGACY_TERM;
 function planFor(m){
  const id=semesterOf(m),study=db.study;
  const plan=id===LEGACY_TERM?study:study?.termPlans?.[id];
  return Array.isArray(plan?.modules)?plan.modules.find(x=>x.localId===m.id):null;
 }
 function moduleCredits(m){
  if(!m)return null;
  const meta=planFor(m),catalogEntry=catalog().find(x=>x.code===m.handbookCode);
  const exactCatalog=!catalogEntry&&catalog().filter(x=>x.name.toLowerCase()===String(m.name||'').toLowerCase());
  const handbook=catalogEntry||(exactCatalog?.length===1?exactCatalog[0]:null);
  for(const input of [handbook?.ects,meta?.ects,m.manualEcts]){const value=Number(input);if(validEcts(value))return value}
  return null;
 }
 function award(m){
  const a=m?.creditRecord;
  if(!a||!knownTerm(a.semesterId))return null;
  const n=Number(a.ects);
  return validEcts(n)&&/^\d{4}-\d\d-\d\d$/.test(a.date||'')?{ects:n,semesterId:a.semesterId,date:a.date}:null;
 }
 const creditsAll=()=>db.modules.reduce((n,m)=>n+(award(m)?.ects||0),0);
 const termAwards=id=>db.modules.filter(m=>award(m)?.semesterId===id);
 const termTotal=id=>termAwards(id).reduce((n,m)=>n+award(m).ects,0);
 function termFinished(id){const a=db.study?.ectsSemesterFinished?.[id];return typeof a==='string'&&/^\d{4}-\d\d-\d\d$/.test(a)?a:null}
 function completionRow(m){
  const earned=award(m),ects=moduleCredits(m);
  const label=earned?'Bestanden am '+new Date(earned.date+'T12:00:00').toLocaleDateString('de-DE')+
    ' · '+creditText(earned.ects)+' ECTS':ects===null?'ECTS fehlen · bitte im Modul-Cockpit eintragen':'Noch nicht bestanden · '+creditText(ects)+' ECTS möglich';
  const alreadyElsewhere=earned&&earned.semesterId!==activeTermId();
  const button=earned?'<button class="secondary" type="button" data-ects-revoke="'+esc(m.id)+'">Abschluss korrigieren</button>':
    ects!==null?'<button class="primary" type="button" data-ects-pass="'+esc(m.id)+'">Als bestanden markieren</button>':'';
  return '<div class="st-ects-module-row"><div><strong>'+esc(m.name)+'</strong>'+
   '<span class="st-ects-module-sub">'+esc(label)+(alreadyElsewhere?' · Verbucht in '+esc(SEMESTERS.find(x=>x.id===earned.semesterId)?.label||'anderem Semester'):'')+
   '</span></div><div class="st-ects-controls">'+button+'</div></div>';
 }
 function renderCredits(){
  const termId=activeTermId(),term=activeTerm(),list=termModules(),earned=termTotal(termId),total=creditsAll(),
   count=termAwards(termId).length,finished=termFinished(termId),home=list.filter(m=>semesterOf(m)===termId),
   planned=home.reduce((n,m)=>n+(moduleCredits(m)||0),0);
  const dash=$e('stCreditDashboard');
  if(dash)dash.innerHTML='<span>Erworbene ECTS: <strong>'+creditText(earned)+'</strong> in '+esc(term.label)+'</span><span>Studium insgesamt: <strong>'+creditText(total)+' ECTS</strong></span>';
  const summary=$e('stCreditOverview');
  if(summary)summary.innerHTML='<div class="st-ects-summary">'+
   '<div><span>Erworbene ECTS · '+esc(term.label)+'</span><strong>'+creditText(earned)+'</strong></div>'+
   '<div><span>ECTS insgesamt</span><strong>'+creditText(total)+'</strong></div>'+
   '<div><span>Abgeschlossene Module im Semester</span><strong>'+count+'</strong></div>'+
   '</div><p class="sub small">Bislang erfasste Module: '+creditText(planned)+' ECTS geplant. '+(list.some(m=>m.handbookCode==='8000')?'Coaching-Selbstkompetenz zählt semesterübergreifend nur einmal. ':'')+
   'ECTS werden nur gezählt, wenn du die bestandene Prüfungsleistung selbst bestätigst.</p>'+
   '<div class="st-ects-state"><strong>Semesterstatus: '+(finished?'Abgeschlossen am '+new Date(finished+'T12:00:00').toLocaleDateString('de-DE'):'Noch nicht als abgeschlossen markiert')+'</strong>'+
   '<button class="secondary" type="button" data-ects-semester="'+(finished?'reopen':'finish')+'">'+(finished?'Semesterstatus zurücksetzen':'Semester als abgeschlossen markieren')+'</button></div>'+
   '<p class="sub small">Der Semesterabschluss ist deine eigene Dokumentation und vergibt keine zusätzlichen Credit Points.</p>';
  const listTarget=$e('stCreditModules');
  if(listTarget)listTarget.innerHTML=list.length?list.map(completionRow).join(''):'<p class="sub">Noch keine Module in diesem Semester eingetragen. Übernimm sie zuerst aus dem Modulhandbuch.</p>';
  const all=$e('stCreditHistory');
  if(all)all.innerHTML='<div class="st-ects-all-grid">'+SEMESTERS.map(t=>'<div class="st-ects-all-item"><strong>'+esc(t.label)+'</strong>'+
   '<span>'+creditText(termTotal(t.id))+' ECTS · '+termAwards(t.id).length+' Module'+(termFinished(t.id)?' · Semester abgeschlossen':'')+'</span></div>').join('')+'</div>';
  const detail=$e('stCreditDetail');
  if(detail){const m=detailModule();
   if(!m){detail.innerHTML='';return}
   const v=moduleCredits(m),a=award(m);
   detail.innerHTML='<h3>Credit Points · '+esc(m.name)+'</h3><p class="sub small">'+
    (a?'Erworben: '+creditText(a.ects)+' ECTS · dokumentiert am '+esc(a.date):
      v!==null?'Für das Modul vorgesehen: '+creditText(v)+' ECTS · noch nicht als bestanden markiert.':'Für dieses Modul sind noch keine ECTS hinterlegt.')+
    '</p>'+completionRow(m)+
    (!a&&v===null?'<form id="stCustomCreditsForm" class="st-ects-manual"><label for="stCustomCredits">ECTS für eigenes Modul</label>'+
     '<input id="stCustomCredits" type="number" min="0.5" max="60" step="0.5" required value="'+(validEcts(Number(m.manualEcts))?String(m.manualEcts):'')+'">'+
     '<button class="secondary" type="submit">ECTS speichern</button></form>':'')+
    '<p class="sub small">Als bestanden markieren erst nach bestandener Prüfungsleistung. Du kannst eine irrtümliche Markierung wieder zurücknehmen.</p>';
  }
 }
 function showError(msg){window.alert(msg)}
 document.addEventListener('click',e=>{
  const pass=e.target.closest('[data-ects-pass]'),revoke=e.target.closest('[data-ects-revoke]'),status=e.target.closest('[data-ects-semester]');
  if(!pass&&!revoke&&!status)return;
  if(document.body.classList.contains('st-auth-locked'))return;
  if(status){
   const id=activeTermId(),finished=termFinished(id);
   if(finished){
    if(!window.confirm('Semesterabschluss-Markierung zurücksetzen? Die erworbenen Credit Points bleiben erhalten.'))return;
    if(db.study?.ectsSemesterFinished)delete db.study.ectsSemesterFinished[id];
   }else{
    if(!window.confirm('Semester '+activeTerm().label+' als abgeschlossen dokumentieren? Das vergibt keine ECTS; nur bestandene Module zählen.'))return;
    const root=studyRoot();root.ectsSemesterFinished??={};root.ectsSemesterFinished[id]=today();
   }
   persist();notify(finished?'Semesterstatus zurückgesetzt':'Semesterabschluss dokumentiert');return;
  }
  const m=getM((pass||revoke).dataset.ectsPass||(pass||revoke).dataset.ectsRevoke);
  if(!m||!termModules().some(x=>x.id===m.id))return;
  if(pass){
   if(award(m))return;
   const ects=moduleCredits(m);
   if(ects===null)return showError('Bitte zuerst ECTS für dieses Modul hinterlegen.');
   if(!window.confirm('Prüfungsleistung in „'+m.name+'“ bestanden? '+creditText(ects)+' ECTS als erworben eintragen?'))return;
   m.creditRecord={ects,semesterId:activeTermId(),date:today()};
  }else{
   if(!award(m))return;
   if(!window.confirm('Bestanden-Markierung von „'+m.name+'“ zurücknehmen? Die gebuchten ECTS werden abgezogen; Lernzeiten bleiben unverändert.'))return;
   delete m.creditRecord;
  }
  persist();notify(pass?'Modulabschluss und ECTS gespeichert':'ECTS-Buchung zurückgenommen');
 });
 document.addEventListener('submit',e=>{
  if(e.target.id!=='stCustomCreditsForm')return;
  e.preventDefault();
  if(document.body.classList.contains('st-auth-locked'))return;
  const m=detailModule(),n=Number($e('stCustomCredits').value);
  if(!m||award(m))return;
  if(!validEcts(n))return showError('Bitte 0,5 bis 60 ECTS in 0,5er-Schritten eingeben.');
  m.manualEcts=n;persist();notify('ECTS für das Modul hinterlegt');
 });
 const oldRender=render;
 render=function(){oldRender();renderCredits()};
 $e('detailModule')?.addEventListener('change',renderCredits);
 renderCredits();
 window.studyCreditTracker={summary:()=>({earned:creditsAll(),bySemester:SEMESTERS.map(t=>({id:t.id,ects:termTotal(t.id),completed:!!termFinished(t.id)}))}),moduleEcts:moduleCredits};
})();
