#!/usr/bin/env node

require('./regression/semantic/declarations-and-calls');
require('./regression/semantic/control-and-operators');
require('./regression/semantic/types-and-operators');
require('./regression/semantic/arrays-and-declarations');

console.log('Semantic regression checks passed.');
