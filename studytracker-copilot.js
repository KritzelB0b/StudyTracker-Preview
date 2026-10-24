/* StudyTracker Preview: lightweight upcoming appointments widget. No AI or private data in public view. */
'use strict';
(()=>{
 const card=document.getElementById('copilotCard');
 if(!card)return;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const dateKey=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
 const daysBetween=(a,b)=>Math.round((Date.parse(a+'T12:00:00')-Date.parse(b+'T12:00:00'))/86400000);
 function renderUpcoming(){
  if(document.body.classList.contains('st-auth-locked')){card.replaceChildren();return;}
  const today=dateKey(new Date());
  const plan=typeof termPlan==='function'?termPlan(false):null;
  const raw=[
   ...(Array.isArray(plan?.tasks)?plan.tasks.filter(t=>!t.done).map(t=>({date:t.date,title:t.title||'Aufgabe',kind:t.kind==='exam'?'Prüfung':t.kind==='study'?'Lernblock':'Aufgabe',time:t.time||''})):[]),
   ...(Array.isArray(plan?.events)?plan.events.map(e=>({date:e.date,title:e.title||e.name||'Termin',kind:/exam|prüfung|klausur/i.test([e.kind,e.type,e.category,e.title,e.name].join(' '))?'Prüfung':'Termin',time:e.start||''})):[])
  ];
  const seen=new Set();
  const soon=raw.filter(x=>typeof x.date==='string'&&/^\d{4}-\d\d-\d\d$/.test(x.date)&&x.date>=today)
   .sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time))
   .filter(x=>{const k=[x.date,x.time,x.title.toLowerCase()].join('|');if(seen.has(k))return false;seen.add(k);return true;}).slice(0,2);
  card.innerHTML='<div class="title-row"><div><h2>Bevorstehende Termine</h2></div><button type="button" class="btn-ghost btn-small" data-go="planner">Kalender ›</button></div>'+
   (soon.length?soon.map(x=>'<div class="cp-row"><span><b>'+esc(x.title)+'</b></span><span>'+esc(x.date.slice(8,10)+'.'+x.date.slice(5,7)+'.')+' <strong>'+(daysBetween(x.date,today)===0?'Heute':daysBetween(x.date,today)===1?'Morgen':'in '+daysBetween(x.date,today)+' Tagen')+'</strong></span></div>').join(''):'<p class="sub">Keine anstehenden Termine.</p>');
 }
 const prev=window.render;
 if(typeof prev==='function')window.render=function(){prev();renderUpcoming()};
 window.addEventListener('focus',renderUpcoming);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderUpcoming()});
 renderUpcoming();
})();
