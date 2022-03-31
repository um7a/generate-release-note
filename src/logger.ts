/*
 * Variables
 */

const BG_RED = "\u001b[41m";
const BG_GREEN = "\u001b[42m";
const BG_YELLOW = "\u001b[43m";
const BG_BLUE = "\u001b[44m";
const BG_MAGENTA = "\u001b[45m";
const BG_CYAN = "\u001b[46m";
const RESET = "\u001b[0m";

/*
 * Classes
 */

type logLevel = { color: string; index: number; prefix: string };

export class Logger {
  static static = {
    DEBUG: {
      color: BG_BLUE,
      index: 5,
      prefix: " DEBUG ",
    },
    INFO: {
      color: BG_GREEN,
      index: 4,
      prefix: " INFO ",
    },
    NOTICE: {
      color: BG_CYAN,
      index: 3,
      prefix: " NOTICE ",
    },
    WARN: {
      color: BG_YELLOW,
      index: 2,
      prefix: " WARN ",
    },
    ERROR: {
      color: BG_RED,
      index: 1,
      prefix: " ERROR ",
    },
    CRIT: {
      color: BG_MAGENTA,
      index: 0,
      prefix: " CRITICAL ",
    },
  };

  // private
  #logLevel: logLevel;

  #addColor: boolean;

  #log(msg: string, logLevel: logLevel) {
    const complementedMsg = msg === undefined ? "" : msg;

    if (this.#logLevel.index >= logLevel.index) {
      const coloredPrefix = this.#addColor
        ? `${logLevel.color}${logLevel.prefix}${RESET}`
        : logLevel.prefix;
      if (typeof complementedMsg === "string") {
        // eslint-disable-next-line no-console
        console.log(`${coloredPrefix} ${complementedMsg}`);
        return;
      }
      process.stdout.write(`${coloredPrefix} `);
      // eslint-disable-next-line no-console
      console.log(complementedMsg);
    }
  }

  // public
  constructor(logLevel: logLevel, addColor: boolean) {
    this.#logLevel = logLevel;
    this.#addColor = addColor !== undefined ? addColor : true;
  }

  setLogLevel(logLevel: logLevel) {
    this.#logLevel = logLevel;
  }

  debug(msg: string) {
    this.#log(msg, Logger.static.DEBUG);
  }

  info(msg: string) {
    this.#log(msg, Logger.static.INFO);
  }

  notice(msg: string) {
    this.#log(msg, Logger.static.NOTICE);
  }

  warn(msg: string) {
    this.#log(msg, Logger.static.WARN);
  }

  error(msg: string) {
    this.#log(msg, Logger.static.ERROR);
  }

  crit(msg: string) {
    this.#log(msg, Logger.static.CRIT);
  }
}
