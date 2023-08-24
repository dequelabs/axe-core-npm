#!/bin/bash

# Fail on first error.
set -e

releaseLevel="$1"

npx lerna version "$releaseLevel" --conventional-commits --no-push --no-git-tag-version --yes
version=$(node -pe 'require("./lerna.json").version')
jq '.version = $newVer' --arg newVer "$version" package.json > tmp
mv tmp package.json
