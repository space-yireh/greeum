import {test} from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {POST as generate} from '../app/api/generate/route';

test('generation logs usage without image or prompt',async()=>{
 const fetchBefore=globalThis.fetch, logBefore=console.log;
 const oldKey=process.env.OPENROUTER_API_KEY,oldOrigin=process.env.APP_ORIGIN;
 process.env.OPENROUTER_API_KEY='test-secret';process.env.APP_ORIGIN='http://localhost:3000';
 const entries:string[]=[];console.log=(...args)=>entries.push(args.join(' '));
 try {
  const png=await sharp({create:{width:16,height:16,channels:3,background:'#123456'}}).png().toBuffer();
  globalThis.fetch=async()=>Response.json({data:[{b64_json:png.toString('base64')}],usage:{prompt_tokens:12,completion_tokens:34,total_tokens:46,cost:0.054}});
  const data=new FormData();data.set('photo',new File([new Uint8Array(png)],'source.png',{type:'image/png'}));data.set('style','cute');data.set('consent','yes');
  const result=await generate(new Request('http://localhost:3000/api/generate',{method:'POST',headers:{origin:'http://localhost:3000','x-vercel-forwarded-for':'test-log'},body:data}));
  assert.equal(result.status,200);const bytes=Buffer.from(await result.arrayBuffer());assert.equal((await sharp(bytes).metadata()).format,'png');
  const record=JSON.parse(entries.find(x=>x.includes('image_generation'))!);
  assert.equal(record.request_id,result.headers.get('x-request-id'));assert.equal(record.cost_usd,0.054);assert.equal(record.total_tokens,46);assert.equal(record.image_width,16);assert.equal(record.style_reference,false);
  assert.ok(!JSON.stringify(record).includes('test-secret'));assert.ok(!JSON.stringify(record).includes(png.toString('base64')));assert.ok(!('prompt' in record));
 }finally{globalThis.fetch=fetchBefore;console.log=logBefore;if(oldKey===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=oldKey;if(oldOrigin===undefined)delete process.env.APP_ORIGIN;else process.env.APP_ORIGIN=oldOrigin;}
});
