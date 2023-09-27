#!/bin/bash

# Fail on first error.
set -e

releaseLevel="$1"

npx standard-version "$releaseLevel" --conventional-commits --no-push --no-git-tag-version --yes
