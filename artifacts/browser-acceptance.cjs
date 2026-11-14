const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
 const ext=require('path').resolve(__dirname,'..');
 const context=await chromium.launchPersistentContext('/tmp/step-cabinet-test-'+Date.now(),{executablePath:process.env.CHROMIUM_EXECUTABLE || chromium.executablePath(),headless:true,args:['--no-sandbox','--disable-extensions-except='+ext,'--load-extension='+ext],viewport:{width:1280,height:1000},acceptDownloads:true});
 let worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');const id=new URL(worker.url()).host;
 console.log('Loaded real extension:',id);
 const editor=await context.newPage();await editor.goto('chrome-extension://'+id+'/popup.html');
 await editor.getByLabel('New guide').fill('Publish your first guide');await editor.getByRole('button',{name:'Create guide'}).click();await editor.waitForFunction(()=>document.querySelector('#status').textContent.includes('Ready'));
 const data=await worker.evaluate(()=>chrome.storage.local.get('cabinet'));const gid=data.cabinet.active;
 const fixture=await context.newPage();await fixture.setContent('<html><body style="margin:0;background:white"><h1>Example workflow</h1><div style="background:red;width:300px;height:180px">PRIVATE TEST TEXT</div><p>All content in this test is synthetic.</p></body></html>');
 const screenshot=(await fixture.screenshot()).toString('base64');
 // Seed one synthetic step to exercise actual extension storage/editor. This does not validate capture permission.
 await worker.evaluate(async({gid,png})=>{const {cabinet}=await chrome.storage.local.get('cabinet');const g=cabinet.guides.find(x=>x.id===gid);g.steps.push({id:'fixture-step',caption:'Review the synthetic example',source:'https://example.test',image:'data:image/png;base64,'+png});g.revision++;await chrome.storage.local.set({cabinet});},{gid,png:screenshot});
 await editor.goto('chrome-extension://'+id+'/editor.html?id='+gid);await editor.locator('canvas').waitFor();await editor.waitForFunction(()=>document.querySelector('canvas').width>300);
 await editor.getByLabel('Introduction').fill('A portable guide with no hosted dependencies.');await editor.getByLabel('Introduction').blur();await editor.waitForFunction(()=>document.querySelector('#status').textContent.includes('Saved'));
 editor.on('dialog',d=>d.accept());await editor.getByRole('button',{name:'Redact private details'}).click();await editor.locator('canvas').scrollIntoViewIfNeeded();await editor.waitForFunction(()=>document.querySelector('canvas').width>300);const box=await editor.locator('canvas').boundingBox();await editor.mouse.move(box.x+30,box.y+20);await editor.mouse.down();await editor.mouse.move(box.x+160,box.y+130);await editor.mouse.up();await editor.waitForTimeout(300);
 const stored=await worker.evaluate(()=>chrome.storage.local.get('cabinet'));if(stored.cabinet.guides[0].steps[0].image==='data:image/png;base64,'+screenshot)throw Error('Redaction not persisted');
 await editor.reload();await editor.waitForFunction(()=>document.querySelector('canvas')?.width>300);
 const pixel=await editor.locator('canvas').evaluate(c=>{const b=c.getBoundingClientRect();return [...c.getContext('2d').getImageData(80*c.width/b.width,60*c.height/b.height,1,1).data]});if(pixel.slice(0,3).some(v=>v!==0))throw Error('Redaction was not solid black after reload: '+pixel);
 await editor.screenshot({path:ext+'/artifacts/editor.png',fullPage:true});
 const htmlDownload=editor.waitForEvent('download');await editor.getByRole('button',{name:'Export HTML',exact:true}).click();await (await htmlDownload).saveAs('/tmp/steps-export.html');
 const zipDownload=editor.waitForEvent('download');await editor.getByRole('button',{name:'Export Markdown + images'}).click();await (await zipDownload).saveAs('/tmp/steps-export.zip');
 const exported=await context.newPage();await exported.goto('file:///tmp/steps-export.html');if(!await exported.getByRole('heading',{name:'Publish your first guide',exact:true}).isVisible())throw Error('Export title missing');
 await editor.getByRole('button',{name:'Delete guide'}).click();await editor.getByRole('heading',{name:'Guide deleted.'}).waitFor();
 console.log('PASS real extension create/edit/redact/reload/export HTML/export ZIP/delete; synthetic image fixture; capture permission NOT tested');await context.close();
})();
