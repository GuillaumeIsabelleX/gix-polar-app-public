#!/bin/bash


#https://github.com/GuillaumeIsabelleX/gix-polar-app-public
#https://github.com/burtonator/polar-app-public.git


sed -i 's/burtonator/GuillaumeIsabelleX/' package.json
cdir=$(pwd)
for d in *; do 
  if [ -d "$d" ]; then
    echo "$d"
    cd $d
    sed -i 's/$d/gix-$d/' package.json
    cd $cdir
  fi
done
cd $cdir
#sed -i 's/burtonator/GuillaumeIsabelleX/' package.json

sed -i 's/polar-app-public/gix-polar-app-public/' package.json
