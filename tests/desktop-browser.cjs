// Browser simulation of the desktop adapter, NOT a Windows/WebView2 launch test.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const root = path.resolve(__dirname, '../desktop/dist');
  const server = http.createServer((req, res) => {
    const file = path.join(root, req.url === '/' ? 'index.html' : req.url);
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
    try { res.end(fs.readFileSync(file)); } catch { res.statusCode = 404; res.end(); }
  }).listen(8001, '127.0.0.1');
  let browser;
  try {
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox']});
    const context = await browser.newContext({viewport: {width:1440,height:900}});
    await context.addInitScript(() => {
      window.calls = [];
      window.__TAURI__ = {core: {invoke: async (command, args) => { window.calls.push({command,args}); return true; }}};
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:8001/');
    await page.locator('#product').fill('デスクトップ商品');
    await page.locator('#save').click();
    await page.locator('dialog input').fill('EXE設定');
    await page.locator('dialog button[value=ok]').click();
    await page.locator('#product').fill('一時変更');
    await page.locator('#load').click();
    assert.equal(await page.locator('#product').inputValue(), 'デスクトップ商品');
    await page.locator('#copy').click();
    await page.locator('#download').click();
    await page.locator('summary').click();
    await page.locator('#export').click();
    const calls = await page.evaluate(() => window.calls);
    assert.deepEqual(calls.map(c => c.command), ['copy_prompt','save_export','save_export']);
    assert.equal(calls[1].args.name, '景品POPプロンプト.txt');
    assert.match(calls[1].args.content, /デスクトップ商品/);
    assert.equal(JSON.parse(calls[2].args.content).presets[0].name, 'EXE設定');
    await page.locator('#output').fill('手動本文');
    await page.locator('#auto').click();
    await page.locator('dialog').press('Escape');
    assert.equal(await page.locator('#output').inputValue(), '手動本文');
    await page.locator('#auto').click();
    await page.locator('dialog button[value=ok]').click();
    assert.match(await page.locator('#output').inputValue(), /デスクトップ商品/);
    await page.reload();
    assert.equal(await page.locator('#product').inputValue(), 'デスクトップ商品');
    await context.setOffline(true);
    await page.locator('#product').fill('オフライン');
    assert.match(await page.locator('#output').inputValue(), /オフライン/);
    assert.deepEqual(errors, []);
    console.log('PASS: staged desktop UI, HTML dialogs, preset save/load, persistence, cancel/confirm, mocked clipboard/text/JSON IPC, offline editing');
  } finally { if (browser) await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
