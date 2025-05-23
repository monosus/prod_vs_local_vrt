import { defineConfig, devices } from '@playwright/test';

const VRT_TEST_DIR = './tests/vrt';
const SNAPSHOT_PATH_TEMPLATE = '{snapshotDir}/{testFilePath}/{arg}{ext}';

const commonProjectSettings = {
    testDir: VRT_TEST_DIR,
    snapshotPathTemplate: SNAPSHOT_PATH_TEMPLATE,
};

const localBaseURL = 'http://localhost:3000';
const productionBaseURL = 'https://www.example.com';

const desktopViewport = { width: 1280, height: 800 };

export default defineConfig({
    timeout: 60_000,
    workers: 8,
    expect: {
        timeout: 10_000,
    },
    reporter: [
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'playwright-report/results.json' }],
        ['list'],
    ],
    use: {
        ignoreHTTPSErrors: true,
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'local',
            use: {
                baseURL: localBaseURL,
                ...devices['Desktop Chrome'],
                viewport: desktopViewport,
            },
            ...commonProjectSettings,
            outputDir: 'test-results/local',
            snapshotDir: './tests/__screenshots__/local',
        },
        {
            name: 'production',
            use: {
                baseURL: productionBaseURL,
                ...devices['Desktop Chrome'],
                viewport: desktopViewport,
            },
            ...commonProjectSettings,
            outputDir: 'test-results/production',
            snapshotDir: './tests/__screenshots__/production',
        },
        {
            name: 'local-vs-prod',
            use: {
                baseURL: localBaseURL,
                ...devices['Desktop Chrome'],
                viewport: desktopViewport,
            },
            ...commonProjectSettings,
            outputDir: 'test-results/local-vs-prod-comparison',
            snapshotDir: './tests/__screenshots__/production',
        },
        {
            name: 'local-mobile',
            use: {
                baseURL: localBaseURL,
                ...devices['iPhone 14'],
            },
            ...commonProjectSettings,
            outputDir: 'test-results/local-mobile',
            snapshotDir: './tests/__screenshots__/local-mobile',
        },
        {
            name: 'production-mobile',
            use: {
                baseURL: productionBaseURL,
                ...devices['iPhone 14'],
            },
            ...commonProjectSettings,
            outputDir: 'test-results/production-mobile',
            snapshotDir: './tests/__screenshots__/production-mobile',
        },
        {
            name: 'local-vs-prod-mobile',
            use: {
                baseURL: localBaseURL,
                ...devices['iPhone 14'],
            },
            ...commonProjectSettings,
            outputDir: 'test-results/local-vs-prod-comparison-mobile',
            snapshotDir: './tests/__screenshots__/production-mobile',
        },
    ],
});