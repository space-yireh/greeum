import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
import { buildImageRequest, normalizeMonochrome, prepareStyleReference, loadStyleReference, BASELINE_MODEL } from '../lib/generation';
import { buildCaricaturePrompt, PROMPT_VERSION } from '../lib/prompts';
import { imageType, MAX_FILE } from '../lib/policy';
import { getComparisonOptions, getReferenceLimit, getReportedCost, type Candidate } from '../lib/comparison';

export async function runComparison(args=process.argv.slice(2)) {
function arg(name:string) { const i=args.indexOf(name); return i<0?undefined:args[i+1]; }
const photoPath=arg('--photo'),referencePath=arg('--reference'),outPath=arg('--out');
const appReferences=args.includes('--app-references'), twoModels=args.includes('--two-models');
if(!photoPath || (!referencePath && !appReferences) || !outPath) {
 console.error('Usage: npm run compare -- --photo /absolute/photo.jpg --reference /absolute/style.png --out /absolute/new-result-folder');
 process.exit(1);
}
const apiKey=process.env.OPENROUTER_API_KEY;
if(!apiKey) { console.error('OPENROUTER_API_KEY is not configured.');process.exit(1); }
const baseline=process.env.OPENROUTER_BASELINE_MODEL || BASELINE_MODEL;
const models:Candidate[]=[
 {id:baseline,label:'기존 모델'},
 {id:'openai/gpt-image-2.5-sunburst',label:'GPT Image 2.5 Sunburst'},
 ...(!twoModels?[{id:'openai/gpt-image-2.5-flare',label:'GPT Image 2.5 Flare'}]:[])
];
if(new Set(models.map(m=>m.id)).size!==models.length) throw new Error('Baseline must differ from GPT candidates.');
const output=path.resolve(outPath);
// Never replace a previous run or accidentally use the project directory as output.
await mkdir(output,{recursive:false});
async function prepareImage(file:string,identity:boolean) {
 const bytes=await readFile(file);
 if(!imageType(bytes)||bytes.length>MAX_FILE) throw new Error('Inputs must be JPG/PNG/WebP under 3MiB.');
 const img=sharp(bytes,{limitInputPixels:16000000});const meta=await img.metadata();
 if((meta.pages||1)>1) throw new Error('Animated inputs are unsupported.');
 const buffer=await img.rotate().resize(1536,1536,{fit:'inside',withoutEnlargement:true}).flatten({background:'#ffffff'}).jpeg({quality:90}).toBuffer();
 return {buffer,hash:createHash('sha256').update(buffer).digest('hex'),role:identity?'identity':'style-only'};
}
const identity=await prepareImage(photoPath,true),reference=referencePath?await prepareImage(referencePath,false):undefined;
const discovered=await fetch('https://openrouter.ai/api/v1/images/models',{signal:AbortSignal.timeout(20000)});
if(!discovered.ok) throw new Error('Image model discovery failed. No paid requests were sent.');
const catalog=await discovered.json();
const verified=[];
for(const model of models) {
 const record=catalog.data?.find((m:{id:string})=>m.id===model.id);
 if(!record?.architecture?.input_modalities?.includes('image') || !record?.architecture?.output_modalities?.includes('image')) throw new Error(`Image input/output unavailable: ${model.id}. No paid requests sent.`);
 const response=await fetch(`https://openrouter.ai/api/v1/images/models/${model.id}/endpoints`,{signal:AbortSignal.timeout(20000)});
 if(!response.ok) throw new Error(`Endpoint discovery failed for ${model.id}. No paid requests sent.`);
 const endpoints=await response.json();
 // Use the minimum supported reference count across eligible providers. Identity always comes first.
 const referenceLimit=getReferenceLimit(endpoints.endpoints);
 if(referenceLimit<1) throw new Error(`No reference image input supported: ${model.id}`);
 const options=getComparisonOptions(model.id);
 const settings=Object.entries(options);
 const eligible=(endpoints.endpoints||[]).filter((e:any)=>settings.every(([key,value])=>key==='size'||e.supported_parameters?.[key]?.values?.includes(value)));
 if(!eligible.length) throw new Error(`Requested comparison settings unsupported for ${model.id}. No paid requests sent.`);
 verified.push({...model,referenceLimit,options,providers:eligible.map((e:any)=>e.provider_tag).filter(Boolean),endpoints:endpoints.endpoints});
}
const report:any={startedAt:new Date().toISOString(),promptVersion:PROMPT_VERSION,baseline,inputs:[{role:identity.role,sha256:identity.hash},...(reference?[{role:reference.role,sha256:reference.hash}]:[])],settings:'Same preprocessed photo and style-specific reference, same prompt per expression; square aspect ratio. Gemini 1K; Sunburst high quality with no size parameter; Flare medium quality at 1024x1024. Quality settings are not equivalent across architectures.',models:verified,results:[],notes:['No automatic retries or model fallback. Default model and .env.local are unchanged.','Model-original previews are not thresholded. Separate app-processed PNGs use the exact application grayscale function.','usage.cost is recorded only if OpenRouter reports it. Null means unavailable, not zero.','Times measure client-observed API round trip including response parsing, not model-only inference.','This one sample per cell is exploratory and cannot establish population-wide likeness quality.','Only this explicit local comparison tool saves results; the web app still stores no uploaded or generated images.']};
function escape(s:unknown){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
async function save() {
 await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
 const cards=report.results.map((r:any)=>`<article><h2>${escape(r.model)} · ${r.style==='cute'?'귀엽게':'비슷하게'}</h2><p>${r.status==='ok'?`API ${r.seconds.toFixed(2)}초 · 비용 ${r.costUsd===null?'미제공':`$${r.costUsd.toFixed(6)}`}`:`실패: ${escape(r.error)} · ${r.seconds.toFixed(2)}초`}</p>${r.rawFile?`<div class="pair"><figure><img src="${escape(r.rawFile)}"><figcaption>모델 원본 · ${(r.palette.nonBinaryRatio*100).toFixed(2)}% 중간톤/컬러 픽셀</figcaption></figure><figure><img src="${escape(r.processedFile)}"><figcaption>앱의 흑백 후처리</figcaption></figure></div><p><a href="${escape(r.rawFile)}" download>원본 다운로드</a> · <a href="${escape(r.processedFile)}" download>흑백 다운로드</a></p>`:''}<p>참조 ${r.referenceCount}장 · ${escape(JSON.stringify(r.options))}</p><details><summary>실제 전송 프롬프트</summary><pre>${escape(r.prompt)}</pre></details></article>`).join('');
 const total=report.results.reduce((s:number,r:any)=>s+(r.costUsd??0),0);
 await writeFile(path.join(output,'index.html'),`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>캐리커처 모델 비교</title><style>body{font:15px system-ui;max-width:1500px;margin:40px auto;padding:20px;background:#f5f5f1;color:#222}article{background:white;border:1px solid #ddd;border-radius:12px;padding:22px;margin:22px 0}h2{font-size:20px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0}img{width:100%;height:auto;background:white}pre{white-space:pre-wrap;font-size:12px;line-height:1.7}figcaption{padding:8px}a{color:#365a45}@media(max-width:650px){.pair{grid-template-columns:1fr}}</style><h1>흑백 캐리커처 A/B 테스트</h1><p>기본 모델: ${escape(baseline)} · 프롬프트 ${PROMPT_VERSION}</p><p>API 보고 비용의 확인된 합계: $${total.toFixed(6)} (미제공 비용 제외)</p><p>${escape(report.settings)}</p><p>원본 인물과의 닮음, 귀여움/유사성 차이, 선화 통일성, 반실사 여부는 눈으로 평가해야 합니다. 비용·시간만으로 기본 모델을 자동 선정하지 않습니다.</p>${cards}<details><summary>실험 참고 사항</summary><pre>${escape(report.notes.join('\n'))}</pre></details></html>`);
}
await save();
for(const model of verified) {
 for(const style of ['cute','similar'] as const) {
  const useReference=model.referenceLimit>=2;
  const selectedReference=useReference?(appReferences?await loadStyleReference(style):await prepareStyleReference(await readFile(referencePath!),style,process.env.CARICATURE_STYLE_REFERENCE_LAYOUT==='paired')):undefined;
  if(useReference && !selectedReference) throw new Error('Style reference is not configured.');
  const prompt=buildCaricaturePrompt(style,useReference);
  const body={...buildImageRequest(style,identity.buffer,model.id,selectedReference),...model.options,provider:{only:model.providers,allow_fallbacks:false}};
  const row:any={model:model.id,style,promptVersion:PROMPT_VERSION,prompt,referenceCount:body.input_references.length,styleReferenceSha256:selectedReference?createHash('sha256').update(Buffer.from(selectedReference.split(',')[1],'base64')).digest('hex'):null,options:model.options,provider:body.provider,status:'pending',costUsd:null};
  const start=performance.now();
  console.log(`Generating ${model.label} / ${style} (one paid request, no retry)`);
  try {
   const response=await fetch('https://openrouter.ai/api/v1/images',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(180000)});
   if(!response.ok){await response.body?.cancel();throw new Error(`OpenRouter HTTP ${response.status}`);}
   const data=await response.json();row.seconds=(performance.now()-start)/1000;
   row.costUsd=getReportedCost(data.usage);row.usage={prompt_tokens:data.usage?.prompt_tokens,completion_tokens:data.usage?.completion_tokens,total_tokens:data.usage?.total_tokens};
   const encoded=data.data?.[0]?.b64_json;
   if(typeof encoded!=='string'||encoded.length>24000000||!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw new Error('Missing or invalid image output');
   const bytes=Buffer.from(encoded,'base64');if(!imageType(bytes)) throw new Error('Unsupported image output');
   const raw=await sharp(bytes,{limitInputPixels:16000000}).png().toBuffer();
   const processed=await normalizeMonochrome(bytes);
   const {data:pixels,info}=await sharp(raw).flatten({background:'#fff'}).toColourspace('srgb').removeAlpha().raw().toBuffer({resolveWithObject:true});
   let nonBinary=0,color=0;for(let i=0;i<pixels.length;i+=info.channels){const r=pixels[i],g=pixels[i+1],b=pixels[i+2];if(r!==g||g!==b)color++;if(!((r===0&&g===0&&b===0)||(r===255&&g===255&&b===255)))nonBinary++;}
   row.palette={nonBinaryRatio:nonBinary/(info.width*info.height),colorRatio:color/(info.width*info.height)};
   row.width=info.width;row.height=info.height;
   const stem=model.id.replaceAll('/','-')+'-'+style;
   row.rawFile=stem+'-original.png';row.processedFile=stem+'-app-bw.png';
   await writeFile(path.join(output,row.rawFile),raw);await writeFile(path.join(output,row.processedFile),processed);
   row.status='ok';
  } catch(e) {row.seconds??=(performance.now()-start)/1000;row.status='error';row.error=e instanceof Error && /^(OpenRouter HTTP [0-9]{3}|Missing or invalid image output|Unsupported image output)$/.test(e.message)?e.message:'Generation or validation failed (possibly timeout); no automatic retry.';}
  report.results.push(row);await save();console.log(`${model.label} / ${style}: ${row.status}, ${row.seconds.toFixed(2)}s, reported cost ${row.costUsd??'unavailable'}`);
 }
}
console.log('Comparison complete. Open index.html in the output folder. Default model was not changed.');

}
if(process.argv[1] && /compare-models\.(?:ts|js)$/.test(process.argv[1])) runComparison().catch((e)=>{console.error(e instanceof Error?e.message:'Comparison setup failed. No automatic retry.');process.exitCode=1;});
