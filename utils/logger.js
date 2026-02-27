const chalk = require('chalk');

// Уровни логирования
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  SUCCESS: 2,
  WARN: 3,
  ERROR: 4,
};

// Текущий уровень логирования (можно менять через ENV)
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL] || LOG_LEVELS.INFO;

// Форматирование времени
function getTimestamp() {
  return new Date().toISOString().slice(11, 23);
}

// Префиксы для каждого уровня
const PREFIXES = {
  DEBUG: chalk.gray('[DEBUG]'),
  INFO: chalk.blue('[INFO]'),
  SUCCESS: chalk.green('[OK]'),
  WARN: chalk.yellow('[WARN]'),
  ERROR: chalk.red('[ERROR]'),
};

// Основной класс логгера
class Logger {
  constructor(options = {}) {
    this.prefix = options.prefix || '';
    this.indent = options.indent || 0;
    this.showTimestamp = options.showTimestamp !== false;
  }

  _format(level, message, data = null) {
    if (LOG_LEVELS[level] < CURRENT_LEVEL) return;

    const timestamp = this.showTimestamp ? chalk.gray(`${getTimestamp()} `) : '';
    const prefix = PREFIXES[level] || '';
    const indent = '  '.repeat(this.indent);
    const fullMessage = `${timestamp}${prefix}${indent} ${message}`;

    if (data !== null) {
      console.log(fullMessage);
      if (typeof data === 'object') {
        console.log(chalk.gray(indent + '  ' + JSON.stringify(data, null, 2)));
      } else {
        console.log(chalk.gray(indent + '  ' + String(data)));
      }
    } else {
      console.log(fullMessage);
    }
  }

  debug(message, data = null) {
    this._format('DEBUG', message, data);
  }

  info(message, data = null) {
    this._format('INFO', message, data);
  }

  success(message, data = null) {
    this._format('SUCCESS', message, data);
  }

  warn(message, data = null) {
    this._format('WARN', message, data);
  }

  error(message, data = null) {
    this._format('ERROR', message, data);
  }

  // Разделитель секций
  section(title) {
    const line = chalk.gray('─'.repeat(60));
    console.log(`\n${line}`);
    console.log(chalk.white.bold(`  ${title}`));
    console.log(line);
  }

  // Прогресс бар (простой)
  progress(current, total, message) {
    const percent = Math.round((current / total) * 100);
    const filled = Math.round(percent / 5);
    const bar = 'x'.repeat(filled) + 'X'.repeat(20 - filled);
    console.log(`\r${chalk.blue('[PROGRESS]')} [${bar}] ${percent}% - ${message}`);
  }

  // Создание дочернего логгера с отступом
  child(options = {}) {
    return new Logger({
      prefix: options.prefix || this.prefix,
      indent: options.indent || this.indent + 1,
      showTimestamp: this.showTimestamp,
    });
  }
}

// Экспорт экземпляра по умолчанию
const logger = new Logger();

module.exports = {
  Logger,
  logger,
  LOG_LEVELS,
};