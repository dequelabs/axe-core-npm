#!/bin/bash

# Fail on first error.
set -e

releaseLevel="$1"

# Let lerna handle versioning if "releaseLevel" is not provided.
if [ -z "$releaseLevel" ] 
then
  npx lerna version --conventional-commits --no-push --no-git-tag-version --yes  
else
  npx lerna version "$releaseLevel" --conventional-commits --no-push --no-git-tag-version --yes
fi
