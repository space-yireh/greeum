import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { buildCaricaturePrompt } from './prompts';
import { imageType, MAX_FILE, type Style } from './policy';

export const DEFAULT_MODEL = 'google/gemini-2.5-flash-image';
/** Optional operator-supplied, bundled art reference; never a visitor upload store. */
export async function loadStyleReference(): Promise<string | undefined> {
 const configured=process.env.CARICATURE_STYLE_REFERENCE_PATH;
 if(!configured) return undefined;
 if(configured!=='assets/style-reference.png') throw new Error('Invalid style reference configuration');
 const bytes=await readFile(path.join(process.cwd(),'assets','style-reference.png'));
 if(bytes.length>MAX_FILE || !imageType(bytes)) throw new Error('Invalid style reference image');
 const normalized=await sharp(bytes,{limitInputPixels:16000000}).rotate().resize(1024,1024,{fit:'inside',withoutEnlargement:true}).flatten({background:'#ffffff'}).png().toBuffer();
 return `data:image/png;base64,${normalized.toString('base64')}`;
}
export function buildImageRequest(style: Style, identity: Buffer, model: string, reference?: string) {
 const urls=[`data:image/jpeg;base64,${identity.toString('base64')}`];
 if(reference) urls.push(reference);
 return {model,n:1,aspect_ratio:'1:1',prompt:buildCaricaturePrompt(style,!!reference),input_references:urls.map(url=>({type:'image_url',image_url:{url}}))};
}
/** Palette guarantee only; likeness and line-art quality still require visual review. */
export async function normalizeMonochrome(bytes: Buffer): Promise<Buffer> {
 return sharp(bytes,{limitInputPixels:16000000}).flatten({background:'#ffffff'}).greyscale().threshold(180).png().toBuffer();
}
