"""Copy only public app assets. Never modify the GitHub Pages sources."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'desktop' / 'dist'
if DEST.exists():
    shutil.rmtree(DEST)
DEST.mkdir(parents=True)
for name in ('index.html', 'css', 'js'):
    source = ROOT / name
    if source.is_dir():
        shutil.copytree(source, DEST / name)
    else:
        shutil.copy2(source, DEST / name)
# WebView dialogs differ between platforms. Use accessible HTML dialogs in EXE only.
app = DEST / 'js' / 'app.js'
text = app.read_text(encoding='utf-8')
for token in ('prompt(', 'confirm('):
    if token not in text:
        raise RuntimeError(f'Expected browser dialog call not found: {token}')
text = text.replace('onclick=()=>', 'onclick=async()=>')
text = text.replace('prompt(', 'await window.desktopDialogs.prompt(')
text = text.replace('confirm(', 'await window.desktopDialogs.confirm(')
app.write_text(text, encoding='utf-8')
shutil.copy2(ROOT / 'desktop' / 'runtime.js', DEST / 'js' / 'desktop-runtime.js')
index = DEST / 'index.html'
html = index.read_text(encoding='utf-8')
anchor = '<script defer src="./js/app.js"></script>'
if html.count(anchor) != 1:
    raise RuntimeError('Expected app script tag not found')
html = html.replace(anchor, '<script defer src="./js/desktop-runtime.js"></script>' + anchor)
index.write_text(html, encoding='utf-8')
print(f'Desktop assets staged: {DEST}')
