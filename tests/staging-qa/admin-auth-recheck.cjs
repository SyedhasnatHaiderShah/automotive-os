const assert=require('node:assert/strict');
const host='https://admin-staging.syedhasnat.com';
async function run(){
  const live=await fetch(host+'/api/health',{redirect:'manual'});
  const body=await live.json();
  console.log('ADMIN_HEALTH',live.status,JSON.stringify(body));
  assert.equal(live.status,200,'admin health');
  assert.equal(body.service,'admin','correct service');
  const req=await fetch(host+'/',{redirect:'manual'});
  console.log('ADMIN_ANONYMOUS_GET',req.status,'authenticateHeader',Boolean(req.headers.get('www-authenticate')));
  assert.ok(req.status===401||req.status===403,'anonymous GET must be denied');
  const forged=await fetch(host+'/',{redirect:'manual',headers:{'cf-access-jwt-assertion':'invalid.jwt.token','x-admin-token':'invalid'}});
  console.log('ADMIN_FORGED_TOKEN_GET',forged.status);
  assert.ok(forged.status===401||forged.status===403,'forged token must be denied');
  console.log('PASS admin unauthenticated and forged-token denial');
}
run().catch(err=>{console.error('ADMIN_SECURITY_FAILURE',err);process.exitCode=1});
