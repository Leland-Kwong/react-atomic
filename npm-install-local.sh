# packs and installs locally to the provided directory

cleanfiles() {
  ls | sed -n '/^retomic./p' | xargs rm
}

# cleanup tar files before and after installing
cleanfiles\
  && npm pack --pack-destination $1\
  && cd $1\
  && npm install retomic*.tgz\
  && cleanfiles
