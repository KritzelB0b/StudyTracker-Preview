import {openCloudPdf,linkCloudPdf} from './pdf-reader.js?v=7';
const API='https://studytracker-privatefiles-api-test.up.railway.app';
const $=id=>document.getElementById(id);
const token=()=>sessionStorage.getItem('studytracker_test_cloud_token')||'';
const enabled=()=>!document.body.classList.contains('st-auth-locked')&&!!token();
let folder=null,folders=[],files=[],dialogAction=null;
const notice=message=>{$('cloudFilesStatus').textContent=message};
const button=(label,fn,variant='secondary')=>{const b=document.createElement('button');b.type='button';b.className=variant;b.textContent=label;b.addEventListener('click',fn);return b};
async function request(path,options={}){
 if(!enabled())throw Error('Bitte zuerst im privaten Test-Dateispeicher anmelden.');
 const headers={Authorization:'Bearer '+token(),...(options.headers||{})};
 const response=await fetch(API+path,{...options,headers,cache:'no-store'});
 if(!response.ok){
  let message='HTTP '+response.status;
  try{const body=await response.json();if(typeof body.detail==='string')message=body.detail}catch{}
  throw Error(message);
 }
 return response;
}
const jsonRequest=(path,method,data)=>request(path,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
const nameFor=id=>id?folders.find(f=>f.id===id)?.name||'Unbekannter Ordner':'Hauptordner';
function fullPath(id){
 if(!id)return 'Hauptordner';
 const names=[],seen=new Set();let current=id;
 while(current&&!seen.has(current)){seen.add(current);const node=folders.find(f=>f.id===current);if(!node)break;names.unshift(node.name);current=node.parent_id}
 return ['Hauptordner',...names].join(' / ');
}
let refreshingFiles=false,lastFilesRefresh=0;
async function refresh(){
 if(!enabled())return notice('Bitte im privaten Test-Dateispeicher anmelden.');
 if(refreshingFiles)return;
 refreshingFiles=true;
 try{
  const [fr,dr]=await Promise.all([
   request('/private/folders'),
   request('/private/documents'+(folder?'?folder_id='+encodeURIComponent(folder):''))
  ]);
  folders=await fr.json();files=await dr.json();
  if(folder&&!folders.some(f=>f.id===folder))folder=null;
  paint();await showStorage();lastFilesRefresh=Date.now();notice('Cloud-Dateispeicher synchronisiert · '+nameFor(folder));
 }catch(error){notice('Dateien konnten nicht geladen werden: '+error.message)}finally{refreshingFiles=false}
}
function refreshVisibleFiles(force=false){
 const panel=$('files');
 if(!enabled()||!navigator.onLine||document.hidden||!panel||panel.classList.contains('hidden'))return;
 if(!force&&Date.now()-lastFilesRefresh<15000)return;
 refresh();
}
let floatingMenu=null,menuAnchor=null;
function closeActionMenu(returnFocus=false){
 const anchor=menuAnchor;
 if(anchor)anchor.setAttribute('aria-expanded','false');
 floatingMenu?.remove();
 floatingMenu=null;menuAnchor=null;
 if(returnFocus&&anchor?.isConnected)anchor.focus();
}
function openActionMenu(trigger,actions,label){
 if(menuAnchor===trigger){closeActionMenu();return}
 closeActionMenu();
 const menu=document.createElement('div');
 menu.className='st-floating-file-menu';
 menu.setAttribute('role','menu');menu.setAttribute('aria-label',label);
 const popupWidth=Math.min(224,window.innerWidth-24);
 menu.style.width=popupWidth+'px';
 for(const [action,handler] of actions){
  const choice=button(action,()=>{closeActionMenu();handler()});
  choice.setAttribute('role','menuitem');
  choice.classList.add('st-floating-file-option');
  if(/löschen/i.test(action))choice.classList.add('st-option-danger');
  menu.append(choice);
 }
 document.body.append(menu);
 floatingMenu=menu;menuAnchor=trigger;
 trigger.setAttribute('aria-expanded','true');
 const rect=trigger.getBoundingClientRect(),spaceBelow=window.innerHeight-rect.bottom;
 const height=menu.getBoundingClientRect().height;
 const alignNextTo=trigger.closest('.st-folder-row')!==null&&rect.right+popupWidth+10<window.innerWidth-10;
 const left=alignNextTo?rect.right+9:rect.right-popupWidth;
 menu.style.left=Math.round(Math.max(10,Math.min(left,window.innerWidth-popupWidth-10)))+'px';
 const below=rect.bottom+7,above=rect.top-height-7;
 menu.style.top=Math.round(Math.max(8,Math.min(spaceBelow>=height+15?below:above,window.innerHeight-height-8)))+'px';
 menu.querySelector('button')?.focus();
}
document.addEventListener('pointerdown',event=>{
 if(floatingMenu&&!floatingMenu.contains(event.target)&&!menuAnchor?.contains(event.target))closeActionMenu();
},true);
document.addEventListener('keydown',event=>{
 if(!floatingMenu)return;
 if(event.key==='Escape'){event.preventDefault();closeActionMenu(true);return}
 if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
 event.preventDefault();
 const all=[...floatingMenu.querySelectorAll('button')];
 const index=all.indexOf(document.activeElement);
 const next=event.key==='Home'?0:event.key==='End'?all.length-1:event.key==='ArrowDown'?(index+1)%all.length:(index+all.length-1)%all.length;
 all[next]?.focus();
});
window.addEventListener('scroll',()=>closeActionMenu(),true);
window.addEventListener('resize',()=>closeActionMenu());
function moreMenu(actions,label){
 const trigger=button('⋯',()=>openActionMenu(trigger,actions,label));
 trigger.className='st-menu-trigger';
 trigger.title=label;
 trigger.setAttribute('aria-label',label);
 trigger.setAttribute('aria-haspopup','menu');
 trigger.setAttribute('aria-expanded','false');
 return trigger;
}
function paint(){
 closeActionMenu();
 const roots=$('cloudFolderTree'),list=$('cloudFileList');roots.replaceChildren();list.replaceChildren();
 $('cloudCurrentPath').textContent=fullPath(folder);
 const root=document.createElement('div');root.className='st-folder-row';
 root.append(button('⌂  Hauptordner',()=>{folder=null;refresh()},folder===null?'primary':'secondary'));roots.append(root);
 function visit(parent,depth,seen){
  for(const item of folders.filter(f=>f.parent_id===parent)){
   if(seen.has(item.id))continue;
   const line=document.createElement('div');line.className='st-folder-row';line.style.setProperty('--depth',String(Math.min(depth,5)));
   const b=button('▸  '+item.name,()=>{folder=item.id;refresh()},item.id===folder?'primary':'secondary');
   b.classList.add('st-folder-name');b.title=fullPath(item.id);
   const more=moreMenu([['Umbenennen',()=>openAction('renameFolder',item)],['Verschieben',()=>openAction('moveFolder',item)],['Leeren Ordner löschen',()=>removeFolder(item)]],'Ordneroptionen für '+item.name);
   line.append(b,more);roots.append(line);visit(item.id,depth+1,new Set([...seen,item.id]));
  }
 }
 visit(null,0,new Set());
 const term=$('cloudFileSearch')?.value.trim().toLocaleLowerCase('de')||'';
 const visible=files.filter(f=>f.filename.toLocaleLowerCase('de').includes(term));
 for(const file of visible){
  const row=document.createElement('div');row.className='cloud-file-row';
  const name=document.createElement('div');name.className='st-cloud-filename';
  const text=document.createElement('strong');text.textContent=file.filename;
  const meta=document.createElement('span');meta.textContent=(file.size/1048576).toLocaleString('de-DE',{maximumFractionDigits:2})+' MB';name.append(text,meta);
  const controls=document.createElement('div');controls.className='st-cloud-row-actions';
  if(/\.pdf$/i.test(file.filename))controls.append(button('Lesen',()=>openPdf(file)));
  controls.append(button('Herunterladen',()=>download(file)));
  controls.append(moreMenu([['Umbenennen',()=>openAction('renameFile',file)],['Verschieben',()=>openAction('moveFile',file)],['Datei löschen',()=>removeFile(file)]],'Dateioptionen für '+file.filename));
  row.append(name,controls);list.append(row);
 }
 if(!visible.length){const msg=document.createElement('p');msg.className='sub';msg.textContent=term?'Keine Dateien zu dieser Suche.':'Noch keine Dateien in diesem Ordner.';list.append(msg)}
}
function folderDescendants(id){
 const ids=new Set([id]),queue=[id];
 while(queue.length){const current=queue.shift();for(const f of folders.filter(x=>x.parent_id===current)){if(!ids.has(f.id)){ids.add(f.id);queue.push(f.id)}}}
 return ids;
}
function openAction(action,item){
 if(!enabled())return notice('Bitte anmelden.');
 dialogAction={action,item};
 const creating=action==='createFolder',rename=action.startsWith('rename')||creating,isFile=action.endsWith('File'),dlg=$('cloudActionDialog');
 $('cloudActionError').textContent='';
 $('cloudActionInputWrap').hidden=!rename;$('cloudActionSelectWrap').hidden=rename;
 $('cloudActionName').required=rename;
 $('cloudActionTitle').textContent=creating?'Neuen Ordner anlegen':(rename?'Umbenennen':'Verschieben')+' · '+(isFile?'Datei':'Ordner');
 $('cloudActionSave').textContent=creating?'Ordner anlegen':rename?'Umbenennen':'Verschieben';
 const name=creating?'':isFile?item.filename:item.name;
 if(rename){
  const extension=isFile?name.slice(name.lastIndexOf('.')):'';
  $('cloudActionName').value=extension?name.slice(0,-extension.length):name;
  $('cloudActionSuffix').textContent=extension?('Endung bleibt '+extension):'';
  $('cloudActionName').maxLength=isFile?Math.max(1,200-extension.length):120;
 }else{
  const excluded=isFile?new Set():folderDescendants(item.id);
  const options=[{id:null,name:'Hauptordner'},...folders.filter(f=>!excluded.has(f.id))];
  const select=$('cloudActionDestination');select.replaceChildren();
  for(const option of options){const el=document.createElement('option');el.value=option.id||'';el.textContent=fullPath(option.id);select.append(el)}
  select.value=(isFile?item.folder_id:item.parent_id)||'';
 }
 dlg.showModal();
 if(rename)$('cloudActionName').focus();else $('cloudActionDestination').focus();
}
$('cloudActionCancel').addEventListener('click',()=>$('cloudActionDialog').close());
$('cloudActionBack').addEventListener('click',()=>$('cloudActionDialog').close());
$('cloudActionForm').addEventListener('submit',async event=>{
 event.preventDefault();if(!dialogAction)return;
 const {action,item}=dialogAction,creating=action==='createFolder',rename=action.startsWith('rename')||creating,isFile=action.endsWith('File');
 const path=creating?'/private/folders':'/private/'+(isFile?'documents/':'folders/')+encodeURIComponent(item.id),payload={};
 if(rename){
  const n=$('cloudActionName').value.trim();
  if(!n){$('cloudActionError').textContent='Bitte einen Namen eingeben.';return}
  const suffix=isFile?item.filename.slice(item.filename.lastIndexOf('.')):'';
  const value=n+suffix;
  if(!creating&&value===(isFile?item.filename:item.name)){$('cloudActionDialog').close();return}
  payload[isFile?'filename':'name']=value;
  if(creating)payload.parent_id=folder;
 }else{
  const dest=$('cloudActionDestination').value||null;
  if(dest===(isFile?item.folder_id:item.parent_id)){$('cloudActionDialog').close();return}
  payload[isFile?'folder_id':'parent_id']=dest;
 }
 const submit=$('cloudActionSave');submit.disabled=true;$('cloudActionError').textContent='';
 try{await jsonRequest(path,creating?'POST':'PUT',payload);$('cloudActionDialog').close();await refresh()}
 catch(e){$('cloudActionError').textContent=e.message}
 finally{submit.disabled=false}
});
function createFolder(){if(!enabled())return notice('Bitte anmelden.');openAction('createFolder',null)}
async function removeFolder(item){
 if(!window.confirm('Leeren Ordner „'+item.name+'“ löschen? Ordner mit Dateien oder Unterordnern bleiben geschützt.'))return;
 try{await request('/private/folders/'+encodeURIComponent(item.id),{method:'DELETE'});if(folder===item.id)folder=null;await refresh()}
 catch(e){notice(e.message)}
}
let activeUpload=null;
/* Persist pending PDF uploads locally so offline/network interruptions never silently discard them.
   Uploading only happens for the signed-in owner and the separate test file account. */
let pendingDbPromise=null,queuedUploading=false,activePendingId=null;
const KNOWN_PDF_KEY='studytracker_preview_known_pdfs_v1';
function knownPdfs(){try{return JSON.parse(localStorage.getItem(KNOWN_PDF_KEY)||'{}')}catch{return {}}}
function rememberPdf(fingerprint,doc,folderId){
 if(!fingerprint||!doc)return;
 try{
  const known=knownPdfs();known[fingerprint]={id:doc,folderId};
  const keys=Object.keys(known);
  for(const key of keys.slice(0,Math.max(0,keys.length-300)))delete known[key];
  localStorage.setItem(KNOWN_PDF_KEY,JSON.stringify(known));
 }catch(e){}
}
async function pdfFingerprint(file){
 const head=new Uint8Array(await file.slice(0,65536).arrayBuffer());
 const tail=new Uint8Array(await file.slice(Math.max(0,file.size-65536)).arrayBuffer());
 const meta=new TextEncoder().encode(file.name+'-'+file.size);
 const combined=new Uint8Array(meta.length+head.length+tail.length);
 combined.set(meta);combined.set(head,meta.length);combined.set(tail,meta.length+head.length);
 const hash=await crypto.subtle.digest('SHA-256',combined);
 return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function pendingDb(){
 if(!pendingDbPromise)pendingDbPromise=new Promise((resolve,reject)=>{
  const req=indexedDB.open('studytracker-preview-pending-pdfs-v1',1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('uploads'))req.result.createObjectStore('uploads',{keyPath:'id'})};
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||Error('Lokale PDF-Warteschlange nicht verfügbar'));
 });
 return pendingDbPromise;
}
async function pendingAll(){
 const db=await pendingDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('uploads','readonly'),req=tx.objectStore('uploads').getAll();
  req.onsuccess=()=>resolve(req.result.sort((a,b)=>a.created-b.created));
  req.onerror=()=>reject(req.error);
 });
}
async function pendingSave(record){
 const db=await pendingDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('uploads','readwrite');
  tx.objectStore('uploads').put(record);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 });
}
async function pendingDelete(id){
 const db=await pendingDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('uploads','readwrite');
  tx.objectStore('uploads').delete(id);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 });
}
async function pendingStatus(){
 const el=$('cloudAutoQueueStatus'),indicator=$('pdfSyncIndicator');
 try{
  const count=(await pendingAll()).length;
  if(el)el.textContent=count?count+' PDF'+(count===1?'':'s')+' wartet/warten auf den Cloud-Upload. Dateien bleiben bis dahin lokal auf diesem Gerät.':'PDF-Uploads werden automatisch in der privaten Cloud gespeichert.';
  if(indicator)indicator.textContent=count?count+' PDF'+(count===1?'':'s')+' ausstehend':enabled()?'PDF-Cloud ✓':'PDF-Cloud: nicht angemeldet';
 }catch(e){
  if(el)el.textContent='PDF-Warteschlange nicht verfügbar – lokale Uploads bitte prüfen.';
  if(indicator)indicator.textContent='PDF-Upload prüfen';
 }
}
async function queueReaderPdf(file){
 if(!file||!file.name.toLowerCase().endsWith('.pdf'))return;
 if(file.size>125*1048576){notice('PDF über 125 MB: nur lokal geöffnet, nicht in die Cloud übernommen.');return}
 const id=crypto.randomUUID?.()||String(Date.now())+'-'+Math.random();
 try{
  const fingerprint=await pdfFingerprint(file);
  if((await pendingAll()).some(p=>p.fingerprint===fingerprint&&p.folderId===folder)){
   notice('PDF ist bereits für die automatische Cloud-Synchronisierung vorgemerkt.');
   processPendingPdf();return;
  }
  await pendingSave({id,file,filename:file.name,size:file.size,mime:file.type||'application/pdf',fingerprint,folderId:folder,created:Date.now()});
  await pendingStatus();
  notice(navigator.onLine?'PDF lokal geöffnet · Cloud-Upload wird automatisch gestartet.':'PDF lokal gespeichert · Upload beginnt automatisch nach Wiederherstellung der Verbindung.');
  processPendingPdf();
 }catch(e){notice('PDF lokal geöffnet, aber automatische Upload-Warteschlange konnte nicht gespeichert werden: '+e.message)}
}
async function processPendingPdf(){
 if(queuedUploading||activeUpload||!enabled()||!navigator.onLine)return;
 queuedUploading=true;let complete=false;
 try{
  const items=await pendingAll();
  if(!items.length)return;
  const item=items[0];activePendingId=item.id;
  // Link only if this particular PDF was previously uploaded by this browser.
  // Filename+size alone can describe different files and must not reuse notes.
  const url='/private/documents'+(item.folderId?'?folder_id='+encodeURIComponent(item.folderId):'');
  const existing=await(await request(url)).json();
  const remembered=knownPdfs()[item.fingerprint];
  const found=existing.find(d=>d.id===remembered?.id&&d.filename===item.filename&&d.size===item.size&&d.mime==='application/pdf');
  let cloudId=found?.id;
  if(!cloudId){
   const params=new URLSearchParams({filename:item.filename});
   if(item.folderId)params.set('folder_id',item.folderId);
   const file=item.file;
   cloudId=await new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();activeUpload=xhr;
    xhr.open('POST',API+'/private/documents?'+params);
    xhr.setRequestHeader('Authorization','Bearer '+token());
    xhr.setRequestHeader('Content-Type','application/pdf');
    setUploadProgress(0,'PDF wird automatisch hochgeladen: '+item.filename);
    xhr.upload.onprogress=e=>{
     if(e.lengthComputable)setUploadProgress(Math.round(e.loaded/e.total*100),'PDF wird synchronisiert: '+Math.round(e.loaded/e.total*100)+' %');
    };
    xhr.onerror=()=>reject(Error('Netzwerkfehler'));
    xhr.onabort=()=>reject(Error('Upload unterbrochen'));
    xhr.onload=()=>{
     if(xhr.status>=200&&xhr.status<300){try{resolve(JSON.parse(xhr.responseText).id)}catch(e){reject(e)}}
     else reject(Error('HTTP '+xhr.status));
    };
    xhr.onloadend=()=>{if(activeUpload===xhr)activeUpload=null;$('cloudFileUpload').disabled=false;setUploadProgress(0,'',false)};
    $('cloudFileUpload').disabled=true;
    xhr.send(file);
   });
  }
  rememberPdf(item.fingerprint,cloudId,item.folderId);
  await pendingDelete(item.id);complete=true;
  await pendingStatus();
  linkCloudPdf({name:item.filename,size:item.size},cloudId);
  notice('PDF automatisch in der Test-Cloud gespeichert: '+item.filename);
  if(document.querySelector('#files:not(.hidden)'))await refresh();
 }catch(e){
  notice('PDF wartet auf erneuten automatischen Upload: '+e.message+' · lokale Kopie bleibt erhalten.');
 }finally{
  queuedUploading=false;activePendingId=null;
  if(complete)setTimeout(processPendingPdf,350);
 }
}
document.addEventListener('st-pdf-local-selected',e=>queueReaderPdf(e.detail.file));
window.addEventListener('online',()=>{processPendingPdf();refreshVisibleFiles(true)});
window.addEventListener('focus',()=>{processPendingPdf();refreshVisibleFiles()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){processPendingPdf();refreshVisibleFiles()}});
setInterval(()=>{processPendingPdf();refreshVisibleFiles()},60000);
pendingStatus();

function setUploadProgress(value,message,visible=true){
 const bar=$('cloudUploadProgressBar'),region=$('cloudUploadProgress');
 if(region)region.hidden=!visible;
 if(bar){bar.style.width=value+'%';bar.setAttribute('aria-valuenow',String(Math.round(value)));}
 if(message)notice(message);
 $('cloudUploadCancel').hidden=!visible;
}
function upload(){
 const file=$('cloudFileInput').files?.[0];
 if(!file)return notice('Bitte eine Datei auswählen.');
 if(!enabled())return notice('Bitte zuerst im privaten Test-Dateispeicher anmelden.');
 const max=125*1048576;
 if(file.size>max)return notice('Datei zu groß: Maximal 125 MB pro Datei in dieser Testversion.');
 if(activeUpload)return notice('Bitte den laufenden Upload zuerst abschließen.');
 const params=new URLSearchParams({filename:file.name});if(folder)params.set('folder_id',folder);
 const xhr=new XMLHttpRequest();activeUpload=xhr;
 xhr.open('POST',API+'/private/documents?'+params);
 xhr.setRequestHeader('Authorization','Bearer '+token());
 xhr.setRequestHeader('Content-Type',file.type||'application/octet-stream');
 $('cloudFileUpload').disabled=true;
 const totalMB=(file.size/1048576).toLocaleString('de-DE',{maximumFractionDigits:1});
 setUploadProgress(0,'Upload vorbereitet: '+file.name+' ('+totalMB+' MB)');
 xhr.upload.onprogress=event=>{
  if(!event.lengthComputable)return;
  const percent=Math.min(100,Math.round(event.loaded/event.total*100));
  setUploadProgress(percent,percent+' % übertragen · '+file.name+(percent===100?' · Server speichert die Datei …':''));
 };
 xhr.onerror=()=>finish(false,'Netzwerkfehler beim Upload. Bitte erneut versuchen.');
 xhr.onabort=()=>finish(false,'Upload abgebrochen.');
 xhr.onload=async()=>{
  if(xhr.status>=200&&xhr.status<300){finish(true,'Datei hochgeladen: '+file.name);$('cloudFileInput').value='';await refresh()}
  else{let message='HTTP '+xhr.status;try{message=JSON.parse(xhr.responseText).detail||message}catch{}finish(false,'Upload fehlgeschlagen: '+message)}
 };
 function finish(success,message){if(activeUpload!==xhr)return;activeUpload=null;$('cloudFileUpload').disabled=false;setUploadProgress(success?100:0,message,false)}
 xhr.send(file);
}
$('cloudUploadCancel').addEventListener('click',async()=>{
 const queued=activePendingId;
 activeUpload?.abort();
 if(queued){
  await pendingDelete(queued).catch(()=>{});
  await pendingStatus();
  notice('Automatischer PDF-Upload abgebrochen und aus der Warteschlange entfernt. Die Datei bleibt lokal im Reader.');
 }
});
async function getFile(file){return (await request('/private/documents/'+encodeURIComponent(file.id))).blob()}
async function openPdf(file){
 try{notice('PDF wird geladen …');const blob=await getFile(file);await openCloudPdf(new File([blob],file.filename,{type:'application/pdf'}),file.id);notice('PDF im Reader geöffnet.')}
 catch(e){notice('PDF konnte nicht geöffnet werden: '+e.message)}
}
async function download(file){
 try{const blob=await getFile(file),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=file.filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000)}
 catch(e){notice('Download fehlgeschlagen: '+e.message)}
}
async function removeFile(file){
 if(!window.confirm('Datei „'+file.filename+'“ und ihre Cloud-Anmerkungen dauerhaft löschen?'))return;
 try{await request('/private/documents/'+encodeURIComponent(file.id),{method:'DELETE'});await refresh()}
 catch(e){notice(e.message)}
}
async function showStorage(){
 try{
  const res=await request('/private/storage'),usage=await res.json(),mb=n=>(n/1048576).toLocaleString('de-DE',{maximumFractionDigits:1});
  const percent=Math.min(100,100*usage.used_bytes/Math.max(1,usage.quota_bytes));
  $('cloudStorageUsage').textContent=mb(usage.used_bytes)+' MB von '+mb(usage.quota_bytes)+' MB · '+usage.file_count+' Dateien · '+usage.folder_count+' Ordner';
  $('cloudStorageBar').style.width=percent+'%';$('cloudStorageProgress').setAttribute('aria-valuenow',String(Math.round(percent)));
 }catch(e){$('cloudStorageUsage').textContent='Speicherinformationen nicht verfügbar: '+e.message}
}
async function testLogin(mode){
 const password=$('cloudTestPassword').value;
 if(password.length<12)return notice('Testpasswort benötigt mindestens zwölf Zeichen.');
 try{
  const response=await fetch(API+'/auth/'+mode,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'studytracker-test@example.com',password})});
  if(!response.ok){const error=await response.json();throw Error(typeof error.detail==='string'?error.detail:'HTTP '+response.status)}
  const data=await response.json();sessionStorage.setItem('studytracker_test_cloud_token',data.token);$('cloudTestPassword').value='';refreshFileAuth();await refresh();processPendingPdf();
 }catch(e){notice('Anmeldung fehlgeschlagen: '+e.message)}
}
$('cloudTestRegister').addEventListener('click',()=>testLogin('register'));
$('cloudTestLogin').addEventListener('click',()=>testLogin('login'));
function refreshFileAuth(){$('cloudTestLogout').hidden=!token();pendingStatus()}
$('cloudTestLogout').addEventListener('click',async()=>{
 const oldToken=token();sessionStorage.removeItem('studytracker_test_cloud_token');
 folder=null;folders=[];files=[];paint();refreshFileAuth();
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),6000);
 let revoked=false;
 try{if(oldToken){const response=await fetch(API+'/auth/logout',{method:'POST',headers:{Authorization:'Bearer '+oldToken},signal:controller.signal});revoked=response.ok}}
 catch(e){}finally{clearTimeout(timeout)}
 notice(revoked?'Test-Datei-Cloud abgemeldet. Sitzung auf dem Server widerrufen.':'Datei-Cloud lokal abgemeldet. Serverwiderruf nicht bestätigt; bereits heruntergeladene lokale Daten bleiben bestehen.');
});
refreshFileAuth();

$('cloudFolderCreate').addEventListener('click',createFolder);
$('cloudFileInput').addEventListener('change',async event=>{
 const file=event.target.files?.[0];
 if(!file)return;
 if(file.name.toLowerCase().endsWith('.pdf')||file.type==='application/pdf'){
  if(!enabled()){notice('Bitte zuerst im Test-Dateispeicher anmelden. Danach PDF erneut auswählen.');return}
  event.target.value='';
  await queueReaderPdf(file);
 }else{
  notice('Datei ausgewählt. Für dieses Dateiformat bitte „Datei hochladen“ anklicken.');
 }
});
$('cloudFileUpload').addEventListener('click',upload);
$('cloudFilesReload').addEventListener('click',refresh);
$('cloudFileSearch').addEventListener('input',paint);
document.querySelector('[data-tab="files"]').addEventListener('click',()=>{if(enabled()){refresh();processPendingPdf()}});
