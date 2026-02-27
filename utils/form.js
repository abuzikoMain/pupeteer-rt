const CONSTANTS = require('../config/constants');
const { logger } = require('./logger');
const { delay } = require('./browser');

async function waitForXPath(page, xpath, options = {}) {
  const timeout = options.timeout || CONSTANTS.TIMINGS.XPATH_WAIT_TIMEOUT;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const found = await page.evaluate((xpath) => {
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      return result.singleNodeValue !== null;
    }, xpath);

    if (found) return true;
    await delay(CONSTANTS.TIMINGS.XPATH_RETRY_INTERVAL);
  }

  throw new Error(`XPath не найден за ${timeout}мс: ${xpath}`);
}

async function fillInputById(page, inputId, value) {
  const selector = `#${inputId}`;
  await page.waitForSelector(selector, { timeout: CONSTANTS.TIMINGS.ELEMENT_WAIT_TIMEOUT });
  await page.click(selector);
  await page.type(selector, value);
  await delay(CONSTANTS.TIMINGS.INPUT_FILL_DELAY);

  logger.success(`Поле заполнено: #${inputId}`);
}

async function clickButtonById(page, buttonId) {
  const selector = `#${buttonId}`;
  await page.waitForSelector(selector, { timeout: CONSTANTS.TIMINGS.ELEMENT_WAIT_TIMEOUT });
  await page.click(selector);

  logger.success(`Кнопка нажата: #${buttonId}`);
}

// Функция для надёжной навигации с обработкой редиректов
// async function navigateTo(page, url, options = {}) {
//   const {
//     waitUntil = 'networkidle2',
//     timeout = CONSTANTS.TIMINGS.NAVIGATION_TIMEOUT,
//     waitForRedirect = true,
//     maxRedirectWait = 10000,
//   } = options;

//   const initialUrl = page.url();

//   await Promise.all([
//     page.waitForNavigation({ waitUntil, timeout }).catch(() => { }),
//     page.goto(url, { waitUntil: 'domcontentloaded', timeout }),
//   ]);

//   // Если ожидаем редиректы — ждём стабилизации URL
//   if (waitForRedirect) {
//     let lastUrl = page.url();
//     let stableCount = 0;
//     const startTime = Date.now();

//     while (Date.now() - startTime < maxRedirectWait) {
//       await delay(500);
//       const currentUrl = page.url();

//       if (currentUrl === lastUrl) {
//         stableCount++;
//         if (stableCount >= 3) break;
//       } else {
//         stableCount = 0;
//         lastUrl = currentUrl;
//         logger.debug(`Редирект: ${currentUrl}`);
//       }
//     }
//   }

//   logger.success(`Переход выполнен: ${url} → ${page.url()}`);
//   return page.url();
// }

// Функция для надёжной навигации с обработкой редиректов
async function navigateTo(page, url, options = {}) {
  const {
    waitUntil = 'networkidle2',
    timeout = CONSTANTS.TIMINGS.NAVIGATION_TIMEOUT,
    waitForRedirect = true,
    maxRedirectWait = 10000,
  } = options;

  const initialUrl = page.url();

  try {
    await Promise.race([
      page.waitForNavigation({ waitUntil, timeout }),
      page.goto(url, { waitUntil: 'domcontentloaded', timeout }),
    ]);
  } catch (navError) {
    // Если навигация не произошла, пробуем просто перейти
    if (!page.url().includes(url)) {
      await page.goto(url, { waitUntil, timeout });
    }
  }

  // Если ожидаем редиректы — ждём стабилизации URL
  if (waitForRedirect) {
    let lastUrl = page.url();
    let stableCount = 0;
    const startTime = Date.now();

    while (Date.now() - startTime < maxRedirectWait) {
      await delay(500);
      const currentUrl = page.url();

      if (currentUrl === lastUrl) {
        stableCount++;
        if (stableCount >= 3) break;
      } else {
        stableCount = 0;
        lastUrl = currentUrl;
        logger.debug(`Редирект: ${currentUrl}`);
      }
    }
  }

  logger.success(`Переход выполнен: ${url} → ${page.url()}`);
  return page.url();
}

/**
 * Проверка результата входа по изменению URL
 * @param {Page} page - экземпляр Puppeteer Page
 * @param {string} loginUrl - URL страницы авторизации (от которого "ушли" при успехе)
 * @param {boolean} checkErrors - проверять ли наличие ошибок на странице
 */
async function checkLoginResult(page, loginUrl, checkErrors = true) {
  // Небольшая пауза для завершения возможных JS-редиректов
  await delay(500);

  const currentUrl = page.url();

  // 1. Опционально: проверяем наличие ошибок на странице
  // if (checkErrors) {
  //   const errorData = await page.evaluate((errorSelector) => {
  //     const errorMsg = document.querySelector(errorSelector);
  //     return {
  //       hasError: errorMsg !== null,
  //       errorText: errorMsg ? errorMsg.innerText.trim() : '',
  //     };
  //   }, CONSTANTS.SELECTORS.ERROR_MESSAGES.CSS);

  //   if (errorData.hasError) {
  //     return {
  //       success: false,
  //       error: errorData.errorText,
  //       currentUrl,
  //       loginUrl
  //     };
  //   }
  // }

  // 2. Если URL не изменился — мы всё ещё на странице входа
  if (currentUrl === loginUrl || currentUrl.startsWith(loginUrl + '?')) {
    return {
      success: false,
      error: 'URL не изменился — авторизация не прошла',
      currentUrl,
      loginUrl
    };
  }

  // 3. Успех: URL изменился и ошибок нет
  return {
    success: true,
    error: null,
    currentUrl,
    loginUrl
  };
}

module.exports = {
  waitForXPath,
  fillInputById,
  clickButtonById,
  navigateTo,
  checkLoginResult,
};