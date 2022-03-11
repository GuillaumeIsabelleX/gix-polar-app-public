#!/bin/bash


#https://github.com/GuillaumeIsabelleX/gix-polar-app-public
#https://github.com/burtonator/polar-app-public.git


echo "----------" > _log
tail -f _log &
cdir=$(pwd)
for d in *; do 
  if [ -d "$d" ]; then
    echo "$d"
    cd "$d"
    echo "-----$d-----" >> _log
    npm install &> /dev/null && echo "Install ok" >> _log || \
    (echo "Install Failed" >> _log && sleep 3)  && \
    npm version minor && npm publish && echo "Publish ok" >> _log|| \
    (echo "Publish Failed" >> _log && sleep 3)
    #npm version major && npm version major
    cat _log >> ../_log
    cd $cdir
  fi
done
cd $cdir
#sed -i 's/burtonator/GuillaumeIsabelleX/' package.json

