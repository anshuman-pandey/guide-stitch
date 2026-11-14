export const MAX_STEPS = 40;
export const MAX_IMAGE = 12 * 1024 * 1024;
export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function imageURL(value) {
  if(typeof value !== 'string' || value.length > MAX_IMAGE || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value)) throw Error('Invalid or oversized PNG image.');
  return value;
}
export function text(value, limit) {
  if(typeof value !== 'string' || value.length > limit) throw Error(`Text must be at most ${limit} characters.`);
  return value;
}
export function publicSource(url) {
  const parsed = new URL(url);
  if(!['http:','https:'].includes(parsed.protocol)) throw Error('Capture a regular HTTP or HTTPS page. Browser settings and extension pages are not supported.');
  return parsed.origin; // Do not retain paths, query tokens or fragment secrets.
}
export function patchGuide(guide, input) {
  if(input.revision !== guide.revision) throw Error('This guide changed in another tab. Reload before editing.');
  const result = structuredClone(guide);
  if(input.title !== undefined) result.title = text(input.title, 120).trim() || 'Untitled guide';
  if(input.description !== undefined) result.description = text(input.description, 2000);
  if(input.step) {
    const step = result.steps.find(s=>s.id===input.step.id);
    if(!step) throw Error('Step no longer exists.');
    if(input.step.caption !== undefined) step.caption=text(input.step.caption,2000);
    if(input.step.image !== undefined) step.image=imageURL(input.step.image);
  }
  if(input.remove) result.steps=result.steps.filter(s=>s.id!==input.remove);
  if(input.move) {
    const index=result.steps.findIndex(s=>s.id===input.move.id);
    const dest=index+input.move.delta;
    if(index<0 || ![-1,1].includes(input.move.delta) || dest<0 || dest>=result.steps.length) throw Error('Cannot move this step.');
    [result.steps[index],result.steps[dest]]=[result.steps[dest],result.steps[index]];
  }
  result.revision++;
  result.updated=new Date().toISOString();
  return result;
}
export function exportHTML(guide) {
  const esc=escapeHTML;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${esc(guide.title)}</title><style>body{font:17px/1.6 system-ui;max-width:900px;margin:50px auto;padding:0 24px;color:#193f35}h1{font-size:44px}section{margin:48px 0;break-inside:avoid}img{width:100%;border:1px solid #ddd;border-radius:8px}p{white-space:pre-wrap;overflow-wrap:anywhere}small{color:#53655c}@media print{body{margin:0}}</style></head><body><small>STEP-BY-STEP GUIDE</small><h1>${esc(guide.title)}</h1><p>${esc(guide.description)}</p>${guide.steps.map((s,i)=>`<section><h2>Step ${i+1}</h2><p>${esc(s.caption)}</p><img src="${imageURL(s.image)}" alt="Screenshot for step ${i+1}"></section>`).join('')}<small>Created with Guide Stitch. Review screenshots before sharing.</small></body></html>`;
}
export function exportMarkdown(guide) {
  // Markdown plus inline data URIs is not portable between renderers; export images separately.
  const clean=v=>String(v).replace(/([\\`*_{}\[\]()#+.!|~-])/g,'\\$1').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return `# ${clean(guide.title)}\n\n${clean(guide.description)}\n\n`+guide.steps.map((s,i)=>`## Step ${i+1}\n\n${clean(s.caption)}\n\n![Screenshot for step ${i+1}](step-${i+1}.png)\n`).join('\n');
}
export function zipFiles(files) {
 const encoder=new TextEncoder(),parts=[],central=[];let offset=0;
 function crc32(bytes){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let k=0;k<8;k++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
 function header(size){const a=new Uint8Array(size);return [a,new DataView(a.buffer)];}
 for(const file of files){
  const name=encoder.encode(file.name),data=typeof file.data==='string'?encoder.encode(file.data):file.data,crc=crc32(data);
  const [local,v]=header(30);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,33,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);
  parts.push(local,name,data);
  const [entry,e]=header(46);e.setUint32(0,0x02014b50,true);e.setUint16(4,20,true);e.setUint16(6,20,true);e.setUint16(8,0x800,true);e.setUint16(14,33,true);e.setUint32(16,crc,true);e.setUint32(20,data.length,true);e.setUint32(24,data.length,true);e.setUint16(28,name.length,true);e.setUint32(42,offset,true);central.push(entry,name);offset+=local.length+name.length+data.length;
 }
 const centralLength=central.reduce((n,a)=>n+a.length,0);const [end,e]=header(22);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,centralLength,true);e.setUint32(16,offset,true);
 const all=[...parts,...central,end],result=new Uint8Array(all.reduce((n,a)=>n+a.length,0));let p=0;for(const a of all){result.set(a,p);p+=a.length;}return result;
}
