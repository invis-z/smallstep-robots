const core = require('@actions/core');
const { Octokit } = require("@octokit/rest");

const repository = core.getInput('repository');
const token = core.getInput('token');
var owner = core.getInput('owner');
var repo = core.getInput('repo');
var excludes = core.getInput('excludes').trim().split(",");

const octokit = (() => {
  if (token) {
    return new Octokit({ auth: token,});
  } else {
    return new Octokit();
  }
})();

async function run() {
    try {
        if (repository){
                [owner, repo] = repository.split("/");
        }
        var releases  = await octokit.repos.listReleases({
            owner: owner,
            repo: repo,
            });
        releases = releases.data;
        releases.sort(function(a, b) { 
            // return b.id - a.id; // I don't know if GitHub's id is only increasing...
            return Date.parse(b.published_at) - Date.parse(a.published_at);
        })
        if (excludes.includes('prerelease')) {
            releases = releases.filter(x => x.prerelease != true);
        }
        if (excludes.includes('draft')) {
            releases = releases.filter(x => x.draft != true);
        }
        if (releases.length) {
            core.setOutput('release', releases[0].tag_name);
            core.setOutput('prerelease', String(releases[0].prerelease));
            core.setOutput('draft', String(releases[0].draft));
            core.setOutput('id', String(releases[0].id));
            core.setOutput('description', String(releases[0].body));
        } else {
            core.setFailed("No valid releases");
        }
    }
    catch (error) {
        core.setFailed(error.message);
    }
}

run()