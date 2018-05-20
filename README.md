# changelog

Generates changes log for npm dependencies of the current repo.

This works for repos that have their `node_modules` directory committed to source control. It was designed specifically for 'deploy' repos of projects based on [NodeServiceTemplate](https://www.mediawiki.org/wiki/ServiceTemplateNode)

## options

-f, --format [STRING]  Format: html, wikitext, wt, json (Default is wikitext)

-t, --token STRING     OAuth token to query github

-r, --rev [STRING]     Revision to compare against current (Default is HEAD^)

-h, --headRev [STRING] Revision to use as current (Default is HEAD)

-l, --limit [INTEGER]  Maximum number of packages to include (Default is 10)

-o, --output STRING    File to output changes to instead of stdout

-c, --config [STRING]  Config file name (Default is .changelog)

## How to use

```
npm install -g changelog
cd <service deploy repo dir>
changelog -f html -o changes.html
```

## Configuration

When only some of the dependencies are relevant, they can be specified in a configuration file named `.changelog` at the root of the deploy repo.

```
kartotherian
@kartotherian/core
@kartotherian/babel
```

