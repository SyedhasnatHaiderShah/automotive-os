const { chromium, request } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');

const url = {
  marketplace: 'https://automotive-marketplace-staging.up.railway.app',
  dealer: 'https://automotive-dealer-staging.up.railway.app',
  admin: 'https://admin-staging.syedhasnat.com',
};
const issues = [];
async function run() {
  fs.mkdirSync('staging-smoke-artifacts', {recursive:true});
  const api = await request.newContext({ timeout: 30000 });
  const health = [
    ['marketplace', url.marketplace+'/api/health'],
    ['dealer', url.dealer+'/api/health'],
    ['admin', url.admin+'/api/health'],
  ];
  for (const [name, endpoint] of health) {
    try {
      const r=await api.get(endpoint, {timeout:30000});
      let body;try{body=await r.json()}catch{body=await r.text()}
      console.log('HEALTH',name,r.status(),JSON.stringify(body).slice(0,300));
      if(r.status()!==200 || body?.status!=='ok' || body?.service!==name)issues.push(name+' invalid health response');
    }catch(e){issues.push(name+' health unreachable: '+e.message)}
  }
  const adminRoot = await api.get(url.admin+'/',{timeout:30000}).catch(e=>({status:()=>0,message:e.message}));
  const status=adminRoot.status();
  console.log('ADMIN_UNAUTH',status);
  if (status!==401 && status!==403) issues.push('admin gate does not reject anonymous GET: '+status);
  // Authorized access may only be exercised with authorized TEST secrets;
  // never forge headers, embed passwords or retrieve Railway secrets.
  if (process.env.STAGING_ADMIN_AUTH_USER && process.env.STAGING_ADMIN_AUTH_PASSWORD) {
    const ctx=await request.newContext({httpCredentials:{username:process.env.STAGING_ADMIN_AUTH_USER,password:process.env.STAGING_ADMIN_AUTH_PASSWORD},timeout:30000});
    const response=await ctx.get(url.admin+'/',{timeout:30000});
    console.log('ADMIN_AUTHORIZED',response.status());
    if(response.status()!==200)issues.push('admin authenticated route not 200: '+response.status());
    await ctx.dispose();
  } else {
    console.log('ADMIN_AUTHORIZED SKIPPED: no authorized GitHub test secrets configured');
  }

  const browser=await chromium.launch({headless:true});
  try {
    for(const view of [
      {name:'marketplace-home',target:url.marketplace+'/'},
      {name:'marketplace-cars',target:url.marketplace+'/cars'},
      {name:'dealer-dashboard',target:url.dealer+'/'},
      {name:'dealer-inventory',target:url.dealer+'/inventory'},
    ]) {
      for(const width of [1440,390]) {
        const ctx=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1});
        const page=await ctx.newPage();
        const pageErrors=[];
        page.on('pageerror',e=>pageErrors.push(e.message));
        try{
          const response=await page.goto(view.target,{waitUntil:'domcontentloaded',timeout:45000});
          await page.evaluate(async()=>{await document.fonts.ready});
          await page.waitForTimeout(1100);
          const body=await page.locator('body').innerText();
          const overflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth));
          console.log('BROWSER',view.name,width,response?.status(),'overflow',overflow,'chars',body.length,'errors',JSON.stringify(pageErrors));
          if(response?.status()!==200)issues.push(view.name+' '+width+' HTTP '+response?.status());
          if(body.includes('Dealer Inventory Service Unavailable'))issues.push(view.name+' inventory backend unavailable');
          if(body.includes('Application error: a client-side exception'))issues.push(view.name+' client crashed');
          if(body.trim().length<70)issues.push(view.name+' unexpectedly empty page');
          if(overflow>5)issues.push(view.name+' horizontal overflow '+overflow+'px');
          if(pageErrors.length)issues.push(view.name+' JS page errors: '+pageErrors.slice(0,2).join(';'));
          await page.screenshot({path:'staging-smoke-artifacts/'+view.name+'-'+width+'.png',fullPage:true,animations:'disabled'});
        }catch(e){issues.push(view.name+' '+width+' browser failure: '+e.message)}
        await ctx.close();
      }
    }
  }finally{await browser.close();await api.dispose()}
  fs.writeFileSync('staging-smoke-artifacts/results.json',JSON.stringify({commit:'cc5bc235c7fb8410ae77a91fece7cbc47f813342',issues},null,2));
  if(issues.length){console.error('FAILED',issues.length,issues.join('\n'));process.exitCode=1;}else console.log('PASS all accessible smoke checks');
}
run().catch(e=>{console.error(e);process.exitCode=1});
