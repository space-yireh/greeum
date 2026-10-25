export type Candidate={id:string;label:string};
export const GPT_COMPARISON_MODELS=['openai/gpt-image-2.5-sunburst','openai/gpt-image-2.5-flare'] as const;
export function getComparisonOptions(model:string):{quality?:string;size?:string;resolution?:string} {
 return GPT_COMPARISON_MODELS.includes(model as typeof GPT_COMPARISON_MODELS[number])?{quality:'medium',size:'1024x1024'}:{resolution:'1K'};
}
export function getReferenceLimit(endpoints:Array<{supported_parameters?:Record<string,{max?:number;type?:string}>}>|undefined):number {
 if(!endpoints?.length)return 0;
 return Math.min(...endpoints.map(e=>Math.max(0,e.supported_parameters?.input_references?.max??0)));
}
export function getReportedCost(usage:unknown):number|null {
 const cost=(usage as {cost?:unknown}|undefined)?.cost;
 return typeof cost==='number'&&Number.isFinite(cost)&&cost>=0?cost:null;
}
