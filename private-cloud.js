import {openCloudPdf} from './pdf-reader.js';
const API='https://studytracker-api-production-7134.up.railway.app';
const $=id=>document.getElementById(id);
const token=()=>sessionStorage.getItem('studytracker_cloud_token')||'';
const enabled=()=>!document.body.classList.contains('st-auth-locked')&&!!token();
let folder=null,folders=[],files=[];
const notice=s=>$('cloudFilesStatus').textContent=s;
function button(text,fn,disabled=false){const b=document.createElement('button');b.className='secondary';b.type='button';b.textContent=text;b.disabled=disabled;b.addEventListener('click',fn);return b}
async function request(path,options={}){
 if(!enabled())throw Error('Bitte zuerst unter „Daten & Einstellungen“ bei Railway anmelden.');
 const headers={Authorization:'Bearer '+token(),...(options.headers||{})};
 const res=await fetch(API+path,{...options,headers,cache:'no-store'});
 if(!res.ok){let msg='HTTP '+res.status;try{const err=await res.json();msg=typeof err.detail==='string'?err.detail:msg}catch{}throw Error(msg)}
 return res;
}
async function refresh(){
 if(!enabled()){notice('Bitte zuerst anmelden.');return}
 try{
 const [f,d]=await Promise.all([request('/private/folders'),request('/private/documents'+(folder?'?folder_id='+encodeURIComponent(folder):''))]);
 folders=await f.json();files=await d.json();paint();notice('Privater Cloud-Dateispeicher verbunden.');
 }catch(e){notice(e.message.includes('404')?'Datei-API noch nicht auf Railway bereitgestellt (HTTP 404). Der Backend-Code ist derzeit nur im Entwicklungsbranch.':e.message)}
}
function paint(){
 const roots=$('cloudFolderTree'),list=$('cloudFileList');roots.replaceChildren();list.replaceChildren();
 roots.append(button('Hauptordner',()=>{folder=null;refresh()}));
 function child(parent,depth,seen){for(const f of folders.filter(x=>x.parent_id===parent)){if(seen.has(f.id))continue;const b=button('　'.repeat(Math.min(depth,5))+'▸ '+f.name,()=>{folder=f.id;refresh()});if(folder===f.id)b.style.borderColor='#e66700';roots.append(b);child(f.id,depth+1,new Set([...seen,f.id]))}}
 child(null,0,new Set());
 for(const f of files){
 const row=document.createElement('div');row.className='cloud-file-row';
 const label=document.createElement('span');label.textContent=f.filename+' · '+(f.size/1024/1024).toFixed(2)+' MB';row.append(label);
 if(/\.pdf$/i.test(f.filename))row.append(button('Lesen',()=>openPdf(f)));
 row.append(button('Herunterladen',()=>download(f)));
 row.append(button('Löschen',()=>removeFile(f)));list.append(row)}
 if(!files.length)list.textContent='In diesem Ordner sind noch keine Dateien.';
}
async function createFolder(){
 if(!enabled())return notice('Bitte zuerst anmelden.');
 const name=prompt('Name des neuen Ordners:');if(!name?.trim())return;
 try{await request('/private/folders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name.trim(),parent_id:folder})});await refresh()}catch(e){notice(e.message)}
}
async function upload(){
 const file=$('cloudFileInput').files?.[0];if(!file)return notice('Bitte eine Datei auswählen.');
 if(file.size>20*1024*1024)return notice('Maximal 20 MB pro Datei.');
 const params=new URLSearchParams({filename:file.name});if(folder)params.set('folder_id',folder);
 try{notice('Upload läuft …');await request('/private/documents?'+params,{method:'POST',headers:{'Content-Type':file.type||'application/octet-stream'},body:file});$('cloudFileInput').value='';await refresh()}catch(e){notice('Upload fehlgeschlagen: '+e.message)}
}
async function getFile(f){return (await request('/private/documents/'+encodeURIComponent(f.id))).blob()}
async function openPdf(f){try{notice('PDF wird privat geladen …');const blob=await getFile(f);await openCloudPdf(new File([blob],f.filename,{type:'application/pdf'}));notice('PDF im Reader geöffnet.')}catch(e){notice(e.message)}}
async function download(f){try{const blob=await getFile(f);const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=f.filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),10000)}catch(e){notice(e.message)}}
async function removeFile(f){if(!confirm('„'+f.filename+'“ dauerhaft aus dem privaten Cloud-Speicher löschen?'))return;try{await request('/private/documents/'+encodeURIComponent(f.id),{method:'DELETE'});await refresh()}catch(e){notice(e.message)}}
$('cloudFolderCreate').onclick=createFolder;$('cloudFileUpload').onclick=upload;$('cloudFilesReload').onclick=refresh;
document.querySelector('[data-tab="files"]').addEventListener('click',()=>{if(enabled())refresh()});
