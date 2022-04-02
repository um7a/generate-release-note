/*
 * Module Dependencies
 */

// Builtin Modules
import { exit } from 'process';

// External Modules
// Internal Modules
import { Arguments, ruleType, stringOptionType } from './arguments';
import { GitCommandWrapper, commitType } from './gitCommandWrapper';
import Logger from './logger';

/*
 * Types
 */
type categoryType = {
  categoryTitle: string;
  commitPrefixes: string[];
  commits: commitType[];
};
type categoriesType = categoryType[];

/*
 * Variables
 */

const addColorToLog = true;
const logger = new Logger(Logger.static.CRIT, addColorToLog);

/*
 * Functions
 */

const parseArgs = (argv: string[]) => {
  const rules: ruleType[] = [
    {
      shortKey: '-h',
      longKey: '--help',
      type: 'boolean',
      description: 'Show help message.',
    },
    {
      shortKey: '-t',
      longKey: '--tag',
      type: 'string',
      description: 'Release tag.',
    },
    {
      shortKey: '-c',
      longKey: '--category',
      type: 'string',
      description:
        'Category to put on the release note. The value should be the format "<Category Title>:<Commit Prefix>,<Commit Prefix>,..."',
    },
    {
      shortKey: '-d',
      longKey: '--debug',
      type: 'boolean',
      description: 'Enable debug logging.',
    },
  ];
  return new Arguments(rules, argv);
};

const isValidTagOption = (tagOption: stringOptionType): boolean => {
  if (!tagOption.found) {
    logger.debug('-t --tag option was not found.');
    return true;
  }
  if (
    typeof tagOption.values === 'undefined'
    || tagOption.values.length === 0
  ) {
    logger.error('Invalid args. -t --tag option should have <tag name>.');
    return false;
  }
  if (tagOption.values.length > 1) {
    logger.error('Invalid args. Multiple -t --tag option were found.');
    return false;
  }
  return true;
};

const isValidCategoryOption = (categoryOption: stringOptionType): boolean => {
  if (!categoryOption.found) {
    logger.debug('-c --category option was not found.');
    return true;
  }
  if (
    typeof categoryOption.values === 'undefined'
    || categoryOption.values.length === 0
  ) {
    logger.error(
      'Invalid args. -c --category option should have <category title>:<commit prefix>.',
    );
    return false;
  }
  return true;
};

const validateArgs = (args: Arguments) => {
  const validateResult = { isValid: true, needHelp: false };

  // Check that -h --help exists.
  validateResult.needHelp = args.getBoolean('help').found;

  // Validate the value of -t --tag.
  if (!isValidTagOption(args.getString('tag'))) {
    validateResult.isValid = false;
    validateResult.needHelp = true;
  }

  // Validate the value of -c --category.
  if (!isValidCategoryOption(args.getString('category'))) {
    validateResult.isValid = false;
    validateResult.needHelp = true;
  }
  return validateResult;
};

const getReleaseTag = (args: Arguments): string => {
  const tagOption = args.getString('tag');
  // If -t --tag option is not found, use the latest tag.
  if (
    typeof tagOption.values === 'undefined'
    || tagOption.values.length !== 1
    || tagOption.values[0] === undefined
  ) {
    logger.debug(
      'The value of -t --tag option was not found. Use the latest tag instead.',
    );
    return GitCommandWrapper.getLatestTag(logger);
  }
  return tagOption.values[0];
};

const getCategories = (args: Arguments): categoriesType => {
  const defaultCategories: categoriesType = [
    {
      categoryTitle: 'Features',
      commitPrefixes: ['feat'],
      commits: [],
    },
    {
      categoryTitle: 'Fixes',
      commitPrefixes: ['fix'],
      commits: [],
    },
    {
      categoryTitle: 'Performances',
      commitPrefixes: ['perf', 'performance'],
      commits: [],
    },
    {
      categoryTitle: 'Refactoring',
      commitPrefixes: ['refactor'],
      commits: [],
    },
    {
      categoryTitle: 'Dependencies',
      commitPrefixes: ['dep', 'deps'],
      commits: [],
    },
    {
      categoryTitle: 'Documents',
      commitPrefixes: ['doc', 'docs'],
      commits: [],
    },
    {
      categoryTitle: 'Other Changes',
      commitPrefixes: [],
      commits: [],
    },
  ];

  const categoryOption = args.getString('category');
  if (typeof categoryOption.values === 'undefined') {
    logger.debug(
      'The value of -c --category option was not found. Use the default categories instead.',
    );
    return defaultCategories;
  }

  const categories: categoriesType = [];
  for (
    let valueIndex = 0;
    valueIndex < categoryOption.values.length;
    valueIndex++
  ) {
    const value = categoryOption.values[valueIndex];
    if (typeof value === 'undefined') {
      continue;
    }
    // The value of -c --category option follows the format bellow.
    //
    //   "<category title>:<commit prefix>,<commit prefix>,..."
    //
    const categoryTitleEndIndex = value.indexOf(':');
    if (categoryTitleEndIndex === -1) {
      throw new Error('Invalid value of -c --category option.');
    }
    const categoryTitle = value.substring(0, categoryTitleEndIndex);
    const commitPrefixes = value
      .substring(categoryTitleEndIndex + 1)
      .split(',');

    const commitsPerCategory: categoryType = {
      categoryTitle,
      commitPrefixes,
      commits: [],
    };
    categories.push(commitsPerCategory);
  }
  // The commits which does not match with any categories are assigned to Other Changes.
  const defaultCategory: categoryType = {
    categoryTitle: 'Other Changes',
    commitPrefixes: [],
    commits: [],
  };
  categories.push(defaultCategory);

  if (categories.length === 0) {
    logger.debug(
      'Could not parse the value of -c --category option. Use the default categories instead.',
    );
    return defaultCategories;
  }

  return categories;
};

const getDebugFlag = (args: Arguments): boolean => {
  const debugOption = args.getBoolean('debug');
  if (typeof debugOption.values === 'undefined') {
    return false;
  }

  let debugFlag = true;
  debugOption.values.forEach((value) => {
    debugFlag = value;
  });
  return debugFlag;
};

/*
 * Classes
 */

/*
 * Main
 */

export default function main() {
  // Parse arguments.
  logger.debug('Parse arguments.');
  const args = parseArgs(process.argv);

  const validateResult = validateArgs(args);
  if (!validateResult.isValid) {
    // eslint-disable-next-line no-console
    console.log(args.generateHelp());
    exit(1);
  }
  if (validateResult.needHelp) {
    // eslint-disable-next-line no-console
    console.log(args.generateHelp());
    exit(0);
  }
  logger.debug('Parsed arguments successfully.');

  // Set debug log level
  if (getDebugFlag(args)) {
    logger.setLogLevel(Logger.static.DEBUG);
  }

  // Get the end point of release notes.
  const releaseTag = getReleaseTag(args);
  logger.debug(`The release tag is "${releaseTag}".`);

  const categories = getCategories(args);
  logger.debug(
    `The categories are "${JSON.stringify(categories, undefined, 2)}".`,
  );

  // Get the previous tag and the oldest commit.
  const previousTag = GitCommandWrapper.getPreviousTag(releaseTag, logger);
  logger.debug(`The previous tag is "${previousTag}".`);

  const firstCommit = GitCommandWrapper.getFirstCommit(logger);
  logger.debug(`The first commit of the git repository is "${firstCommit}".`);

  const startPoint = previousTag || firstCommit;
  logger.debug(`"${startPoint}" is used for the start point of release note.`);

  // Get commits between the tags.
  const commits = GitCommandWrapper.getCommitsBetween(
    startPoint,
    releaseTag,
    logger,
  );
  logger.debug(`The commits are "${JSON.stringify(commits, undefined, 2)}"`);

  // Sort into the categories.
  while (commits.length > 0) {
    const commit = commits.pop();
    if (typeof commit === 'undefined') {
      continue;
    }
    logger.debug(
      `Find the category matches with the commit ${JSON.stringify(commit)}`,
    );

    let categoryIsFound = false;
    categories.forEach((category) => {
      logger.debug(
        `Check the category ${JSON.stringify(
          category,
        )} matches with the commit.`,
      );
      // for (const prefixInCommit of commit.prefixes) {
      for (
        let prefixIndex = 0;
        prefixIndex < commit.prefixes.length;
        prefixIndex++
      ) {
        const prefixInCommit = commit.prefixes[prefixIndex];
        if (
          !categoryIsFound
          && category.commitPrefixes.length !== 0
          /* Other Changes */ && category.commitPrefixes.some(
            (prefixInCategory) => prefixInCategory === prefixInCommit,
          )
        ) {
          category.commits.push(commit);
          categoryIsFound = true;
          logger.debug(
            `The category ${JSON.stringify(
              categories,
            )} matches with the commit.`,
          );
          break;
        }
      }
    });
    if (!categoryIsFound) {
      // Other Changes
      const otherChanges = categories[categories.length - 1];
      if (typeof otherChanges === 'undefined') {
        logger.error('Category "Other Changes" is not found.');
        exit(1);
      }
      otherChanges.commits.push(commit);
    }
  }

  // Output Release Note.
  // eslint-disable-next-line no-console
  console.log(`# Release Note for ${releaseTag}`);
  categories.forEach((commitsPerCategory) => {
    if (commitsPerCategory.commits.length === 0) {
      return;
    }
    // eslint-disable-next-line no-console
    console.log(`## ${commitsPerCategory.categoryTitle}`);
    commitsPerCategory.commits.forEach((commit) => {
      // eslint-disable-next-line no-console
      console.log(`* ${commit.hash} ${commit.rawMessage}`);
    });
    // eslint-disable-next-line no-console
    console.log();
  });
}
