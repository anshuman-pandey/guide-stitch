import {exportHTML,exportMarkdown,zipFiles} from './core.js';
const $=id=>document.getElementById(id),id=new URL(location.href).searchParams.get('id');let guide,queue=Promise.resolve();
async function api(message){const r=await chrome.runtime.sendMessage(message);if(!r.ok)throw Error(r.error);return r.data;}
function task(fn){queue=queue.then(fn).catch(e=>{I18n.text($('status'), e.message);});return queue;}
function mutate(patch){return task(async()=>{guide=await api({op:'update',id,revision:guide.revision,...patch});I18n.text($('status'), 'Saved on this device.');renderSteps();});}
function element(tag,content,values){const e=document.createElement(tag);if(content!==undefined)I18n.text(e,content,values);return e;}
function button(label,fn,style='quiet'){const e=element('button',label);e.className=style;e.onclick=fn;return e;}
function renderSteps(){
 $('steps').replaceChildren();$('empty').hidden=!!guide.steps.length;
 for(const [i,s] of guide.steps.entries()){
  const article=element('article'),bar=element('div');bar.className='stepbar';bar.append(element('h2','Step {0}',{0:i+1}));
  const up=button('↑ Move up',()=>mutate({move:{id:s.id,delta:-1}}));up.disabled=i===0;
  const down=button('↓ Move down',()=>mutate({move:{id:s.id,delta:1}}));down.disabled=i===guide.steps.length-1;
  bar.append(up,down,button('Remove step',()=>{if(confirm(I18n.t('Permanently remove this step? Exported copies are unaffected.')))mutate({remove:s.id});},'danger'));article.append(bar);
  const label=element('label','Explain this step'),caption=element('textarea');caption.rows=3;caption.maxLength=2000;caption.value=s.caption;caption.onchange=()=>mutate({step:{id:s.id,caption:caption.value}});label.append(caption);article.append(label);
  const canvas=element('canvas');canvas.setAttribute('aria-label',`Screenshot for step ${i+1}`);const image=new Image(),context=canvas.getContext('2d');let redact=false,start;
  image.onload=()=>{canvas.width=image.width;canvas.height=image.height;context.drawImage(image,0,0);};image.src=s.image;
  const enable=button('Redact private details',()=>{if(confirm(I18n.t('Drag across private details to replace those pixels permanently. This cannot be undone. Continue?'))){redact=true;canvas.classList.add('redacting');I18n.text(enable, 'Drag a rectangle over private details');}});
  article.append(enable,canvas);
  const coordinate=e=>{const box=canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(canvas.width,(e.clientX-box.left)*canvas.width/box.width)),y:Math.max(0,Math.min(canvas.height,(e.clientY-box.top)*canvas.height/box.height))};};
  canvas.onpointerdown=e=>{if(redact){start=coordinate(e);canvas.setPointerCapture(e.pointerId);}};
  canvas.onpointermove=e=>{if(!start)return;const p=coordinate(e);context.drawImage(image,0,0);context.strokeStyle='#e73729';context.lineWidth=3;context.strokeRect(start.x,start.y,p.x-start.x,p.y-start.y);};
  canvas.onpointercancel=()=>{start=null;context.drawImage(image,0,0);};
  canvas.onpointerup=e=>{if(!start)return;const p=coordinate(e),x=Math.floor(Math.min(start.x,p.x)),y=Math.floor(Math.min(start.y,p.y)),w=Math.ceil(Math.abs(p.x-start.x)),h=Math.ceil(Math.abs(p.y-start.y));start=null;context.drawImage(image,0,0);if(w<2||h<2)return;context.fillStyle='#000';context.fillRect(x,y,w,h);redact=false;mutate({step:{id:s.id,image:canvas.toDataURL('image/png')}});};
  const source=element('small',`Captured on ${s.source}. Page paths and tokens were not stored.`);article.append(source);$('steps').append(article);
 }
}
function download(name,data,type){const blob=new Blob([data],{type}),url=URL.createObjectURL(blob),a=element('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
function slug(){return guide.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,60)||'guide';}
$('title').onchange=()=>mutate({title:$('title').value});$('description').onchange=()=>mutate({description:$('description').value});
$('html').onclick=()=>task(async()=>{if(!guide.steps.length)throw Error('Capture at least one step before exporting.');download(slug()+'.html',exportHTML(guide),'text/html');I18n.text($('status'), 'HTML exported. All images are included; no server required.');});
$('markdown').onclick=()=>task(async()=>{if(!guide.steps.length)throw Error('Capture at least one step before exporting.');const files=[{name:'guide.md',data:exportMarkdown(guide)},...guide.steps.map((s,i)=>({name:`step-${i+1}.png`,data:Uint8Array.from(atob(s.image.split(',')[1]),c=>c.charCodeAt(0))}))];download(slug()+'.zip',zipFiles(files),'application/zip');I18n.text($('status'), 'Markdown and screenshots exported in one ZIP.');});
$('delete').onclick=()=>task(async()=>{if(confirm(I18n.t('Permanently delete this guide and its screenshots from this device?'))){await api({op:'delete',id,revision:guide.revision});document.querySelector('main').replaceChildren(element('h1','Guide deleted.'),element('p','Open the extension to start a new guide.'));}});
try{guide=await api({op:'get',id});$('title').value=guide.title;$('description').value=guide.description;renderSteps();I18n.text($('status'), 'All changes stay on this device.');}catch(e){I18n.text($('status'), e.message);for(const b of document.querySelectorAll('button'))b.disabled=true;}
