/*
 * Module Dependencies
 */

// Builtin Modules
import { type } from "os";
import { exit } from "process";

// External Modules
// Internal Modules
import { Arguments, rule, stringOption } from "./arguments";
import { GitCommandWrapper, commit } from "./gitCommandWrapper";
import { Logger } from "./logger";

/*
 * Types
 */
type category = {
  categoryTitle: string;
  commitPrefixes: string[];
  commits: commit[];
};
type categories = category[];

/*
 * Variables
 */

const addColorToLog = true;
const logger = new Logger(Logger.static.INFO, addColorToLog);

/*
 * Functions
 */

const parseArgs = (argv: string[]) => {
  const rules: rule[] = [
    {
      shortKey: "-h",
      longKey: "--help",
      type: "boolean",
      description: "Show help message.",
    },
    {
      shortKey: "-t",
      longKey: "--tag",
      type: "string",
      description: "Release tag.",
    },
    {
      shortKey: "-c",
      longKey: "--category",
      type: "string",
      description:
        'Category to put on the release note. The value should be the format "<Category Title>:<Commit Prefix>,<Commit Prefix>,..."',
    },
    {
      shortKey: "-d",
      longKey: "--debug",
      type: "boolean",
      description: "Enable debug logging.",
    },
  ];
  return new Arguments(rules, argv);
};

const isValidTagOption = (tagOption: stringOption): boolean => {
  if (!tagOption.found) {
    logger.debug(`Invalid args. -t --tag option ware not found.`);
    return false;
  }
  if (
    typeof tagOption.values === "undefined" ||
    tagOption.values.length !== 1
  ) {
    logger.debug(
      `Invalid args. None or multiple values of -t --tag option ware found.`
    );
    return false;
  }
  return true;
};

const isValidCategoryOption = (categoryOption: stringOption): boolean => {
  if (!categoryOption.found) {
    logger.debug(`Invalid args. -c --category option ware not found.`);
    return false;
  }
  if (typeof categoryOption.values === "undefined") {
    logger.debug(
      `Invalid args. values of -c --category option ware not found.`
    );
    return false;
  }
  return true;
};

const validateArgs = (args: Arguments) => {
  const validateResult = { isValid: true, needHelp: false };

  // Check that -h --help exists.
  validateResult.needHelp = args.getBoolean("help").found;

  // Validate the value of -t --tag.
  if (!isValidTagOption(args.getString("tag"))) {
    validateResult.isValid = false;
    validateResult.needHelp = true;
  }

  // Validate the value of -c --category.
  if (!isValidCategoryOption(args.getString("category"))) {
    validateResult.isValid = false;
    validateResult.needHelp = true;
  }
  return validateResult;
};

const getReleaseTag = (args: Arguments): string => {
  const tagOption = args.getString("tag");
  if (
    typeof tagOption.values === "undefined" ||
    tagOption.values.length !== 1
  ) {
    throw new Error(`Failed to get the values of -t --tag option.`);
  }

  const releaseTag = tagOption.values[0];
  if (releaseTag === undefined) {
    throw new Error(`The value of -t --tag option is undefined.`);
  }
  return releaseTag;
};

const getCategories = (args: Arguments): categories => {
  const categoryOption = args.getString("category");
  if (typeof categoryOption.values === "undefined") {
    throw new Error(`Failed to get the values of -c --category option.`);
  }

  const categories: categories = [];
  for (const value of categoryOption.values) {
    // The value of -c --category option follows the format bellow.
    //
    //   "<category title>:<commit prefix>,<commit prefix>,..."
    //
    const categoryTitleEndIndex = value.indexOf(":");
    if (categoryTitleEndIndex === -1) {
      throw new Error("Invalid value of -c --category option.");
    }
    const categoryTitle = value.substring(0, categoryTitleEndIndex);
    const commitPrefixes = value
      .substring(categoryTitleEndIndex + 1)
      .split(",");

    const commitsPerCategory: category = {
      categoryTitle,
      commitPrefixes,
      commits: [],
    };
    categories.push(commitsPerCategory);
  }
  // The commits which does not match with any categories are assigned to Other Changes.
  const defaultCategory: category = {
    categoryTitle: "Other Changes",
    commitPrefixes: [],
    commits: [],
  };
  categories.push(defaultCategory);

  return categories;
};

const getDebugFlag = (args: Arguments): boolean => {
  const debugOption = args.getBoolean("debug");
  if (typeof debugOption.values === "undefined") {
    return false;
  }

  let debugFlag = true;
  debugOption.values.forEach(value => {
    debugFlag = value;
  })
  return debugFlag;
}

/*
 * Classes
 */

/*
 * Main
 */

export function main() {
  logger.debug("Parse arguments.");
  const args = parseArgs(process.argv);

  const validateResult = validateArgs(args);
  if (validateResult.needHelp && !validateResult.isValid) {
    console.log(args.generateHelp());
    exit(1);
  }
  if (validateResult.needHelp) {
    console.log(args.generateHelp());
    exit(0);
  }
  logger.debug("Parsed arguments successfully.");

  if (getDebugFlag(args)) {
    logger.setLogLevel(Logger.static.DEBUG);
  }

  const releaseTag = getReleaseTag(args);
  logger.debug(`The release tag is "${releaseTag}".`);

  const categories = getCategories(args);
  logger.debug(`The categories are "${JSON.stringify(categories, undefined, 2)}".`);

  // Get the previous tag and the oldest commit.
  const previousTag = GitCommandWrapper.getPreviousTag(releaseTag);
  logger.debug(`The previous tag is "${previousTag}".`);

  const firstCommit = GitCommandWrapper.getFirstCommit();
  logger.debug(`The first commit of the git repository is "${firstCommit}".`);

  const startPoint = previousTag ? previousTag : firstCommit;
  logger.debug(`"${startPoint}" is used for the start point of release note.`);

  // Get commits between the tags.
  const commits = GitCommandWrapper.getCommitsBetween(startPoint, releaseTag);
  logger.debug(`The commits are "${JSON.stringify(commits, undefined, 2)}"`);

  // Sort into the categories.
  while (commits.length > 0) {
    const commit = commits.pop();
    if (typeof commit === "undefined") {
      continue;
    }
    logger.debug(`Find the category matches with the commit ${JSON.stringify(commit)}`);

    let categoryIsFound = false;
    categories.forEach((category) => {
      logger.debug(`Check the category ${JSON.stringify(category)} matches with the commit.`);
      for (const prefixInCommit of commit.prefixes) {
        if (
          !categoryIsFound &&
          category.commitPrefixes.length !== 0 /* Other Changes */ &&
          category.commitPrefixes.some(
            (prefixInCategory) => prefixInCategory === prefixInCommit
          )
        ) {
          category.commits.push(commit);
          categoryIsFound = true;
          logger.debug(`The category ${JSON.stringify(categories)} matches with the commit.`);
          break;
        }
      }
    });
    if (!categoryIsFound) {
      // Other Changes
      const otherChanges = categories[categories.length - 1];
      if (typeof otherChanges === "undefined") {
        logger.error('Category "Other Changes" is not found.');
        exit(1);
      }
      otherChanges.commits.push(commit);
    }
  }

  // Output Release Note.
  console.log(`# Release Note for ${releaseTag}`);
  categories.forEach((commitsPerCategory) => {
    if (commitsPerCategory.commits.length === 0) {
      return;
    }
    console.log(`## ${commitsPerCategory.categoryTitle}`);
    commitsPerCategory.commits.forEach((commit) => {
      console.log(`* ${commit.hash} ${commit.rawMessage}`);
    });
    console.log();
  });
}
