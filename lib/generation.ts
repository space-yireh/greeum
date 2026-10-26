import 'server-only';
import sharp from 'sharp';
import { buildCaricaturePrompt } from './prompts';
import { imageType, MAX_FILE, type Style } from './policy';

export const BASELINE_MODEL = 'google/gemini-nano-banana-2.1';
export const DEFAULT_MODEL = 'openai/gpt-image-2.5-sunburst';
/** Split the operator's two-panel sheet in memory; never persist visitor photos. */
export async function prepareStyleReference(bytes: Buffer, style: Style, paired: boolean): Promise<string> {
 if(bytes.length>MAX_FILE || !imageType(bytes)) throw new Error('Invalid style reference image');
 const oriented=await sharp(bytes,{limitInputPixels:16000000}).rotate().toBuffer();
 const metadata=await sharp(oriented).metadata();
 if((metadata.pages||1)>1) throw new Error('Animated style references are unsupported');
 let selected=sharp(oriented);
 if(paired) {
  if(!metadata.width || !metadata.height || metadata.width<metadata.height*1.5) throw new Error('Expected a side-by-side style reference sheet');
  const half=Math.floor(metadata.width/2);
  // Funny has no supplied example: borrow the left panel's ink language only.
  const left=style==='similar'?half:0;
  selected=selected.extract({left,top:0,width:style==='similar'?metadata.width-half:half,height:metadata.height});
 }
 const normalized=await selected.resize(1536,1536,{fit:'inside',withoutEnlargement:true}).flatten({background:'#ffffff'}).png().toBuffer();
 return `data:image/png;base64,${normalized.toString('base64')}`;
}
/** Optional bundled art reference; selection depends on the requested expression. */
export async function loadStyleReference(_style: Style): Promise<string | undefined> {
 // The old style reference depicts a different, more realistic drawing style.
 return undefined;
}
export function buildImageRequest(style: Style, identity: Buffer, model: string, reference?: string) {
 const urls=[`data:image/jpeg;base64,${identity.toString('base64')}`];
 if(reference) urls.push(reference);
 const options:{resolution?:string;quality?:string;size?:string}=model===BASELINE_MODEL?{resolution:'1K'}:model===DEFAULT_MODEL?{quality:'high'}:model.startsWith('openai/gpt-image-2.5-')?{quality:'medium',size:'1024x1024'}:{};
 return {model,n:1,...options,aspect_ratio:'1:1',prompt:buildCaricaturePrompt(style,!!reference),input_references:urls.map(url=>({type:'image_url',image_url:{url}}))};
}
/** Remove chroma while preserving every antialiased edge and fine grayscale ink stroke. */
export async function normalizeMonochrome(bytes: Buffer): Promise<Buffer> {
 return sharp(bytes,{limitInputPixels:16000000}).flatten({background:'#ffffff'}).greyscale().png().toBuffer();
}
