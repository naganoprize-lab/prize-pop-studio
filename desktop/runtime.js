/* Only included in the packaged desktop assets; never loaded by GitHub Pages. */
'use strict';
window.desktopDialogs = {
  show(message, initial, isPrompt) {
    return new Promise(resolve => {
      const previousFocus = document.activeElement;
      const dialog = document.createElement('dialog');
      dialog.style.cssText = 'max-width:480px;width:90%;padding:24px;border:1px solid #728078;border-radius:12px;background:var(--surface);color:inherit';
      const form = document.createElement('form');
      form.method = 'dialog';
      const label = document.createElement('label');
      label.textContent = message;
      const input = document.createElement('input');
      input.value = initial || '';
      input.maxLength = 100;
      if (isPrompt) label.append(input);
      const actions = document.createElement('div');
      actions.style.cssText = 'display:flex;gap:10px;margin-top:20px;justify-content:flex-end';
      const cancel = document.createElement('button');
      cancel.textContent = 'キャンセル';
      cancel.type = 'button';
      cancel.onclick = () => dialog.close('cancel');
      const ok = document.createElement('button');
      ok.textContent = '確定';
      ok.value = 'ok';
      actions.append(cancel, ok);
      form.append(label, actions);
      dialog.append(form);
      document.body.append(dialog);
      dialog.addEventListener('close', () => {
        const result = dialog.returnValue === 'ok';
        dialog.remove();
        previousFocus?.focus();
        resolve(isPrompt ? (result ? input.value : null) : result);
      }, { once: true });
      dialog.showModal();
      (isPrompt ? input : cancel).focus();
      if (isPrompt) input.select();
    });
  },
  prompt(message, initial = '') { return this.show(message, initial, true); },
  confirm(message) { return this.show(message, '', false); }
};
window.addEventListener('DOMContentLoaded', () => {
  const invoke = window.__TAURI__.core.invoke;
  window.download = async (content, type, name) => {
    try {
      const saved = await invoke('save_export', { content, name });
      notify(saved ? 'ファイルを保存しました。' : '保存をキャンセルしました。');
    } catch {
      notify('ファイルを保存できませんでした。保存先のアクセス権と空き容量を確認してください。');
    }
  };
  document.getElementById('copy').onclick = async () => {
    try {
      await invoke('copy_prompt', { text: document.getElementById('output').value });
      notify('プロンプトをコピーしました。');
    } catch {
      const output = document.getElementById('output');
      output.focus();
      output.select();
      notify('本文を選択しました。Ctrl+Cでコピーしてください。');
    }
  };
});
