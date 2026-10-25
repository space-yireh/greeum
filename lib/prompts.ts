import type { Style } from './policy';

/** Shared art direction. Options below may change facial treatment only. */
export const BASE_STYLE_PROMPT = `Create one distinctive, cute 2D black-and-white caricature of the person in reference image 1.
ART DIRECTION — mandatory for every expression option:
Use only pure black (#000000) and pure white (#FFFFFF), on a clean pure white background. Draw bold, confident, smooth black outer contours and a few economical inner lines. Use flat solid black shapes and white negative space for all shadows. Keep the face predominantly white with sparse, deliberate black marks for its individual features. Render hair as coherent solid black masses with only a few clean white highlight cuts; retain its actual silhouette, parting, fringe and length. Simplify clothing into black and white shapes.
IDENTITY — image 1 is the only source of the person's identity:
Preserve their distinctive eye shape, eyelid angle, eyebrow shape and spacing, facial silhouette, cheek and jaw shape, nose, mouth, expression, hairstyle and major visible accessories. Preserve visible age cues without beautifying or inventing a different person. Maintain the source head angle, pose and visible hand gesture. Draw a single person in a consistent head-and-upper-torso composition with white margin; do not add hands or accessories absent from image 1. Remove background objects, decorative symbols, sparkles, lettering, logos and watermarks. Simplify garment lettering to blank shapes.
SIMPLIFICATION:
Make a recognizable individual using deliberately simplified cartoon forms. Keep the same bold ink line language, flat fills, composition and level of detail across all three expression options. Express personality through accurate relationships between features, never through a stock pretty face.
STRICT EXCLUSIONS:
No color, pastel, skin-tone fill, tinted background, gray shading, gradients, airbrush, watercolor, pencil sketch, paper texture, crosshatching, halftone, photographic skin, pores, realistic or semi-realistic portrait rendering, 3D rendering, Disney/Pixar styling, generic Japanese anime beauty archetypes, oversized sparkling anime eyes, or identical template faces. Do not merely desaturate a realistic portrait. Redraw it as simple bold flat black-and-white cartoon ink art.`;

export const STYLE_PROMPTS: Record<Style, string> = {
 cute: `FACIAL TREATMENT — CUTE: Make the facial outline slightly rounder and soften the expression in a warm, lovable way. Preserve the person's original eye contour, tilt, spacing and characteristic features. Keep eyes close to their source size; do not substitute huge round eyes or a standard baby/chibi face. Use restrained cheek curves and a gentle version of the source smile. Change facial treatment only; obey the shared ink art direction.`,
 similar: `FACIAL TREATMENT — LIKENESS: Prioritize the person's original face shape and the relative size, position and spacing of eyes, nose and mouth. Retain asymmetries and distinguishing details with a small number of clear marks. Keep a subtly cute, approachable expression without idealizing, slimming or beautifying the face. This must remain a simplified flat black-and-white cartoon caricature, never a realistic portrait. Change facial treatment only; obey the shared ink art direction.`,
 funny: `FACIAL TREATMENT — FUNNY: Select one or two genuinely distinctive facial traits visible in image 1 and moderately exaggerate their relative shape or proportion. Make the existing expression more animated and playfully humorous while preserving the person's recognizable eye shape, hairstyle and facial identity. Do not invent a different emotion, use gross distortion, mockery, cruelty or stereotyped features. Do not enlarge every feature indiscriminately. Change facial treatment only; obey the shared ink art direction.`
};

export function buildCaricaturePrompt(style: Style, hasStyleReference = false): string {
 return [BASE_STYLE_PROMPT,
  hasStyleReference ? `REFERENCE ROLES: Image 1 is the identity photograph. Image 2 is ART STYLE ONLY: borrow its contour weight, black hair masses, white negative space and simplification, never its face, identity, clothing, accessories, lettering or pose. The written pure-black-and-white rules override any gray or realistic detail in the style reference.` : '',
  STYLE_PROMPTS[style],
  'FINAL CHECK: exactly one recognizable person; pure white background; bold flat black-and-white cartoon ink art; no color or realistic shading. Return one image.'
 ].filter(Boolean).join('\n\n');
}
