#!/bin/bash


#https://github.com/GuillaumeIsabelleX/gix-polar-app-public
#https://github.com/burtonator/polar-app-public.git


echo "----------" > _log
tail -f _log &
cdir=$(pwd)
first="polar-karma polar-test"
for d in polar-karma polar-test; do 
  if [ -d "$d" ]; then
    echo "$d"
    cd "$d"
    echo "-----$d-----" >> _log
    npm install && echo "Install ok" >> ../_log || \
    echo "Install Failed" >> _log  && \
    npm publish && echo "Publish ok" >> ../_log|| \
    echo "Publish Failed" >> ../_log
    cd $cdir
  fi
done
cd $cdir
#sed -i 's/burtonator/GuillaumeIsabelleX/' package.json





