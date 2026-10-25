import {test} from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {BASE_STYLE_PROMPT,STYLE_PROMPTS,buildCaricaturePrompt} from '../lib/prompts';
import {buildImageRequest,normalizeMonochrome,prepareStyleReference,DEFAULT_MODEL} from '../lib/generation';
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
test('grayscale output removes color but retains intermediate tones and antialiased line edges',async()=>{
 const pixels=Buffer.from([0,0,0,85,85,85,128,128,128,255,255,255,200,80,120]);
 const input=await sharp(pixels,{raw:{width:5,height:1,channels:3}}).png().toBuffer();
 const normalized=await normalizeMonochrome(input);
 const {data,info}=await sharp(normalized).toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
 for(let i=0;i<data.length;i+=info.channels){assert.equal(data[i],data[i+1]);assert.equal(data[i],data[i+2]);}
 assert.equal(data[0],0);assert.equal(data[3*info.channels],255);
 assert.ok(data[info.channels]>0 && data[info.channels]<255);
 assert.ok(data[2*info.channels]>0 && data[2*info.channels]<255);
});

test('paired reference sends only the chosen panel and rejects unsuitable sheet geometry',async()=>{
 const width=80,height=40;const pixels=Buffer.alloc(width*height*3);
 for(let y=0;y<height;y++)for(let x=width/2;x<width;x++)pixels.fill(255,(y*width+x)*3,(y*width+x+1)*3);
 const sheet=await sharp(pixels,{raw:{width,height,channels:3}}).png().toBuffer();
 for(const style of ['cute','similar','funny'] as Style[]){
  const url=await prepareStyleReference(sheet,style,true);
  const bytes=Buffer.from(url.split(',')[1],'base64');const meta=await sharp(bytes).metadata();
  assert.equal(meta.width,40);assert.equal(meta.height,40);
  const stats=await sharp(bytes).stats();assert.equal(stats.channels[0].mean,style==='similar'?255:0);
  const request=buildImageRequest(style,Buffer.from('identity'),DEFAULT_MODEL,url);
  assert.equal(request.input_references.length,2);assert.equal(request.input_references[1].image_url.url,url);
  assert.doesNotMatch(request.prompt,/PAIRED STYLE SHEET/);
 }
 const square=await sharp(sheet).resize(40,40).png().toBuffer();
 await assert.rejects(()=>prepareStyleReference(square,'cute',true),/side-by-side/);
});

test('selected GPT default uses medium square output and preserves Gemini settings',()=>{
 assert.equal(DEFAULT_MODEL,'openai/gpt-image-2.5-sunburst');
 assert.equal(buildImageRequest('cute',Buffer.from('x'),DEFAULT_MODEL).quality,'medium');
 assert.equal(buildImageRequest('cute',Buffer.from('x'),DEFAULT_MODEL).size,'1024x1024');
 assert.equal(buildImageRequest('cute',Buffer.from('x'),DEFAULT_MODEL).resolution,undefined);
 assert.equal(buildImageRequest('cute',Buffer.from('x'),'google/gemini-nano-banana-2.1').resolution,'1K');
 assert.equal(buildImageRequest('cute',Buffer.from('x'),'other-model').resolution,undefined);
});

test('selected reference never overrides identity and style-specific anatomy instructions',()=>{
 assert.match(buildCaricaturePrompt('cute',true),/shorten the lower face/);
 assert.match(buildCaricaturePrompt('similar',true),/Keep the original facial length/);
 assert.match(buildCaricaturePrompt('cute',true),/Image 2 is ART STYLE ONLY/);
 assert.doesNotMatch(buildCaricaturePrompt('cute',false),/Image 2 is ART STYLE ONLY/);
});
