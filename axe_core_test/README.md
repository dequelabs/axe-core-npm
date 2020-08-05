# Testing Axe Core versions for all @axe-core/packages

## Why?

All of the @axe-core/packages that utilize axe-core should match major and minor versions with the @axe-core/package (ie: @axe-core/cli v3.5 should use axe-core v3.5).

## How?

We will validate axe-core versions with @axe-core/package by writing unit test and running them in ci. This _should_ make it so any commits moving forwards will fail if an @axe-core/package does not have the correct axe-core version.

### Caveat

We are only validating axe-core versions to the minor version and will ignore the patch version. (ie: @axe-core/cli v3.5 can use axe-core v3.5.5-canary)
