# Publishing to npm

This document contains instructions to publish dgraph-js-http to [npm].

[npm]: https://www.npmjs.com/

## Before deploying

- Bump version by modifying the `version` field in `package.json` file
- Run `npm install` to update the version in `package-lock.json` file
- Commit these changes

## Deploying

- Publish github release notes (specify version tag upon publish)
- Run `cd-dgraph-js-http` workflow (input: version tag)
