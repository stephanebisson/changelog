const fs = require('fs-extra');
const https = require('https');
const rp = require('request-promise');
const { exec, execSync } = require('child_process');

const render = require('./render');

const utf8 = {encoding: 'utf-8'};

/**
 * Check if the given package name exist and has a package.json
 * in the current node_modules directory
 */
function packageExist(name) {
    return fs.existsSync(`./node_modules/${name}/package.json`);
}

/**
 * Load the content of package.json for a dependency at a specific revision
 */
function loadPackage(name, rev) {
    rev = rev || 'HEAD';
    const cmd = `git show ${rev}:node_modules/${name}/package.json`;
    return JSON.parse(execSync(cmd, utf8));
}

/**
 * Fetch commits from github for a repo between 2 hashes
 */
function getCommits(repo, fromHash, toHash, options) {
    const uri = `https://api.github.com/repos/${repo}/commits?sha=${toHash}`;
    const token = options.token || process.env.TOKEN;
    let queryOptions = {
        uri,
        json: true,
        headers: {
            'User-Agent': 'changelog'
        }
    };
    if (token) {
        queryOptions.headers.Authorization = 'token ' + token;
    }
    return rp(queryOptions).then(commits => {
        let keep = [];
        for (commit of commits) {
            if (commit.sha === fromHash) {
                return keep;
            }
            if (commit.commit.message.indexOf('Merge pull request #') === 0) {
                // this commit is a pull request merge commit
                // commits from the pull request will show up
                // independently in history
                continue;
            }
            if (commit.commit.message.match(/^\d+\.\d+\.\d+$/)) {
                // this commit is only a version increase commit
                // most likely the result of `npm version`
                continue;
            }
            keep.push({
                message: commit.commit.message,
                messageSummary: commit.commit.message.split("\n")[0],
                date: commit.commit.committer.date,
                sha: commit.sha,
                url: `https://github.com/${repo}/commit/${commit.sha}`
            });
        }
        // TODO: if you get here, there may be more on another page
        return keep;
    });
}

/**
 * Build info object about a npm dependency
 * Includes: name, current revision, previous revision, commits
 */
function buildPackageInfo(name, currentHash, previousHash, options) {
    if (!packageExist(name)) {
        return;
    }

    try {
        const currentPackageJson = loadPackage(name, currentHash);
        const previousPackageJson = loadPackage(name, previousHash);
        const repo = currentPackageJson.repository.url.match(/^.*?github\.com\/(.*?)\.git$/)[1];

        if (previousPackageJson.gitHead === currentPackageJson.gitHead) {
            return;
        }
        
        return getCommits(repo, previousPackageJson.gitHead, currentPackageJson.gitHead, options)
            .then(commits => {
                return {
                    name,
                    current: currentPackageJson.gitHead,
                    previous: previousPackageJson.gitHead,
                    commits
                };
            });
    } catch (e) {
        // TODO: handle this
        // dependencies that were just introduced will fail
        // to get the previous revision because it didn't exist
        // console.log(e);
    }
}

/**
 * Figure the commit hash for a revision (can be a symbolic revision like HEAD^)
 */
function getHash(rev) {
    return execSync(`git log ${rev} -n 1 --format=%h`, utf8).trim();
}

/**
 * Get the list of all npm dependencies of the current package
 */
function getAllPackageNames() {
    return new Promise(function(resolve, reject) {
        exec('npm ls', {cwd: '.'},(error, stdout, stderr) => {
            var packages = stdout.split('\n')
                .map(item => {
                    var m = item.match(/^[└|├|─|┬|│|\s]*(.+?)\@/);
                    if (m) {
                        return m[1];
                    }
                })
                .filter(item => !!item);

            resolve(packages);
        });
    });
}

/**
 * Get the list of all npm dependencies to consider, can be from config file or all
 */
function getPackageNames(options) {
    if (fs.existsSync(options.config)) {
        return Promise.resolve(fs.readFileSync(options.config, utf8).trim().split("\n"));
    } else {
        return getAllPackageNames();
    }
}

/**
 * Send change log content to desired output (stdout or file)
 */
function output(content, options) {
    if (options.output) {
        return fs.writeFile(options.output, content, utf8);
    } else {
        console.log(content);
        return Promise.resolve();
    }
}

/**
 * Do generate the change log based on the given options
 */
function generateChangeLog(options) {
    const currentHash = getHash( options.headRev );
    const previousHash = getHash( options.rev );
    getPackageNames(options).then(names => {
        return Promise
            .all(names
                .slice(0, options.limit)
                .map(name => buildPackageInfo(name, currentHash, previousHash, options))
                .filter(p => !!p))
        })
        .then(repos => { return {repos}; })
        .then(data => render(data, options.format))
        .then(view => output(view, options))
        .catch(console.log);
}

module.exports = generateChangeLog;
