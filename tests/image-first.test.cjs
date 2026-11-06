const {test} = require('node:test');
const assert = require('node:assert/strict');
const {generate} = require('../js/prompt-generator');
const presets = require('./fixtures/prize-pop-presets.json').presets;
const opening = `【最優先：POP画像を生成してください】

この依頼は、アミューズメント施設で使用する景品POPの画像生成依頼です。

最終成果物は、実際に生成された完成POP画像です。

画像生成機能を使用し、指定された用紙サイズ・デザイン・商品情報に従って、完成したPOP画像を1枚生成してください。

商品情報の調査、キャッチコピーの作成、レイアウトの検討は、画像生成のための準備作業として内部的に行ってください。

調査結果、デザイン案、構成案、画像生成用プロンプトを文章で提示するだけで終了しないでください。

必要な情報がそろっている場合は、追加確認を挟まず画像生成を開始してください。`;
const closing = `【最終出力：画像生成を実行】

以上の条件を反映した、完成済みの景品POP画像を生成してください。

最終的な回答は、文章によるデザイン説明ではなく、生成されたPOP画像を中心にしてください。

商品情報の一覧、デザイン案、制作手順、画像生成用プロンプトを提示するだけで終了しないでください。

画像生成機能が利用できない場合に限り、その旨を簡潔に伝えてください。`;

test('全6プリセット・両モード・両文章形式で指定の冒頭と末尾を厳密に維持', () => {
  for (const preset of presets) for (const format of ['箇条書き','自然文']) for (const detail of [false,true]) {
    const state = {...preset.settings, format};
    const before = JSON.stringify(state);
    const p = generate(state, {imageInformation:!detail, preferEnteredInformation:detail});
    assert.ok(p.startsWith(opening+'\n\n'));
    assert.ok(p.endsWith('\n\n'+closing));
    assert.equal(p.split('【最優先：').length-1,1);
    assert.equal(p.split('【最終出力：').length-1,1);
    assert.equal(p.split('右下に小さく').length-1,1);
    assert.match(p,/検索が利用できない場合でも/);
    assert.match(p,/未確認のメーカー名、価格、仕様、商品特徴を創作しない/);
    const lines=p.split('\n').filter(Boolean);
    assert.equal(new Set(lines).size,lines.length);
    for (let i=1;i<5;i++) assert.ok(p.indexOf(`優先度${i}：`)<p.indexOf(`優先度${i+1}：`));
    assert.equal(JSON.stringify(state),before);
  }
});

test('全用紙・両方向・カスタム寸法と印刷の制限を反映', () => {
  for (const [paper,w,h] of [['A3',297,420],['A4',210,297],['B3',364,515],['B4',257,364],['A5',148,210],['カスタムサイズ',180,280]]) {
    for (const orientation of ['縦向き','横向き']) {
      const p=generate({...presets[0].settings,paper,orientation,width:180,height:280});
      const [width,height]=orientation==='縦向き'?[w,h]:[h,w];
      assert.ok(p.includes(`${paper}・${orientation}`));
      assert.ok(p.includes(`縦横比は${width}:${height}`));
      assert.match(p,/可能な限り近い比率/);
      assert.match(p,/実寸・解像度での出力を保証するものではありません/);
      assert.match(p,/安全余白/);
    }
  }
});

test('詳細入力は画像取得モードから戻った直後も優先し、かんたんでは隠す', () => {
  const state={...presets[0].settings,product:'確認済み商品',catchcopy:'指定コピー',price:'500円',info:'メーカー：確認済み会社'};
  const detail=generate(state,{imageInformation:true,preferEnteredInformation:true});
  assert.match(detail,/商品名：「確認済み商品」/);
  assert.match(detail,/価格・料金：「500円」/);
  assert.match(detail,/入力した商品情報を画像からの推測や検索結果より優先/);
  const easy=generate(state,{imageInformation:true});
  assert.ok(!easy.includes('確認済み商品'));assert.ok(!easy.includes('500円'));
});

test('商品外観保持と追加指示・禁止情報を反映、注記は重複しない', () => {
  const p=generate({...presets[0].settings,extra:presets[0].settings.extra+'\n落ち着いた照明\n右下に小さく「※写真はイメージです」と入れてください。',exclude:'価格'});
  for (const text of ['商品パッケージの形状、配色、ロゴ、文字','勝手に変更せず','不自然に変形','余分な商品','落ち着いた照明','表示しない情報：「価格」']) assert.ok(p.includes(text));
  assert.equal(p.split('右下に小さく').length-1,1);
});


test('画像読取が必要なとき参考画像なしの矛盾を避け、POP参考も保持する', () => {
  for (const reference of ['参考画像なし','既存POPを参考にする']) {
    const p=generate({...presets[0].settings,reference});
    assert.ok(!p.includes('参考画像は使用せず'));
    assert.match(p,/添付画像の商品をPOPの主役/);
    if(reference==='既存POPを参考にする') assert.match(p,/商品画像と既存POP/);
  }
});
