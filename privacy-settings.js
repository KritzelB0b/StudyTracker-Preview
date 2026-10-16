(()=>{
const $p=id=>document.getElementById(id),api='https://studytracker-api-production-7134.up.railway.app';
function token(){return sessionStorage.getItem('studytracker_cloud_token')||''}
async function req(path,options={}){if(!token())throw Error('Bitte zuerst im Bereich Railway anmelden.');const r=await fetch(api+path,{...options,headers:{Authorization:'Bearer '+token(),...(options.headers||{})}});if(!r.ok)throw Error('HTTP '+r.status+': '+await r.text());return r}
async function loadPrefs(){if(!token())return;try{const d=await (await req('/privacy')).json();$p('pubEnabled').checked=d.enabled;document.querySelectorAll('.pubField').forEach(el=>el.checked=d.fields.includes(el.value))}catch(e){$p('pubInfo').textContent=e.message}}
$p('pubSave').addEventListener('click',async()=>{try{const fields=[...document.querySelectorAll('.pubField:checked')].map(x=>x.value);await req('/privacy',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:$p('pubEnabled').checked,fields})});$p('pubInfo').textContent='Freigabe gespeichert.'}catch(e){$p('pubInfo').textContent=e.message}});
document.querySelectorAll('[data-tab="settings"]').forEach(el=>el.addEventListener('click',()=>{loadPrefs()}));$p('cloudLogin')?.addEventListener('click',()=>setTimeout(()=>{loadPrefs()},1700));
})();

