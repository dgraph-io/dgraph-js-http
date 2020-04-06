# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## 20.3.0 - 2020-04-03

### Changed

- Switch to CalVer to reflect supported Dgraph version.
- Tested and updated to work with Dgraph 20.03.0.

## 1.0.0-rc1 - 2019-03-01

### Changed

- Upgraded devDependencies
- Null is no longer accepted as a falsy parameter
  (thanks to tslint, not sure if a good idea, thus rc1 not final API).

## 0.2.0 - 2019-02-12

### Removed

- Removed linRead logic - see Dgraph issue #2570
  This version of dgraph-js-http may be incompatible with Dgraph below 1.0.9

### Changed

- Switched to yarn for dependencies management

## [0.1.0] - 2018-06-03

### Added
- Full compatibility with Dgraph v1.0.6

[Unreleased]: https://github.com/dgraph-io/dgraph-js-http/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/dgraph-io/dgraph-js-http/tree/v0.1.0
