#!/usr/bin/env node
require('./lib/js/cli.cjs').entry('drift',require('./backend.cjs'),__dirname);
