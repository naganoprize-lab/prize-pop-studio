const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const fixture=require('./fixtures/prize-pop-presets.json');
const {generate}=require('../js/prompt-generator');
const context={};vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../js/standard-presets.js'),'utf8'),context);
test('標準プリセットは添付JSONと全設定・ID・名前が一致する',()=>assert.deepEqual(JSON.parse(JSON.stringify(context.StandardPresets)),fixture));
test('画像指示は商品名として印字せず、二重指示や創作禁止の矛盾がない',()=>{
 for(const preset of fixture.presets){
  const p=generate(preset.settings,{imageInformation:true});
  assert.ok(!p.includes('商品名：「添付された画像'));
  assert.ok(!p.includes('入力内容を正確に使用'));
  assert.equal(p.split('右下に小さく').length-1,1);
  assert.match(p,/会社名/);assert.match(p,/検索が利用できない場合/);
  assert.equal(p,generate(preset.settings));
 }
});
test('かんたんモードでは入力済みの商品情報を出力せず、元の設定は変更しない',()=>{
 const state={...fixture.presets[0].settings,product:'手入力商品',catchcopy:'手入力コピー',price:'500円'};
 const before=JSON.stringify(state);const p=generate(state,{imageInformation:true});
 assert.ok(!p.includes('手入力'));assert.ok(!p.includes('500円'));assert.equal(JSON.stringify(state),before);
 assert.match(generate(state),/手入力商品/);
});
