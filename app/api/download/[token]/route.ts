import { readResult, validateResultToken } from '../../../../lib/result-storage';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(_req:Request,{params}:{params:Promise<{token:string}>}) {
 const id=validateResultToken((await params).token);
 if(!id)return new Response('다운로드 링크가 만료되었어요.',{status:404,headers:{'Cache-Control':'private, no-store'}});
 try {
  const result=await readResult(id);
  if(!result || result.statusCode!==200 || result.blob.contentType!=='image/png' || result.blob.size>4*1024*1024)return new Response('이미지를 찾을 수 없어요.',{status:404,headers:{'Cache-Control':'private, no-store'}});
  return new Response(result.stream,{headers:{'Content-Type':'image/png','Content-Disposition':'attachment; filename="greeum-cute.png"','Content-Length':String(result.blob.size),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
 }catch{return new Response('다운로드에 실패했어요.',{status:503,headers:{'Cache-Control':'private, no-store'}});}
}
