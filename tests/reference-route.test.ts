import {test} from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {POST} from '../app/api/generate/route';
import {loadStyleReference} from '../lib/generation';

test('route sends only the identity image and rejects removed styles',async()=>{
 const saved={...process.env}; const original=globalThis.fetch;
 try {
  process.env.APP_ORIGIN='http://localhost:3000';process.env.OPENROUTER_API_KEY='mock';
  process.env.CARICATURE_STYLE_REFERENCE_PATH='assets/style-reference.png';
  assert.equal(await loadStyleReference('cute'),undefined);
  const photo=await sharp({create:{width:8,height:8,channels:3,background:'#abc'}}).png().toBuffer();
  let calls=0;
  globalThis.fetch=async(_url,init)=>{calls++;const body=JSON.parse(init!.body as string);assert.equal(body.input_references.length,1);assert.match(body.input_references[0].image_url.url,/^data:image\/jpeg;base64,/);return Response.json({data:[{b64_json:photo.toString('base64')}]});};
  for(const style of ['cute','similar','funny']) {
   const form=new FormData();form.set('photo',new File([new Uint8Array(photo)],'photo.png',{type:'image/png'}));form.set('style',style);form.set('consent','yes');
   const req=new Request('http://localhost:3000/api/generate',{method:'POST',headers:{origin:'http://localhost:3000','x-vercel-forwarded-for':`ref-${style}`},body:form});
   assert.equal((await POST(req)).status,style==='cute'?200:400);
  }
  assert.equal(calls,1);
 } finally {globalThis.fetch=original;process.env=saved;}
});
