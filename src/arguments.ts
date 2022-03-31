type optionPosition = {
  found: boolean;
  positions: number[];
};
type option = {
  found: boolean;
  rule: rule | undefined;
  values: (string | number | boolean)[] | undefined;
};
export type stringOption = {
  found: boolean;
  rule: rule | undefined;
  values: string[] | undefined;
};
type numberOption = {
  found: boolean;
  rule: rule | undefined;
  values: number[] | undefined;
};
type booleanOption = {
  found: boolean;
  rule: rule | undefined;
  values: boolean[] | undefined;
};
type truncatedKey = {
  nTruncated: number;
  original: string;
  truncated: string;
};
export type rule = {
  shortKey: string;
  longKey: string;
  type: "number" | "string" | "boolean";
  description: string;
};

let debugEnabled = false;
//debugEnabled = true;

const debug = (tag: string, msg: string): void => {
  if (debugEnabled) {
    process.stdout.write("debug");
    process.stdout.write(" ");
    process.stdout.write(tag);
    process.stdout.write(" ");
    console.log(msg);
  }
};

const getTruncatedKey = (original: string): truncatedKey => {
  let truncated = original;
  let nTruncated = 0;
  while (truncated.startsWith("-")) {
    nTruncated += 1;
    truncated = truncated.substring(1);
  }
  return { nTruncated, original, truncated };
};

export class Arguments {
  //
  // private
  //
  #argv: string[];
  #rules: rule[];

  getRule(key: string): { found: boolean; rule: rule | undefined } {
    const debugTag = "Arguments.#getRule";

    const truncatedKey = getTruncatedKey(key);
    if (truncatedKey.truncated.length <= 0) {
      debug(
        debugTag,
        `Invalid key: '${key}'. The length of truncated key is ${truncatedKey.truncated.length}.`
      );
    }
    const isShortKey = truncatedKey.truncated.length === 1;

    for (const rule of this.#rules) {
      if (isShortKey) {
        if (truncatedKey.truncated === rule.shortKey) {
          return { found: true, rule };
        }
      } else {
        if (truncatedKey.truncated === rule.longKey) {
          return { found: true, rule };
        }
      }
    }
    return { found: false, rule: undefined };
  }

  /**
   * This function returns the position of the option on #argv.
   * Note:
   *   The format of an option should be follow the format bellow.
   *     (1) "-<single character>"
   *     (2) "-<single character> <value>"
   *     (3) "--<multiple characters>"
   *     (4) "--<multiple characters> <value>"
   * @param {string} key - The key you want to find.
   * @returns { optionPosition } - The position of the option in #argv.
   */
  #getOptionPosition(rule: rule): optionPosition {
    const debugTag = "Arguments.#getOptionPosition";
    const notFoundPosition = {
      found: false,
      positions: [],
    };

    // Find option using rule
    const positions: number[] = [];
    for (let i = 0; i < this.#argv.length; i += 1) {
      const candidateKey = this.#argv[i];
      if (candidateKey === null || typeof candidateKey === "undefined") {
        debug(debugTag, "The element of #argv is null or undefined. continue.");
        continue;
      }

      const truncatedCandidateKey = getTruncatedKey(candidateKey);
      const candidateIsShortKey = truncatedCandidateKey.truncated.length === 1;

      // If the candidate is not option, stop checking and continue.
      if (truncatedCandidateKey.truncated.length <= 0) {
        debug(debugTag, `#argv[${i}] is not an option (only '-'). continue.`);
        continue;
      }
      if (candidateIsShortKey && truncatedCandidateKey.nTruncated !== 1) {
        debug(debugTag, `#argv[${i}] is not an option (no '-'). continue.`);
        continue;
      }
      if (!candidateIsShortKey && truncatedCandidateKey.nTruncated !== 2) {
        debug(debugTag, `#argv[${i}] is not an option (no '--'). continue.`);
        continue;
      }

      if (candidateIsShortKey) {
        if (typeof rule === "undefined") {
          throw new Error(
            `rule.rule is undefined. But it must not be undefined because rule.found is true.`
          );
        }
        if (truncatedCandidateKey.truncated === rule.shortKey) {
          debug(debugTag, "Position of the target short key is found.");
          positions.push(i);
          continue;
        }
      }

      if (truncatedCandidateKey.truncated === rule.longKey) {
        debug(debugTag, "Position of the target long key is found.");
        positions.push(i);
        continue;
      }
    }
    if (positions.length > 0) {
      return { found: true, positions };
    }
    debug(debugTag, "Position of the target key is not found.");
    return notFoundPosition;
  }

  #get(key: string): option {
    const debugTag = "Arguments.#get";
    const notFoundOption: option = {
      found: false,
      rule: undefined,
      values: undefined,
    };

    const keyLength = getTruncatedKey(key).truncated.length;
    const rule = this.getRule(key);
    if (!rule.found) {
      debug(debugTag, `Rule of the ${key} is not found.`);
      return notFoundOption;
    }
    if (typeof rule.rule === "undefined") {
      throw new Error(
        `rule.rule is undefined. But it must not be undefined because rule.found is true.`
      );
    }

    const optionPosition = this.#getOptionPosition(rule.rule);
    if (!optionPosition.found) {
      debug(debugTag, `The key is not found.`);
      return notFoundOption;
    }
    if (typeof optionPosition.positions === "undefined") {
      throw new Error(
        `optionPosition.position is undefined. But it must not be undefined because optionPosition.found is true.`
      );
    }

    const values: (string | number | boolean)[] = [];
    for (const position of optionPosition.positions) {
      const value = this.#argv[position + 1];

      // The key is the last of argv.
      if (value === undefined) {
        debug(debugTag, `The key is found. But its value is not found.`);
        if (rule.rule.type === "boolean") {
          debug(debugTag, `Treat as true.`);
          values.push(true);
        }
        continue;
      }
      debug(debugTag, `The key and value are found.`);

      // Check value can be parsed as boolean.
      if (rule.rule.type === "boolean") {
        if (value.match(/[tT]rue/)) {
          debug(
            debugTag,
            `The boolean option ${key} is found with ${value}. Treat as true.`
          );
          values.push(true);
          continue;
        }
        if (value.match(/[fF]alse/)) {
          debug(
            debugTag,
            `The boolean option ${key} is found with ${value}. Treat as false.`
          );
          values.push(false);
          continue;
        }
        debug(
          debugTag,
          `The boolean option ${key} is found with ${value}. This value is not accepted as the value of boolean option. Treat as the value is not found (treat as true).`
        );
        values.push(true);
        continue;
      }
      if (rule.rule.type === "number") {
        // Check value can be parsed as number.
        if (!Number.isNaN(Number.parseInt(value))) {
          debug(debugTag, `The number option ${key} is found with ${value}.`);
          values.push(Number.parseInt(value));
        }

        if (!Number.isNaN(Number.parseFloat(value))) {
          debug(debugTag, `The number option ${key} is found with ${value}.`);
          values.push(Number.parseFloat(value));
        }
        debug(
          debugTag,
          `The number option ${key} is found with ${value}. This value is not accepted as the value of number option. Skip processing.`
        );
        continue;
      }
      if (rule.rule.type === "string") {
        debug(debugTag, `The string option ${key} is found with ${value}.`);
        values.push(value);
        continue;
      }
    }
    // The value is treated as string.
    return {
      found: true,
      rule: rule.rule,
      values,
    };
  }

  //
  // public
  //
  constructor(rules: rule[], argv: string[]) {
    const debugTag = "Arguments.constructor";

    // Deep copy rules to this.#rules.
    this.#rules = [];
    for (const rule of rules) {
      const ruleCopy = {
        shortKey: rule.shortKey,
        longKey: rule.longKey,
        type: rule.type,
        description: rule.description,
      };
      // truncate shortKey
      const truncatedShortKey = getTruncatedKey(ruleCopy.shortKey);
      if (
        truncatedShortKey.nTruncated !== 1 &&
        truncatedShortKey.nTruncated !== 0
      ) {
        throw new Error(
          `Invalid rule. shortKey is invalid format: '${ruleCopy.shortKey}'.`
        );
      }
      ruleCopy.shortKey = truncatedShortKey.truncated;
      // truncate longKey
      const truncatedLongKey = getTruncatedKey(ruleCopy.longKey);
      if (
        truncatedLongKey.nTruncated !== 2 &&
        truncatedShortKey.nTruncated !== 0
      ) {
        throw new Error(
          `Invalid rule. longKey is invalid format: '${ruleCopy.longKey}'.`
        );
      }
      ruleCopy.longKey = truncatedLongKey.truncated;

      this.#rules.push(ruleCopy);
    }
    // Note: Array.from() is not deep copy.
    // But no problem in the following case because all of argv's elements are string.
    this.#argv = Array.from(argv);
  }

  getBoolean(key: string): booleanOption {
    const debugTag = "Arguments.getBoolean";
    const returnOption: booleanOption = {
      found: false,
      rule: undefined,
      values: undefined,
    };

    const option = this.#get(key);
    // Option does not exists.
    if (option.found === false) {
      debug(debugTag, `The boolean option ${key} is not found.`);
      return returnOption;
    }
    if (typeof option.rule === "undefined") {
      throw new Error(
        `option.rule is undefined. But it must not be undefined because option.found is true.`
      );
    }
    returnOption.found = true;
    returnOption.rule = option.rule;

    // Option exists, but value does not exists.
    // I treat this case as true.
    if (option.values === undefined) {
      debug(debugTag, `The boolean option ${key} is found without values.`);
      return returnOption;
    }

    returnOption.values = [];
    for (const value of option.values) {
      if (typeof value !== "boolean") {
        throw new Error(`Unexpected value of boolean option: ${value}`);
      }
      returnOption.values.push(value);
    }
    return returnOption;
  }

  getString(key: string): stringOption {
    const debugTag = "Arguments.getString";
    const returnOption: stringOption = {
      found: false,
      rule: undefined,
      values: undefined,
    };

    const option = this.#get(key);
    // Option does not exists.
    if (option.found === false) {
      debug(debugTag, `The string option ${key} is not found.`);
      return returnOption;
    }
    if (typeof option.rule === "undefined") {
      throw new Error(
        `option.rule is undefined. But it must not be undefined because option.found is true.`
      );
    }
    returnOption.found = true;
    returnOption.rule = option.rule;

    // Option exists, but value does not exists.
    // I treat this case as true.
    if (option.values === undefined) {
      debug(debugTag, `The string option ${key} is found without values.`);
      return returnOption;
    }

    returnOption.values = [];
    for (const value of option.values) {
      if (typeof value !== "string") {
        throw new Error(`Unexpected value of string option: ${value}`);
      }
      returnOption.values.push(value);
    }
    return returnOption;
  }

  getNumber(key: string): numberOption {
    const debugTag = "Arguments.getNumber";
    const returnOption: numberOption = {
      found: false,
      rule: undefined,
      values: undefined,
    };

    const option = this.#get(key);
    // Option does not exists.
    if (option.found === false) {
      debug(debugTag, `The number option ${key} is not found.`);
      return returnOption;
    }
    if (typeof option.rule === "undefined") {
      throw new Error(
        `option.rule is undefined. But it must not be undefined because option.found is true.`
      );
    }
    returnOption.found = true;
    returnOption.rule = option.rule;

    // Option exists, but value does not exists.
    // I treat this case as true.
    if (option.values === undefined) {
      debug(debugTag, `The number option ${key} is found without values.`);
      return returnOption;
    }

    returnOption.values = [];
    for (const value of option.values) {
      if (typeof value !== "number") {
        throw new Error(`Unexpected value of number option: ${value}`);
      }
      returnOption.values.push(value);
    }
    return returnOption;
  }

  generateHelp(): string {
    let help = "\nUsage: \n";

    let maxLineLen = 0;
    const optionLines: {
      ruleIndex: number;
      line: string;
      description: string;
    }[] = [];

    for (let i = 0; i < this.#rules.length; i++) {
      const rule = this.#rules[i];
      if (rule === undefined) {
        continue;
      }
      const optionLine: string = `  -${rule.shortKey}, --${rule.longKey}`;
      if (optionLine.length > maxLineLen) {
        maxLineLen = optionLine.length;
      }
      optionLines.push({
        ruleIndex: i,
        line: optionLine,
        description: rule.description,
      });
    }

    for (const optionLine of optionLines) {
      help += optionLine.line;
      for (let i = 0; i < maxLineLen - optionLine.line.length; i++) {
        help += " ";
      }

      help += ` : ${optionLine.description}\n`;
    }

    return help;
  }
}
