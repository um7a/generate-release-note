type optionPositionType = {
  found: boolean;
  positions: number[];
};

export type ruleType = {
  shortKey: string;
  longKey: string;
  type: 'number' | 'string' | 'boolean';
  description: string;
};

export type stringOptionType = {
  found: boolean;
  rule: ruleType | undefined;
  values: string[] | undefined;
};
export type numberOptionType = {
  found: boolean;
  rule: ruleType | undefined;
  values: number[] | undefined;
};
export type booleanOptionType = {
  found: boolean;
  rule: ruleType | undefined;
  values: boolean[] | undefined;
};
type truncatedKeyType = {
  nTruncated: number;
  original: string;
  truncated: string;
};

const getTruncatedKey = (original: string): truncatedKeyType => {
  let truncated = original;
  let nTruncated = 0;
  while (truncated.startsWith('-')) {
    nTruncated++;
    truncated = truncated.substring(1);
  }
  return { nTruncated, original, truncated };
};

export class Arguments {
  //
  // private
  //
  #argv: string[];

  #rules: ruleType[];

  #getRule(key: string): { found: boolean; rule: ruleType | undefined } {
    const truncatedKey = getTruncatedKey(key);
    const isShortKey = truncatedKey.truncated.length === 1;

    for (let i = 0; i < this.#rules.length; i++) {
      const rule = this.#rules[i];
      if (typeof rule === 'undefined') {
        continue;
      }
      if (isShortKey) {
        if (truncatedKey.truncated === rule.shortKey) {
          return { found: true, rule };
        }
      } else if (truncatedKey.truncated === rule.longKey) {
        return { found: true, rule };
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
   * @returns { optionPositionType } - The position of the option in #argv.
   */
  #getOptionPosition(rule: ruleType): optionPositionType {
    const notFoundPosition = {
      found: false,
      positions: [],
    };

    // Find option using rule
    const positions: number[] = [];
    for (let i = 0; i < this.#argv.length; i++) {
      const candidateKey = this.#argv[i];
      if (candidateKey === null || typeof candidateKey === 'undefined') {
        continue;
      }

      const truncatedCandidateKey = getTruncatedKey(candidateKey);
      const candidateIsShortKey = truncatedCandidateKey.truncated.length === 1;

      // If the candidate is not option, stop checking and continue.
      if (truncatedCandidateKey.truncated.length <= 0) {
        continue;
      }
      if (candidateIsShortKey && truncatedCandidateKey.nTruncated !== 1) {
        continue;
      }
      if (!candidateIsShortKey && truncatedCandidateKey.nTruncated !== 2) {
        continue;
      }

      if (candidateIsShortKey) {
        if (typeof rule === 'undefined') {
          throw new Error(
            'rule.rule is undefined. But it must not be undefined because rule.found is true.',
          );
        }
        if (truncatedCandidateKey.truncated === rule.shortKey) {
          positions.push(i);
          continue;
        }
      }

      if (truncatedCandidateKey.truncated === rule.longKey) {
        positions.push(i);
        continue;
      }
    }
    if (positions.length > 0) {
      return { found: true, positions };
    }
    return notFoundPosition;
  }

  #get(key: string): stringOptionType {
    const notFoundOption: stringOptionType = {
      found: false,
      rule: undefined,
      values: undefined,
    };
    const rule = this.#getRule(key);
    if (!rule.found) {
      return notFoundOption;
    }
    if (typeof rule.rule === 'undefined') {
      throw new Error(
        'rule.rule is undefined. But it must not be undefined because rule.found is true.',
      );
    }

    const optionPosition = this.#getOptionPosition(rule.rule);
    if (!optionPosition.found) {
      return notFoundOption;
    }
    if (typeof optionPosition.positions === 'undefined') {
      throw new Error(
        'optionPosition.position is undefined. But it must not be undefined because optionPosition.found is true.',
      );
    }
    const values: string[] = [];
    for (let i = 0; i < optionPosition.positions.length; i++) {
      const position = optionPosition.positions[i];
      if (typeof position === 'undefined') {
        continue;
      }
      const value = this.#argv[position + 1];
      // The key is the last of argv.
      if (value === undefined) {
        continue;
      }

      // Check value is not next option key.
      if (value.startsWith('-')) {
        continue;
      }
      values.push(value);
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
  constructor(rules: ruleType[], argv: string[]) {
    // Deep copy rules to this.#rules.
    this.#rules = [];
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      if (typeof rule === 'undefined') {
        continue;
      }
      const ruleCopy = {
        shortKey: rule.shortKey,
        longKey: rule.longKey,
        type: rule.type,
        description: rule.description,
      };
      // truncate shortKey
      const truncatedShortKey = getTruncatedKey(ruleCopy.shortKey);
      if (
        truncatedShortKey.nTruncated !== 1
        && truncatedShortKey.nTruncated !== 0
      ) {
        throw new Error(
          `Invalid rule. shortKey is invalid format: '${ruleCopy.shortKey}'.`,
        );
      }
      if (truncatedShortKey.truncated.length !== 1) {
        throw new Error(
          `Invalid rule. shortKey is invalid format: '${ruleCopy.shortKey}'.`,
        );
      }

      ruleCopy.shortKey = truncatedShortKey.truncated;

      // truncate longKey
      const truncatedLongKey = getTruncatedKey(ruleCopy.longKey);
      if (
        truncatedLongKey.nTruncated !== 2
        && truncatedShortKey.nTruncated !== 0
      ) {
        throw new Error(
          `Invalid rule. longKey is invalid format: '${ruleCopy.longKey}'.`,
        );
      }
      if (truncatedLongKey.truncated.length < 2) {
        throw new Error(
          `Invalid rule. longKey is invalid format: '${ruleCopy.longKey}'.`,
        );
      }

      ruleCopy.longKey = truncatedLongKey.truncated;

      this.#rules.push(ruleCopy);
    }
    // Note: Array.from() is not deep copy.
    // But no problem in the following case because all of argv's elements are string.
    this.#argv = Array.from(argv);
  }

  getBoolean(key: string): booleanOptionType {
    const returnOption: booleanOptionType = {
      found: false,
      rule: undefined,
      values: undefined,
    };

    const option = this.#get(key);
    // Option does not exists.
    if (option.found === false) {
      return returnOption;
    }
    if (typeof option.rule === 'undefined') {
      throw new Error(
        'option.rule is undefined. But it must not be undefined because option.found is true.',
      );
    }
    returnOption.found = option.found;
    returnOption.rule = option.rule;

    // Option exists, but its value does not exists.
    // I treat this case as true.
    if (option.values === undefined || option.values.length === 0) {
      returnOption.values = [true];
      return returnOption;
    }

    returnOption.values = [];
    for (let i = 0; i < option.values.length; i++) {
      const value = option.values[i];
      if (typeof value === 'undefined') {
        continue;
      }
      if (value.match(/[tT]rue/)) {
        returnOption.values.push(true);
        continue;
      }
      if (value.match(/[fF]alse/)) {
        returnOption.values.push(false);
        continue;
      }
      // Treat Non boolean string as no value. So treat as true.
      returnOption.values.push(true);
    }
    return returnOption;
  }

  getString(key: string): stringOptionType {
    return this.#get(key);
  }

  getNumber(key: string): numberOptionType {
    const returnOption: numberOptionType = {
      found: false,
      rule: undefined,
      values: undefined,
    };

    const option = this.#get(key);
    // Option does not exists.
    if (option.found === false) {
      return returnOption;
    }
    if (typeof option.rule === 'undefined') {
      throw new Error(
        'option.rule is undefined. But it must not be undefined because option.found is true.',
      );
    }
    returnOption.found = true;
    returnOption.rule = option.rule;

    // Option exists, but its value does not exists.
    if (option.values === undefined) {
      return returnOption;
    }

    returnOption.values = [];
    for (let i = 0; i < option.values.length; i++) {
      const value = option.values[i];
      if (typeof value !== 'string') {
        continue;
      }
      // Check value can be parsed as number.
      if (!Number.isNaN(Number.parseInt(value, 10))) {
        returnOption.values.push(Number.parseInt(value, 10));
        continue;
      }
      if (!Number.isNaN(Number.parseFloat(value))) {
        returnOption.values.push(Number.parseFloat(value));
        continue;
      }
    }
    return returnOption;
  }

  generateHelp(): string {
    let help = '\nUsage: \n';

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

    for (let lineIndex = 0; lineIndex < optionLines.length; lineIndex++) {
      const optionLine = optionLines[lineIndex];
      if (typeof optionLine === 'undefined') {
        continue;
      }
      help += optionLine.line;
      for (let i = 0; i < maxLineLen - optionLine.line.length; i++) {
        help += ' ';
      }

      help += ` : ${optionLine.description}\n`;
    }

    return help;
  }
}
