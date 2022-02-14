#!/bin/bash

# Fail on first error.
set -e

releaseLevel="$1"

npx lerna version "$releaseLevel" --conventional-commits --no-push --no-git-tag-version --yes
