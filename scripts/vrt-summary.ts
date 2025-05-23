import fs from 'fs';
import { PNG } from 'pngjs';
import fg from 'fast-glob';
import path from 'path';

(async () => {
  const diffs = await fg('tests/**/__diff__/*.png');
  const report: { file: string; diffPct: string }[] = [];

  for (const p of diffs) {
    const png = PNG.sync.read(fs.readFileSync(p));
    const total = png.width * png.height;
    let diff = 0;
    for (let i = 0; i < png.data.length; i += 4) {
      if (png.data[i] === 255 && png.data[i + 1] === 0 && png.data[i + 2] === 255) diff++;
    }
    report.push({ file: path.basename(p), diffPct: ((diff / total) * 100).toFixed(2) });
  }
  console.table(report.sort((a, b) => Number(b.diffPct) - Number(a.diffPct)));
})(); 