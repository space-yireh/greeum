import 'server-only';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { Limiter, imageType } from '../../../lib/policy';
import { verifyDownloadToken } from '../../../lib/download-token';
export const runtime='nodejs';
const limiter=new Limiter();
const MAX=4*1024*1024;
const common={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
function fail(status:number){return new Response('다운로드하지 못했어요. 그림을 길게 눌러 저장해 주세요.',{status,headers:common});}
export async function POST(req:Request) {
 const expected=process.env.APP_ORIGIN || (process.env.NODE_ENV==='production'?'':new URL(req.url).origin);
 if(!expected || req.headers.get('origin')!==expected)return fail(403);
 if(!req.headers.get('content-type')?.startsWith('multipart/form-data'))return fail(400);
 const key=createHash('sha256').update(req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || 'local').digest('hex');
 if(!limiter.take(key))return fail(429);
 try {
  if(Number(req.headers.get('content-length'))>MAX+65536)return fail(413);
  const reader=req.body?.getReader();if(!reader)return fail(400);
  const chunks:Uint8Array[]=[];let size=0;
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX+65536){await reader.cancel();return fail(413);}chunks.push(value);}
  const form=await new Response(Buffer.concat(chunks),{headers:{'Content-Type':req.headers.get('content-type')!}}).formData();
  const file=form.get('image'), name=form.get('filename'),token=form.get('token');
  if(!(file instanceof File)||file.type!=='image/png'||file.size===0||file.size>MAX||typeof name!=='string'||!/^greeum_(cute|similar|funny)_\d{8}_\d{6}_[a-f0-9]{16}\.png$/.test(name)||typeof token!=='string')return fail(400);
  const bytes=Buffer.from(await file.arrayBuffer());
  if(imageType(bytes)!=='image/png'||!verifyDownloadToken(bytes,token))return fail(403);
  const meta=await sharp(bytes,{limitInputPixels:16000000}).metadata();
  if(meta.format!=='png'||(meta.pages||1)>1)return fail(400);
  await sharp(bytes,{limitInputPixels:16000000}).stats();
  return new Response(new Uint8Array(bytes),{headers:{...common,'Content-Type':'image/png','Content-Disposition':`attachment; filename="${name}"`,'Content-Length':String(bytes.length)}});
 } catch {return fail(400);} finally {limiter.release(key);}
}
