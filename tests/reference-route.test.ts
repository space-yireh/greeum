import {test} from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {POST} from '../app/api/generate/route';
import {loadStyleReference} from '../lib/generation';

test('route forwards identity first and the selected single style image second',async()=>{
 const saved={...process.env}; const original=globalThis.fetch;
 try {
  process.env.APP_ORIGIN='http://localhost:3000'; process.env.OPENROUTER_API_KEY='mock';
  process.env.CARICATURE_STYLE_REFERENCE_PATH='assets/style-reference.png';
  const photo=await sharp({create:{width:8,height:8,channels:3,background:'#abc'}}).png().toBuffer();
  const references: (string | undefined)[]=[];
  for(const style of ['cute','similar'] as const){
   const expected=await loadStyleReference(style);
   globalThis.fetch=async(_url,init)=>{
    const body=JSON.parse(init!.body as string);
    assert.equal(body.input_references.length,2);
    assert.match(body.input_references[0].image_url.url,/^data:image\/jpeg;base64,/);
    assert.equal(body.input_references[1].image_url.url,expected);
    references.push(expected);
    return Response.json({data:[{b64_json:photo.toString('base64')}]});
   };
   const form=new FormData(); form.set('photo',new File([new Uint8Array(photo)],'photo.png',{type:'image/png'}));form.set('style',style);form.set('consent','yes');
   const req=new Request('http://localhost:3000/api/generate',{method:'POST',headers:{origin:'http://localhost:3000','x-vercel-forwarded-for':`ref-${style}`},body:form});
   assert.equal((await POST(req)).status,200);
  }
  assert.notEqual(references[0],references[1]);
 } finally {globalThis.fetch=original;process.env=saved;}
});
