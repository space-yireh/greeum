import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getComparisonOptions,getReferenceLimit,getReportedCost} from '../lib/comparison';
import {buildImageRequest,BASELINE_MODEL} from '../lib/generation';
test('A/B preserves baseline, shares identity/style prompt, applies only supported model-family settings',()=>{
 const ids=[BASELINE_MODEL,'openai/gpt-image-2.5-sunburst','openai/gpt-image-2.5-flare'];
 const requests=ids.map(id=>({...buildImageRequest('similar',Buffer.from('same-photo'),id,'data:image/png;base64,same-style'),...getComparisonOptions(id)}));
 for(const request of requests){assert.equal(request.prompt,requests[0].prompt);assert.deepEqual(request.input_references,requests[0].input_references);}
 assert.equal(BASELINE_MODEL,'google/gemini-nano-banana-2.1');
 assert.equal(requests[0].resolution,'1K');assert.equal(requests[0].quality,undefined);
 assert.equal(requests[1].quality,'medium');assert.equal(requests[1].size,'1024x1024');assert.equal(requests[1].resolution,undefined);
});
test('reference fallback is conservative and retains original as first image',()=>{
 assert.equal(getReferenceLimit([{supported_parameters:{input_references:{max:16}}}]),16);
 assert.equal(getReferenceLimit([{supported_parameters:{input_references:{max:16}}},{supported_parameters:{input_references:{max:1}}}]),1);
 assert.equal(getReferenceLimit([]),0);
 const request=buildImageRequest('cute',Buffer.from('identity'),'single-reference-model');
 assert.equal(request.input_references.length,1);assert.doesNotMatch(request.prompt,/Image 2 is ART STYLE ONLY/);
});
test('unreported generation cost is unknown rather than invented or zero',()=>{
 assert.equal(getReportedCost({cost:0.04}),0.04);assert.equal(getReportedCost({cost:0}),0);
 for(const usage of [undefined,{}, {cost:'0.04'},{cost:-1},{cost:NaN}])assert.equal(getReportedCost(usage),null);
});
