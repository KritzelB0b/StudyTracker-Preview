import {openCloudPdf} from './pdf-reader.js';
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
async function refresh(){
 if(!enabled())return notice('Bitte im privaten Test-Dateispeicher anmelden.');
 try{
  const [fr,dr]=await Promise.all([
   request('/private/folders'),
   request('/private/documents'+(folder?'?folder_id='+encodeURIComponent(folder):''))
  ]);
  folders=await fr.json();files=await dr.json();
  if(folder&&!folders.some(f=>f.id===folder))folder=null;
  paint();await showStorage();notice('Cloud-Dateispeicher verbunden · '+nameFor(folder));
 }catch(error){notice('Dateien konnten nicht geladen werden: '+error.message)}
}
function moreMenu(actions,label){
 const details=document.createElement('details');details.className='st-file-more';
 const summary=document.createElement('summary');summary.textContent='⋯';summary.title=label;summary.setAttribute('aria-label',label);
 const menu=document.createElement('div');menu.className='st-file-menu';
 for(const [text,handler] of actions)menu.append(button(text,()=>{details.open=false;handler()}));
 details.append(summary,menu);return details;
}
function paint(){
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
async function upload(){
 const file=$('cloudFileInput').files?.[0];if(!file)return notice('Bitte eine Datei auswählen.');
 if(file.size>20*1048576)return notice('Maximal 20 MB pro Datei.');
 const params=new URLSearchParams({filename:file.name});if(folder)params.set('folder_id',folder);
 try{notice('Datei wird hochgeladen …');await request('/private/documents?'+params,{method:'POST',headers:{'Content-Type':file.type||'application/octet-stream'},body:file});$('cloudFileInput').value='';await refresh()}
 catch(e){notice('Upload fehlgeschlagen: '+e.message)}
}
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
  const data=await response.json();sessionStorage.setItem('studytracker_test_cloud_token',data.token);$('cloudTestPassword').value='';await refresh();
 }catch(e){notice('Anmeldung fehlgeschlagen: '+e.message)}
}
$('cloudTestRegister').addEventListener('click',()=>testLogin('register'));
$('cloudTestLogin').addEventListener('click',()=>testLogin('login'));
$('cloudFolderCreate').addEventListener('click',createFolder);
$('cloudFileUpload').addEventListener('click',upload);
$('cloudFilesReload').addEventListener('click',refresh);
$('cloudFileSearch').addEventListener('input',paint);
document.querySelector('[data-tab="files"]').addEventListener('click',()=>{if(enabled())refresh()});
