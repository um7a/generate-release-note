import { Arguments, ruleType } from '../src/arguments';

const validArgv = [
  'program-name',
  '-f',
  '-s',
  'some_string',
  '-n',
  'some_number',
];

const validRule: ruleType[] = [
  {
    shortKey: 'f',
    longKey: 'flag',
    type: 'boolean',
    description: 'some boolean option.',
  },
  {
    shortKey: 's',
    longKey: 'str',
    type: 'string',
    description: 'some string option.',
  },
  {
    shortKey: 'n',
    longKey: 'num',
    type: 'number',
    description: 'some number option.',
  },
];

describe('Test of arguments module', () => {
  describe('Test of constructor', () => {
    test('constructor can be called successfully.', () => {
      const argv = validArgv;
      const rules = validRule;
      expect(() => new Arguments(rules, argv)).not.toThrow();
    });

    test('constructor throw error if shortKey is invalid.', () => {
      const argv = validArgv;
      const rules: ruleType[] = [
        {
          shortKey: 'fl',
          longKey: 'flag',
          type: 'boolean',
          description: 'some boolean option.',
        },
      ];
      expect(() => new Arguments(rules, argv)).toThrow();
    });

    test('constructor throw error if longKey is invalid.', () => {
      const argv = validArgv;
      const rules: ruleType[] = [
        {
          shortKey: 'f',
          longKey: 'f',
          type: 'boolean',
          description: 'some boolean option.',
        },
      ];
      expect(() => new Arguments(rules, argv)).toThrow();
    });
  });

  type testCaseType = {
    argv: string[];
    rule: ruleType;
    getFunction: 'getBoolean' | 'getString' | 'getNumber';
    expectedFound: boolean;
    expectedValues?: boolean[] | string[] | number[];
  };

  const execTest = (testCase: testCaseType) => {
    const {
      getFunction, argv, rule, expectedFound, expectedValues,
    } = testCase;

    test(`${getFunction} (key = [ ${rule.shortKey}, ${
      rule.longKey
    } ], argv = [${argv.toString()}], expectedFound = ${expectedFound}, expectedValue = [${expectedValues}])`, () => {
      const rules: ruleType[] = [rule];
      const args = new Arguments(rules, argv);

      const actualValueOfShort = args[getFunction](rule.shortKey);
      const actualValueOfLong = args[getFunction](rule.longKey);

      expect(actualValueOfShort.found).toBe(expectedFound);
      expect(actualValueOfLong.found).toBe(expectedFound);

      if (expectedValues) {
        if (typeof actualValueOfShort.values === 'undefined') {
          throw new Error(
            `Test failed. Expected is [${expectedValues.toString()}], but the actualValueOfShort is undefined.`,
          );
        }
        if (typeof actualValueOfLong.values === 'undefined') {
          throw new Error(
            `Test failed. Expected is [${expectedValues.toString()}], but the actualValueOfLong is undefined.`,
          );
        }

        expect(actualValueOfShort.values.length).toBe(expectedValues.length);
        expect(actualValueOfLong.values.length).toBe(expectedValues.length);

        for (let i = 0; i < expectedValues.length; i++) {
          expect(actualValueOfShort.values[i]).toBe(expectedValues[i]);
          expect(actualValueOfLong.values[i]).toBe(expectedValues[i]);
          // expect(expectedValues[i]).toBe(actualValueOfShort.values[i]);
          // expect(expectedValues[i]).toBe(actualValueOfLong.values[i]);
        }
      }
    });
  };

  describe('Test of getBoolean()', () => {
    const ruleForGetBooleanTest: ruleType = {
      shortKey: 'f',
      longKey: 'flag',
      type: 'boolean',
      description: 'some boolean option.',
    };
    const testCases: testCaseType[] = [
      // no key and value
      {
        argv: ['program-name'],
        rule: ruleForGetBooleanTest,
        getFunction: 'getBoolean',
        expectedFound: false,
      },
      // only key
      {
        argv: ['program-name', '-f'],
        rule: ruleForGetBooleanTest,
        getFunction: 'getBoolean',
        expectedFound: true,
        expectedValues: [true],
      },
      {
        argv: ['program-name', '--flag'],
        rule: ruleForGetBooleanTest,
        getFunction: 'getBoolean',
        expectedFound: true,
        expectedValues: [true],
      },
      // key and string value
      {
        argv: ['program-name', '-f', 'some_str'],
        rule: ruleForGetBooleanTest,
        getFunction: 'getBoolean',
        expectedFound: true,
        expectedValues: [true],
      },
      {
        argv: ['program-name', '--flag', 'some_str'],
        rule: ruleForGetBooleanTest,
        getFunction: 'getBoolean',
        expectedFound: true,
        expectedValues: [true],
      },
      // key and truthy value
      {
        argv: ['program-name', '-f', 'True'],
        rule: ruleForGetBooleanTest,
        getFunction: 'getBoolean',
        expectedFound: true,
        expectedValues: [true],
      },
      {
        argv: ['program-name', '--flag', 'True'],
        rule: ruleForGetBooleanTest,
        getFunction: 'getBoolean',
        expectedFound: true,
        expectedValues: [true],
      },
      {
        argv: ['program-name', '-f', 'true'],
        rule: ruleForGetBooleanTest,
        getFunction: 'getBoolean',
        expectedFound: true,
        expectedValues: [true],
      },
      {
        argv: ['program-name', '--flag', 'true'],
        rule: ruleForGetBooleanTest,
        getFunction: 'getBoolean',
        expectedFound: true,
        expectedValues: [true],
      },
      // key and falsy value
      {
        argv: ['program-name', '-f', 'False'],
        rule: ruleForGetBooleanTest,
        getFunction: 'getBoolean',
        expectedFound: true,
        expectedValues: [false],
      },
      {
        argv: ['program-name', '--flag', 'False'],
        rule: ruleForGetBooleanTest,
        getFunction: 'getBoolean',
        expectedFound: true,
        expectedValues: [false],
      },
      {
        argv: ['program-name', '-f', 'false'],
        rule: ruleForGetBooleanTest,
        getFunction: 'getBoolean',
        expectedFound: true,
        expectedValues: [false],
      },
      {
        argv: ['program-name', '--flag', 'false'],
        rule: ruleForGetBooleanTest,
        getFunction: 'getBoolean',
        expectedFound: true,
        expectedValues: [false],
      },
      // key and number value
      {
        argv: ['program-name', '-f', '5'],
        rule: ruleForGetBooleanTest,
        getFunction: 'getBoolean',
        expectedFound: true,
        expectedValues: [true],
      },
      {
        argv: ['program-name', '--flag', '5'],
        rule: ruleForGetBooleanTest,
        getFunction: 'getBoolean',
        expectedFound: true,
        expectedValues: [true],
      },
      // key and other key
      {
        argv: ['program-name', '-s', '-f', '-s'],
        rule: ruleForGetBooleanTest,
        getFunction: 'getBoolean',
        expectedFound: true,
        expectedValues: [true],
      },
      {
        argv: ['program-name', '--str', '--flag', '--str'],
        rule: ruleForGetBooleanTest,
        getFunction: 'getBoolean',
        expectedFound: true,
        expectedValues: [true],
      },
      // key and value and other key
      {
        argv: ['program-name', '-s', '-f', 'true', '-s'],
        rule: ruleForGetBooleanTest,
        getFunction: 'getBoolean',
        expectedFound: true,
        expectedValues: [true],
      },
      {
        argv: ['program-name', '--str', '--flag', 'true', '--str'],
        rule: ruleForGetBooleanTest,
        getFunction: 'getBoolean',
        expectedFound: true,
        expectedValues: [true],
      },
    ];
    testCases.forEach((testCase) => {
      execTest(testCase);
    });
  });

  describe('Test of getString()', () => {
    const ruleForGetStringTest: ruleType = {
      shortKey: 's',
      longKey: 'str',
      type: 'string',
      description: 'some string option.',
    };
    const testCases: testCaseType[] = [
      // no key and value
      {
        argv: ['program-name'],
        rule: ruleForGetStringTest,
        getFunction: 'getString',
        expectedFound: false,
      },
      // only key
      {
        argv: ['program-name', '-s'],
        rule: ruleForGetStringTest,
        getFunction: 'getString',
        expectedFound: true,
        expectedValues: [],
      },
      {
        argv: ['program-name', '--str'],
        rule: ruleForGetStringTest,
        getFunction: 'getString',
        expectedFound: true,
        expectedValues: [],
      },
      // key and string value
      {
        argv: ['program-name', '-s', 'some_str'],
        rule: ruleForGetStringTest,
        getFunction: 'getString',
        expectedFound: true,
        expectedValues: ['some_str'],
      },
      {
        argv: ['program-name', '--str', 'some_str'],
        rule: ruleForGetStringTest,
        getFunction: 'getString',
        expectedFound: true,
        expectedValues: ['some_str'],
      },
      // key and boolean value
      {
        argv: ['program-name', '-s', 'true'],
        rule: ruleForGetStringTest,
        getFunction: 'getString',
        expectedFound: true,
        expectedValues: ['true'],
      },
      {
        argv: ['program-name', '--str', 'true'],
        rule: ruleForGetStringTest,
        getFunction: 'getString',
        expectedFound: true,
        expectedValues: ['true'],
      },
      // key and number value
      {
        argv: ['program-name', '-s', '5'],
        rule: ruleForGetStringTest,
        getFunction: 'getString',
        expectedFound: true,
        expectedValues: ['5'],
      },
      {
        argv: ['program-name', '--str', '5'],
        rule: ruleForGetStringTest,
        getFunction: 'getString',
        expectedFound: true,
        expectedValues: ['5'],
      },
      // key and other key
      {
        argv: ['program-name', '-f', '-s', '-f'],
        rule: ruleForGetStringTest,
        getFunction: 'getString',
        expectedFound: true,
        expectedValues: [],
      },
      {
        argv: ['program-name', '--flag', '--str', '--flag'],
        rule: ruleForGetStringTest,
        getFunction: 'getString',
        expectedFound: true,
        expectedValues: [],
      },
      // key and value and other key
      {
        argv: ['program-name', '-f', '-s', 'some_string', '-f'],
        rule: ruleForGetStringTest,
        getFunction: 'getString',
        expectedFound: true,
        expectedValues: ['some_string'],
      },
      {
        argv: ['program-name', '--flag', '--str', 'some_string', '--flag'],
        rule: ruleForGetStringTest,
        getFunction: 'getString',
        expectedFound: true,
        expectedValues: ['some_string'],
      },
    ];
    testCases.forEach((testCase) => {
      execTest(testCase);
    });
  });

  describe('Test of getNumber()', () => {
    const ruleForGetNumberTest: ruleType = {
      shortKey: 'n',
      longKey: 'num',
      type: 'number',
      description: 'some number option.',
    };
    const testCases: testCaseType[] = [
      // no key and value
      {
        argv: ['program-name'],
        rule: ruleForGetNumberTest,
        getFunction: 'getNumber',
        expectedFound: false,
      },
      // only key
      {
        argv: ['program-name', '-n'],
        rule: ruleForGetNumberTest,
        getFunction: 'getNumber',
        expectedFound: true,
        expectedValues: [],
      },
      {
        argv: ['program-name', '--num'],
        rule: ruleForGetNumberTest,
        getFunction: 'getNumber',
        expectedFound: true,
        expectedValues: [],
      },
      // key and string value
      {
        argv: ['program-name', '-n', 'some_str'],
        rule: ruleForGetNumberTest,
        getFunction: 'getNumber',
        expectedFound: true,
        expectedValues: [],
      },
      {
        argv: ['program-name', '--num', 'some_str'],
        rule: ruleForGetNumberTest,
        getFunction: 'getNumber',
        expectedFound: true,
        expectedValues: [],
      },
      // key and boolean value
      {
        argv: ['program-name', '-n', 'true'],
        rule: ruleForGetNumberTest,
        getFunction: 'getNumber',
        expectedFound: true,
        expectedValues: [],
      },
      {
        argv: ['program-name', '--num', 'true'],
        rule: ruleForGetNumberTest,
        getFunction: 'getNumber',
        expectedFound: true,
        expectedValues: [],
      },
      // key and number value
      {
        argv: ['program-name', '-n', '5'],
        rule: ruleForGetNumberTest,
        getFunction: 'getNumber',
        expectedFound: true,
        expectedValues: [5],
      },
      {
        argv: ['program-name', '--num', '5'],
        rule: ruleForGetNumberTest,
        getFunction: 'getNumber',
        expectedFound: true,
        expectedValues: [5],
      },
      // key and other key
      {
        argv: ['program-name', '-f', '-n', '-f'],
        rule: ruleForGetNumberTest,
        getFunction: 'getNumber',
        expectedFound: true,
        expectedValues: [],
      },
      {
        argv: ['program-name', '--flag', '--num', '--flag'],
        rule: ruleForGetNumberTest,
        getFunction: 'getNumber',
        expectedFound: true,
        expectedValues: [],
      },
      // key and value and other key
      {
        argv: ['program-name', '-f', '-n', '5', '-f'],
        rule: ruleForGetNumberTest,
        getFunction: 'getNumber',
        expectedFound: true,
        expectedValues: [5],
      },
      {
        argv: ['program-name', '--flag', '--num', '5', '--flag'],
        rule: ruleForGetNumberTest,
        getFunction: 'getNumber',
        expectedFound: true,
        expectedValues: [5],
      },
    ];
    testCases.forEach((testCase) => {
      execTest(testCase);
    });
  });
});
