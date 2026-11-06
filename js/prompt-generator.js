(function(root){
const sizes={A3:[297,420],A4:[210,297],B3:[364,515],B4:[257,364],A5:[148,210]};
function dimensions(s){let [w,h]=sizes[s.paper]||[Number(s.width),Number(s.height)];if(!Number.isFinite(w)||!Number.isFinite(h)||w<1||h<1||w>5000||h>5000)return null;[w,h]=s.orientation==='横向き'?[Math.max(w,h),Math.min(w,h)]:[Math.min(w,h),Math.max(w,h)];return {w,h,ratio:(w/h).toFixed(3)};}
function generate(s,options={}){
const marker="添付された画像を読み取って作成";
const imageInformation=options.imageInformation||(s.product===marker&&s.catchcopy===marker);
const instructionLines=['・会社名：「添付された画像を読み取って作成」','・商品情報：「添付された画像を読み取って検索をして情報を取得した内容を反映」','・POP情報：「右下に小さく(※写真はイメージです)を入れる」'];
const replacements=['会社名は添付画像から確認し、不明な場合は創作せず省略してください。','商品情報は画像から読み取り、必要に応じて検索で確認してください。検索できない場合は確認済みの情報のみ使用してください。','右下に小さく「※写真はイメージです」と入れてください。'];
const extra=(s.extra||"").split("\n").map(line=>{const i=instructionLines.indexOf(line.trim());return i<0?line:imageInformation?'':replacements[i];}).filter(Boolean).join("\n").trim();
const d=dimensions(s);if(s.color==='カスタムカラー'&&!/^#[0-9a-f]{6}$/i.test(s.hex))return 'カスタムカラーを#から始まる6桁のHEXコードで入力してください。';if(!d)return 'カスタムサイズの幅・高さを1〜5000mmで入力してください。';const sections=[];const add=(title,lines)=>{const unique=[...new Set(lines.filter(Boolean))];if(unique.length)sections.push('【'+title+'】\n'+unique.map(x=>s.format==='自然文'?x:'・'+x).join(s.format==='自然文'?'\n':'\n'));};
add('1. 制作依頼',['アミューズメント施設で使用する景品POPを制作してください。']);
add('2. 用紙サイズ・縦横比',[`${s.paper}・${s.orientation}、仕上がり寸法は幅${d.w}mm × 高さ${d.h}mm、縦横比は${d.w}:${d.h}（幅÷高さ=${d.ratio}）です。`]);
add('3. デザインの方向性',[`対象は${s.target}、デザインは${s.design}を基本にしてください。`,s.taste!=='指定なし'?`全体のテイストは${s.taste}を優先してください。`:'']);
add('4. 配色・フォント・装飾',[`配色は${s.color==='カスタムカラー'?s.hex:s.color}、フォントは${s.font}、文字の強調は「${s.emphasis}」にしてください。`,`背景は${s.background}、装飾は${s.decoration}にしてください。`]);
add('5. 商品情報',imageInformation?[
'添付された商品画像を読み取り、確認できる商品名・会社名を特定し、画像と確認済みの情報に基づくキャッチコピーを作成してください。',
'商品情報は画像から読み取り、必要に応じて検索して確認できた内容を反映してください。検索が利用できない場合は確認できた情報のみ使用し、名称・会社名・価格など不明な情報は創作しないでください。',
'「添付された画像を読み取って作成」等は制作指示であり、POPに印字しないでください。',
'右下に小さく「※写真はイメージです」と入れてください。'
]:[['商品名',s.product],['キャッチコピー',s.catchcopy],['価格・料金',s.price],['サブコピー',s.subcopy],['その他の情報',s.info],['特に強調する情報',s.highlight]].filter(x=>x[1]?.trim()).map(([k,v])=>v.trim()===marker?`${k}は添付画像を読み取って作成し、不明な内容は創作しないでください。`:`${k}：「${v.trim()}」。`));
add('6. レイアウト',[`文字配置は${s.textPosition}、商品配置は${s.productPosition}にしてください。`,`余白は${s.margin}、情報量は${s.density}、文字の視認性は${s.legibility}、商品画像の強調は${s.productScale}にしてください。`]);
const reference=imageInformation&&s.reference==='参考画像なし'?'商品画像を参考にする':s.reference;
const product=reference==='商品画像を参考にする'||reference==='商品画像と既存POPの両方を参考にする';const pop=reference==='既存POPを参考にする'||reference==='商品画像と既存POPの両方を参考にする';
add('7. 参考画像の扱い',reference==='参考画像なし'?['参考画像は使用せず制作してください。',`画像の再現度は「${s.fidelity}」とし、指定された商品情報に沿って制作してください。`]:[`ChatGPTに手動添付する${product&&pop?'商品画像と既存POP':product?'商品画像':'既存POP'}を参考にしてください。`,product?(s.preserve==='商品の形状・色・ロゴを変更しない'?'商品の形状・色・ロゴを変更しないでください。':'商品デザインを可能な限り忠実に維持してください。'):'',pop?`${s.popTreatment}。`:'',`画像の再現度は「${s.fidelity}」を基本とし、商品保持の指定がある場合は保持を優先してください。`]);
add('8. 制作上の注意',[s.exclude?.trim()?`表示しない情報：「${s.exclude.trim()}」。この禁止指定は他の表示指定より優先してください。`:'',(imageInformation||s.product===marker||s.catchcopy===marker)?'画像から確認できない情報は省略してください。':'商品名とキャッチコピーは入力内容を正確に使用し、未指定の名称・コピー・価格を創作しないでください。','文字化け、誤字、不要な文字を避け、重要な文字や商品が端で切れないようにしてください。','用紙の縦横比を守り、印刷時にも読みやすい構図にしてください。','指定が競合する場合は、表示禁止、商品デザインの保持、明示したテイスト、その他の作風の順に優先してください。']);
add('9. その他の自由指示',extra?[`次の追加指示は上記の優先条件を守る範囲で反映してください：${extra}`]:[]);return sections.join('\n\n');}
root.PromptGenerator={dimensions,generate};if(typeof module!=='undefined')module.exports=root.PromptGenerator;
})(globalThis);
