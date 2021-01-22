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
    context.eventName === 'issue_comment' &&
    context.payload.issue.pull_request
  ) {
    const pr = await getPullRequest(context.payload.issue.number);

    ref = pr.head.ref;
    sha = pr.head.sha;

    core.debug(`The PR's head ref is: ${ref}`);
    core.debug(`The PR's head sha is: ${sha}`);

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

  core.info('set ref output');
  core.setOutput('ref', ref);

  core.info('set sha output');
  core.setOutput('sha', sha);

  core.info('set commit output');
  core.setOutput('commit', commit);
}

run().catch(async error => {
  core.setFailed(error.message);
});
