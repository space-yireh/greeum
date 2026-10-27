import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
const secret=()=>process.env.OPENROUTER_API_KEY || '';
export function makeDownloadToken(image:Buffer, now=Date.now()):string {
 const expires=String(now+30*60*1000);
 const hash=createHash('sha256').update(image).digest('hex');
 const payload=`${expires}.${hash}`;
 return `${payload}.${createHmac('sha256',secret()).update(payload).digest('hex')}`;
}
export function verifyDownloadToken(image:Buffer,token:string,now=Date.now()):boolean {
 if(!secret())return false;
 const parts=token.split('.');if(parts.length!==3 || !/^\d{13}$/.test(parts[0]) || !/^[a-f0-9]{64}$/.test(parts[1]) || !/^[a-f0-9]{64}$/.test(parts[2]))return false;
 const expires=Number(parts[0]);if(expires<now || expires>now+30*60*1000)return false;
 if(createHash('sha256').update(image).digest('hex')!==parts[1])return false;
 const expected=createHmac('sha256',secret()).update(`${parts[0]}.${parts[1]}`).digest();
 return timingSafeEqual(expected,Buffer.from(parts[2],'hex'));
}
