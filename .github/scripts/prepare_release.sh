#!/bin/bash

# Fail on first error.
set -e

releaseLevel="$1"

# Let lerna handle versioning if "releaseLevel" is not provided.
if [ -z "$releaseLevel" ]
then
  pnpm dlx lerna@10.0.1 version --conventional-commits --no-push --no-git-tag-version --yes
else
  pnpm dlx lerna@10.0.1 version "$releaseLevel" --conventional-commits --no-push --no-git-tag-version --yes
fi
