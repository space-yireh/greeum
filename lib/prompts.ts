import type { Style } from './policy';

export const PROMPT_VERSION = 'cute-marker-caricature-v2';

export const BASE_STYLE_PROMPT = `Create a charming, simplified black-and-white hand-drawn caricature from image 1 on a clean white background. Draw the main foreground subject or subjects together; when the photo has two main people, include both. Ignore incidental background bystanders. Preserve each person's relative position, recognizable hairstyle, face shape, accessories and visible pose, including a hand gesture when clearly present.
Draw with a broad black pen: bold rounded outlines with gentle natural variation, flat solid-black shapes and generous white space. Give faces a rounded, friendly caricature shape. Use simple black oval or dot-like eyes, a short curved eyebrow, a tiny simple nose and a clear curved or open smiling mouth. Use only a few deliberate lines for each face; preserve differences between people through hairstyle, face shape, eyebrows, expression and accessories. Do not make everyone identical or draw detailed realistic eyes, lips, wrinkles or beard stubble. Suggest facial hair with a few short marks only if recognizable and relevant.
Show hair as large clean solid-black shapes with just a few flowing white gaps. Simplify clothing, hats and accessories into easy-to-read black and white shapes. Avoid textured pen scribbles inside black areas. Keep the main subject or subjects in a comfortable head-and-upper-body composition; preserve an important visible pose. Omit background scenery, extra people, decorative marks and text.
The result should feel cheerful, expressive and genuinely hand-drawn, with the simplicity of a cute cartoon caricature. No photo tracing, detailed portrait, gray facial shading, gradients, fine hair strands, dense hatching, skin texture, 3D or color.`;

export const STYLE_PROMPTS: Record<Style, string> = { cute: '', similar: '', funny: '' };
export function buildCaricaturePrompt(_style: Style, _hasStyleReference = false): string {
 return BASE_STYLE_PROMPT;
}
