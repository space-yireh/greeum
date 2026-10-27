import 'server-only';
import sharp from 'sharp';
import { createHash, randomUUID } from 'node:crypto';
import { MAX_BODY, MAX_FILE, imageType, isStyle, Limiter } from '../../../lib/policy';
import { buildImageRequest, DEFAULT_MODEL, loadStyleReference, normalizeMonochrome } from '../../../lib/generation';
export const runtime='nodejs'; export const maxDuration=240;
const limiter=new Limiter();
const headers={'Cache-Control':'no-store, private'};
function error(message:string,status:number) { return Response.json({error:message},{status,headers}); }
type Metrics = { request_id:string; timestamp:string; model_id:string; style:string|null; quality:string|null; size:string|null; aspect_ratio:string|null; image_bytes:number|null; image_width:number|null; image_height:number|null; style_reference:boolean|null; input_tokens:number|null; output_tokens:number|null; total_tokens:number|null; cost_usd:number|null; error_code:string|null; status:string; elapsed_ms:number; http_status:number|null };
const numberOrNull=(value:unknown):number|null=>typeof value==='number' && Number.isFinite(value) && value>=0?value:null;
export async function POST(req:Request) {
 const started=Date.now();
 const log:Metrics={request_id:randomUUID(),timestamp:new Date().toISOString(),model_id:process.env.OPENROUTER_MODEL || DEFAULT_MODEL,style:null,quality:null,size:null,aspect_ratio:null,image_bytes:null,image_width:null,image_height:null,style_reference:null,input_tokens:null,output_tokens:null,total_tokens:null,cost_usd:null,error_code:null,status:'failure',elapsed_ms:0,http_status:null};
 let response:Response;
 try { response=await handle(req,log); }
 catch { log.error_code='UNHANDLED_ERROR'; response=error('연결에 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.',500); }
 log.http_status=response.status;log.status=response.ok?'success':'failure';log.elapsed_ms=Date.now()-started;
 if(!response.ok && !log.error_code) log.error_code=`HTTP_${response.status}`;
 try { console.log(JSON.stringify({event:'image_generation',...log})); } catch { /* Logging must not break generation. */ }
 response.headers.set('X-Request-Id',log.request_id);
 return response;
}
async function handle(req:Request,log:Metrics) {
 const origin=req.headers.get('origin');
 const expected=process.env.APP_ORIGIN;
 if(!expected && process.env.NODE_ENV==='production') return error('서버 주소 설정이 필요합니다.',503);
 if(!origin || origin!==(expected || new URL(req.url).origin)) return error('허용되지 않은 요청입니다.',403);
 if(!process.env.OPENROUTER_API_KEY) return error('아직 준비 중이에요. 운영자에게 API 키 설정을 요청해 주세요.',503);
 const ip=req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || 'local';
 const key=createHash('sha256').update(ip).digest('hex');
 if(!limiter.take(key)) return error('잠시 쉬어 주세요. 10분에 3회까지, 한 번에 한 장만 만들 수 있어요.',429);
 try {
  if(!req.headers.get('content-type')?.startsWith('multipart/form-data')) return error('사진 업로드 형식이 올바르지 않습니다.',400);
  if(Number(req.headers.get('content-length'))>MAX_BODY) return error('사진은 5MB 이하로 올려 주세요.',413);
  const reader=req.body?.getReader(); if(!reader) return error('사진이 없습니다.',400);
  const chunks:Uint8Array[]=[]; let size=0;
  while(true) { const {done,value}=await reader.read(); if(done) break; size+=value.length; if(size>MAX_BODY) { await reader.cancel(); return error('사진은 5MB 이하로 올려 주세요.',413); } chunks.push(value); }
  let form:FormData;
  try { form=await new Response(Buffer.concat(chunks),{headers:{'Content-Type':req.headers.get('content-type')!}}).formData(); } catch { return error('업로드 내용을 읽을 수 없어요.',400); }
  const photo=form.get('photo'), style=form.get('style');
  if(form.get('consent')!=='yes') return error('외부 AI 전송에 동의해 주세요.',400);
  if(isStyle(style)) log.style=style;
  if(!isStyle(style) || style!=='cute') return error('귀여운 캐리커처만 만들 수 있어요.',400);
  if(!(photo instanceof File) || !photo.size || photo.size>MAX_FILE) return error('5MB 이하의 사진 한 장을 선택해 주세요.',400);
  const bytes=Buffer.from(await photo.arrayBuffer());log.image_bytes=bytes.length;
  if(!imageType(bytes) || !['image/jpeg','image/png','image/webp'].includes(photo.type)) return error('JPG, PNG, WebP 사진만 사용할 수 있어요.',400);
  let clean:Buffer;
  try {
   const image=sharp(bytes,{limitInputPixels:16000000,animated:false});
   const meta=await image.metadata();
   log.image_width=meta.width??null;log.image_height=meta.height??null;
   if((meta.pages||1)>1) return error('움직이는 사진은 지원하지 않아요.',400);
   clean=await image.rotate().resize(1536,1536,{fit:'inside',withoutEnlargement:true}).jpeg({quality:90}).toBuffer();
  } catch { return error('손상되었거나 너무 큰 해상도의 사진입니다. 1,600만 화소 이하로 선택해 주세요.',400); }
  let reference:string|undefined;
  try { reference=await loadStyleReference(style); } catch { return error('그림체 레퍼런스 설정을 확인해 주세요. 운영자는 assets의 스타일별 참고 이미지 파일과 환경변수를 확인해야 합니다.',503); }
  const payload=buildImageRequest(style,clean,log.model_id,reference);
  log.quality=payload.quality??null;log.size=payload.size??payload.resolution??null;log.aspect_ratio=payload.aspect_ratio??null;log.style_reference=!!reference;
  const upstream=await fetch('https://openrouter.ai/api/v1/images',{
   method:'POST',cache:'no-store',signal:AbortSignal.timeout(180000),
   headers:{Authorization:`Bearer ${process.env.OPENROUTER_API_KEY}`,'Content-Type':'application/json'},
   body:JSON.stringify(payload)
  });
  if(!upstream.ok) {
   const status=upstream.status;
   await upstream.body?.cancel();
   // Never log the request, photograph, credentials, or provider response body.
   log.error_code=`OPENROUTER_HTTP_${status}`;
   const message=status===401?'OpenRouter가 API 키 인증을 거부했습니다. 운영자는 OpenRouter에서 키의 계정 상태를 확인하거나 새 키를 발급해 .env.local에 설정해 주세요.':status===403?'OpenRouter 계정 또는 API 키에 이 모델을 사용할 권한이 없습니다.':status===429?'AI 요청이 많아요. 잠시 뒤 다시 시도해 주세요.':status===402?'운영자의 AI 이용 잔액이 부족합니다.':'AI가 사진을 생성하지 못했어요. 잠시 뒤 다시 시도해 주세요.';
   return error(message,status===429?429:502);
  }
  const data=await upstream.json();
  log.input_tokens=numberOrNull(data.usage?.prompt_tokens ?? data.usage?.input_tokens);
  log.output_tokens=numberOrNull(data.usage?.completion_tokens ?? data.usage?.output_tokens);
  log.total_tokens=numberOrNull(data.usage?.total_tokens);
  log.cost_usd=numberOrNull(data.usage?.cost);
  const item=data.data?.[0];
  if(typeof item?.b64_json!=='string' || item.b64_json.length>24000000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(item.b64_json)) return error('AI가 유효한 이미지를 반환하지 않았어요.',502);
  const rawOutput=Buffer.from(item.b64_json,'base64'); const mime=imageType(rawOutput);
  if(!mime) return error('지원하지 않는 결과 형식입니다.',502);
  let output:Buffer;
  try { output=await normalizeMonochrome(rawOutput); } catch { return error('AI가 손상된 이미지를 반환했어요.',502); }
  // Binary response avoids base64 inflation against Vercel's 4.5MB response limit.
  if(output.length>4*1024*1024) return error('결과가 너무 큽니다. 다시 시도해 주세요.',502);
  return new Response(new Uint8Array(output),{headers:{...headers,'Content-Type':'image/png','Content-Disposition':'inline'}});
 } catch(e) { log.error_code=e instanceof Error && ['TimeoutError','AbortError'].includes(e.name)?'UPSTREAM_TIMEOUT':'GENERATION_ERROR'; return error(e instanceof Error && ['TimeoutError','AbortError'].includes(e.name)?'생성이 지연되어 종료했어요. 잠시 뒤 다시 시도해 주세요.':'연결에 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.',504); }
 finally { limiter.release(key); }
}
