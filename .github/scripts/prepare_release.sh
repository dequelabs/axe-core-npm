#!/bin/bash

# Fail on first error.
set -e

releaseLevel="$1"

# The calling actions provide no setup-node and no install step, so pnpm has to
# be provisioned here. @pnpm/exe bundles its own Node, so the runner's version
# does not matter.
if ! command -v pnpm > /dev/null; then
  npm install -g --ignore-scripts @pnpm/exe@11.23.0
fi

# Let lerna handle versioning if "releaseLevel" is not provided.
if [ -z "$releaseLevel" ]
then
  pnpm dlx lerna@10.0.1 version --conventional-commits --no-push --no-git-tag-version --yes
else
  pnpm dlx lerna@10.0.1 version "$releaseLevel" --conventional-commits --no-push --no-git-tag-version --yes
fi
