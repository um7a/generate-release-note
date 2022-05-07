/*
 * Module Dependencies
 */
// Builtin Modules
import { execSync } from 'child_process';

// External Modules
// Internal Modules
import Logger from './logger';

export type commitType = {
  hash: string;
  prefixes: string[];
  rawMessage: string;
};

export class GitCommandWrapper {
  //
  // private
  //

  //
  // public
  //
  static getLatestTag(logger?: Logger): string {
    // The output of "git tag" follows the format bellow.
    //
    //   v0.0.1\n
    //   v0.0.2\n
    //   v0.0.3\n
    //
    const command = 'git tag --sort=v:refname';
    logger?.debug(`Execute ${command}`);

    const gitTagStdout = execSync(command).toString().replace(/\n$/, '');

    if (gitTagStdout.length === 0) {
      throw new Error('No tags are found.');
    }

    const tags = gitTagStdout.split('\n');

    logger?.debug(`tags: "${tags.toString()}" (length: ${tags.length})`);

    const latestTag = tags[tags.length - 1];
    if (latestTag === undefined) {
      throw new Error('Failed to parse the output of git tag.');
    }
    return latestTag;
  }

  static getPreviousTag(tag: string, logger?: Logger): string | undefined {
    // The output of "git tag" follows the format bellow.
    //
    //   v0.0.1\n
    //   v0.0.2\n
    //   v0.0.3\n
    //
    const command = 'git tag --sort=v:refname';
    logger?.debug(`Execute ${command}`);

    const gitTagStdout = execSync(command).toString().replace(/\n$/, '');

    if (gitTagStdout.length === 0) {
      throw new Error('No tags are found.');
    }

    const tags = gitTagStdout.split('\n');

    logger?.debug(`tags: "${tags.toString()}" (length: ${tags.length})`);

    const tagIndex = tags.findIndex((candidateTag) => candidateTag === tag);
    if (tagIndex === -1) {
      throw new Error(`Tag ${tag} is not found.`);
    }
    const previousTag = tags[tagIndex - 1];
    // Returns undefined if the previous tag is not found.
    // This means the specified tag is the oldest tag.
    return previousTag;
  }

  static getFirstCommit(logger?: Logger): string {
    // --reverse            : Show tags from oldest first.
    // --pretty=format:"%h" : Show only short hash value of tags.
    //
    // So the following command show the short hash value of the oldest commit.
    const command = 'git log --reverse --pretty=format:"%h"';
    logger?.debug(`Execute ${command}`);

    const commits = execSync(command).toString().replace(/\n$/, '').split('\n');

    logger?.debug(
      `All commits: "${commits.toString()}" (length: ${commits.length})`,
    );

    if (commits.length === 0) {
      throw new Error('No commits are found.');
    }

    const firstCommit = commits[0];
    if (typeof firstCommit === 'undefined') {
      throw new Error('Failed to parse the first commit.');
    }

    return firstCommit;
  }

  static getCommitsBetween(
    oldestTagOrCommit: string,
    newestTagOrCommit: string,
    logger?: Logger,
  ): commitType[] {
    // The following command follows the format bellow.
    //
    //   <short hash> <commit message>
    //   <short hash> <commit message>
    //   <short hash> <commit message>
    //
    const command = `git log --pretty=format:"%h %s" ${oldestTagOrCommit}..${newestTagOrCommit}`;
    logger?.debug(`Execute ${command}`);

    const commitStrs = execSync(
      `git log --pretty=format:"%h %s" ${oldestTagOrCommit}..${newestTagOrCommit}`,
    )
      .toString()
      .replace(/\n$/, '')
      .split('\n');

    logger?.debug(
      `The output of command: "${commitStrs.toString()}" (length: ${
        commitStrs.length
      })`,
    );

    const commits: commitType[] = [];
    for (let commitIndex = 0; commitIndex < commitStrs.length; commitIndex++) {
      const commitStr = commitStrs[commitIndex];
      if (typeof commitStr === 'undefined') {
        continue;
      }
      // Parse <short hash> from line.
      const idEndIndex = commitStr.indexOf(' ');
      if (idEndIndex === -1) {
        throw new Error(
          `Unexpected output of git log: ${commitStrs.toString()}`,
        );
      }
      const hash = commitStr.substring(0, idEndIndex);

      // Parse <commit message> from line.
      const rawMessage: string = commitStr.substring(idEndIndex + 1);

      // Parse prefix from <commit message>
      let prefixes: string[] = [];
      const prefixAndMessage = rawMessage.split(': ');
      if (prefixAndMessage.length >= 2) {
        // Prefix exists.
        const prefix = prefixAndMessage[0];
        if (typeof prefix !== 'undefined') {
          prefixes = prefix.split('/');
        }
      }
      const commit: commitType = { hash, prefixes, rawMessage };
      commits.push(commit);
    }
    return commits;
  }
}
