import {test} from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {BASE_STYLE_PROMPT,STYLE_PROMPTS,buildCaricaturePrompt} from '../lib/prompts';
import {buildImageRequest,normalizeMonochrome} from '../lib/generation';
import type {Style} from '../lib/policy';
test('all outgoing options retain identical base style, separate expression and identity/reference roles',()=>{
 for(const style of ['cute','similar','funny'] as Style[]) {
  const body=buildImageRequest(style,Buffer.from('identity'),'google/gemini-2.5-flash-image','data:image/png;base64,reference');
  assert.ok(body.prompt.startsWith(BASE_STYLE_PROMPT));assert.ok(body.prompt.includes(STYLE_PROMPTS[style]));
  assert.match(body.prompt,/Image 2 is ART STYLE ONLY/);assert.equal(body.input_references.length,2);
  assert.equal(body.input_references[0].image_url.url,'data:image/jpeg;base64,aWRlbnRpdHk=');
 }
 assert.equal(buildImageRequest('cute',Buffer.from('x'),'m').input_references.length,1);
 assert.doesNotMatch(buildCaricaturePrompt('cute'),/Image 2 is ART STYLE ONLY/);
});
test('palette normalization produces only black and white even for colored translucent model output',async()=>{
 const input=await sharp({create:{width:4,height:4,channels:4,background:{r:200,g:80,b:120,alpha:0.3}}}).png().toBuffer();
 const normalized=await normalizeMonochrome(input);
 const {data,info}=await sharp(normalized).toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
 for(let i=0;i<data.length;i+=info.channels){assert.ok(data[i]===0||data[i]===255);assert.equal(data[i],data[i+1]);assert.equal(data[i],data[i+2]);}
});
