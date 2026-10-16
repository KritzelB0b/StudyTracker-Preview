import {setCloudBookmarks} from './pdf-reader.js';
const API='https://studytracker-privatefiles-api-test.up.railway.app';
const token=()=>sessionStorage.getItem('studytracker_test_cloud_token')||'';
const status=s=>{const el=document.getElementById('stCloudNotesStatus');if(el)el.textContent=s};
let id=null,key=null,generation=0,ready=false,dirty=false,busy=false,timer=null,notes={pages:{}},bookmarks=[];
const localKey=k=>'st-reader-annotations-v1-'+k;
function hasContent(data){return Object.values(data?.pages||{}).some(p=>p?.notes?.length||p?.links?.length||p?.strokes?.length)}
function schedule(){if(!id||!ready)return;dirty=true;status('Änderungen werden gespeichert …');clearTimeout(timer);timer=setTimeout(push,1000)}
async function call(method,doc,payload){const res=await fetch(API+'/private/documents/'+encodeURIComponent(doc)+'/notes',{method,headers:{Authorization:'Bearer '+token(),...(payload?{'Content-Type':'application/json'}:{})},...(payload?{body:JSON.stringify({data:payload})}:{}),cache:'no-store'});if(!res.ok)throw Error('HTTP '+res.status);return res.json()}
async function push(){if(!ready||!dirty||busy||!id)return;const documentId=id,version=generation;const snapshot={pages:notes.pages,bookmarks:[...bookmarks]};dirty=false;busy=true;try{await call('PUT',documentId,snapshot);if(version===generation)status('Anmerkungen in der Test-Cloud gespeichert ✓')}catch(e){if(version===generation){dirty=true;status('Speichern fehlgeschlagen ('+e.message+'), lokal gesichert')}}finally{busy=false;if(dirty&&version===generation){clearTimeout(timer);timer=setTimeout(push,4000)}}}
function stop(){clearTimeout(timer);generation++;ready=false;id=null;key=null;dirty=false;busy=false;status('Nur lokal gespeichert')}
document.addEventListener('st-pdf-close',()=>{if(id&&ready&&dirty)void push();stop()});
document.addEventListener('st-pdf-open',async e=>{
 stop();id=e.detail.cloudId||null;key=e.detail.key||null;if(!id){status('Lokale PDF: keine Cloud-Synchronisierung');return}
 const version=generation,doc=id,docKey=key;status('Cloud-Anmerkungen werden geladen …');
 let local={pages:{}};try{local=JSON.parse(localStorage.getItem(localKey(docKey))||'{"pages":{}}')}catch{}
 try{const response=await call('GET',doc);if(version!==generation||id!==doc)return;
 const remote=response.data&&typeof response.data==='object'?response.data:{pages:{}};const remoteNotes={pages:remote.pages&&typeof remote.pages==='object'?remote.pages:{}};const remoteHas=hasContent(remoteNotes),localHas=hasContent(local);
 if(remoteHas&&localHas&&JSON.stringify(remoteNotes.pages)!==JSON.stringify(local.pages)){try{localStorage.setItem(localKey(docKey)+'-backup-'+doc,JSON.stringify(local))}catch{}}
 notes=remoteHas?remoteNotes:localHas?local:{pages:{}};bookmarks=Array.isArray(remote.bookmarks)?remote.bookmarks.filter(Number.isInteger):[];
 document.dispatchEvent(new CustomEvent('st-pdf-cloud-loaded',{detail:{key:docKey,data:notes}}));
 if(bookmarks.length)setCloudBookmarks(bookmarks);
 ready=true;status('Cloud-Anmerkungen geladen ✓');
 if(!remoteHas&&localHas)schedule();
 }catch(err){if(version!==generation)return;status('Cloud nicht erreichbar: '+err.message+' · lokale Daten bleiben erhalten')}
});
document.addEventListener('st-pdf-annotation-change',e=>{if(!id||e.detail.key!==key)return;notes=e.detail.data;schedule()});
document.addEventListener('st-pdf-bookmarks-change',e=>{if(!id)return;bookmarks=e.detail.bookmarks;schedule()});
