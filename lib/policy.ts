export const MAX_FILE = 5 * 1024 * 1024;
export const MAX_BODY = MAX_FILE + 64 * 1024;
export const styles = {
 cute: { label: '귀엽게', icon: '✿', description: '동글동글, 사랑스러운 나' },
 similar: { label: '비슷하게', icon: '◉', description: '나를 닮은 한 장의 그림' },
 funny: { label: '익살스럽게', icon: '✷', description: '개성은 크게, 웃음은 더 크게' }
} as const;
export type Style = keyof typeof styles;
export function isStyle(s: unknown): s is Style { return typeof s === 'string' && Object.hasOwn(styles,s); }
export function imageType(b: Uint8Array) {
 if (b[0]===255 && b[1]===216 && b[2]===255) return 'image/jpeg';
 if (Buffer.from(b.subarray(0,8)).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
 if (Buffer.from(b.subarray(0,4)).toString()==='RIFF' && Buffer.from(b.subarray(8,12)).toString()==='WEBP') return 'image/webp';
 return null;
}
export class Limiter {
 private entries = new Map<string,{count:number;until:number;busy:boolean}>();
 take(key:string, now=Date.now()) {
  for (const [k,v] of this.entries) if(v.until<=now && !v.busy) this.entries.delete(k);
  let e=this.entries.get(key);
  if(e?.busy || (e && e.until>now && e.count>=3)) return false;
  if(!e || e.until<=now) { if(this.entries.size>=5000) return false; e={count:0,until:now+600000,busy:false}; this.entries.set(key,e); }
  e.count++; e.busy=true; return true;
 }
 release(key:string) { const e=this.entries.get(key); if(e) e.busy=false; }
}
