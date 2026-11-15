const $=id=>document.getElementById(id);
async function api(message){const r=await chrome.runtime.sendMessage(message);if(!r.ok)throw Error(r.error);return r.data;}
async function refresh(){const s=await api({op:'list'});$('guides').replaceChildren(...s.guides.map(g=>{const o=document.createElement('option');o.value=g.id;o.textContent=`${g.title} (${g.count})`;o.selected=g.id===s.active;return o;}));$('capture').disabled=!s.active;$('edit').disabled=!s.guides.length;}
async function perform(fn){for(const b of document.querySelectorAll('button'))b.disabled=true;try{await fn();}catch(e){I18n.text($('status'), e.message);}finally{await refresh();$('create').disabled=false;}}
$('create').onclick=()=>perform(async()=>{await api({op:'create',title:$('title').value.trim()||'Untitled guide'});I18n.text($('status'), 'Ready. Capture your first step.');});
$('guides').onchange=()=>perform(()=>api({op:'active',id:$('guides').value}));
$('capture').onclick=()=>perform(async()=>{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});const s=await api({op:'capture',tabId:tab.id});I18n.text($('status'), "Step {0} captured. Review it before sharing.", {0: s.count});});
$('edit').onclick=()=>chrome.tabs.create({url:chrome.runtime.getURL('editor.html')+'?id='+encodeURIComponent($('guides').value)});
await refresh();const {captureError}=await chrome.storage.local.get('captureError');if(captureError){I18n.text($('status'), captureError);await chrome.storage.local.remove('captureError');}
