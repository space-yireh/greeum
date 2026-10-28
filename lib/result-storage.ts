import 'server-only';
import { put, get, list, del } from '@vercel/blob';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
const PREFIX='greeum-results/';
const ACCESS_MS=60*60*1000;
const RETENTION_MS=24*60*60*1000;
function key(){return process.env.CRON_SECRET || '';}
export function storageEnabled(){return !!process.env.BLOB_READ_WRITE_TOKEN && key().length>=32;}
function signature(payload:string){return createHmac('sha256',key()).update(payload).digest('hex');}
export function makeResultToken(id:string,now=Date.now()){
 const payload=`${id}.${now+ACCESS_MS}`;
 return `${payload}.${signature(payload)}`;
}
export function validateResultToken(token:string,now=Date.now()):string|null {
 if(!storageEnabled())return null;
 const [id,expires,sig,...extra]=token.split('.');
 if(extra.length || !/^[a-f0-9]{32}$/.test(id||'') || !/^\d{13}$/.test(expires||'') || !/^[a-f0-9]{64}$/.test(sig||''))return null;
 const end=Number(expires);if(end<=now || end>now+ACCESS_MS)return null;
 const expected=Buffer.from(signature(`${id}.${expires}`),'hex');
 return timingSafeEqual(expected,Buffer.from(sig,'hex'))?id:null;
}
export async function saveResult(data:Buffer):Promise<string> {
 const id=randomBytes(16).toString('hex');
 await put(`${PREFIX}${id}.png`,data,{access:'private',contentType:'image/png',cacheControlMaxAge:60});
 return `/api/download/${makeResultToken(id)}`;
}
export async function readResult(id:string){return get(`${PREFIX}${id}.png`,{access:'private',useCache:false});}
export async function cleanupResults(now=Date.now()){
 let cursor:string|undefined, removed=0;
 do {
  const page=await list({prefix:PREFIX,limit:1000,cursor});
  const expired=page.blobs.filter(blob=>blob.uploadedAt.getTime()<now-RETENTION_MS).map(blob=>blob.pathname);
  if(expired.length){await del(expired);removed+=expired.length;}
  cursor=page.hasMore?page.cursor:undefined;
 } while(cursor);
 return removed;
}
