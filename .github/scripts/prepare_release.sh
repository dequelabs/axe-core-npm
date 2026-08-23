#!/bin/bash

# Fail on first error.
set -e

releaseLevel="$1"

# The calling actions provide no setup-node and no install step, so this script
# has to provision pnpm itself. `lerna version` shells out to it once
# `npmClient: pnpm` is set. @pnpm/exe bundles its own Node, so this works
# regardless of the runner's Node version.
if ! command -v pnpm > /dev/null; then
  npm install -g @pnpm/exe@11
fi

# Let lerna handle versioning if "releaseLevel" is not provided.
if [ -z "$releaseLevel" ]
then
  pnpm dlx lerna@10.0.1 version --conventional-commits --no-push --no-git-tag-version --yes
else
  pnpm dlx lerna@10.0.1 version "$releaseLevel" --conventional-commits --no-push --no-git-tag-version --yes
fi
