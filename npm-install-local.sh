# packs and installs locally to the provided directory
npm pack --pack-destination $1\
  && cd $1\
  && npm install retomic*.tgz
