# Prize POP Studio

アミューズメント施設の景品POP制作に使う、日本語のChatGPT画像生成プロンプトを作成する静的Webアプリです。HTML・CSS・Vanilla JavaScriptのみで動作し、外部API、CDN、APIキー、認証、データベース、npm、ビルド工程は不要です。

## 主な機能

- JIS規格のA3/A4/A5/B3/B4とカスタムサイズ（1〜5000mm）、縦横切替と実寸・比率計算
- 作風、配色、HEXカラー、フォント、背景、対象、詳細レイアウトをリアルタイム反映
- 商品情報、禁止情報、参考画像の扱い、追加指示の統合
- 箇条書き・自然文切替、手動編集の保護、コピー、テキスト保存
- 初期プリセット6種類、名前付き保存・呼び出し・名前変更・削除、JSON入出力
- プロンプト履歴（最新50件）の保存・再利用・削除
- 画像のローカルプレビュー（最大6枚、各20MB）、ライト・ダーク表示、PC3カラムとレスポンシブ表示

## ローカルで使用

`index.html`をブラウザで開きます。ネットワークなしでも主要機能が動作します。ローカルファイルの保存領域やクリップボード権限はブラウザにより異なります。安定した保存には、同じURLでローカルHTTPサーバーを使ってください（Pythonがある場合）：

```sh
cd prize-pop-studio
python3 -m http.server 8000
```

コピー権限がない場合は本文を選択し、Ctrl+C（Macは⌘C）でコピーできます。

## GitHub Pagesへの公開

1. ファイル一式をGitHubリポジトリの`main`ブランチへマージ・プッシュします。
2. Settings → Pages → Build and deploymentで「Deploy from a branch」を選択します。
3. Branchを`main`、フォルダを`/ (root)`として保存します。
4. デプロイ完了後、Pagesに表示されるURLを開きます。

相対パスを使用しているため、`/prize-pop-studio/`などのサブパスに対応します。`.nojekyll`を含み、ビルドは不要です。アプリの「テキスト保存」はプロンプトを保存し、画像やPOP自体は生成しません。

## 保存と安全性

設定・手動編集中の本文・テーマ・プリセット・履歴は、バージョン1のJSONとしてブラウザのlocalStorage（`pps:`接頭辞）に保存します。同じブラウザ・同じオリジンでのみ復元されます。プライベートモードや保存容量制限では永続保存できない場合がありますが、基本機能は継続します。破損した保存値は安全な初期値へ戻します。プリセットJSONは追加インポートで、最大100件です。履歴と画像はJSONエクスポートに含みません。

入力はHTMLとして描画せず文字列として扱います。画像はObject URLによるプレビューだけに使い、サーバーへ送信せず、localStorageにも保存しません。外部API・解析・フォント取得などの通信は行いません。ページ自体の初回取得を除き通信不要ですが、公開URLのオフライン再読み込みを保証するService Workerは実装していません。

手動編集を始めると、設定変更やプリセット呼び出しでも本文を保持します。「自動生成に戻す」で確認後に再生成します。履歴の再利用は本文と設定を復元します。リセットは保存済みプリセットと履歴を残します。

競合時は表示禁止 → 商品保持 → 明示テイスト → その他の作風の順で優先するよう指示します。画像生成モデルが指示に従うことや印刷解像度は保証できないため、生成画像の文字・寸法・ロゴを確認してください。

## ChatGPTでの使用

1. 用紙・作風・商品情報を入力し、必要なら参考画像をプレビューします。
2. プロンプトをコピーしてChatGPTへ貼り付けます。
3. 参考画像を使用する場合は、同じ画像をChatGPT側で手動添付します。
4. 画像生成を依頼し、出力の内容や文字を確認して印刷に使用します。

## 検証

Node.jsがあれば、追加インストール不要で生成エンジンを検証できます（アプリ利用にNode.jsは不要）。

```sh
node tests/prompt-generator.test.cjs
```

実装時のChromium自動確認は`tests/browser.cjs`を参照してください。これは開発環境のPlaywrightとChromiumを使う任意の検証であり、本番の依存関係ではありません。

## Windows ポータブルEXE版（Tauri 2）

Web版とは別に、既存の画面をローカルに埋め込んだWindows x64版をビルドできます。GitHub Pages用のファイルや公開設定は変更しません。アプリ用サーバー、外部API、CDNは不要です。初期サイズ1440×900、最小1100×700で、最大化・最小化・サイズ変更が可能です。

### ダウンロード・起動

初回はワークフローをmainへマージすると手動実行が表示されます。PRでは自動ビルドします。

1. この変更のマージ後、GitHubの **Actions → Windows portable EXE → Run workflow** で `main` を選び実行します。
2. 成功した実行の **Artifacts → Prize-POP-Studio-windows-x64** をダウンロードします（GitHubへのログインが必要な場合があります）。成果物の保持期間は30日です。
3. Artifactsの外側のZIPを展開し、その中の `Prize-POP-Studio-windows-x64.zip` も展開してください。
4. `Prize POP Studio.exe` を起動します。アプリのインストールは不要で、HTML・CSS・JavaScriptはEXEに埋め込まれています。

対応環境はWindows 10/11 x64です。**Microsoft Edge WebView2 Runtimeが必要**です。通常Windows 11や多くのWindows 10に導入されていますが、未導入のPCではMicrosoft公式のEvergreen Runtimeを別途導入してください。ネットワークから隔離するPCでは事前にRuntimeを用意する必要があります。Runtimeの導入・更新と、アプリ自体のオフライン動作は別です。このZIPはWebView2のインストーラーを含みません。

EXEはコード署名していないため、SmartScreen等で警告される場合があります。配布元・ビルドログとZIPのSHA256（ActionsのPackage portable EXEログ）を確認してください。

### データ保存・移行

プリセット・履歴・設定は従来と同じlocalStorageを使用しますが、**Web版とEXE版の保存領域は別**です。EXE版のWebView2ユーザーデータは通常 `%LOCALAPPDATA%\jp.naganoprize.prizepopstudio\` 配下に保存され、EXEと同じフォルダには保存されません。同じWindowsユーザー・アプリ識別子で起動すると復元されます。

Web版でプリセットをJSONエクスポートし、EXE版でインポートすればプリセットを移行できます（逆方向も可能）。現在のJSON形式はプリセットのみで、履歴・編集中の本文・画像は含みません。必要な本文はテキスト保存してください。JSONとテキストの保存はEXE版ではWindowsの保存ダイアログを使用し、キャンセルできます。画像選択・JSON読込は従来のファイル選択を使い、画像を送信しません。

**USBメモリ等で設定も持ち運べる完全ポータブル方式は未実装で、別途実装が必要です。** 今回の「ポータブル」はアプリのインストールが不要という意味です。EXEを別PCにコピーしても設定は移動しません。

### Windowsでのローカルビルド

事前にRust stable（MSVC）、Visual Studio C++ Build Tools（Desktop development with C++ / Windows SDK）、Python 3、WebView2 Runtimeを準備します。ビルド時の依存関係取得にはインターネットが必要ですが、アプリ実行時には不要です。npmは使いません。

```powershell
# リポジトリのルートで実行
rustup target add x86_64-pc-windows-msvc
cargo install tauri-cli --version 2.12.4 --locked
python tests/stage-desktop.test.py
cargo tauri build --target x86_64-pc-windows-msvc --no-bundle -- --locked
```

出力は `src-tauri/target/x86_64-pc-windows-msvc/release/prize-pop-studio.exe` です。`bundle.active: false` と `--no-bundle` でMSI/NSISなどのインストーラー生成を無効化しています。ActionsはWindows上でプロセス起動とメインウィンドウの出現だけをスモークテストし、このEXEとREADMEをZIPにまとめます。これはUI操作の実機確認を代替しません。`Cargo.lock`でアプリの依存関係を固定しています。

`desktop/dist/` は `scripts/stage-desktop.py` が毎回生成する一時成果物です。公開用 `index.html`・`css/`・`js/` を変更せず必要なものだけコピーし、EXE側だけ非同期HTMLダイアログとネイティブ保存・コピーを組み込みます。Web版の開発・公開にRustやPythonは不要です。

### 検証と残りの確認

- `node tests/prompt-generator.test.cjs`：既存の生成エンジン検証。
- `python tests/stage-desktop.test.py`：ステージングの再現性、Webファイル不変、埋め込み対象、ウィンドウ設定、インストーラー無効化を検証。Windows CIでも実行します。
- `node tests/browser.cjs`：既存Web版のブラウザ検証（任意、開発環境のPlaywright/Chromiumが必要）。
- `node tests/desktop-browser.cjs`：EXE用ファイルの画面・ダイアログ・保存復元をChromiumで検証。Rustとの通信は模擬するため、実際のWindows保存やクリップボードを検証するものではありません。

**GitHub Actionsのビルド成功と、WindowsでのEXE起動成功は別の確認です。** Windows実機では、ZIP展開後に次を確認してください。

- 起動、日本語UI、最小サイズ・最大化・最小化、用紙変更とプロンプト更新
- コピーと他アプリへの貼り付け、プリセット保存、終了・再起動後の設定復元
- JSON保存・インポート、テキスト保存、保存キャンセル、画像プレビュー
- ネットワーク切断状態での起動と上記主要機能

この開発環境はLinuxのため、実際のWindows EXE起動・WebView2・OS保存ダイアログ・Windowsクリップボードの確認は未実施です。CIや実機で未確認の状態を成功とみなさず、Actionsログと実機確認の結果を別々に記録してください。

今回のLinux環境での結果：既存Webブラウザ検証、生成エンジン4テスト、ステージング2テスト、デスクトップ用ブラウザ模擬検証、公式Tauri設定スキーマ検証は通過しました。Windowsターゲットの依存関係取得は成功しましたが、`cargo check --target x86_64-pc-windows-msvc --locked` はLinux側のWindowsリソースコンパイラ `llvm-rc` 不在で停止しています。Windows EXE/ZIPの生成、Actionsでの成功、Windows実機での確認はまだ完了していません。
