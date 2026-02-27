require('dotenv').config({ path: __dirname + '/../.env' });

const CONSTANTS = require('../config/constants');
const { getCredentials, validateEnvFile } = require('../utils/env');
const { initBrowser, closeBrowser, takeScreenshot, delay } = require('../utils/browser');
const { fillInputById, clickButtonById, navigateTo, checkLoginResult } = require('../utils/form');
const { logger } = require('../utils/logger');

// Вспомогательная функция для условного создания скриншотов
async function takeScreenshotIfEnabled(page, name) {
  if (!CONSTANTS.SCREENSHOT.ENABLED) {
    return null;
  }
  
  // Если режим FINAL_ONLY — пропускаем промежуточные скриншоты
  if (CONSTANTS.SCREENSHOT.FINAL_ONLY && !['06_lk_page', 'error'].includes(name)) {
    logger.debug(`Скриншот пропущен (FINAL_ONLY): ${name}`);
    return null;
  }
  
  return await takeScreenshot(page, name);
}

async function runLoginFlow() {
  let browser = null;
  const totalSteps = 6;
  let currentStep = 0;

  try {
    logger.section('АВТОМАТИЗАЦИЯ ВХОДА НА САЙТ');

    // Проверка ENV
    logger.progress(++currentStep, totalSteps, 'Проверка конфигурации');
    if (!validateEnvFile()) {
      throw new Error('Файл .env не найден');
    }

    const { phone, password } = getCredentials();
    logger.info('Учётные данные загружены', {
      телефон: `${phone.substring(0, 4)}***`,
      пароль: '***'.repeat(Math.min(password.length, 10)),
    });

    // Инициализация браузера
    logger.progress(++currentStep, totalSteps, 'Инициализация браузера');
    const { browser: br, page } = await initBrowser();
    browser = br;

    // Переход на главную
    logger.progress(++currentStep, totalSteps, 'Загрузка главной страницы');
    await page.goto(CONSTANTS.SITE.BASE_URL, {
      waitUntil: 'networkidle2',
      timeout: CONSTANTS.TIMINGS.PAGE_LOAD_TIMEOUT,
    });
    await delay(CONSTANTS.TIMINGS.PAGE_LOAD_DELAY);
    await takeScreenshotIfEnabled(page, '01_homepage');
    logger.success('Главная страница загружена');

    // Поиск ссылки
    logger.progress(++currentStep, totalSteps, 'Поиск ссылки для входа');
    const hrefs = await page.evaluate((selector) => {
      const elements = document.querySelectorAll(selector);
      return Array.from(elements)
        .map(el => el.href)
        .filter(href => href && href.trim() !== '');
    }, CONSTANTS.SELECTORS.LOGIN_LINK.CSS);

    if (hrefs.length !== 1) {
      throw new Error(`Ожидается 1 ссылка, найдено: ${hrefs.length}`);
    }

    logger.success(`Ссылка найдена: ${hrefs[0]}`);

    // Переход по ссылке
    logger.progress(++currentStep, totalSteps, 'Переход к форме авторизации');
    const loginPageUrl = await navigateTo(page, hrefs[0]);
    await delay(CONSTANTS.TIMINGS.PAGE_LOAD_DELAY);
    await takeScreenshotIfEnabled(page, '02_login_page');

    // Переключение на форму с паролем
    logger.progress(++currentStep, totalSteps, 'Переключение на форму с паролем');
    await clickButtonById(page, CONSTANTS.SELECTORS.SHOW_PASSWORD_FORM_BTN.ID);
    await delay(CONSTANTS.TIMINGS.FORM_TOGGLE_DELAY);
    await takeScreenshotIfEnabled(page, '03_auth_form');

    // Заполнение формы
    logger.info('Заполнение формы авторизации');
    await fillInputById(page, CONSTANTS.SELECTORS.FORM_FIELDS.PHONE.ID, phone);
    await fillInputById(page, CONSTANTS.SELECTORS.FORM_FIELDS.PASSWORD.ID, password);
    await takeScreenshotIfEnabled(page, '04_form_filled');

    // Отправка формы
    logger.info('Отправка формы');
    await clickButtonById(page, CONSTANTS.SELECTORS.SUBMIT_BTN.ID);
    await delay(CONSTANTS.TIMINGS.FORM_SUBMIT_DELAY);
    await takeScreenshotIfEnabled(page, '05_after_submit');

    // Проверка результата авторизации (по URL)
    logger.section('ПРОВЕРКА АВТОРИЗАЦИИ');
    const loginResult = await checkLoginResult(page, loginPageUrl);

    if (loginResult.success) {
      logger.success('Вход выполнен успешно', {
        было: loginResult.loginUrl,
        стало: loginResult.currentUrl
      });

      // Переход в личный кабинет, если мы ещё не там
      logger.info('Переход в личный кабинет DEBUG');
      const targetUrl = CONSTANTS.SITE.TARGET_URL;
      logger.info('Значение targetUrl', { targetUrl });
      const startWith = loginResult.currentUrl.startsWith(targetUrl);
      logger.info('Значение startWith', { startWith });

      if (!startWith) {
        logger.info('Переход в личный кабинет');
        await navigateTo(page, targetUrl);
        await delay(3000);
        await takeScreenshotIfEnabled(page, '06_lk_page');
        logger.success('Личный кабинет загружен', { url: page.url() });
      } else {
        logger.info('Уже находимся в целевом домене');
      }

    } else {
      logger.error('Ошибка входа', {
        причина: loginResult.error,
        текущий_URL: loginResult.currentUrl,
        ожидаемый_уход_с: loginResult.loginUrl
      });
    }

    logger.section('ЗАВЕРШЕНИЕ');

  } catch (error) {
    logger.error('Критическая ошибка', error.message);

    try {
      if (browser) {
        const pages = await browser.pages();
        if (pages.length > 0) {
          await takeScreenshotIfEnabled(pages[0], 'error');
        }
      }
    } catch { }

    process.exit(1);
  } finally {
    if (browser) {
      await closeBrowser(browser);
    }
    logger.section('РАБОТА ЗАВЕРШЕНА');
  }
}

runLoginFlow();