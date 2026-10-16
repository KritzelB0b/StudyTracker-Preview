import {setCloudBookmarks} from './pdf-reader.js';
const API='https://studytracker-privatefiles-api-test.up.railway.app';
const token=()=>sessionStorage.getItem('studytracker_test_cloud_token')||'';
const status=s=>{const el=document.getElementById('stCloudNotesStatus');if(el)el.textContent=s};
let id=null,key=null,generation=0,ready=false,dirty=false,busy=false,timer=null,notes={pages:{}},bookmarks=[],revision=0,conflict=false;
const localKey=k=>'st-reader-annotations-v1-'+k;
function hasContent(data){return Object.values(data?.pages||{}).some(p=>p?.notes?.length||p?.links?.length||p?.strokes?.length)}
function schedule(){if(!id||!ready||conflict)return;dirty=true;status('Änderungen werden gespeichert …');clearTimeout(timer);timer=setTimeout(push,1000)}
async function call(method,doc,payload){const res=await fetch(API+'/private/documents/'+encodeURIComponent(doc)+'/notes',{method,headers:{Authorization:'Bearer '+token(),...(payload?{'Content-Type':'application/json'}:{})},...(payload?{body:JSON.stringify({data:payload,revision})}:{}),cache:'no-store'});if(!res.ok){const err=new Error('HTTP '+res.status);err.status=res.status;throw err}return res.json()}
async function push(){
 if(!ready||!dirty||busy||!id||conflict)return;
 const doc=id,version=generation,rev=revision;
 const snapshot={pages:structuredClone(notes.pages),bookmarks:[...bookmarks]};
 dirty=false;busy=true;
 try{
  const response=await call('PUT',doc,snapshot);
  if(version===generation&&doc===id){revision=response.revision;status('Anmerkungen in der Test-Cloud gespeichert ✓')}
 }catch(e){
  if(version!==generation||doc!==id)return;
  dirty=true;
  if(e.status===409){
   conflict=true;clearTimeout(timer);
   try{localStorage.setItem(localKey(key)+'-conflict-'+doc,JSON.stringify(snapshot))}catch{}
   status('Konflikt: Ein anderes Gerät hat neuer gespeichert. Deine Änderungen sind lokal gesichert. PDF bitte schließen und erneut öffnen; Änderungen vor dem Schließen ggf. separat sichern.');
  }else status('Speichern fehlgeschlagen ('+e.message+'), lokal gesichert');
 }finally{
  busy=false;
  if(dirty&&!conflict&&version===generation&&doc===id){clearTimeout(timer);timer=setTimeout(push,4000)}
 }
}
function stop(){clearTimeout(timer);generation++;ready=false;id=null;key=null;dirty=false;conflict=false;revision=0;status('Nur lokal gespeichert')}
document.addEventListener('st-pdf-close',()=>{if(id&&ready&&dirty){try{localStorage.setItem(localKey(key)+'-pending-'+id,JSON.stringify({pages:notes.pages,bookmarks}))}catch{}status('Änderungen lokal gesichert; bitte erneut öffnen und Cloud-Status prüfen')}stop()});
document.addEventListener('st-pdf-open',async e=>{
 stop();id=e.detail.cloudId||null;key=e.detail.key||null;if(!id){status('Lokale PDF: keine Cloud-Synchronisierung');return}
 const version=generation,doc=id,docKey=key;status('Cloud-Anmerkungen werden geladen …');
 let local={pages:{}};try{local=JSON.parse(localStorage.getItem(localKey(docKey))||'{"pages":{}}')}catch{}
 try{const response=await call('GET',doc);if(version!==generation||id!==doc)return;
 revision=Number.isInteger(response.revision)?response.revision:0;const remote=response.data&&typeof response.data==='object'?response.data:{pages:{}};const remoteNotes={pages:remote.pages&&typeof remote.pages==='object'?remote.pages:{}};const remoteHas=hasContent(remoteNotes),localHas=hasContent(local);
 if(remoteHas&&localHas&&JSON.stringify(remoteNotes.pages)!==JSON.stringify(local.pages)){try{localStorage.setItem(localKey(docKey)+'-backup-'+doc,JSON.stringify(local))}catch{}}
 notes=remoteHas?remoteNotes:localHas?local:{pages:{}};bookmarks=Array.isArray(remote.bookmarks)?remote.bookmarks.filter(Number.isInteger):[];
 document.dispatchEvent(new CustomEvent('st-pdf-cloud-loaded',{detail:{key:docKey,data:notes}}));
 if(bookmarks.length)setCloudBookmarks(bookmarks);
 ready=true;status('Cloud-Anmerkungen geladen ✓');
 if(!remoteHas&&localHas)schedule();
 }catch(err){if(version!==generation)return;status('Cloud nicht erreichbar: '+err.message+' · lokale Daten bleiben erhalten')}
});
document.addEventListener('st-pdf-annotation-change',e=>{if(!id||e.detail.key!==key)return;notes=e.detail.data;if(conflict){try{localStorage.setItem(localKey(key)+'-conflict-'+id,JSON.stringify({pages:notes.pages,bookmarks}))}catch{}return}schedule()});
document.addEventListener('st-pdf-bookmarks-change',e=>{if(!id)return;bookmarks=e.detail.bookmarks;schedule()});
