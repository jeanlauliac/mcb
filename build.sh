#!/bin/bash

node_modules/.bin/tsc ./src/mcb.ts --outFile gen/temp/mcb_bare.js --module system
cat src/prelude.js gen/temp/mcb_bare.js src/epilogue.js > gen/dist/mcb.js
