// utils/lazyKiller.ts
import { BrowserContext, Page } from '@playwright/test';

export async function injectLazyKiller(context: BrowserContext) {
    await context.addInitScript(() => {
        // IO を常に isIntersecting=true に
        window.IntersectionObserver = class {
            constructor(cb: any) { cb([{ isIntersecting: true }]); }
            observe() { }
            unobserve() { }
            disconnect() { }
        } as any;

        // DOM 生成直後に lazy → eager
        document.addEventListener('DOMContentLoaded', () => {
            document
                .querySelectorAll<HTMLImageElement>('img[loading="lazy"]')
                .forEach(img => (img.loading = 'eager'));
        });
    });
}

export async function autoScroll(page: Page) {
    await page.evaluate(async () => {
        await new Promise<void>(resolve => {
            const step = window.innerHeight;
            const delay = 100;
            let prev = -1;
            const timer = setInterval(() => {
                window.scrollBy(0, step);
                if (window.scrollY === prev) {
                    clearInterval(timer);
                    resolve();
                }
                prev = window.scrollY;
            }, delay);
        });
    });
}