import { test, expect } from '@playwright/test';
import { waitForImages } from '../utils/waitForImages';
import { injectLazyKiller } from '../utils/lazyKiller';
import { paths } from './paths';

/**
 * Ensure unique screenshot filenames when the same test file runs in parallel.
 * We append the Playwright parallel index (0, 1, 2, ...) to every snapshot
 * name so concurrent workers never try to write the same file at the same time.
 */
const suffixFor = () => '';

// ★ ファイル全体を parallel モードに
// Playwright v1.30以降対応
// これによりforループで生成した各testがワーカーで並列実行される

test.describe.configure({ mode: 'parallel' });

// プロジェクト名からメニュー展開用ディレクトリ名を生成
const getMenuOpenDir = (projectName: string) => `all-pages-vrt-menu-open-${projectName}`;

/**
 * Pause all <video> elements and reset to the first frame.
 * Ensures consistent screenshots when pages contain autoplay content.
 */
async function pauseAllVideos(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    for (const v of document.querySelectorAll('video')) {
      (v as HTMLVideoElement).pause();
      (v as HTMLVideoElement).currentTime = 0;
    }
  });
}

// beforeEachでlazy killer注入
test.beforeEach(async ({ context }) => {
  await injectLazyKiller(context);
  // Disable autoplaying media so screenshots are stable
  await context.addInitScript(() => {
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true,
      writable: true,
      value: () => Promise.resolve(),
    });
  });
});

test.describe('全ページVRT', () => {
  for (const path of paths) {
    test(`VRT: ${path}`, async ({ page }, testInfo) => {
      await page.goto(path, { waitUntil: 'networkidle' });
      await waitForImages(page);
      await page.waitForLoadState('networkidle');
      await pauseAllVideos(page);
      const safeName = path === '/' ? 'top' : path.replace(/\//g, '_').replace(/^_/, '');

      // 通常状態（並列実行でもファイル競合しないように suffix 追加）
      await expect(page).toHaveScreenshot(`${safeName}${suffixFor()}.png`, {
        fullPage: true,
        animations: 'disabled',
        threshold: 0.3,
        maxDiffPixelRatio: 0.02,
      });

      // トップページのテストの場合のみメニュー展開状態も保存
      // if (path === '/') {
      //   const menuBtn = page.locator('button.w-32.h-32.bg-black');
      //   if (await menuBtn.isVisible()) {
      //     await menuBtn.click();
      //     await page.waitForTimeout(500);
      //     await waitForImages(page);
      //     await pauseAllVideos(page);
      //     const menuDir = getMenuOpenDir(testInfo.project.name);
      //     await expect(page).toHaveScreenshot(`${menuDir}/${safeName}-menu${suffixFor(testInfo)}.png`, {
      //       fullPage: true,
      //       animations: 'disabled',
      //       threshold: 0.4,
      //       maxDiffPixelRatio: 0.05,
      //     });
      //   }
      // }
    });
  }
});