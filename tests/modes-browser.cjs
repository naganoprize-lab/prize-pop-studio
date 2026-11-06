const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const http=require('node:http');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{const p=path.join(root,req.url==='/'?'index.html':req.url);res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');try{res.end(fs.readFileSync(p));}catch{res.statusCode=404;res.end();}}).listen(8002,'127.0.0.1');
 let browser;try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const ctx=await browser.newContext({viewport:{width:1440,height:1000}});const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8002/');
 assert.equal(await page.locator('#easyMode').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#product').count(),0);assert.equal(await page.locator('#designCards button').count(),6);
 assert.match(await page.locator('#designCards [aria-pressed=true]').innerText(),/シンプル・商品重視/);
 assert.match(await page.locator('#output').inputValue(),/420mm × 高さ297mm/);
 for(const button of await page.locator('#designCards button').all()){
  await button.click();assert.ok((await page.locator('#output').inputValue()).startsWith('【最優先：POP画像を生成してください】'));assert.ok((await page.locator('#output').inputValue()).endsWith('画像生成機能が利用できない場合に限り、その旨を簡潔に伝えてください。'));const id=await button.getAttribute('data-preset');const actual=await page.evaluate(()=>JSON.parse(JSON.stringify(state)));const expected=require('./fixtures/prize-pop-presets.json').presets.find(p=>p.id===id).settings;assert.deepEqual(actual,expected);
 }
 const selected=await page.locator('#preset').inputValue();const before=await page.locator('#output').inputValue();await page.locator('#detailMode').click();assert.equal(await page.locator('#preset').inputValue(),selected);assert.equal(await page.locator('#output').inputValue(),before);
 await page.locator('#product').fill('保持する商品');await page.locator('#catchcopy').fill('保持するコピー');await page.locator('#extra').fill('追加メモ');await page.locator('#color').selectOption('寒色系');
 await page.locator('#easyMode').click();assert.equal(await page.locator('#product').count(),0);assert.ok(!(await page.locator('#output').inputValue()).includes('保持する商品'));
 await page.locator('#paper').selectOption('B4');await page.locator('#orientation').selectOption('縦向き');assert.match(await page.locator('#output').inputValue(),/257mm × 高さ364mm/);
 const easyPrompt=await page.locator('#output').inputValue();await page.locator('#detailMode').click();assert.match(await page.locator('#output').inputValue(),/商品名：「保持する商品」/);assert.equal(await page.locator('#product').inputValue(),'保持する商品');assert.equal(await page.locator('#catchcopy').inputValue(),'保持するコピー');assert.equal(await page.locator('#extra').inputValue(),'追加メモ');assert.equal(await page.locator('#color').inputValue(),'寒色系');
 await page.locator('#output').fill('手動編集は保持');await page.locator('#easyMode').click();await page.locator('#designCards button').first().click();await page.locator('#detailMode').click();assert.equal(await page.locator('#output').inputValue(),'手動編集は保持');assert.equal(await page.locator('#product').inputValue(),'保持する商品');
 await page.reload();assert.equal(await page.locator('#easyMode').getAttribute('aria-pressed'),'true');await page.locator('#detailMode').click();assert.equal(await page.locator('#product').inputValue(),'保持する商品');
 page.once('dialog',d=>d.accept());await page.locator('#reset').click();assert.match(await page.locator('#preset option:checked').innerText(),/シンプル・商品重視/);await page.locator('#easyMode').click();
 fs.mkdirSync('/tmp/pps-modes',{recursive:true});await page.screenshot({path:'/tmp/pps-modes/easy.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 // Existing localStorage data must survive migration and deduplicate names only in the UI.
 await page.evaluate(()=>{localStorage.setItem('pps:presets',JSON.stringify({version:1,data:[{id:'legacy-user',name:'保存済みオリジナル',settings:state},{id:'legacy-standard',name:'実用設定_和風',settings:state}]}));});await page.reload();assert.equal(await page.locator('#preset option').filter({hasText:'実用設定_和風'}).count(),1);assert.equal(await page.locator('#preset option').filter({hasText:'保存済みオリジナル'}).count(),1);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pps:presets')).data.length),2);
 assert.deepEqual(errors,[]);console.log('PASS: defaults, exact six presets, no easy product inputs, paper changes, mode switching, detailed/manual/session preservation, reset, responsive layouts, legacy data');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
