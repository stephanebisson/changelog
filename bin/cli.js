#!/usr/bin/env node

const cli = require('cli');
const changelog = require('../lib/changelog');

const options = cli.parse({
    format: ['f', 'Format: html, wikitext, wt, json', 'string', 'wikitext'],
    token: ['t', 'OAuth token to query github', 'string', ''],
    rev: ['r', 'Revision to compare against current', 'string', 'HEAD^'],
    headRev: ['h', 'Revision to use as current', 'string', 'HEAD'],
    limit: ['l', 'Maximum number of packages to include', 'integer', 10],
    output: ['o', 'File to output changes to instead of stdout', 'string', ''],
    config: ['c', 'Config file name', 'string', '.changelog']
});

changelog(options);
