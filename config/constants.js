require('dotenv').config({ path: __dirname + '/../.env' });

module.exports = {
  SITE: {
    BASE_URL: 'https://archangelsk.rt.ru/',
    LOGIN_DOMAIN: 'auth.rt.ru',              
    TARGET_URL: 'https://lk.rt.ru',       
  },

  TIMINGS: {
    PAGE_LOAD_DELAY: 2000,
    INPUT_FILL_DELAY: 500,
    FORM_TOGGLE_DELAY: 2000,
    FORM_SUBMIT_DELAY: 5000,
    BROWSER_CLOSE_DELAY: 5000,
    ELEMENT_WAIT_TIMEOUT: 10000,
    PAGE_LOAD_TIMEOUT: 60000,
    NAVIGATION_TIMEOUT: 30000,
    XPATH_WAIT_TIMEOUT: 30000,
    XPATH_RETRY_INTERVAL: 500,
  },

  SELECTORS: {
    LOGIN_LINK: {
      CSS: 'a[qa-id="Button"][id="short-name-block-id"]',
    },
    SHOW_PASSWORD_FORM_BTN: {
      ID: 'standard_auth_btn',
    },
    FORM_FIELDS: {
      PHONE: { ID: 'username' },
      PASSWORD: { ID: 'password' },
    },
    SUBMIT_BTN: {
      ID: 'kc-login',
    },
    ERROR_MESSAGES: {
      CSS: '.error, .alert-error, [class*="error"]',
    },
  },

  SCREENSHOT: {
    ENABLED: true,
    FULL_PAGE: true,
    DIRECTORY: 'screenshots/',
    FINAL_ONLY: true,
  },

  BROWSER: {
    HEADLESS: false,
    VIEWPORT_WIDTH: 1920,
    VIEWPORT_HEIGHT: 1080,
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ARGS: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
    ],
  },
};