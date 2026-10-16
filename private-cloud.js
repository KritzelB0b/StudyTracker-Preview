import {openCloudPdf} from './pdf-reader.js';
const API='https://studytracker-privatefiles-api-test.up.railway.app';
const $=id=>document.getElementById(id);
const token=()=>sessionStorage.getItem('studytracker_test_cloud_token')||'';
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
 folders=await f.json();files=await d.json();paint();await showStorage();notice('Privater Cloud-Dateispeicher verbunden.');
 }catch(e){notice(e.message.includes('404')?'Datei-API noch nicht auf Railway bereitgestellt (HTTP 404). Der Backend-Code ist derzeit nur im Entwicklungsbranch.':e.message)}
}
function paint(){
 const roots=$('cloudFolderTree'),list=$('cloudFileList');roots.replaceChildren();list.replaceChildren();
 roots.append(button('Hauptordner',()=>{folder=null;refresh()}));
 function child(parent,depth,seen){for(const f of folders.filter(x=>x.parent_id===parent)){if(seen.has(f.id))continue;const b=button('　'.repeat(Math.min(depth,5))+'▸ '+f.name,()=>{folder=f.id;refresh()});if(folder===f.id)b.style.borderColor='#e66700';roots.append(b);const controls=document.createElement('div');controls.className='cloud-folder-actions';controls.append(button('Umbenennen',()=>renameFolder(f)),button('Verschieben',()=>moveFolder(f)),button('Löschen',()=>removeFolder(f)));roots.append(controls);child(f.id,depth+1,new Set([...seen,f.id]))}}
 child(null,0,new Set());
 for(const f of files){
 const row=document.createElement('div');row.className='cloud-file-row';
 const label=document.createElement('span');label.textContent=f.filename+' · '+(f.size/1024/1024).toFixed(2)+' MB';row.append(label);
 if(/\.pdf$/i.test(f.filename))row.append(button('Lesen',()=>openPdf(f)));
 row.append(button('Umbenennen',()=>renameFile(f)));row.append(button('Verschieben',()=>moveFile(f)));row.append(button('Herunterladen',()=>download(f)));
 row.append(button('Löschen',()=>removeFile(f)));list.append(row)}
 if(!files.length)list.textContent='In diesem Ordner sind noch keine Dateien.';
}
function destinations(){return [{id:null,name:'Hauptordner'},...folders.map(f=>({id:f.id,name:f.name}))]}
function askDestination(current,except=[]){
 const options=destinations().filter(f=>!except.includes(f.id));
 const answer=prompt('Zielordner auswählen (Nummer):\\n'+options.map((f,i)=>(i+1)+'. '+f.name+(f.id===current?' (aktuell)':'')).join('\\n'));
 if(answer===null)return undefined;
 const i=Number(answer)-1;if(!Number.isInteger(i)||i<0||i>=options.length){notice('Ungültiger Zielordner.');return undefined}
 return options[i].id;
}
async function update(path,payload){await request(path,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});await refresh()}
async function renameFile(file){const name=prompt('Dateiname ändern (Dateiendung beibehalten):',file.filename);if(name===null||!name.trim()||name===file.filename)return;try{await update('/private/documents/'+file.id,{filename:name.trim()})}catch(e){notice(e.message)}}
async function moveFile(file){const destination=askDestination(file.folder_id);if(destination===undefined||destination===file.folder_id)return;try{await update('/private/documents/'+file.id,{folder_id:destination})}catch(e){notice(e.message)}}
async function renameFolder(dir){const name=prompt('Ordner umbenennen:',dir.name);if(name===null||!name.trim()||name===dir.name)return;try{await update('/private/folders/'+dir.id,{name:name.trim()})}catch(e){notice(e.message)}}
async function moveFolder(dir){const destination=askDestination(dir.parent_id,[dir.id]);if(destination===undefined||destination===dir.parent_id)return;try{await update('/private/folders/'+dir.id,{parent_id:destination})}catch(e){notice(e.message)}}
async function removeFolder(dir){if(!confirm('Leeren Ordner „'+dir.name+'“ löschen? Ordner mit Dateien oder Unterordnern werden nicht gelöscht.'))return;try{await request('/private/folders/'+dir.id,{method:'DELETE'});if(folder===dir.id)folder=null;await refresh()}catch(e){notice(e.message)}}
async function showStorage(){try{const res=await request('/private/storage');const d=await res.json();const mb=n=>(n/1024/1024).toFixed(1);$('cloudStorageUsage').textContent=mb(d.used_bytes)+' MB von '+mb(d.quota_bytes)+' MB verwendet · '+d.file_count+' Dateien · '+d.folder_count+' Ordner';}catch(e){$('cloudStorageUsage').textContent='Speicherinformationen nicht verfügbar: '+e.message}}
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
async function openPdf(f){try{notice('PDF wird privat geladen …');const blob=await getFile(f);await openCloudPdf(new File([blob],f.filename,{type:'application/pdf'}),f.id);notice('PDF im Reader geöffnet.')}catch(e){notice(e.message)}}
async function download(f){try{const blob=await getFile(f);const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=f.filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),10000)}catch(e){notice(e.message)}}
async function removeFile(f){if(!confirm('„'+f.filename+'“ dauerhaft aus dem privaten Cloud-Speicher löschen?'))return;try{await request('/private/documents/'+encodeURIComponent(f.id),{method:'DELETE'});await refresh()}catch(e){notice(e.message)}}
async function testLogin(mode){const password=$('cloudTestPassword').value;if(password.length<12)return notice('Testpasswort benötigt mindestens 12 Zeichen.');try{const res=await fetch(API+'/auth/'+mode,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'studytracker-test@example.com',password})});if(!res.ok){const e=await res.json();throw Error(typeof e.detail==='string'?e.detail:'HTTP '+res.status)}const d=await res.json();sessionStorage.setItem('studytracker_test_cloud_token',d.token);$('cloudTestPassword').value='';await refresh()}catch(e){notice(e.message)}}
$('cloudTestRegister').onclick=()=>testLogin('register');$('cloudTestLogin').onclick=()=>testLogin('login');
$('cloudFolderCreate').onclick=createFolder;$('cloudFileUpload').onclick=upload;$('cloudFilesReload').onclick=refresh;
document.querySelector('[data-tab="files"]').addEventListener('click',()=>{if(enabled())refresh()});
