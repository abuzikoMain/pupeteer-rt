const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

function validateEnvFile() {
  const envPath = path.join(__dirname, '../.env');
  
  if (!fs.existsSync(envPath)) {
    logger.error(`Файл .env не найден: ${envPath}`);
    return false;
  }
  
  return true;
}

function getCredentials() {
  const phone = process.env.PHONE?.trim();
  const password = process.env.PASSWORD?.trim();
  
  logger.debug('Загрузка учётных данных из .env', {
    path: path.join(__dirname, '../.env'),
    PHONE: phone ? `${phone.substring(0, 3)}***` : 'отсутствует',
    PASSWORD: password ? 'присутствует' : 'отсутствует',
  });
  
  if (!phone) {
    logger.error('Переменная PHONE не найдена в .env');
    throw new Error('PHONE не найден в .env');
  }
  
  if (!password) {
    logger.error('Переменная PASSWORD не найдена в .env');
    throw new Error('PASSWORD не найден в .env');
  }
  
  return { phone, password };
}

module.exports = {
  validateEnvFile,
  getCredentials,
};