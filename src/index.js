const github = require('@actions/github');
const core = require('@actions/core');

const githubToken = core.getInput('github_token');

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

// function getPullNumber() {
//   const pullNumber = core.getInput("pull_number");

//   if (pullNumber) {
//     return pullNumber;
//   }

//   if (!pullNumber) {
//     switch (github.context.eventName) {
//       case "issue_comment":
//         return github.context.payload.issue.number;
//       case "pull_request":
//         return github.context.payload.pull_request.number;
//     }
//   }

//   throw new Error(
//     `Failed to prase pull request number with event_name: "${github.context.eventName}"`
//   );
// }

// async function getCheckSuiteID() {
//   const runID = github.context.runId;

//   core.info(`Getting workflow with ID: ${runID}.`);

//   const { data: workflowRun } = await octokit.actions.getWorkflowRun({
//     owner,
//     repo,
//     run_id: runID,
//   });

//   return workflowRun.check_suite_id;
// }

// async function getLastCheckSuiteRunID(checkSuiteID) {
//   core.info(
//     `Getting check suite runs with ID: ${checkSuiteID} and check_name: "${checkName}".`
//   );

//   const {
//     data: { check_runs: checkRuns },
//   } = await octokit.checks.listForSuite({
//     owner,
//     repo,
//     check_suite_id: checkSuiteID,
//     check_name: checkName,
//   });

//   return checkRuns[checkRuns.length - 1].id;
// }

// async function getPullRequestHeadSha() {
//   const pullNumber = getPullNumber();

//   core.info(`Getting pull request: #${pullNumber}.`);

//   const { data: pullRequest } = await octokit.pulls.get({
//     owner,
//     repo,
//     pull_number: pullNumber,
//   });

//   return pullRequest.head.sha;
// }

// async function createCommitStatus(sha, checkRunID) {
//   const state = core.getInput("state");

//   core.info(`Creating commit status for SHA: "${sha}" with state: "${state}".`);

//   await octokit.repos.createCommitStatus({
//     owner,
//     repo,
//     sha,
//     state,
//     target_url: `https://github.com/${owner}/${repo}/runs/${checkRunID}?check_suite_focus=true`,
//     context: commitContext,
//   });
// }

// async function run() {
//   try {
//     core.info(`Starting for ${owner}/${repo}...`);

//     const checkSuiteID = await getCheckSuiteID();
//     const checkSuiteRunID = await getLastCheckSuiteRunID(checkSuiteID);

//     const prHeadSha = await getPullRequestHeadSha();
//     await createCommitStatus(prHeadSha, checkSuiteRunID);

//     core.info("Completed.");
//   } catch (error) {
//     core.setFailed(error.message);
//   }
// }

// run();
