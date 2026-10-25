import {test} from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { normalizeMonochrome } from '../lib/generation';
import { BASE_STYLE_PROMPT, STYLE_PROMPTS } from '../lib/prompts';
import {POST} from '../app/api/generate/route';
test('API consent, origin, decoding, sanitized forwarding and provider failures',async()=>{
 process.env.APP_ORIGIN='http://localhost:3000';process.env.OPENROUTER_API_KEY='test-only';
 let serial=0; const originalFetch=globalThis.fetch;
 const png=await sharp({create:{width:8,height:8,channels:3,background:'#abcdef'}}).png().toBuffer();
 function request(consent='yes',bytes=png,origin='http://localhost:3000') {const f=new FormData();f.set('photo',new File([new Uint8Array(bytes)],'photo.png',{type:'image/png'}));f.set('style','cute');f.set('consent',consent);return new Request('http://localhost:3000/api/generate',{method:'POST',headers:{origin,'x-vercel-forwarded-for':`test-${serial++}`},body:f});}
 try {
  globalThis.fetch=async(url,init)=>{assert.equal(url,'https://openrouter.ai/api/v1/images');const body=JSON.parse(init!.body as string);assert.equal(body.n,1);assert.equal(body.aspect_ratio,'1:1');assert.ok(body.prompt.includes(BASE_STYLE_PROMPT));assert.ok(body.prompt.includes(STYLE_PROMPTS.cute));const image=body.input_references[0].image_url.url;assert.match(image,/^data:image\/jpeg;base64,/);assert.equal((await sharp(Buffer.from(image.split(',')[1],'base64')).metadata()).exif,undefined);return Response.json({data:[{b64_json:png.toString('base64')}]});};
  assert.equal((await POST(request('no'))).status,400);
  assert.equal((await POST(request('yes',png,'http://evil.example'))).status,403);
  assert.equal((await POST(request('yes',Buffer.from('fake')))).status,400);
  const good=await POST(request());assert.equal(good.status,200);assert.equal(good.headers.get('Content-Type'),'image/png');assert.deepEqual(Buffer.from(await good.arrayBuffer()),await normalizeMonochrome(png));
  globalThis.fetch=async()=>new Response('private upstream detail',{status:402});const fail=await POST(request());assert.equal(fail.status,502);assert.doesNotMatch(await fail.text(),/private upstream/);
  globalThis.fetch=async()=>Response.json({error:{message:'User not found.'}},{status:401});const auth=await POST(request());assert.equal(auth.status,502);assert.match((await auth.json()).error,/API 키 인증/);
  globalThis.fetch=async()=>Response.json({data:[]});assert.equal((await POST(request())).status,502);
  delete process.env.OPENROUTER_API_KEY;assert.equal((await POST(request())).status,503);
 }finally{globalThis.fetch=originalFetch;delete process.env.OPENROUTER_API_KEY;delete process.env.APP_ORIGIN;}
});
