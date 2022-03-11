#!/bin/bash


#https://github.com/GuillaumeIsabelleX/gix-polar-app-public
#https://github.com/burtonator/polar-app-public.git


cdir=$(pwd)
for d in *; do 
  if [ -d "$d" ]; then
    #echo "$d"
    #cd "$d"
    echo $1 sed -i 's/'"$d"'/gix-'"$d"'/' package.json
  
  fi
done
cd $cdir
#sed -i 's/burtonator/GuillaumeIsabelleX/' package.json

