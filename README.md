# generate-release-note
![typescript](https://github.com/um7a/generate-release-note/actions/workflows/typescript.yml/badge.svg?branch=main)

This npm package provides a utility to generate release notes from git tag.  
You can see the actual release notes which created by this utility on the [Release](https://github.com/um7a/generate-release-note/releases) page of this repository.


## (Basic Usage) Create Release Notes for the Latest Tag

You can create release notes for updates from the previous tag to the latest tag by the following command.

```
$ npx generate-release-note
```

## Specify the Tag of Release Notes
If you want to create the release note for previously created tag, you can specify the tag using `-t`, `--tag` option.

```
$ npx generate-release-note -t <tag name>
```

## Customize Release Notes

This utility sort commits using the commit prefix.  
For example, if there is a commit whose commit message is the following, the commit prefix is `fix:`.

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
$ npx generate-release-note -t <Category Title>:<commit Prefix>
# or
$ npx generate-release-note -t <Category Title>:<commit Prefix>,<commit Prefix>, ...
```
You can set multiple `-c`, `--category` option.  
