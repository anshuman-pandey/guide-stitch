import test from 'node:test';import assert from 'node:assert/strict';
let storage={},listener,command,failCapture=false,missingURL=false;
const png='data:image/png;base64,iVBORw0KGgo=';
globalThis.chrome={runtime:{id:'test-extension',onMessage:{addListener(fn){listener=fn;}}},commands:{onCommand:{addListener(fn){command=fn;}}},storage:{local:{async get(key){return structuredClone({[key]:storage[key]});},async set(value){Object.assign(storage,structuredClone(value));}}},tabs:{async query(){return [{id:3,windowId:1,url:missingURL?undefined:'https://example.test/private?token=secret'}];},async captureVisibleTab(){if(failCapture)throw Error('activeTab permission missing');return png;}},action:{async setBadgeText(){}}};
await import('./worker.js');
const send=message=>new Promise(resolve=>listener(message,{id:'test-extension'},resolve));
test('capture persists step and removes URL secrets',async()=>{storage={};let r=await send({op:'create',title:'Test'});assert.ok(r.ok);r=await send({op:'capture',tabId:3});assert.ok(r.ok);assert.equal(storage.cabinet.guides[0].steps[0].source,'https://example.test');assert.equal(storage.cabinet.guides[0].revision,1);});
test('simultaneous captures serialize without losing a step',async()=>{storage={};await send({op:'create',title:'Test'});await Promise.all([send({op:'capture'}),send({op:'capture'})]);assert.equal(storage.cabinet.guides[0].steps.length,2);});
test('permission failure leaves stored guide unchanged',async()=>{storage={};await send({op:'create',title:'Test'});failCapture=true;const r=await send({op:'capture'});failCapture=false;assert.equal(r.ok,false);assert.equal(storage.cabinet.guides[0].steps.length,0);});
test('wrong tab refuses capture',async()=>{storage={};await send({op:'create',title:'Test'});assert.equal((await send({op:'capture',tabId:99})).ok,false);});
test('stale editor cannot overwrite captured step',async()=>{storage={};const g=(await send({op:'create',title:'Test'})).data;await send({op:'capture'});assert.equal((await send({op:'update',id:g.id,revision:0,title:'Stale'})).ok,false);assert.equal(storage.cabinet.guides[0].steps.length,1);});
test('guide delete clears active reference and images',async()=>{storage={};const g=(await send({op:'create',title:'Test'})).data;await send({op:'capture'});assert.ok((await send({op:'delete',id:g.id,revision:1})).ok);assert.equal(storage.cabinet.active,null);assert.deepEqual(storage.cabinet.guides,[]);});
test('foreign sender rejected',()=>assert.equal(listener({op:'list'},{id:'other'},()=>{}),false));

test('missing activeTab permission gives a useful recovery action',async()=>{storage={};await send({op:'create',title:'Test'});missingURL=true;try{const r=await send({op:'capture'});assert.equal(r.ok,false);assert.match(r.error,/toolbar icon/);assert.equal(storage.cabinet.guides[0].steps.length,0);}finally{missingURL=false;}});
