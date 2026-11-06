(function (root) {
  const sizes = { A3: [297, 420], A4: [210, 297], B3: [364, 515], B4: [257, 364], A5: [148, 210] };
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
  const marker = '添付された画像を読み取って作成';
  const instructionLines = [
    '・会社名：「添付された画像を読み取って作成」',
    '・商品情報：「添付された画像を読み取って検索をして情報を取得した内容を反映」',
    '・POP情報：「右下に小さく(※写真はイメージです)を入れる」'
  ];
  const footnote = '右下に小さく「※写真はイメージです」と入れてください。';

  function dimensions(s) {
    let [w, h] = sizes[s.paper] || [Number(s.width), Number(s.height)];
    if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1 || w > 5000 || h > 5000) return null;
    [w, h] = s.orientation === '横向き' ? [Math.max(w, h), Math.min(w, h)] : [Math.min(w, h), Math.max(w, h)];
    return { w, h, ratio: (w / h).toFixed(3) };
  }

  function generate(s, options = {}) {
    const d = dimensions(s);
    // Invalid settings are validation messages, not prompts to send for generation.
    if (s.color === 'カスタムカラー' && !/^#[0-9a-f]{6}$/i.test(s.hex)) return 'カスタムカラーを#から始まる6桁のHEXコードで入力してください。';
    if (!d) return 'カスタムサイズの幅・高さを1〜5000mmで入力してください。';

    const imageInformation = options.imageInformation || (s.product === marker && s.catchcopy === marker);
    const sourceLines = (s.extra || '').split('\n').map(line => line.trim());
    const extra = sourceLines.filter(line => !instructionLines.includes(line) && line !== footnote).join('\n').trim();
    const sections = [opening];
    const emitted = new Set();
    function add(title, lines) {
      const unique = lines.filter(line => {
        if (!line || emitted.has(line)) return false;
        emitted.add(line);
        return true;
      });
      if (unique.length) sections.push(`【${title}】\n` + unique.map(line => s.format === '自然文' ? line : '・' + line).join('\n'));
    }

    add('1. 制作の優先順位', [
      '優先度1：完成したPOP画像の生成',
      '優先度2：選択した用紙サイズ・向き・デザインの反映',
      '優先度3：添付商品画像の正確な再現',
      '優先度4：商品名・キャッチコピーなどの適切な配置',
      '優先度5：必要に応じた商品情報の確認'
    ]);
    add('2. 用紙サイズ・縦横比', [
      `${s.paper}・${s.orientation}、印刷時の目標仕上がり寸法は幅${d.w}mm × 高さ${d.h}mm、縦横比は${d.w}:${d.h}（幅÷高さ=${d.ratio}）です。`,
      '生成画像は指定用紙の縦横比にできる限り合わせてください。画像生成モデルが指定寸法に直接対応しない場合は可能な限り近い比率で生成してください。指定実寸・解像度での出力を保証するものではありません。'
    ]);
    add('3. デザインの方向性', [
      `対象は${s.target}、デザインは${s.design}を基本にしてください。`,
      s.taste !== '指定なし' ? `全体のテイストは${s.taste}を優先してください。` : ''
    ]);
    add('4. 配色・フォント・装飾', [
      `配色は${s.color === 'カスタムカラー' ? s.hex : s.color}、フォントは${s.font}、文字の強調は「${s.emphasis}」にしてください。`,
      `背景は${s.background}、装飾は${s.decoration}にしてください。`
    ]);

    const fields = [['商品名', s.product], ['キャッチコピー', s.catchcopy], ['価格・料金', s.price], ['サブコピー', s.subcopy], ['その他の情報', s.info], ['特に強調する情報', s.highlight]];
    const entered = fields.filter(([, value]) => value?.trim() && value.trim() !== marker);
    const useEntered = !imageInformation || options.preferEnteredInformation;
    const needsImage = imageInformation || fields.some(([, value]) => value === marker) || sourceLines.includes(instructionLines[0]);
    add('5. 商品情報', [
      ...(useEntered ? entered.map(([label, value]) => `${label}：「${value.trim()}」。`) : []),
      useEntered && entered.length ? 'ユーザーが入力した商品情報を画像からの推測や検索結果より優先し、商品名・指定コピー・価格を勝手に置き換えないでください。' : '',
      needsImage ? '添付された商品画像を読み取り、確認できる商品名・メーカー（会社名）・特徴を特定し、未指定のキャッチコピーは確認済みの情報に基づき短く自然に作成してください。入力済みの項目がある場合はその内容を優先してください。' : '',
      '商品情報は必要な場合のみ検索し、確認できた内容をPOPに反映してください。検索が利用できない場合でも、添付画像から確認できる情報（入力済みの商品情報があればそれも）で画像生成を進めてください。未確認のメーカー名、価格、仕様、商品特徴を創作しないでください。',
      needsImage ? '「添付された画像を読み取って作成」等は制作指示であり、POPに印字しないでください。' : '',
      !needsImage ? '未指定の商品名・会社名・価格は創作せず省略してください。' : ''
    ]);
    add('6. レイアウト', [
      `文字配置は${s.textPosition}、商品配置は${s.productPosition}にしてください。`,
      `余白は${s.margin}、情報量は${s.density}、文字の視認性は${s.legibility}、商品画像の強調は${s.productScale}にしてください。`,
      '商品が最も目立つ構成にし、商品名を読みやすく配置してください。キャッチコピーは短く自然にし、過度に文字を増やさず、必要な情報を簡潔にまとめてください。'
    ]);
    let reference = s.reference;
    if (needsImage) {
      if (reference === '参考画像なし') reference = '商品画像を参考にする';
      else if (reference === '既存POPを参考にする') reference = '商品画像と既存POPの両方を参考にする';
    }
    const product = reference === '商品画像を参考にする' || reference === '商品画像と既存POPの両方を参考にする';
    const pop = reference === '既存POPを参考にする' || reference === '商品画像と既存POPの両方を参考にする';
    add('7. 参考画像の扱い', [
      reference === '参考画像なし' ? '参考画像は使用せず、入力された商品情報に沿って制作してください。' : `ChatGPTに手動添付する${product && pop ? '商品画像と既存POP' : product ? '商品画像' : '既存POP'}を参考にしてください。`,
      product ? '添付画像の商品をPOPの主役として大きく配置し、商品パッケージの形状、配色、ロゴ、文字を可能な限り維持してください。商品の外観を勝手に変更せず、一部が切れたり、不自然に変形したり、余分な商品が増えたりしないようにしてください。商品画像の強調度は、この主役としての見せ方の範囲で調整してください。' : '',
      product && s.preserve === '商品の形状・色・ロゴを変更しない' ? '商品の形状・色・ロゴを変更しないでください。' : '',
      pop ? `${s.popTreatment}。` : '',
      `画像の再現度は「${s.fidelity}」を基本とし、商品保持の指定がある場合は保持を優先してください。`
    ]);
    add('8. 制作上の注意', [
      s.exclude?.trim() ? `表示しない情報：「${s.exclude.trim()}」。この禁止指定は他の表示指定より優先してください。` : '',
      '日本語の誤字・文字化け・不要な文字を避けてください。印刷時に重要な文字や商品が切れないよう、用紙の端から適切な安全余白を設けてください。',
      footnote,
      '制作の優先順位を守りつつ、表示禁止と未確認情報を創作しない条件を守ってください。商品外観の保持は自由なアレンジより優先し、テイスト指定と個別の作風設定を両立させてください。'
    ]);
    add('9. その他の自由指示', extra ? [`次の追加指示は上記の優先条件を守る範囲で反映してください：${extra}`] : []);
    sections.push(closing);
    return sections.join('\n\n');
  }
  root.PromptGenerator = { dimensions, generate };
  if (typeof module !== 'undefined') module.exports = root.PromptGenerator;
})(globalThis);
