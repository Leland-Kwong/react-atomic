#!/usr/bin/env bash
# packs and installs npm package folder locally to the provided destination

cleanfiles() {
  ls | sed -n '/^retomic./p' | xargs rm
}

cleanupdist() {
  git checkout dist
}

destination="$1"

npm run build
npm pack --pack-destination $destination
# keep dist folder clean so we don't acidentally commit it
cleanupdist
# install into destination
cd $destination
npm install retomic*.tgz
# cleanup tar files after installing
cleanfiles
