import {test} from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {makeDownloadToken} from '../lib/download-token';
import {POST as download} from '../app/api/download/route';
import {POST as generate} from '../app/api/generate/route';

test('generation logs usage without image or prompt; signed download returns the exact PNG',async()=>{
 const fetchBefore=globalThis.fetch, logBefore=console.log;
 const oldKey=process.env.OPENROUTER_API_KEY,oldOrigin=process.env.APP_ORIGIN;
 process.env.OPENROUTER_API_KEY='test-secret';process.env.APP_ORIGIN='http://localhost:3000';
 const entries:string[]=[];console.log=(...args)=>entries.push(args.join(' '));
 try {
  const png=await sharp({create:{width:16,height:16,channels:3,background:'#123456'}}).png().toBuffer();
  globalThis.fetch=async()=>Response.json({data:[{b64_json:png.toString('base64')}],usage:{prompt_tokens:12,completion_tokens:34,total_tokens:46,cost:0.054}});
  const data=new FormData();data.set('photo',new File([new Uint8Array(png)],'source.png',{type:'image/png'}));data.set('style','cute');data.set('consent','yes');
  const result=await generate(new Request('http://localhost:3000/api/generate',{method:'POST',headers:{origin:'http://localhost:3000','x-vercel-forwarded-for':'test-log'},body:data}));
  assert.equal(result.status,200);const bytes=Buffer.from(await result.arrayBuffer());const token=result.headers.get('x-download-token')!;
  const record=JSON.parse(entries.find(x=>x.includes('image_generation'))!);
  assert.equal(record.request_id,result.headers.get('x-request-id'));assert.equal(record.cost_usd,0.054);assert.equal(record.total_tokens,46);assert.equal(record.image_width,16);assert.equal(record.style_reference,false);
  assert.ok(!JSON.stringify(record).includes('test-secret'));assert.ok(!JSON.stringify(record).includes(png.toString('base64')));assert.ok(!('prompt' in record));
  function request(t:string,origin='http://localhost:3000'){
   const f=new FormData();f.set('image',new File([new Uint8Array(bytes)],'image.png',{type:'image/png'}));f.set('filename','greeum_cute_20261027_233501_0123456789abcdef.png');f.set('token',t);
   return new Request('http://localhost:3000/api/download',{method:'POST',headers:{origin,'x-vercel-forwarded-for':`download-${t.slice(-8)}`},body:f});
  }
  const out=await download(request(token));assert.equal(out.status,200);assert.equal(out.headers.get('content-type'),'image/png');assert.match(out.headers.get('content-disposition')!,/^attachment;/);assert.equal(Number(out.headers.get('content-length')),bytes.length);assert.deepEqual(Buffer.from(await out.arrayBuffer()),bytes);
  assert.equal((await download(request(makeDownloadToken(bytes,Date.now()-31*60*1000)))).status,403);
  assert.equal((await download(request(token,'https://evil.example'))).status,403);
 }finally{globalThis.fetch=fetchBefore;console.log=logBefore;if(oldKey===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=oldKey;if(oldOrigin===undefined)delete process.env.APP_ORIGIN;else process.env.APP_ORIGIN=oldOrigin;}
});
