import type { Style } from './policy';

export const PROMPT_VERSION = 'bw-style-specific-v3';

/** One ink-art family; each facial treatment is intentionally distinct. */
export const BASE_STYLE_PROMPT = `Draw ONE expressive, individually recognizable 2D black-ink caricature of the person in image 1, on a clean white digital background.
SHARED INK LANGUAGE:
Use confident, rounded black outer contours, expressive tapered inner strokes, black hair masses and white negative space. The visual palette is black ink and white. Smooth antialiased edges and delicate black linework are welcome; do not simulate a hard-threshold bitmap, posterization, a vector logo or a traced photograph. Hair should have a coherent natural silhouette with a few flowing white highlights, not spiky cutout edges or a forest of tiny white scratches. Mostly leave facial skin white. Small, purposeful fine ink strokes may describe eyelids, lips, nose, hair and the shadow beneath the chin; avoid broad gray skin shading.
IDENTITY AND INTERPRETATION:
Image 1 defines who the person is: their characteristic eye tilt and spacing, brow character, nose and mouth shapes, facial silhouette, hairstyle, head angle and visible accessories. Keep those identifying relationships rather than substituting a stock attractive face. The selected FACIAL TREATMENT below controls how much to soften or exaggerate proportions and expression; do not let literal photo tracing override that treatment. Preserve recognizable age cues and major accessories. Use the original pose and a head-and-upper-torso composition with comfortable white margin. Include hands only if present in the photograph. Simplify clothing without copying text or logos.
COMPOSITION AND EXCLUSIONS:
One person, one portrait, no split panels, comparison labels, speech bubbles, decorative marks, background scenery or watermark. No color, pastel, skin-tone fill, watercolor, pencil rubbing, paper grain, photorealistic skin, pores, airbrushed volume, 3D rendering, Disney/Pixar styling, or generic anime beauty templates. The result must look deliberately drawn by an ink caricature artist, not like a photograph with a monochrome filter.`;

export const STYLE_PROMPTS: Record<Style, string> = {
 cute: `FACIAL TREATMENT — CUTE, DISTINCTLY SOFTER AND MORE STYLIZED:
Reinterpret the person as a lovable hand-inked cartoon. Gently widen the cheek area, shorten the lower face, round the jaw and chin, and make the head feel a little fuller relative to the torso. These are intentional proportion changes, not just blush marks added to a realistic face. Make the eyes a little fuller and softer while retaining their characteristic tilt, separation and upper-lid gesture; do not keep literal photographic eye dimensions when that prevents the cute treatment. Avoid huge anime eyes or a standardized baby face. Simplify the nose and lip contours while retaining their individual shape cues. Relax the brows, soften the mouth corners and use a gentle small smile. Use fewer, rounder facial strokes and grouped hair shapes. Do not add detailed lip hatching, stern sharp eyes, a long angular jaw or dense under-eye lines. Recognizability comes from the distinctive combination of hair, eye gesture, nose and smile rather than exact photographic proportions.`,
 similar: `FACIAL TREATMENT — LIKENESS, MORE INDIVIDUAL FACIAL DETAIL:
Keep the original facial length, cheek and jaw widths, eye size and spacing, nose-to-mouth distance and chin shape. Accurately translate the particular upper-lid fold, lower-lid curve, brow angle, nose bridge and tip, nostril shape, cupid's bow, lip fullness and visible asymmetries into controlled ink contours. Preserve the source expression, including a neutral mouth when present. Use fine tapered strokes and restrained directional ink hatching at the lips, hair and under the chin when useful, without shading the entire face. Keep the result an approachable black-ink cartoon portrait; it must not become a realistic skin rendering. Do not round and shorten the face, enlarge the eyes or replace the mouth with the cute option's small generic smile.`,
 funny: `FACIAL TREATMENT — FUNNY, SELECTIVE PLAYFUL EXAGGERATION:
Choose one or two distinctive traits actually visible in image 1 and amplify their shape or relationship with lively curved ink lines. Keep the eye gesture, hairstyle and identifying feature combination recognizable. Make the expression more animated and mischievous, rather than merely adding the cute option's smile. Do not exaggerate every feature at once, imitate the reference person's identity, invent props, demean the subject, or use grotesque or stereotyped distortions. Keep the same clean black-ink language and white background.`
};

export function buildCaricaturePrompt(style: Style, hasStyleReference = false): string {
 return [BASE_STYLE_PROMPT,
  hasStyleReference ? `REFERENCE ROLES: Image 1 is the identity photograph. Image 2 is ART STYLE ONLY and has already been selected for this expression option. Match its contour rhythm, facial abstraction, balance of black hair masses and white space, and degree of ink detail. Apply that drawing language to the person in image 1. Do not copy image 2's identity, facial anatomy, earrings, clothing, pose, lettering, labels or decorative marks. Produce one standalone portrait, never reproduce the reference sheet.` : '',
  STYLE_PROMPTS[style],
  'FINAL CHECK: one recognizable individual, white background, natural black ink contours, the selected expression treatment clearly visible. Return one image.'
 ].filter(Boolean).join('\n\n');
}
