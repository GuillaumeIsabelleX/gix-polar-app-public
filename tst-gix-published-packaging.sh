#!/bin/bash


#https://github.com/GuillaumeIsabelleX/gix-polar-app-public
#https://github.com/burtonator/polar-app-public.git

tstdir=tests/dummyinstall

wdir=$(pwd)/$tstdir
rm -rf $wdir
mkdir -p $tstdir
(cd $wdir ; npm init --y)
cdir=$(pwd)
for d in *; do 
  if [ -d "$d" ]; then
    echo "$d"
    cd $wdir
	npm install gix-$d --save

    cd $cdir
  fi
done
cd $cdir
#sed -i 's/burtonator/GuillaumeIsabelleX/' package.json

