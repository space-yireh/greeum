import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeResultToken,validateResultToken,storageEnabled} from '../lib/result-storage';
import {GET as download} from '../app/api/download/[token]/route';
import {GET as cleanup} from '../app/api/cron/cleanup/route';
test('download tokens expire and are bound to a single private result; cleanup requires secret',async()=>{
 const oldToken=process.env.BLOB_READ_WRITE_TOKEN, oldSecret=process.env.CRON_SECRET;
 process.env.BLOB_READ_WRITE_TOKEN='fake-token';process.env.CRON_SECRET='s'.repeat(40);
 try {
  assert.equal(storageEnabled(),true);
  const id='a'.repeat(32),now=Date.now(),token=makeResultToken(id,now);
  assert.equal(validateResultToken(token,now),id);
  assert.equal(validateResultToken(token,now+60*60*1000),null);
  assert.equal(validateResultToken(token.replace('aaaa','bbbb'),now),null);
  assert.equal((await download(new Request('http://localhost/api/download/invalid'),{params:Promise.resolve({token:'invalid'})})).status,404);
  assert.equal((await cleanup(new Request('http://localhost/api/cron/cleanup'))).status,401);
 }finally{
  if(oldToken===undefined)delete process.env.BLOB_READ_WRITE_TOKEN;else process.env.BLOB_READ_WRITE_TOKEN=oldToken;
  if(oldSecret===undefined)delete process.env.CRON_SECRET;else process.env.CRON_SECRET=oldSecret;
 }
});
