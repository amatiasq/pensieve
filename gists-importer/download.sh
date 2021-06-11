#!/bin/bash
# https://caiustheory.com/download-all-your-gists/

brew install gist

gist --login

mkdir amatiasq
cd amatiasq

for repo in $(gist -l | awk '{ print $1 }')
do
  git clone $repo 2> /dev/null
done

cp ../process.sh .
