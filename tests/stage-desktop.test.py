"""No third-party dependencies; also executed in Windows CI."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]

class DesktopStaging(unittest.TestCase):
    def test_reproducible_staging_leaves_web_unchanged(self):
        files = [ROOT / 'index.html', ROOT / '.nojekyll', *sorted((ROOT / 'css').glob('*')), *sorted((ROOT / 'js').glob('*'))]
        before = {str(p): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
        staged = ROOT / 'desktop/dist'
        def snapshot():
            # Snapshot keys are portable identifiers, not native filesystem paths.
            return {p.relative_to(staged).as_posix(): p.read_bytes() for p in staged.rglob('*') if p.is_file()}
        subprocess.run([sys.executable, str(ROOT / 'scripts/stage-desktop.py')], check=True, cwd=ROOT)
        first = snapshot()
        subprocess.run([sys.executable, str(ROOT / 'scripts/stage-desktop.py')], check=True, cwd=ROOT)
        self.assertEqual(first, snapshot())
        self.assertEqual(before, {str(p): hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
        self.assertEqual(set(first), {'index.html', 'css/style.css', 'js/app.js', 'js/storage.js', 'js/prompt-generator.js', 'js/desktop-runtime.js'})
        for name in ('css/style.css', 'js/storage.js', 'js/prompt-generator.js'):
            self.assertEqual(first[name], (ROOT / name).read_bytes())
        self.assertEqual(first['js/desktop-runtime.js'], (ROOT / 'desktop/runtime.js').read_bytes())
        expected_app = (ROOT / 'js/app.js').read_text(encoding='utf-8')
        expected_app = expected_app.replace('onclick=()=>', 'onclick=async()=>')
        expected_app = expected_app.replace('prompt(', 'await window.desktopDialogs.prompt(')
        expected_app = expected_app.replace('confirm(', 'await window.desktopDialogs.confirm(')
        self.assertEqual((staged / 'js/app.js').read_text(encoding='utf-8'), expected_app)
        expected_html = (ROOT / 'index.html').read_text(encoding='utf-8').replace(
            '<script defer src="./js/app.js"></script>',
            '<script defer src="./js/desktop-runtime.js"></script><script defer src="./js/app.js"></script>')
        self.assertEqual((staged / 'index.html').read_text(encoding='utf-8'), expected_html)
        self.assertIn(b'await window.desktopDialogs.prompt(', first['js/app.js'])
        self.assertNotIn(b'window.desktopDialogs', (ROOT / 'js/app.js').read_bytes())

    def test_window_and_installer_settings(self):
        config = json.loads((ROOT / 'src-tauri/tauri.conf.json').read_text(encoding='utf-8'))
        window = config['app']['windows'][0]
        self.assertEqual((window['width'],window['height']), (1440,900))
        self.assertEqual((window['minWidth'],window['minHeight']), (1100,700))
        self.assertFalse(config['bundle']['active'])
        self.assertEqual(config['build']['frontendDist'], '../desktop/dist')

if __name__ == '__main__':
    unittest.main()
