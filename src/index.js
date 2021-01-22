const github = require('@actions/github');
const core = require('@actions/core');

const githubToken = core.getInput('github-token');

const octokit = new github.GitHub(githubToken);

const { context } = github;

let { ref } = context;
let { sha } = context;

async function getPullRequest(number) {
  core.info(`Getting pull request: "${number}".`);

  const { data: pullRequest } = await octokit.pulls.get({
    ...context.repo,
    pull_number: number,
  });

  return pullRequest;
}

async function run() {
  core.debug(`action : ${context.action}`);
  core.debug(`ref : ${context.ref}`);
  core.debug(`eventName : ${context.eventName}`);
  core.debug(`actor : ${context.actor}`);
  core.debug(`sha : ${context.sha}`);
  core.debug(`workflow : ${context.workflow}`);

  let commit;

  if (
    (context.eventName === 'issue_comment' &&
      context.payload.issue.pull_request) ||
    github.context.eventName.startsWith('pull_request')
  ) {
    let pr;

    if (context.eventName === 'issue_comment') {
      pr = await getPullRequest(context.payload.issue.number);
    } else {
      pr = github.context.payload.pull_request;
    }

    ref = pr.head.ref;
    sha = pr.head.sha;

    const { data: commitData } = await octokit.git.getCommit({
      ...context.repo,
      commit_sha: sha,
    });

    commit = commitData.message;

    core.debug(`The head commit is: ${commit}`);
  } else if (github.context.eventName === 'push') {
    core.debug(`The head commit is: ${context.payload.head_commit}`);

    commit = context.payload.head_commit.message;
  } else {
    core.setFailed('Event unrecognized');

    return;
  }

  core.info(`set ref output to ${ref}`);
  core.setOutput('ref', ref);

  core.info(`set sha output to ${sha}`);
  core.setOutput('sha', sha);

  core.info(`set commit output to ${commit}`);
  core.setOutput('commit', commit);
}

run().catch(async error => {
  core.setFailed(error.message);
});
