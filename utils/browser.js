const CONSTANTS = require('../config/constants');
const { logger } = require('./logger');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function initBrowser() {
  const puppeteer = require('puppeteer');

  logger.info('Запуск браузера Puppeteer...');

  const browser = await puppeteer.launch({
    headless: CONSTANTS.BROWSER.HEADLESS,
    args: CONSTANTS.BROWSER.ARGS,
  });

  const page = await browser.newPage();

  await page.setViewport({
    width: CONSTANTS.BROWSER.VIEWPORT_WIDTH,
    height: CONSTANTS.BROWSER.VIEWPORT_HEIGHT,
  });

  await page.setUserAgent(CONSTANTS.BROWSER.USER_AGENT);
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  logger.success('Браузер инициализирован');

  return { browser, page };
}

async function closeBrowser(browser, delayMs = CONSTANTS.TIMINGS.BROWSER_CLOSE_DELAY) {
  await delay(delayMs);
  if (browser && !browser.isConnected()) {
    logger.warn('Браузер уже закрыт');
    return;
  }
  await browser.close();
  logger.info('Браузер закрыт');
}

async function takeScreenshot(page, name = 'screenshot') {
  if (!CONSTANTS.SCREENSHOT.ENABLED) return null;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${CONSTANTS.SCREENSHOT.DIRECTORY}${name}_${timestamp}.png`;

  await page.screenshot({
    path: filename,
    fullPage: CONSTANTS.SCREENSHOT.FULL_PAGE
  });

  logger.debug(`Скриншот сохранён: ${filename}`);
  return filename;
}

async function waitForUrlChange(page, expectedPattern = null, options = {}) {
  const { timeout = 15000, pollInterval = 300 } = options;
  const startTime = Date.now();
  const initialUrl = page.url();

  while (Date.now() - startTime < timeout) {
    const currentUrl = page.url();

    if (currentUrl !== initialUrl) {
      if (!expectedPattern || expectedPattern.test(currentUrl)) {
        logger.debug(`URL изменился: ${initialUrl} → ${currentUrl}`);
        return { success: true, url: currentUrl };
      }
    }

    await delay(pollInterval);
  }

  return {
    success: false,
    url: page.url(),
    error: `Timeout: URL не изменился${expectedPattern ? ` под паттерн ${expectedPattern}` : ''}`
  };
}

module.exports = {
  delay,
  initBrowser,
  closeBrowser,
  takeScreenshot,
  waitForUrlChange
};