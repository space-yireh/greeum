import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Limiter, imageType, isStyle } from '../lib/policy';
test('accepts only known styles including inherited property attacks',()=>{assert.equal(isStyle('cute'),true);assert.equal(isStyle('__proto__'),false);assert.equal(isStyle('constructor'),false);});
test('checks actual bytes rather than extension',()=>{assert.equal(imageType(Buffer.from('<svg/>')),null);assert.equal(imageType(Buffer.from([255,216,255])), 'image/jpeg');assert.equal(imageType(Buffer.from([137,80,78,71,13,10,26,10])), 'image/png');assert.equal(imageType(Buffer.from('RIFF0000WEBP')), 'image/webp');});
test('rejects concurrent and excess requests, resets expired quota',()=>{const l=new Limiter();assert.equal(l.take('a',0),true);assert.equal(l.take('a',0),false);l.release('a');assert.equal(l.take('a',1),true);l.release('a');assert.equal(l.take('a',2),true);l.release('a');assert.equal(l.take('a',3),false);assert.equal(l.take('a',600001),true);});
