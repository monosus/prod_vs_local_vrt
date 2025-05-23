import { Page } from '@playwright/test';

interface ImageLoadResult {
  src: string;
  status: 'already_complete' | 'loaded' | 'error' | 'timeout';
}

export async function waitForImages(page: Page) {
  // IntersectionObserver をモックして即ロード
  await page.addInitScript(() => {
    window.IntersectionObserver = class {
      constructor(cb: any) { cb([{ isIntersecting: true }]); }
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;
  });

  // すべての <img> 完全ロードを待機
  console.log('Starting waitForImages...');
  try {
    await page.evaluate(async () => {
      const imgs = Array.from(document.images);
      console.log(`[Browser] Found ${imgs.length} images to check for completion.`);

      const promises: Promise<ImageLoadResult>[] = imgs.map((img, index) => {
        if (img.complete && img.naturalWidth > 0) {
          // console.log(`[Browser] Image ${index} (${img.src.substring(0, 50)}...) already complete.`);
          return Promise.resolve({ src: img.src.substring(0,100), status: 'already_complete' });
        }
        // console.log(`[Browser] Image ${index} (${img.src.substring(0, 50)}...) is not complete. Adding listeners.`);
        return new Promise((resolve) => {
          let resolved = false;
          const identifier = `Image ${index} (${img.src.substring(0, 100)}...)`;

          const resolveOnce = (status: 'loaded' | 'error' | 'timeout') => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeoutId);
              img.removeEventListener('load', loadListener);
              img.removeEventListener('error', errorListener);
              // console.log(`[Browser] ${identifier} resolved with status: ${status}`);
              resolve({ src: img.src.substring(0,100), status });
            }
          };

          const timeoutId = setTimeout(() => {
            // console.warn(`[Browser] ${identifier} timed out after 20s waiting for load/error.`);
            resolveOnce('timeout');
          }, 20000); // 個々の画像のロードタイムアウトを20秒に設定

          const loadListener = () => resolveOnce('loaded');
          const errorListener = () => resolveOnce('error');

          img.addEventListener('load', loadListener);
          img.addEventListener('error', errorListener);
        });
      });
      const results = await Promise.all(promises);
      // console.log("[Browser] All image checks processed:", results);
      const timedOutImages = results.filter(r => r.status === 'timeout');
      if (timedOutImages.length > 0) {
        console.warn(`[Browser] ${timedOutImages.length} images timed out:`, timedOutImages.map(r => r.src));
      }
       const errorImages = results.filter(r => r.status === 'error');
      if (errorImages.length > 0) {
        console.warn(`[Browser] ${errorImages.length} images errored:`, errorImages.map(r => r.src));
      }
    });
  } catch (e: any) {
    console.error("Error during page.evaluate in waitForImages:", e.message);
  }
  console.log('Finished waitForImages.');
} 