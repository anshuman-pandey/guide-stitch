import {MAX_STEPS, imageURL, patchGuide, publicSource, text} from './core.js';
let serial=Promise.resolve();
const enqueue=fn=>{const run=serial.then(fn,fn);serial=run.catch(()=>{});return run;};
async function state(){const s=await chrome.storage.local.get('cabinet');return s.cabinet||{guides:[],active:null};}
async function save(s){await chrome.storage.local.set({cabinet:s});}
async function run(message){
 const s=await state();
 if(message.op==='list')return {guides:s.guides.map(({steps,...g})=>({...g,count:steps.length})),active:s.active};
 if(message.op==='create'){
  if(s.guides.length>=30)throw Error('Local library is full (30 guides). Export and delete a guide to continue.');
  const g={id:crypto.randomUUID(),title:text(message.title||'Untitled guide',120),description:'',revision:0,steps:[],updated:new Date().toISOString()};
  s.guides.unshift(g);s.active=g.id;await save(s);return g;
 }
 if(message.op==='active'){
  if(!s.guides.some(g=>g.id===message.id))throw Error('Guide not found.');
  s.active=message.id;await save(s);return true;
 }
 if(message.op==='capture'){
  const guide=s.guides.find(g=>g.id===s.active);if(!guide)throw Error('Create or select a guide first.');
  if(guide.steps.length>=MAX_STEPS)throw Error(`This guide has ${MAX_STEPS} steps. Start another guide.`);
  const [tab]=await chrome.tabs.query({active:true,lastFocusedWindow:true});
  if(!tab || (message.tabId && tab.id!==message.tabId))throw Error('The active tab changed. Open the extension on the page to capture.');
  if(!tab.url)throw Error('Page access is not granted. Click the extension toolbar icon on the page you want to capture, then try again.');
  const source=publicSource(tab.url);
  const image=imageURL(await chrome.tabs.captureVisibleTab(tab.windowId,{format:'png'}));
  const [after]=await chrome.tabs.query({active:true,windowId:tab.windowId});
  if(after?.id!==tab.id || after?.url!==tab.url)throw Error('The page changed during capture. Try again after it settles.');
  guide.steps.push({id:crypto.randomUUID(),caption:`Step ${guide.steps.length+1}`,source,image});guide.revision++;guide.updated=new Date().toISOString();await save(s);
  await chrome.action.setBadgeText({text:String(guide.steps.length)});return {count:guide.steps.length,id:guide.id};
 }
 const index=s.guides.findIndex(g=>g.id===message.id);if(index<0)throw Error('Guide not found.');
 if(message.op==='get')return s.guides[index];
 if(message.op==='update'){s.guides[index]=patchGuide(s.guides[index],message);await save(s);return s.guides[index];}
 if(message.op==='delete'){
  if(message.revision!==s.guides[index].revision)throw Error('Guide changed. Reload before deleting.');
  s.guides.splice(index,1);if(s.active===message.id)s.active=null;await save(s);return true;
 }
 throw Error('Unknown operation.');
}
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
 if(sender.id!==chrome.runtime.id)return false;
 enqueue(()=>run(message)).then(data=>respond({ok:true,data}),e=>respond({ok:false,error:e.message}));return true;
});
chrome.commands.onCommand.addListener(command=>{
 if(command==='capture-step')enqueue(()=>run({op:'capture'})).catch(async e=>{
  await chrome.storage.local.set({captureError:e.message});await chrome.action.setBadgeText({text:'!'});
 });
});
