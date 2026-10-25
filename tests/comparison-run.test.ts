import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,readdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import {runComparison} from '../scripts/compare-models';
test('six-cell comparison writes raw/processed images, exact prompts and real-reported metrics; single-reference fallback works',async()=>{
 const temp=await mkdtemp(path.join(os.tmpdir(),'caricature-ab-'));
 const savedFetch=globalThis.fetch,savedKey=process.env.OPENROUTER_API_KEY,savedModel=process.env.OPENROUTER_MODEL;
 process.env.OPENROUTER_API_KEY='mock-key';process.env.OPENROUTER_MODEL='google/gemini-nano-banana-2.1';
 const requests:any[]=[];
 try {
  const photo=await sharp({create:{width:8,height:8,channels:3,background:'#abccdd'}}).png().toBuffer();
  const reference=await sharp({create:{width:8,height:8,channels:3,background:'#000'}}).png().toBuffer();
  await writeFile(path.join(temp,'photo.png'),photo);await writeFile(path.join(temp,'ref.png'),reference);
  const ids=[process.env.OPENROUTER_MODEL,'openai/gpt-image-2.5-sunburst','openai/gpt-image-2.5-flare'];
  globalThis.fetch=async(url,init)=>{
   const u=String(url);
   if(u.endsWith('/images/models'))return Response.json({data:ids.map(id=>({id,architecture:{input_modalities:['image'],output_modalities:['image']}}))});
   if(u.endsWith('/endpoints'))return Response.json({endpoints:[{provider_tag:'test-provider',supported_parameters:{input_references:{max:u.includes('flare')?1:16},resolution:{values:['1K']},quality:{values:['medium']}}}]});
   requests.push(JSON.parse(init!.body as string));return Response.json({data:[{b64_json:photo.toString('base64')}],usage:{cost:0.02,prompt_tokens:10,completion_tokens:20,total_tokens:30}});
  };
  const out=path.join(temp,'results');await runComparison(['--photo',path.join(temp,'photo.png'),'--reference',path.join(temp,'ref.png'),'--out',out]);
  assert.equal(requests.length,6);
  const report=JSON.parse(await readFile(path.join(out,'report.json'),'utf8'));
  assert.equal(report.results.length,6);assert.ok(report.results.every((r:any)=>r.status==='ok'&&r.costUsd===0.02&&r.seconds>=0));
  for(let i=0;i<6;i++){assert.equal(report.results[i].prompt,requests[i].prompt);assert.equal(requests[i].input_references[0].image_url.url,requests[0].input_references[0].image_url.url);}
  assert.equal(requests[0].prompt,requests[2].prompt);assert.equal(requests[1].prompt,requests[3].prompt);
  assert.equal(requests[4].input_references.length,1);assert.doesNotMatch(requests[4].prompt,/Image 2 is ART STYLE ONLY/);
  assert.equal((await readdir(out)).filter(f=>f.endsWith('.png')).length,12);
  const html=await readFile(path.join(out,'index.html'),'utf8');assert.ok(html.includes('0.120000'));assert.ok(!html.includes('mock-key'));
  assert.equal(process.env.OPENROUTER_MODEL,ids[0]);
 }finally {globalThis.fetch=savedFetch;if(savedKey===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=savedKey;if(savedModel===undefined)delete process.env.OPENROUTER_MODEL;else process.env.OPENROUTER_MODEL=savedModel;await rm(temp,{recursive:true,force:true});}
});
