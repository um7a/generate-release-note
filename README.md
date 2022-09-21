# generate-release-note

![nodejs](https://github.com/um7a/generate-release-note/actions/workflows/nodejs.yml/badge.svg?branch=main)
![daily_build](https://github.com/um7a/generate-release-note/actions/workflows/daily_build.yml/badge.svg?branch=main)

This npm package provides a utility to generate release notes in markdown from git commits.  
You can see the actual release notes which created by this utility on the [Release](https://github.com/um7a/generate-release-note/releases) page of this repository.

- [Install](#install)
- [Usage](#usage)
- [Example](#example)
  - [Create Release Notes from the previous tag to the latest tag](#create-release-notes-from-the-previous-tag-to-the-latest-tag)
  - [Specify the target tag](#specify-the-target-tag)
  - [Customize Release Notes](#customize-release-notes)

## Install

```
$ npm install -g generate-release-note
```

## Usage

```
$ generate-release-note -h

Usage:
  -h, --help     : Show help message.
  -t, --tag      : Release tag.
  -c, --category : Category to put on the release note. The value should be the format "<Category Title>:<Commit Prefix>,<Commit Prefix>,..."
  -d, --debug    : Enable debug logging.
```

## Example

### Create Release Notes from the previous tag to the latest tag

You can create release notes for updates from the previous tag to the latest tag by the following command.

```
$ generate-release-note
```

### Specify the target tag

If you want to create the release note for previously created tag, you can specify the tag using `-t`, `--tag` option.

```
$ generate-release-note -t <tag name>
```

### Customize Release Notes

This utility sort commits using the commit prefix.  
For example, if there is a commit whose commit message is the following, `fix:` is treated as a commit prefix.

```
fix: typo in index.js
```

By default, this utility check the following commit prefix and put the following titles on the release note.  
| Title | Commits that are contained |
| ---- | ---- |
| Features | `feat` |
| Fixes | `fix` |
| Performances | `perf`, `performance` |
| Refactoring | `refactor` |
| Dependencies | `dep`, `deps` |
| Documents | `doc`, `docs` |
| Other Changes | Other commit prefixes. |

You can customize the title and prefixes using `-c`, `--category` option.

The format of the option value is

```
$ npx generate-release-note -c <Category Title>:<commit Prefix>
# or
$ npx generate-release-note -c <Category Title>:<commit Prefix>,<commit Prefix>, ...
```

You can set multiple `-c`, `--category` option.
