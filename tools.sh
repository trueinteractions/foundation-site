#!/bin/bash

if [ "$1" = "build" ]; then
	if [ ! -d ".tint" ]; then
		git clone https://github.com/trueinteractions/tint2 .tint
	fi
	cd .tint
	git pull
	cd ..
	rm -rf ./.build/docs/*.html > /dev/null
	./node_modules/.bin/jsdoc -c docs.json
fi

if [ "$1" = optimize ]; then
  imageOptim -j -a -q -c -d ./static/images/
fi
