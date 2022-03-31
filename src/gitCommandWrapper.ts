/*
 * Module Dependencies
 */
// Builtin Modules
import { execSync } from "child_process";

// External Modules
// Internal Modules

export type commit = {
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
  static getPreviousTag(tag: string): string | undefined {
    // The output of "git tag" follows the format bellow.
    //
    //   v0.0.1\n
    //   v0.0.2\n
    //   v0.0.3\n
    //
    const gitTagStdout = execSync("git tag").toString().replace(/\n$/, "");
    if (gitTagStdout.length === 0) {
      throw new Error("No tags are found.");
    }

    const tags = gitTagStdout.split("\n");

    const tagIndex = tags.findIndex((candidateTag) => candidateTag === tag);
    if (tagIndex === -1) {
      throw new Error(`Tag ${tag} is not found.`);
    }
    const previousTag = tags[tagIndex - 1];
    // Returns undefined if the previous tag is not found.
    // This means the specified tag is the oldest tag.
    return previousTag;
  }

  static getFirstCommit(): string {
    // --reverse            : Show tags from oldest first.
    // --pretty=format:"%h" : Show only short hash value of tags.
    //
    // So the following command show the short hash value of the oldest commit.
    const firstCommit = execSync(
      'git log --reverse --pretty=format:"%h" | head -n 1'
    )
      .toString()
      .replace(/\n$/, "");

    if (firstCommit.length === 0) {
      throw new Error("No commits are found.");
    }

    return firstCommit;
  }

  static getCommitsBetween(
    oldestTagOrCommit: string,
    newestTagOrCommit: string
  ): commit[] {
    // The following command follows the format bellow.
    //
    //   <short hash> <commit message>
    //   <short hash> <commit message>
    //   <short hash> <commit message>
    //
    const commitStrs = execSync(
      `git log --pretty=format:"%h %s" ${oldestTagOrCommit}..${newestTagOrCommit}`
    )
      .toString()
      .replace(/\n$/, "")
      .split("\n");

    const commits: commit[] = [];
    for (const commitStr of commitStrs) {
      // Parse <short hash> from line.
      const idEndIndex = commitStr.indexOf(" ");
      if (idEndIndex === -1) {
        throw new Error("Unexpected output of git log.");
      }
      const hash = commitStr.substring(0, idEndIndex);

      // Parse <commit message> from line.
      const rawMessage: string = commitStr.substring(idEndIndex + 1);

      // Parse prefix from <commit message>
      let prefixes: string[] = [];
      const prefixAndMessage = rawMessage.split(": ");
      if (prefixAndMessage.length >= 2) {
        // Prefix exists.
        const prefix = prefixAndMessage[0];
        if (typeof prefix !== "undefined") {
          prefixes = prefix.split("/");
        }
      }
      const commit: commit = { hash, prefixes, rawMessage };
      commits.push(commit);
    }
    return commits;
  }
}
