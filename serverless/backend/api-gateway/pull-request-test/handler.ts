import { Context, Callback } from 'aws-lambda';
import { PullRequest } from './resources/pull-request';
const slack = require('slack');
const botname = 'devops-fonteva';
const viewName = 'FONTEVA_QA_ATDD_Pull_Requests_Validation';
const token = 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U';
const octokit = require('@octokit/rest')({
  timeout: 0, // 0 means no request timeout
  headers: {
    accept: 'application/vnd.github.v3+json',
    'user-agent': 'octokit/rest.js v1.2.3' // v1.2.3 will be current version
  },
  baseUrl: 'https://api.github.com',
  agent: undefined
});
octokit.authenticate({
  type: 'token',
  token: '64bfd77ac5a6760de1c27650c287e2b93dd8781a' // smunukuntla -> ' a878b18e2cf86c91b294e12b9a86a770d1cfa0d4' // fonteva-qa-atdd-pr-validation
});
const jenkinsapi = require('jenkins-api');
const username = 'smunukuntla@fonteva.com';
const jenkintoken = '51dd16be6ca691a6f95e31bf1e26cfc5';
const jenkins = jenkinsapi.init(
  `https://${username}:${jenkintoken}@jenkins.fonteva.io`,
  {
    strictSSL: true
  }
);
// await octokit.users.get()

const pullrequest: PullRequest = new PullRequest();
export interface Trigger {
  type: string;
  action: string;
}
export interface Checklist {
  repoFullName: string;
  repoOwner: string;
  repoPrivate: boolean;
  repoURL: string;
  reviewer: Array<Object>;
  pullrequestTitleFormat: string;
  pullrequestHTMLUrl: string;
  pullrequestAuthor: string;
  jenkinJOBName: string;
  jenkinsJOBBranch: string;
}

exports.pullRequestTest = async (
  event: any,
  context: Context,
  callback: Callback
) => {
  if (event.headers['X-GitHub-Event'] !== undefined) {
    //#region Request from Github

    const allViews: Array<string> = [];
    const allJobsInView: Array<string> = [];
    const trigger: Trigger = {
      type: event.headers['X-GitHub-Event'],
      action: JSON.parse(event.body).action
    };
    const checklist: Checklist = {
      repoFullName: JSON.parse(event.body).repository.full_name, // Fonteva/fonteva-qa-atdd
      repoOwner: JSON.parse(event.body).repository.owner.login, // Fonteva
      repoPrivate: JSON.parse(event.body).repository.private, // true
      repoURL: JSON.parse(event.body).repository.git_url, // git://github.com/Fonteva/fonteva-qa-atdd.git
      reviewer: JSON.parse(event.body).pull_request.requested_reviewers, // length > 0
      pullrequestTitleFormat: JSON.parse(event.body)
        .pull_request.title.toLowerCase()
        .trim(),
      pullrequestHTMLUrl: JSON.parse(event.body).pull_request.html_url,
      pullrequestAuthor: JSON.parse(event.body).pull_request.user.login,
      jenkinJOBName: `PR-Job-${
        JSON.parse(event.body).pull_request.number
      }-author-${JSON.parse(event.body).pull_request.user.login}`,
      jenkinsJOBBranch: `*/${JSON.parse(event.body).pull_request.head.ref}`
    };
    if (
    checklist.repoFullName === 'Fonteva/fonteva-qa-atdd' && // 'Fonteva/fonteva-qa-atdd'
    checklist.repoOwner === 'Fonteva' && // Fonteva
    checklist.repoPrivate === true &&
    checklist.repoURL.includes('github.com/Fonteva/fonteva-qa-atdd.git') // github.com/Fonteva/fonteva-qa-atdd.git
  ) {
    switch (`${trigger.type}:${trigger.action}`) {
      //#region When a PR is CREATED
      case 'pull_request:opened':
        if (
          (checklist.pullrequestTitleFormat.match(/{/g) || []).length === 1 &&
          (checklist.pullrequestTitleFormat.match(/}/g) || []).length === 1
        ) {
          const start = checklist.pullrequestTitleFormat.indexOf('{');
          const end = checklist.pullrequestTitleFormat.indexOf('}');
          const tags = checklist.pullrequestTitleFormat.slice(
            Number(start),
            Number(end)
          );
          if (
            ((tags.match(/@insprint/g) || []).length === 1 &&
              ((tags.match(/@2018-r2/g) || []).length === 0 &&
                (tags.match(/@2018-r1/g) || []).length === 0)) ||
            ((tags.match(/@2018-r2/g) || []).length === 1 &&
              ((tags.match(/@insprint/g) || []).length === 0 &&
                (tags.match(/@2018-r1/g) || []).length === 0)) ||
            ((tags.match(/@2018-r1/g) || []).length === 1 &&
              ((tags.match(/@insprint/g) || []).length === 0 &&
                (tags.match(/@2018-r2/g) || []).length === 0))
          ) {
            // REVIEW REQUEST
            await octokit.pullRequests.createReviewRequest({
              owner: `${checklist.repoOwner}`,
              repo: `${checklist.repoFullName.split('/')[1]}`,
              number: `${JSON.parse(event.body).number}`,
              reviewers: [`${botname}`]
            });
            // POST ON SLACK
            /*await slack.chat.postMessage({
              token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
              channel: 'testing',
              // text: `Hey Andy, I'm here and under testing on other channel.`
              // tslint:disable-next-line:max-line-length
              text: `PR Title: ${checklist.pullrequestTitleFormat}\nPR Link: ${
                checklist.pullrequestHTMLUrl
              }\nAuthor: ${
                checklist.pullrequestAuthor
                // tslint:disable-next-line:max-line-length
              }\nStatus: REVIEW_REQUESTED \nReason: Initial checks PASSED and I'm validating the pull request.` // Build is triggered with runner cmd: ${tags}`
            });*/
            // API GATEWAY RESPONSE: 200
            const response = {
              headers: {
                'Access-Control-Allow-Origin': '*'
              },
              statusCode: 200};
            callback(null, response);
          } else if ((tags.match(/framework/g) || []).length === 1) {
            // COMMENT
            await octokit.issues.createComment({
              owner: `${checklist.repoOwner}`,
              repo: `${checklist.repoFullName.split('/')[1]}`,
              number: `${JSON.parse(event.body).number}`,
              body: `@${
                JSON.parse(event.body).pull_request.user.login
              }, I will not RUN this since it is a 'Framework' enhancement`
            });
            // POST ON SLACK
            /*await slack.chat.postMessage({
              token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
              channel: 'testing',
              // text: `Hey Andy, I'm here and under testing on other channel.`
              // tslint:disable-next-line:max-line-length
              text: `PR Title: ${checklist.pullrequestTitleFormat}\nPR Link: ${
                checklist.pullrequestHTMLUrl
              }\nAuthor: ${
                checklist.pullrequestAuthor
              }\nStatus: COMMENT \nReason: I will not RUN this since it is a 'Framework' enhancement`
            });*/
            // API GATEWAY RESPONSE: 200
            const response = {
              headers: {
                'Access-Control-Allow-Origin': '*'
              },
              statusCode: 200};
            callback(null, response);
          } else {
            // COMMENT
            await octokit.issues.createComment({
              owner: `${checklist.repoOwner}`,
              repo: `${checklist.repoFullName.split('/')[1]}`,
              number: `${JSON.parse(event.body).number}`,
              body: `@${
                JSON.parse(event.body).pull_request.user.login
              }, **INVALID_TAG_FORMAT**: Tags should be unique and must be paired with either of these **@insprint/@2018-r1/@2018-r2**`
            });
            // DELETE REVIEW REQUEST
            await octokit.pullRequests.deleteReviewRequest({
              owner: `${checklist.repoOwner}`,
              repo: `${checklist.repoFullName.split('/')[1]}`,
              number: `${JSON.parse(event.body).number}`,
              reviewers: [`${botname}`]
            });
            // POST ON SLACK
            /*await slack.chat.postMessage({
              token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
              channel: 'testing',
              // text: `Hey Andy, I'm here and under testing on other channel.`
              // tslint:disable-next-line:max-line-length
              text: `PR Title: ${checklist.pullrequestTitleFormat}\nPR Link: ${
                checklist.pullrequestHTMLUrl
              }\nAuthor: ${
                checklist.pullrequestAuthor
                // tslint:disable-next-line:max-line-length
              }\nStatus: COMMENT \nReason: **INVALID_TAG_FORMAT**: Tags should be unique and must be paired with either of these **@insprint/@2018-r1/@2018-r2**`
            });*/
            // API GATEWAY RESPONSE: 200
            const response = {
              headers: {
                'Access-Control-Allow-Origin': '*'
              },
              statusCode: 200};
            callback(null, response);
          }
        } else {
          //#region Checkpoint 1: Invalid PR Title colon
          // COMMENT
          await octokit.issues.createComment({
            owner: `${checklist.repoOwner}`,
            repo: `${checklist.repoFullName.split('/')[1]}`,
            number: `${JSON.parse(event.body).number}`,
            body: `@${
              JSON.parse(event.body).pull_request.user.login
            }, **INVALID_TITLE_FORMAT**: Title should be in valid format like, {@abc and @xyz} Sample PR Title`
          });
          // DELETE REVIEW REQUEST
          await octokit.pullRequests.deleteReviewRequest({
            owner: `${checklist.repoOwner}`,
            repo: `${checklist.repoFullName.split('/')[1]}`,
            number: `${JSON.parse(event.body).number}`,
            reviewers: [`${botname}`]
          });
          // POST ON SLACK
          /*await slack.chat.postMessage({
            token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
            channel: 'testing',
            // text: `Hey Andy, I'm here and under testing on other channel.`
            // tslint:disable-next-line:max-line-length
            text: `PR Title: ${checklist.pullrequestTitleFormat}\nPR Link: ${
              checklist.pullrequestHTMLUrl
            }\nAuthor: ${
              checklist.pullrequestAuthor
            }\nStatus: COMMENT \nReason: Title should be in valid format like, {@abc and @xyz} Sample PR Title`
          });*/
          // API GATEWAY RESPONSE: 200
          const response = {
            headers: {
              'Access-Control-Allow-Origin': '*'
            },
            statusCode: 200
          };
          callback(null, response);
          //#endregion
        }
        break;
      //#endregion
      //#region When a PR is EDITED
      case 'pull_request:edited':
        if (
          (checklist.pullrequestTitleFormat.match(/{/g) || []).length === 1 &&
          (checklist.pullrequestTitleFormat.match(/}/g) || []).length === 1
        ) {
          const start = checklist.pullrequestTitleFormat.indexOf('{');
          const end = checklist.pullrequestTitleFormat.indexOf('}');
          const tags = checklist.pullrequestTitleFormat.slice(
            Number(start),
            Number(end)
          );
          if (
            ((tags.match(/@insprint/g) || []).length === 1 &&
              ((tags.match(/@2018-r2/g) || []).length === 0 &&
                (tags.match(/@2018-r1/g) || []).length === 0)) ||
            ((tags.match(/@2018-r2/g) || []).length === 1 &&
              ((tags.match(/@insprint/g) || []).length === 0 &&
                (tags.match(/@2018-r1/g) || []).length === 0)) ||
            ((tags.match(/@2018-r1/g) || []).length === 1 &&
              ((tags.match(/@insprint/g) || []).length === 0 &&
                (tags.match(/@2018-r2/g) || []).length === 0))
          ) {
            // REVIEW REQUEST
            await octokit.pullRequests.createReviewRequest({
              owner: `${checklist.repoOwner}`,
              repo: `${checklist.repoFullName.split('/')[1]}`,
              number: `${JSON.parse(event.body).number}`,
              reviewers: [`${botname}`]
            });
            // POST ON SLACK
            /*await slack.chat.postMessage({
              token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
              channel: 'testing',
              // text: `Hey Andy, I'm here and under testing on other channel.`
              // tslint:disable-next-line:max-line-length
              text: `PR Title: ${checklist.pullrequestTitleFormat}\nPR Link: ${
                checklist.pullrequestHTMLUrl
              }\nAuthor: ${
                checklist.pullrequestAuthor
                // tslint:disable-next-line:max-line-length
              }\nStatus: REVIEW_REQUESTED \nReason: Initial checks PASSED and I'm validating the pull request.` // Build is triggered with runner cmd: ${tags}`
            });*/
            // API GATEWAY RESPONSE: 200
            const response = {
              headers: {
                'Access-Control-Allow-Origin': '*'
              },
              statusCode: 200
              // body: JSON.stringify(`**INVALID_TITLE_FORMAT**: Title should have ':' [example: @abc and @xyz : Sample PR Title]`)
            };
            callback(null, response);
          } else if ((tags.match(/framework/g) || []).length === 1) {
            // COMMENT
            await octokit.issues.createComment({
              owner: `${checklist.repoOwner}`,
              repo: `${checklist.repoFullName.split('/')[1]}`,
              number: `${JSON.parse(event.body).number}`,
              body: `@${
                JSON.parse(event.body).pull_request.user.login
              }, I will not RUN this since it is a 'Framework' enhancement`
            });
            // DELETE REVIEW REQUEST
          await octokit.pullRequests.deleteReviewRequest({
            owner: `${checklist.repoOwner}`,
            repo: `${checklist.repoFullName.split('/')[1]}`,
            number: `${JSON.parse(event.body).number}`,
            reviewers: [`${botname}`]
          });
          // IF REVIEW EXISTS THEN DISMISS THE REVIEW AND DELETE THE JENKINS JOB
          octokit.pullRequests.getReviews({
            owner: `${checklist.repoOwner}`,
            repo: `${checklist.repoFullName.split('/')[1]}`,
            number: `${JSON.parse(event.body).number}`})
            .then(async (result: any) => {
              if (result['data'] !== undefined || result['data'].length !== 0) {
                result['data'].forEach(async (review: any) => {

                  await octokit.pullRequests.dismissReview({
                    owner: `${checklist.repoOwner}`,
                    repo: `${checklist.repoFullName.split('/')[1]}`,
                    number: `${JSON.parse(event.body).number}`,
                    review_id: `${review['id']}`,
                    message: 'I dismissed my review. Will validate again once the PR is updated'});

                });
              }

            });
            jenkins.delete_job(checklist.jenkinJOBName, async(err: any, data: any) => {});

            // POST ON SLACK
            /*await slack.chat.postMessage({
              token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
              channel: 'testing',
              // text: `Hey Andy, I'm here and under testing on other channel.`
              // tslint:disable-next-line:max-line-length
              text: `PR Title: ${checklist.pullrequestTitleFormat}\nPR Link: ${
                checklist.pullrequestHTMLUrl
              }\nAuthor: ${
                checklist.pullrequestAuthor
              }\nStatus: COMMENT \nReason: I will not RUN this since it is a 'Framework' enhancement`
            });*/
            // API GATEWAY RESPONSE: 200
            const response = {
              headers: {
                'Access-Control-Allow-Origin': '*'
              },
              statusCode: 200
              // body: JSON.stringify(`**INVALID_TITLE_FORMAT**: Title should have ':' [example: @abc and @xyz : Sample PR Title]`)
            };
            callback(null, response);
          } else {
            // COMMENT
            await octokit.issues.createComment({
              owner: `${checklist.repoOwner}`,
              repo: `${checklist.repoFullName.split('/')[1]}`,
              number: `${JSON.parse(event.body).number}`,
              body: `@${
                JSON.parse(event.body).pull_request.user.login
              }, **INVALID_TAG_FORMAT**: Tags should be unique and must be paired with either of these **@insprint/@2018-r1/@2018-r2**`
            });
            // DELETE REVIEW REQUEST
            await octokit.pullRequests.deleteReviewRequest({
              owner: `${checklist.repoOwner}`,
              repo: `${checklist.repoFullName.split('/')[1]}`,
              number: `${JSON.parse(event.body).number}`,
              reviewers: [`${botname}`]
            });
            // IF REVIEW EXISTS THEN DISMISS THE REVIEW AND DELETE THE JENKINS JOB
          octokit.pullRequests.getReviews({
            owner: `${checklist.repoOwner}`,
            repo: `${checklist.repoFullName.split('/')[1]}`,
            number: `${JSON.parse(event.body).number}`})
            .then(async (result: any) => {
              if (result['data'] !== undefined || result['data'].length !== 0) {
                result['data'].forEach(async (review: any) => {

                  await octokit.pullRequests.dismissReview({
                    owner: `${checklist.repoOwner}`,
                    repo: `${checklist.repoFullName.split('/')[1]}`,
                    number: `${JSON.parse(event.body).number}`,
                    review_id: `${review['id']}`,
                    message: 'I dismissed my review. Will validate again once the PR is updated'});

                });
              }

            });
            jenkins.delete_job(checklist.jenkinJOBName, async(err: any, data: any) => {});
            /*await octokit.issues.createComment({
              owner: `${checklist.repoOwner}`,
              repo: `${checklist.repoFullName.split('/')[1]}`,
              number: `${JSON.parse(event.body).number}`,
              body: `@${
                JSON.parse(event.body).pull_request.user.login
              }, Jenkins JOB is closed ${checklist.jenkinJOBName}`
            });
            // POST ON SLACK
            await slack.chat.postMessage({
              token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
              channel: 'testing',
              // text: `Hey Andy, I'm here and under testing on other channel.`
              // tslint:disable-next-line:max-line-length
              text: `PR Title: ${checklist.pullrequestTitleFormat}\nPR Link: ${
                checklist.pullrequestHTMLUrl
              }\nAuthor: ${
                checklist.pullrequestAuthor
                // tslint:disable-next-line:max-line-length
              }\nStatus: COMMENT \nReason: **INVALID_TAG_FORMAT**: Tags should be unique and must be paired with either of these **@insprint/@2018-r1/@2018-r2**`
            });*/
            // API GATEWAY RESPONSE: 200
            const response = {
              headers: {
                'Access-Control-Allow-Origin': '*'
              },
              statusCode: 200
              // body: JSON.stringify(`**INVALID_TITLE_FORMAT**: Title should have ':' [example: @abc and @xyz : Sample PR Title]`)
            };
            callback(null, response);
          }
        } else {
          //#region Checkpoint 1: Invalid PR Title colon
          // COMMENT
          await octokit.issues.createComment({
            owner: `${checklist.repoOwner}`,
            repo: `${checklist.repoFullName.split('/')[1]}`,
            number: `${JSON.parse(event.body).number}`,
            body: `@${
              JSON.parse(event.body).pull_request.user.login
            }, **INVALID_TITLE_FORMAT**: Title should be in valid format like, {@abc and @xyz} Sample PR Title`
          });
          // DELETE REVIEW REQUEST
          await octokit.pullRequests.deleteReviewRequest({
            owner: `${checklist.repoOwner}`,
            repo: `${checklist.repoFullName.split('/')[1]}`,
            number: `${JSON.parse(event.body).number}`,
            reviewers: [`${botname}`]
          });
          // IF REVIEW EXISTS THEN DISMISS THE REVIEW AND DELETE THE JENKINS JOB
          octokit.pullRequests.getReviews({
            owner: `${checklist.repoOwner}`,
            repo: `${checklist.repoFullName.split('/')[1]}`,
            number: `${JSON.parse(event.body).number}`})
            .then(async (result: any) => {
              if (result['data'] !== undefined || result['data'].length !== 0) {
                result['data'].forEach(async (review: any) => {

                  await octokit.pullRequests.dismissReview({
                    owner: `${checklist.repoOwner}`,
                    repo: `${checklist.repoFullName.split('/')[1]}`,
                    number: `${JSON.parse(event.body).number}`,
                    review_id: `${review['id']}`,
                    message: 'I dismissed my review. Will validate again once the PR is updated'});

                });
              }

            });
            jenkins.delete_job(checklist.jenkinJOBName, async(err: any, data: any) => {});
            /*await octokit.issues.createComment({
              owner: `${checklist.repoOwner}`,
              repo: `${checklist.repoFullName.split('/')[1]}`,
              number: `${JSON.parse(event.body).number}`,
              body: `@${
                JSON.parse(event.body).pull_request.user.login
              }, Jenkins JOB is closed ${checklist.jenkinJOBName}`
            });*/
          // POST ON SLACK
          /*await slack.chat.postMessage({
            token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
            channel: 'testing',
            // text: `Hey Andy, I'm here and under testing on other channel.`
            // tslint:disable-next-line:max-line-length
            text: `PR Title: ${checklist.pullrequestTitleFormat}\nPR Link: ${
              checklist.pullrequestHTMLUrl
            }\nAuthor: ${
              checklist.pullrequestAuthor
            }\nStatus: COMMENT \nReason: Title should be in valid format like, {@abc and @xyz} Sample PR Title`
          });*/
          // API GATEWAY RESPONSE: 200
          const response = {
            headers: {
              'Access-Control-Allow-Origin': '*'
            },
            statusCode: 200};
          callback(null, response);
          //#endregion
        }
        break;
      //#endregion
      //#region When a COMMIT is PUSHED
      case 'pull_request:synchronize':
              if (
                (checklist.pullrequestTitleFormat.match(/{/g) || []).length === 1 &&
                (checklist.pullrequestTitleFormat.match(/}/g) || []).length === 1
              ) {
                const start = checklist.pullrequestTitleFormat.indexOf('{');
                const end = checklist.pullrequestTitleFormat.indexOf('}');
                const tags = checklist.pullrequestTitleFormat.slice(
                  Number(start),
                  Number(end)
                );
                if (
                  ((tags.match(/@insprint/g) || []).length === 1 &&
                    ((tags.match(/@2018-r2/g) || []).length === 0 &&
                      (tags.match(/@2018-r1/g) || []).length === 0)) ||
                  ((tags.match(/@2018-r2/g) || []).length === 1 &&
                    ((tags.match(/@insprint/g) || []).length === 0 &&
                      (tags.match(/@2018-r1/g) || []).length === 0)) ||
                  ((tags.match(/@2018-r1/g) || []).length === 1 &&
                    ((tags.match(/@insprint/g) || []).length === 0 &&
                      (tags.match(/@2018-r2/g) || []).length === 0))
                ) {
                  // DELETE REVIEW REQUEST
                await octokit.pullRequests.deleteReviewRequest({
                  owner: `${checklist.repoOwner}`,
                  repo: `${checklist.repoFullName.split('/')[1]}`,
                  number: `${JSON.parse(event.body).number}`,
                  reviewers: [`${botname}`]
                });
                // IF REVIEW EXISTS THEN DISMISS THE REVIEW AND DELETE THE JENKINS JOB
                octokit.pullRequests.getReviews({
                  owner: `${checklist.repoOwner}`,
                  repo: `${checklist.repoFullName.split('/')[1]}`,
                  number: `${JSON.parse(event.body).number}`})
                  .then(async (result: any) => {
                    if (result['data'] !== undefined || result['data'].length !== 0) {
                      result['data'].forEach(async (review: any) => {

                        await octokit.pullRequests.dismissReview({
                          owner: `${checklist.repoOwner}`,
                          repo: `${checklist.repoFullName.split('/')[1]}`,
                          number: `${JSON.parse(event.body).number}`,
                          review_id: `${review['id']}`,
                          message: 'I dismissed my review. Will validate again once the PR is updated'});

                      });
                    }

                  });
                  jenkins.delete_job(checklist.jenkinJOBName, async(err: any, data: any) => {});
                  /*await octokit.issues.createComment({
                    owner: `${checklist.repoOwner}`,
                    repo: `${checklist.repoFullName.split('/')[1]}`,
                    number: `${JSON.parse(event.body).number}`,
                    body: `@${
                      JSON.parse(event.body).pull_request.user.login
                    }, Jenkins JOB is closed ${checklist.jenkinJOBName}`
                  });*/
                  // REVIEW REQUEST
                  await octokit.pullRequests.createReviewRequest({
                    owner: `${checklist.repoOwner}`,
                    repo: `${checklist.repoFullName.split('/')[1]}`,
                    number: `${JSON.parse(event.body).number}`,
                    reviewers: [`${botname}`]
                  });
                  // POST ON SLACK
                  /*await slack.chat.postMessage({
                    token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
                    channel: 'testing',
                    // text: `Hey Andy, I'm here and under testing on other channel.`
                    // tslint:disable-next-line:max-line-length
                    text: `PR Title: ${checklist.pullrequestTitleFormat}\nPR Link: ${
                      checklist.pullrequestHTMLUrl
                    }\nAuthor: ${
                      checklist.pullrequestAuthor
                      // tslint:disable-next-line:max-line-length
                    }\nStatus: REVIEW_REQUESTED \nReason: Initial checks PASSED and I'm validating the pull request.` // Build is triggered with runner cmd: ${tags}`
                  });*/
                  // API GATEWAY RESPONSE: 200
                  const response = {
                    headers: {
                      'Access-Control-Allow-Origin': '*'
                    },
                    statusCode: 200
                    // body: JSON.stringify(`**INVALID_TITLE_FORMAT**: Title should have ':' [example: @abc and @xyz : Sample PR Title]`)
                  };
                  callback(null, response);
                } else if ((tags.match(/framework/g) || []).length === 1) {
                  // COMMENT
                  await octokit.issues.createComment({
                    owner: `${checklist.repoOwner}`,
                    repo: `${checklist.repoFullName.split('/')[1]}`,
                    number: `${JSON.parse(event.body).number}`,
                    body: `@${
                      JSON.parse(event.body).pull_request.user.login
                    }, I will not RUN this since it is a 'Framework' enhancement`
                  });
                  // DELETE REVIEW REQUEST
                await octokit.pullRequests.deleteReviewRequest({
                  owner: `${checklist.repoOwner}`,
                  repo: `${checklist.repoFullName.split('/')[1]}`,
                  number: `${JSON.parse(event.body).number}`,
                  reviewers: [`${botname}`]
                });
                // IF REVIEW EXISTS THEN DISMISS THE REVIEW AND DELETE THE JENKINS JOB
                octokit.pullRequests.getReviews({
                  owner: `${checklist.repoOwner}`,
                  repo: `${checklist.repoFullName.split('/')[1]}`,
                  number: `${JSON.parse(event.body).number}`})
                  .then(async (result: any) => {
                    if (result['data'] !== undefined || result['data'].length !== 0) {
                      result['data'].forEach(async (review: any) => {

                        await octokit.pullRequests.dismissReview({
                          owner: `${checklist.repoOwner}`,
                          repo: `${checklist.repoFullName.split('/')[1]}`,
                          number: `${JSON.parse(event.body).number}`,
                          review_id: `${review['id']}`,
                          message: 'I dismissed my review. Will validate again once the PR is updated'});

                      });
                    }

                  });
                  jenkins.delete_job(checklist.jenkinJOBName, async(err: any, data: any) => {});

                  // POST ON SLACK
                  /*await slack.chat.postMessage({
                    token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
                    channel: 'testing',
                    // text: `Hey Andy, I'm here and under testing on other channel.`
                    // tslint:disable-next-line:max-line-length
                    text: `PR Title: ${checklist.pullrequestTitleFormat}\nPR Link: ${
                      checklist.pullrequestHTMLUrl
                    }\nAuthor: ${
                      checklist.pullrequestAuthor
                    }\nStatus: COMMENT \nReason: I will not RUN this since it is a 'Framework' enhancement`
                  });*/
                  // API GATEWAY RESPONSE: 200
                  const response = {
                    headers: {
                      'Access-Control-Allow-Origin': '*'
                    },
                    statusCode: 200
                    // body: JSON.stringify(`**INVALID_TITLE_FORMAT**: Title should have ':' [example: @abc and @xyz : Sample PR Title]`)
                  };
                  callback(null, response);
                } else {
                  // COMMENT
                  await octokit.issues.createComment({
                    owner: `${checklist.repoOwner}`,
                    repo: `${checklist.repoFullName.split('/')[1]}`,
                    number: `${JSON.parse(event.body).number}`,
                    body: `@${
                      JSON.parse(event.body).pull_request.user.login
                    // tslint:disable-next-line:max-line-length
                    }, **INVALID_TAG_FORMAT**: Tags should be unique and must be paired with either of these **@insprint/@2018-r1/@2018-r2**`
                  });
                  // DELETE REVIEW REQUEST
                  await octokit.pullRequests.deleteReviewRequest({
                    owner: `${checklist.repoOwner}`,
                    repo: `${checklist.repoFullName.split('/')[1]}`,
                    number: `${JSON.parse(event.body).number}`,
                    reviewers: [`${botname}`]
                  });
                  // IF REVIEW EXISTS THEN DISMISS THE REVIEW AND DELETE THE JENKINS JOB
                octokit.pullRequests.getReviews({
                  owner: `${checklist.repoOwner}`,
                  repo: `${checklist.repoFullName.split('/')[1]}`,
                  number: `${JSON.parse(event.body).number}`})
                  .then(async (result: any) => {
                    if (result['data'] !== undefined || result['data'].length !== 0) {
                      result['data'].forEach(async (review: any) => {

                        await octokit.pullRequests.dismissReview({
                          owner: `${checklist.repoOwner}`,
                          repo: `${checklist.repoFullName.split('/')[1]}`,
                          number: `${JSON.parse(event.body).number}`,
                          review_id: `${review['id']}`,
                          message: 'I dismissed my review. Will validate again once the PR is updated'});

                      });
                    }

                  });
                  jenkins.delete_job(checklist.jenkinJOBName, async(err: any, data: any) => {});
                  /*await octokit.issues.createComment({
                    owner: `${checklist.repoOwner}`,
                    repo: `${checklist.repoFullName.split('/')[1]}`,
                    number: `${JSON.parse(event.body).number}`,
                    body: `@${
                      JSON.parse(event.body).pull_request.user.login
                    }, Jenkins JOB is closed ${checklist.jenkinJOBName}`
                  });
                  // POST ON SLACK
                  await slack.chat.postMessage({
                    token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
                    channel: 'testing',
                    // text: `Hey Andy, I'm here and under testing on other channel.`
                    // tslint:disable-next-line:max-line-length
                    text: `PR Title: ${checklist.pullrequestTitleFormat}\nPR Link: ${
                      checklist.pullrequestHTMLUrl
                    }\nAuthor: ${
                      checklist.pullrequestAuthor
                      // tslint:disable-next-line:max-line-length
                    }\nStatus: COMMENT \nReason: **INVALID_TAG_FORMAT**: Tags should be unique and must be paired with either of these **@insprint/@2018-r1/@2018-r2**`
                  });*/
                  // API GATEWAY RESPONSE: 200
                  const response = {
                    headers: {
                      'Access-Control-Allow-Origin': '*'
                    },
                    statusCode: 200
                    // body: JSON.stringify(`**INVALID_TITLE_FORMAT**: Title should have ':' [example: @abc and @xyz : Sample PR Title]`)
                  };
                  callback(null, response);
                }
              } else {
                //#region Checkpoint 1: Invalid PR Title colon
                // COMMENT
                await octokit.issues.createComment({
                  owner: `${checklist.repoOwner}`,
                  repo: `${checklist.repoFullName.split('/')[1]}`,
                  number: `${JSON.parse(event.body).number}`,
                  body: `@${
                    JSON.parse(event.body).pull_request.user.login
                  }, **INVALID_TITLE_FORMAT**: Title should be in valid format like, {@abc and @xyz} Sample PR Title`
                });
                // DELETE REVIEW REQUEST
                await octokit.pullRequests.deleteReviewRequest({
                  owner: `${checklist.repoOwner}`,
                  repo: `${checklist.repoFullName.split('/')[1]}`,
                  number: `${JSON.parse(event.body).number}`,
                  reviewers: [`${botname}`]
                });
                // IF REVIEW EXISTS THEN DISMISS THE REVIEW AND DELETE THE JENKINS JOB
                octokit.pullRequests.getReviews({
                  owner: `${checklist.repoOwner}`,
                  repo: `${checklist.repoFullName.split('/')[1]}`,
                  number: `${JSON.parse(event.body).number}`})
                  .then(async (result: any) => {
                    if (result['data'] !== undefined || result['data'].length !== 0) {
                      result['data'].forEach(async (review: any) => {

                        await octokit.pullRequests.dismissReview({
                          owner: `${checklist.repoOwner}`,
                          repo: `${checklist.repoFullName.split('/')[1]}`,
                          number: `${JSON.parse(event.body).number}`,
                          review_id: `${review['id']}`,
                          message: 'I dismissed my review. Will validate again once the PR is updated'});

                      });
                    }

                  });
                  jenkins.delete_job(checklist.jenkinJOBName, async(err: any, data: any) => {});
                  /*await octokit.issues.createComment({
                    owner: `${checklist.repoOwner}`,
                    repo: `${checklist.repoFullName.split('/')[1]}`,
                    number: `${JSON.parse(event.body).number}`,
                    body: `@${
                      JSON.parse(event.body).pull_request.user.login
                    }, Jenkins JOB is closed ${checklist.jenkinJOBName}`
                  });
                // POST ON SLACK
                await slack.chat.postMessage({
                  token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
                  channel: 'testing',
                  // text: `Hey Andy, I'm here and under testing on other channel.`
                  // tslint:disable-next-line:max-line-length
                  text: `PR Title: ${checklist.pullrequestTitleFormat}\nPR Link: ${
                    checklist.pullrequestHTMLUrl
                  }\nAuthor: ${
                    checklist.pullrequestAuthor
                  }\nStatus: COMMENT \nReason: Title should be in valid format like, {@abc and @xyz} Sample PR Title`
                });*/
                // API GATEWAY RESPONSE: 200
                const response = {
                  headers: {
                    'Access-Control-Allow-Origin': '*'
                  },
                  statusCode: 200
                  // body: JSON.stringify(`**INVALID_TITLE_FORMAT**: Title should have ':' [example: @abc and @xyz : Sample PR Title]`)
                };
                callback(null, response);
                //#endregion
              }
              break;
            //#endregion
      //#region When a PR is REOPENED
      case 'pull_request:reopened':
        if (
          (checklist.pullrequestTitleFormat.match(/{/g) || []).length === 1 &&
          (checklist.pullrequestTitleFormat.match(/}/g) || []).length === 1
        ) {
          const start = checklist.pullrequestTitleFormat.indexOf('{');
          const end = checklist.pullrequestTitleFormat.indexOf('}');
          const tags = checklist.pullrequestTitleFormat.slice(
            Number(start),
            Number(end)
          );
          if (
            ((tags.match(/@insprint/g) || []).length === 1 &&
              ((tags.match(/@2018-r2/g) || []).length === 0 &&
                (tags.match(/@2018-r1/g) || []).length === 0)) ||
            ((tags.match(/@2018-r2/g) || []).length === 1 &&
              ((tags.match(/@insprint/g) || []).length === 0 &&
                (tags.match(/@2018-r1/g) || []).length === 0)) ||
            ((tags.match(/@2018-r1/g) || []).length === 1 &&
              ((tags.match(/@insprint/g) || []).length === 0 &&
                (tags.match(/@2018-r2/g) || []).length === 0))
          ) {
            // REVIEW REQUEST
            await octokit.pullRequests.createReviewRequest({
              owner: `${checklist.repoOwner}`,
              repo: `${checklist.repoFullName.split('/')[1]}`,
              number: `${JSON.parse(event.body).number}`,
              reviewers: [`${botname}`]
            });
            // POST ON SLACK
            /*await slack.chat.postMessage({
              token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
              channel: 'testing',
              // text: `Hey Andy, I'm here and under testing on other channel.`
              // tslint:disable-next-line:max-line-length
              text: `PR Title: ${checklist.pullrequestTitleFormat}\nPR Link: ${
                checklist.pullrequestHTMLUrl
              }\nAuthor: ${
                checklist.pullrequestAuthor
                // tslint:disable-next-line:max-line-length
              }\nStatus: REVIEW_REQUESTED \nReason: Initial checks PASSED and I'm validating the pull request.` // Build is triggered with runner cmd: ${tags}`
            });*/
            // API GATEWAY RESPONSE: 200
            const response = {
              headers: {
                'Access-Control-Allow-Origin': '*'
              },
              statusCode: 200
              // body: JSON.stringify(`**INVALID_TITLE_FORMAT**: Title should have ':' [example: @abc and @xyz : Sample PR Title]`)
            };
            callback(null, response);
          } else if ((tags.match(/framework/g) || []).length === 1) {
            // COMMENT
            await octokit.issues.createComment({
              owner: `${checklist.repoOwner}`,
              repo: `${checklist.repoFullName.split('/')[1]}`,
              number: `${JSON.parse(event.body).number}`,
              body: `@${
                JSON.parse(event.body).pull_request.user.login
              }, I will not RUN this since it is a 'Framework' enhancement`
            });
            // DELETE REVIEW REQUEST
          await octokit.pullRequests.deleteReviewRequest({
            owner: `${checklist.repoOwner}`,
            repo: `${checklist.repoFullName.split('/')[1]}`,
            number: `${JSON.parse(event.body).number}`,
            reviewers: [`${botname}`]
          });
          // IF REVIEW EXISTS THEN DISMISS THE REVIEW AND DELETE THE JENKINS JOB
          octokit.pullRequests.getReviews({
            owner: `${checklist.repoOwner}`,
            repo: `${checklist.repoFullName.split('/')[1]}`,
            number: `${JSON.parse(event.body).number}`})
            .then(async (result: any) => {
              if (result['data'] !== undefined || result['data'].length !== 0) {
                result['data'].forEach(async (review: any) => {

                  await octokit.pullRequests.dismissReview({
                    owner: `${checklist.repoOwner}`,
                    repo: `${checklist.repoFullName.split('/')[1]}`,
                    number: `${JSON.parse(event.body).number}`,
                    review_id: `${review['id']}`,
                    message: 'I dismissed my review. Will validate again once the PR is updated'});

                });
              }

            });
            jenkins.delete_job(checklist.jenkinJOBName, async(err: any, data: any) => {});

            // POST ON SLACK
            /*await slack.chat.postMessage({
              token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
              channel: 'testing',
              // text: `Hey Andy, I'm here and under testing on other channel.`
              // tslint:disable-next-line:max-line-length
              text: `PR Title: ${checklist.pullrequestTitleFormat}\nPR Link: ${
                checklist.pullrequestHTMLUrl
              }\nAuthor: ${
                checklist.pullrequestAuthor
              }\nStatus: COMMENT \nReason: I will not RUN this since it is a 'Framework' enhancement`
            });*/
            // API GATEWAY RESPONSE: 200
            const response = {
              headers: {
                'Access-Control-Allow-Origin': '*'
              },
              statusCode: 200
              // body: JSON.stringify(`**INVALID_TITLE_FORMAT**: Title should have ':' [example: @abc and @xyz : Sample PR Title]`)
            };
            callback(null, response);
          } else {
            // COMMENT
            await octokit.issues.createComment({
              owner: `${checklist.repoOwner}`,
              repo: `${checklist.repoFullName.split('/')[1]}`,
              number: `${JSON.parse(event.body).number}`,
              body: `@${
                JSON.parse(event.body).pull_request.user.login
              }, **INVALID_TAG_FORMAT**: Tags should be unique and must be paired with either of these **@insprint/@2018-r1/@2018-r2**`
            });
            // DELETE REVIEW REQUEST
            await octokit.pullRequests.deleteReviewRequest({
              owner: `${checklist.repoOwner}`,
              repo: `${checklist.repoFullName.split('/')[1]}`,
              number: `${JSON.parse(event.body).number}`,
              reviewers: [`${botname}`]
            });
            // IF REVIEW EXISTS THEN DISMISS THE REVIEW AND DELETE THE JENKINS JOB
          octokit.pullRequests.getReviews({
            owner: `${checklist.repoOwner}`,
            repo: `${checklist.repoFullName.split('/')[1]}`,
            number: `${JSON.parse(event.body).number}`})
            .then(async (result: any) => {
              if (result['data'] !== undefined || result['data'].length !== 0) {
                result['data'].forEach(async (review: any) => {

                  await octokit.pullRequests.dismissReview({
                    owner: `${checklist.repoOwner}`,
                    repo: `${checklist.repoFullName.split('/')[1]}`,
                    number: `${JSON.parse(event.body).number}`,
                    review_id: `${review['id']}`,
                    message: 'I dismissed my review. Will validate again once the PR is updated'});

                });
              }

            });
            jenkins.delete_job(checklist.jenkinJOBName, async(err: any, data: any) => {});
            /*await octokit.issues.createComment({
              owner: `${checklist.repoOwner}`,
              repo: `${checklist.repoFullName.split('/')[1]}`,
              number: `${JSON.parse(event.body).number}`,
              body: `@${
                JSON.parse(event.body).pull_request.user.login
              }, Jenkins JOB is closed ${checklist.jenkinJOBName}`
            });
            // POST ON SLACK
            await slack.chat.postMessage({
              token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
              channel: 'testing',
              // text: `Hey Andy, I'm here and under testing on other channel.`
              // tslint:disable-next-line:max-line-length
              text: `PR Title: ${checklist.pullrequestTitleFormat}\nPR Link: ${
                checklist.pullrequestHTMLUrl
              }\nAuthor: ${
                checklist.pullrequestAuthor
                // tslint:disable-next-line:max-line-length
              }\nStatus: COMMENT \nReason: **INVALID_TAG_FORMAT**: Tags should be unique and must be paired with either of these **@insprint/@2018-r1/@2018-r2**`
            });*/
            // API GATEWAY RESPONSE: 200
            const response = {
              headers: {
                'Access-Control-Allow-Origin': '*'
              },
              statusCode: 200
              // body: JSON.stringify(`**INVALID_TITLE_FORMAT**: Title should have ':' [example: @abc and @xyz : Sample PR Title]`)
            };
            callback(null, response);
          }
        } else {
          //#region Checkpoint 1: Invalid PR Title colon
          // COMMENT
          await octokit.issues.createComment({
            owner: `${checklist.repoOwner}`,
            repo: `${checklist.repoFullName.split('/')[1]}`,
            number: `${JSON.parse(event.body).number}`,
            body: `@${
              JSON.parse(event.body).pull_request.user.login
            }, **INVALID_TITLE_FORMAT**: Title should be in valid format like, {@abc and @xyz} Sample PR Title`
          });
          // DELETE REVIEW REQUEST
          await octokit.pullRequests.deleteReviewRequest({
            owner: `${checklist.repoOwner}`,
            repo: `${checklist.repoFullName.split('/')[1]}`,
            number: `${JSON.parse(event.body).number}`,
            reviewers: [`${botname}`]
          });
          // IF REVIEW EXISTS THEN DISMISS THE REVIEW AND DELETE THE JENKINS JOB
          octokit.pullRequests.getReviews({
            owner: `${checklist.repoOwner}`,
            repo: `${checklist.repoFullName.split('/')[1]}`,
            number: `${JSON.parse(event.body).number}`})
            .then(async (result: any) => {
              if (result['data'] !== undefined || result['data'].length !== 0) {
                result['data'].forEach(async (review: any) => {

                  await octokit.pullRequests.dismissReview({
                    owner: `${checklist.repoOwner}`,
                    repo: `${checklist.repoFullName.split('/')[1]}`,
                    number: `${JSON.parse(event.body).number}`,
                    review_id: `${review['id']}`,
                    message: 'I dismissed my review. Will validate again once the PR is updated'});

                });
              }

            });
            jenkins.delete_job(checklist.jenkinJOBName, async(err: any, data: any) => {});
            /*await octokit.issues.createComment({
              owner: `${checklist.repoOwner}`,
              repo: `${checklist.repoFullName.split('/')[1]}`,
              number: `${JSON.parse(event.body).number}`,
              body: `@${
                JSON.parse(event.body).pull_request.user.login
              }, Jenkins JOB is closed ${checklist.jenkinJOBName}`
            });
          // POST ON SLACK
          await slack.chat.postMessage({
            token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
            channel: 'testing',
            // text: `Hey Andy, I'm here and under testing on other channel.`
            // tslint:disable-next-line:max-line-length
            text: `PR Title: ${checklist.pullrequestTitleFormat}\nPR Link: ${
              checklist.pullrequestHTMLUrl
            }\nAuthor: ${
              checklist.pullrequestAuthor
            }\nStatus: COMMENT \nReason: Title should be in valid format like, {@abc and @xyz} Sample PR Title`
          });*/
          // API GATEWAY RESPONSE: 200
          const response = {
            headers: {
              'Access-Control-Allow-Origin': '*'
            },
            statusCode: 200
            // body: JSON.stringify(`**INVALID_TITLE_FORMAT**: Title should have ':' [example: @abc and @xyz : Sample PR Title]`)
          };
          callback(null, response);
          //#endregion
        }
        break;
      //#endregion
      //#region When PR is REVIEW REQUESTED
      case 'pull_request:review_requested': // PR Review Request
        const allReviewers = checklist.reviewer.map(user => user['login']);
        if (
          (checklist.pullrequestTitleFormat.match(/{/g) || []).length === 1 &&
          (checklist.pullrequestTitleFormat.match(/}/g) || []).length === 1
        ) {
          const start = checklist.pullrequestTitleFormat.indexOf('{');
          const end = checklist.pullrequestTitleFormat.indexOf('}');
          const tags = checklist.pullrequestTitleFormat.slice(
            Number(start) + 1,
            Number(end)
          );
          if (
            ((tags.match(/@insprint/g) || []).length === 1 &&
              ((tags.match(/@2018-r2/g) || []).length === 0 &&
                (tags.match(/@2018-r1/g) || []).length === 0)) ||
            ((tags.match(/@2018-r2/g) || []).length === 1 &&
              ((tags.match(/@insprint/g) || []).length === 0 &&
                (tags.match(/@2018-r1/g) || []).length === 0)) ||
            ((tags.match(/@2018-r1/g) || []).length === 1 &&
              ((tags.match(/@insprint/g) || []).length === 0 &&
                (tags.match(/@2018-r2/g) || []).length === 0))
          ) {
            if (checklist.reviewer.length >= 1) {


              if (allReviewers.indexOf(`${botname}`) > -1) {
                // let myarray: Array<string>;
                jenkins.all_views(async (err: any, data: any) => {
                  data.forEach((view: any) => {
                    allViews.push(view.name);
                  });
                  if (allViews.indexOf(viewName) > -1) {

                    jenkins.all_jobs_in_view(viewName, async (err: any, jobsinfo: any) => {
                      /*await octokit.issues.createComment({
                        owner: `${checklist.repoOwner}`,
                        repo: `${checklist.repoFullName.split('/')[1]}`,
                        number: `${JSON.parse(event.body).number}`,
                        body: `@${
                          JSON.stringify(jobsinfo)
                        }`
                      });*/
                    if (jobsinfo.length === 0) {
                      await jenkins.create_job(
                        checklist.jenkinJOBName,
                        `<project>
                        <actions/>
                        <description>          
                        </description>
                        <keepDependencies>false</keepDependencies>
                        <properties>
                        </properties>
                        <scm class="hudson.plugins.git.GitSCM" plugin="git@3.9.1">
                            <configVersion>2</configVersion>
                            <userRemoteConfigs>
                                <hudson.plugins.git.UserRemoteConfig>
                                    <url>git@github.com:${checklist.repoFullName}</url>
                                    <credentialsId>594af53a-b4fb-4708-8af3-d08e765f9bf0</credentialsId>
                                </hudson.plugins.git.UserRemoteConfig>
                            </userRemoteConfigs>
                            <branches>
                                <hudson.plugins.git.BranchSpec>
                                    <name>${
                                      checklist.jenkinsJOBBranch
                                    }</name>
                                </hudson.plugins.git.BranchSpec>
                            </branches>
                            <doGenerateSubmoduleConfigurations>false</doGenerateSubmoduleConfigurations>
                            <submoduleCfg class="list"/>
                            <extensions/>
                        </scm>
                        <canRoam>true</canRoam>
                        <disabled>false</disabled>
                        <blockBuildWhenDownstreamBuilding>false</blockBuildWhenDownstreamBuilding>
                        <blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding>
                        <triggers/>
                        <concurrentBuild>false</concurrentBuild>
                        <builders>
                            <hudson.tasks.Shell>
                                <command>
          npm --version
          npm install
          npm run update
          npm run cloud -- --cucumberOpts.tags="${tags}" --job="${
                          checklist.jenkinJOBName
                        }"
                                </command>
                            </hudson.tasks.Shell>
                        </builders>
                        <publishers>
<org.jenkinsci.plugins.postbuildscript.PostBuildScript plugin="postbuildscript@2.8.1">
<config>
<scriptFiles/>
<groovyScripts/>
<buildSteps>
<org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
<results>
<string>SUCCESS</string>
</results>
<role>BOTH</role>
<buildSteps>
<hudson.tasks.Shell>
<command>
curl -H 'Content-type: application/json' -d '{"jobname":"'"$JOB_NAME"'", "repoOwner":"'"$REPOOWNER"'", "repo":"'"$REPO"'", "prNumber":"'"$NUMBER"'", "login":"'"$LOGIN"'","buildStatus":"SUCCESS","buildNumber": "'"$BUILD_NUMBER"'","buildID": "'"$BUILD_ID"'","buildDisplayName": "'"$BUILD_DISPLAY_NAME"'","executorNumber": "'"$EXECUTOR_NUMBER"'","nodeName": "'"$NODE_NAME"'","buildURL": "'"$BUILD_URL"'","jobURL": "'"$JOB_URL"'"}' https://geq6e7su7f.execute-api.us-east-1.amazonaws.com/prod/pullRequestTest
</command>
</hudson.tasks.Shell>
</buildSteps>
</org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
<org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
<results>
<string>UNSTABLE</string>
</results>
<role>BOTH</role>
<buildSteps>
<hudson.tasks.Shell>
<command>
curl -H 'Content-type: application/json' -d '{"jobname":"'"$JOB_NAME"'", "repoOwner":"'"$REPOOWNER"'", "repo":"'"$REPO"'", "prNumber":"'"$NUMBER"'", "login":"'"$LOGIN"'","buildStatus":"UNSTABLE","buildNumber": "'"$BUILD_NUMBER"'","buildID": "'"$BUILD_ID"'","buildDisplayName": "'"$BUILD_DISPLAY_NAME"'","executorNumber": "'"$EXECUTOR_NUMBER"'","nodeName": "'"$NODE_NAME"'","buildURL": "'"$BUILD_URL"'","jobURL": "'"$JOB_URL"'"}' https://geq6e7su7f.execute-api.us-east-1.amazonaws.com/prod/pullRequestTest
</command>
</hudson.tasks.Shell>
</buildSteps>
</org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
<org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
<results>
<string>FAILURE</string>
</results>
<role>BOTH</role>
<buildSteps>
<hudson.tasks.Shell>
<command>
curl -H 'Content-type: application/json' -d '{"jobname":"'"$JOB_NAME"'", "repoOwner":"'"$REPOOWNER"'", "repo":"'"$REPO"'", "prNumber":"'"$NUMBER"'", "login":"'"$LOGIN"'","buildStatus":"FAILURE","buildNumber": "'"$BUILD_NUMBER"'","buildID": "'"$BUILD_ID"'","buildDisplayName": "'"$BUILD_DISPLAY_NAME"'","executorNumber": "'"$EXECUTOR_NUMBER"'","nodeName": "'"$NODE_NAME"'","buildURL": "'"$BUILD_URL"'","jobURL": "'"$JOB_URL"'"}' https://geq6e7su7f.execute-api.us-east-1.amazonaws.com/prod/pullRequestTest
</command>
</hudson.tasks.Shell>
</buildSteps>
</org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
<org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
<results>
<string>NOT_BUILT</string>
</results>
<role>BOTH</role>
<buildSteps>
<hudson.tasks.Shell>
<command>
curl -H 'Content-type: application/json' -d '{"jobname":"'"$JOB_NAME"'", "repoOwner":"'"$REPOOWNER"'", "repo":"'"$REPO"'", "prNumber":"'"$NUMBER"'", "login":"'"$LOGIN"'","buildStatus":"NOT_BUILT","buildNumber": "'"$BUILD_NUMBER"'","buildID": "'"$BUILD_ID"'","buildDisplayName": "'"$BUILD_DISPLAY_NAME"'","executorNumber": "'"$EXECUTOR_NUMBER"'","nodeName": "'"$NODE_NAME"'","buildURL": "'"$BUILD_URL"'","jobURL": "'"$JOB_URL"'"}' https://geq6e7su7f.execute-api.us-east-1.amazonaws.com/prod/pullRequestTest
</command>
</hudson.tasks.Shell>
</buildSteps>
</org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
<org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
<results>
<string>ABORTED</string>
</results>
<role>BOTH</role>
<buildSteps>
<hudson.tasks.Shell>
<command>
curl -H 'Content-type: application/json' -d '{"jobname":"'"$JOB_NAME"'", "repoOwner":"'"$REPOOWNER"'", "repo":"'"$REPO"'", "prNumber":"'"$NUMBER"'", "login":"'"$LOGIN"'","buildStatus":"ABORTED","buildNumber": "'"$BUILD_NUMBER"'","buildID": "'"$BUILD_ID"'","buildDisplayName": "'"$BUILD_DISPLAY_NAME"'","executorNumber": "'"$EXECUTOR_NUMBER"'","nodeName": "'"$NODE_NAME"'","buildURL": "'"$BUILD_URL"'","jobURL": "'"$JOB_URL"'"}' https://geq6e7su7f.execute-api.us-east-1.amazonaws.com/prod/pullRequestTest
</command>
</hudson.tasks.Shell>
</buildSteps>
</org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
</buildSteps>
<markBuildUnstable>false</markBuildUnstable>
</config>
</org.jenkinsci.plugins.postbuildscript.PostBuildScript>
</publishers>
<buildWrappers>
<hudson.plugins.timestamper.TimestamperBuildWrapper plugin="timestamper@1.8.10"/>
<hudson.plugins.ansicolor.AnsiColorBuildWrapper plugin="ansicolor@0.5.2">
<colorMapName>xterm</colorMapName>
</hudson.plugins.ansicolor.AnsiColorBuildWrapper>
<EnvInjectBuildWrapper plugin="envinject@2.1.6">
<info>
<propertiesContent>
REPOOWNER=${checklist.repoOwner}
REPO=${(checklist.repoFullName).split('/')[1]}
NUMBER=${JSON.parse(event.body).number}
LOGIN=${JSON.parse(event.body).pull_request.user.login}
</propertiesContent>
<secureGroovyScript plugin="script-security@1.46">
<script/>
<sandbox>false</sandbox>
</secureGroovyScript>
<loadFilesFromMaster>false</loadFilesFromMaster>
</info>
</EnvInjectBuildWrapper>
<jenkins.plugins.nodejs.NodeJSBuildWrapper plugin="nodejs@1.2.6">
<nodeJSInstallationName>recent node</nodeJSInstallationName>
</jenkins.plugins.nodejs.NodeJSBuildWrapper>
</buildWrappers>
                    </project>`,
                        // tslint:disable-next-line:no-shadowed-variable
                        async (err: any, data: any) => {
                          await jenkins.add_job_to_view(
                            viewName,
                            checklist.jenkinJOBName,
                            async (err: any, data: any) => {
                              await jenkins.job_info(
                                checklist.jenkinJOBName,
                                async (err: any, data: any) => {
                                  /*await octokit.issues.createComment({
                                    owner: `${checklist.repoOwner}`,
                                    repo: `${
                                      checklist.repoFullName.split('/')[1]
                                    }`,
                                    number: `${
                                      JSON.parse(event.body).number
                                    }`,
                                    body: `@${
                                      JSON.parse(event.body).pull_request
                                        .user.login
                                    }, JOB Name: ${data.fullName}
                                       JOB URL: ${data.url}`
                                  });*/
                                  await jenkins.build(
                                    checklist.jenkinJOBName,
                                    async (err: any, data: any) => {
                                      /*await octokit.pullRequests.createReview({
                                        owner: `${checklist.repoOwner}`,
                                        repo: `${checklist.repoFullName.split('/')[1]}`,
                                        number: `${JSON.parse(event.body).number}`                 
                                      });*/
                                      /*await octokit.issues.createComment({
                                        owner: `${checklist.repoOwner}`,
                                        repo: `${
                                          checklist.repoFullName.split(
                                            '/'
                                          )[1]
                                        }`,
                                        number: `${
                                          JSON.parse(event.body).number
                                        }`,
                                        body: `@${
                                          JSON.parse(event.body)
                                            .pull_request.user.login
                                        }, JOB Name: ${JSON.stringify(
                                          data
                                        )}`
                                      });*/
                                    }
                                  );
                                }
                              );
                            }
                          );
                        }
                      );
                    } else {
                      jobsinfo.forEach((job: any) => {
                        allJobsInView.push(job.name);
                      });
                      if (allJobsInView.indexOf(checklist.jenkinJOBName) === -1) {

                        await jenkins.create_job(
                          checklist.jenkinJOBName,
                          `<project>
                          <actions/>
                          <description>          
                          </description>
                          <keepDependencies>false</keepDependencies>
                          <properties>
                          </properties>
                          <scm class="hudson.plugins.git.GitSCM" plugin="git@3.9.1">
                              <configVersion>2</configVersion>
                              <userRemoteConfigs>
                                  <hudson.plugins.git.UserRemoteConfig>
                                      <url>git@github.com:${checklist.repoFullName}</url>
                                      <credentialsId>594af53a-b4fb-4708-8af3-d08e765f9bf0</credentialsId>
                                  </hudson.plugins.git.UserRemoteConfig>
                              </userRemoteConfigs>
                              <branches>
                                  <hudson.plugins.git.BranchSpec>
                                      <name>${
                                        checklist.jenkinsJOBBranch
                                      }</name>
                                  </hudson.plugins.git.BranchSpec>
                              </branches>
                              <doGenerateSubmoduleConfigurations>false</doGenerateSubmoduleConfigurations>
                              <submoduleCfg class="list"/>
                              <extensions/>
                          </scm>
                          <canRoam>true</canRoam>
                          <disabled>false</disabled>
                          <blockBuildWhenDownstreamBuilding>false</blockBuildWhenDownstreamBuilding>
                          <blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding>
                          <triggers/>
                          <concurrentBuild>false</concurrentBuild>
                          <builders>
                              <hudson.tasks.Shell>
                                  <command>
            npm --version
            npm install
            npm run update
            npm run cloud -- --cucumberOpts.tags="${tags}" --job="${
                            checklist.jenkinJOBName
                          }"
                                  </command>
                              </hudson.tasks.Shell>
                          </builders>
                          <publishers>
  <org.jenkinsci.plugins.postbuildscript.PostBuildScript plugin="postbuildscript@2.8.1">
  <config>
  <scriptFiles/>
  <groovyScripts/>
  <buildSteps>
  <org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
  <results>
  <string>SUCCESS</string>
  </results>
  <role>BOTH</role>
  <buildSteps>
  <hudson.tasks.Shell>
  <command>
  curl -H 'Content-type: application/json' -d '{"jobname":"'"$JOB_NAME"'", "repoOwner":"'"$REPOOWNER"'", "repo":"'"$REPO"'", "prNumber":"'"$NUMBER"'", "login":"'"$LOGIN"'","buildStatus":"SUCCESS","buildNumber": "'"$BUILD_NUMBER"'","buildID": "'"$BUILD_ID"'","buildDisplayName": "'"$BUILD_DISPLAY_NAME"'","executorNumber": "'"$EXECUTOR_NUMBER"'","nodeName": "'"$NODE_NAME"'","buildURL": "'"$BUILD_URL"'","jobURL": "'"$JOB_URL"'"}' https://geq6e7su7f.execute-api.us-east-1.amazonaws.com/prod/pullRequestTest
  </command>
  </hudson.tasks.Shell>
  </buildSteps>
  </org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
  <org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
  <results>
  <string>UNSTABLE</string>
  </results>
  <role>BOTH</role>
  <buildSteps>
  <hudson.tasks.Shell>
  <command>
  curl -H 'Content-type: application/json' -d '{"jobname":"'"$JOB_NAME"'", "repoOwner":"'"$REPOOWNER"'", "repo":"'"$REPO"'", "prNumber":"'"$NUMBER"'", "login":"'"$LOGIN"'","buildStatus":"UNSTABLE","buildNumber": "'"$BUILD_NUMBER"'","buildID": "'"$BUILD_ID"'","buildDisplayName": "'"$BUILD_DISPLAY_NAME"'","executorNumber": "'"$EXECUTOR_NUMBER"'","nodeName": "'"$NODE_NAME"'","buildURL": "'"$BUILD_URL"'","jobURL": "'"$JOB_URL"'"}' https://geq6e7su7f.execute-api.us-east-1.amazonaws.com/prod/pullRequestTest
  </command>
  </hudson.tasks.Shell>
  </buildSteps>
  </org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
  <org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
  <results>
  <string>FAILURE</string>
  </results>
  <role>BOTH</role>
  <buildSteps>
  <hudson.tasks.Shell>
  <command>
  curl -H 'Content-type: application/json' -d '{"jobname":"'"$JOB_NAME"'", "repoOwner":"'"$REPOOWNER"'", "repo":"'"$REPO"'", "prNumber":"'"$NUMBER"'", "login":"'"$LOGIN"'","buildStatus":"FAILURE","buildNumber": "'"$BUILD_NUMBER"'","buildID": "'"$BUILD_ID"'","buildDisplayName": "'"$BUILD_DISPLAY_NAME"'","executorNumber": "'"$EXECUTOR_NUMBER"'","nodeName": "'"$NODE_NAME"'","buildURL": "'"$BUILD_URL"'","jobURL": "'"$JOB_URL"'"}' https://geq6e7su7f.execute-api.us-east-1.amazonaws.com/prod/pullRequestTest
  </command>
  </hudson.tasks.Shell>
  </buildSteps>
  </org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
  <org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
  <results>
  <string>NOT_BUILT</string>
  </results>
  <role>BOTH</role>
  <buildSteps>
  <hudson.tasks.Shell>
  <command>
  curl -H 'Content-type: application/json' -d '{"jobname":"'"$JOB_NAME"'", "repoOwner":"'"$REPOOWNER"'", "repo":"'"$REPO"'", "prNumber":"'"$NUMBER"'", "login":"'"$LOGIN"'","buildStatus":"NOT_BUILT","buildNumber": "'"$BUILD_NUMBER"'","buildID": "'"$BUILD_ID"'","buildDisplayName": "'"$BUILD_DISPLAY_NAME"'","executorNumber": "'"$EXECUTOR_NUMBER"'","nodeName": "'"$NODE_NAME"'","buildURL": "'"$BUILD_URL"'","jobURL": "'"$JOB_URL"'"}' https://geq6e7su7f.execute-api.us-east-1.amazonaws.com/prod/pullRequestTest
  </command>
  </hudson.tasks.Shell>
  </buildSteps>
  </org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
  <org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
  <results>
  <string>ABORTED</string>
  </results>
  <role>BOTH</role>
  <buildSteps>
  <hudson.tasks.Shell>
  <command>
  curl -H 'Content-type: application/json' -d '{"jobname":"'"$JOB_NAME"'", "repoOwner":"'"$REPOOWNER"'", "repo":"'"$REPO"'", "prNumber":"'"$NUMBER"'", "login":"'"$LOGIN"'","buildStatus":"ABORTED","buildNumber": "'"$BUILD_NUMBER"'","buildID": "'"$BUILD_ID"'","buildDisplayName": "'"$BUILD_DISPLAY_NAME"'","executorNumber": "'"$EXECUTOR_NUMBER"'","nodeName": "'"$NODE_NAME"'","buildURL": "'"$BUILD_URL"'","jobURL": "'"$JOB_URL"'"}' https://geq6e7su7f.execute-api.us-east-1.amazonaws.com/prod/pullRequestTest
  </command>
  </hudson.tasks.Shell>
  </buildSteps>
  </org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
  </buildSteps>
  <markBuildUnstable>false</markBuildUnstable>
  </config>
  </org.jenkinsci.plugins.postbuildscript.PostBuildScript>
  </publishers>
  <buildWrappers>
  <hudson.plugins.timestamper.TimestamperBuildWrapper plugin="timestamper@1.8.10"/>
  <hudson.plugins.ansicolor.AnsiColorBuildWrapper plugin="ansicolor@0.5.2">
  <colorMapName>xterm</colorMapName>
  </hudson.plugins.ansicolor.AnsiColorBuildWrapper>
  <EnvInjectBuildWrapper plugin="envinject@2.1.6">
  <info>
  <propertiesContent>
  REPOOWNER=${checklist.repoOwner}
  REPO=${(checklist.repoFullName).split('/')[1]}
  NUMBER=${JSON.parse(event.body).number}
  LOGIN=${JSON.parse(event.body).pull_request.user.login}
  </propertiesContent>
  <secureGroovyScript plugin="script-security@1.46">
  <script/>
  <sandbox>false</sandbox>
  </secureGroovyScript>
  <loadFilesFromMaster>false</loadFilesFromMaster>
  </info>
  </EnvInjectBuildWrapper>
  <jenkins.plugins.nodejs.NodeJSBuildWrapper plugin="nodejs@1.2.6">
  <nodeJSInstallationName>recent node</nodeJSInstallationName>
  </jenkins.plugins.nodejs.NodeJSBuildWrapper>
  </buildWrappers>
                      </project>`,
                          // tslint:disable-next-line:no-shadowed-variable
                          async (err: any, data: any) => {
                            await jenkins.add_job_to_view(
                              viewName,
                              checklist.jenkinJOBName,
                              async (err: any, data: any) => {
                                await jenkins.job_info(
                                  checklist.jenkinJOBName,
                                  async (err: any, data: any) => {
                                    /*await octokit.issues.createComment({
                                      owner: `${checklist.repoOwner}`,
                                      repo: `${
                                        checklist.repoFullName.split('/')[1]
                                      }`,
                                      number: `${
                                        JSON.parse(event.body).number
                                      }`,
                                      body: `@${
                                        JSON.parse(event.body).pull_request
                                          .user.login
                                      }, JOB Name: ${data.fullName}
                                         JOB URL: ${data.url}`
                                    });*/
                                    await jenkins.build(
                                      checklist.jenkinJOBName,
                                      async (err: any, data: any) => {
                                        /*await octokit.pullRequests.createReview({
                                          owner: `${checklist.repoOwner}`,
                                          repo: `${checklist.repoFullName.split('/')[1]}`,
                                          number: `${JSON.parse(event.body).number}`                 
                                        });*/
                                        /*await octokit.issues.createComment({
                                          owner: `${checklist.repoOwner}`,
                                          repo: `${
                                            checklist.repoFullName.split(
                                              '/'
                                            )[1]
                                          }`,
                                          number: `${
                                            JSON.parse(event.body).number
                                          }`,
                                          body: `@${
                                            JSON.parse(event.body)
                                              .pull_request.user.login
                                          }, JOB Name: ${JSON.stringify(
                                            data
                                          )}`
                                        });*/
                                      });
                                  });
                              });
                          });
                      }
                    }
                  });


                  } else {
                    jenkins.create_view(
                      viewName,
                      async (err: any, viewInfo: any) => {
                        if (viewInfo['jobs'].length === 0) {
                          await jenkins.create_job(
                            checklist.jenkinJOBName,
                            `<project>
                            <actions/>
                            <description>          
                            </description>
                            <keepDependencies>false</keepDependencies>
                            <properties>
                            </properties>
                            <scm class="hudson.plugins.git.GitSCM" plugin="git@3.9.1">
                                <configVersion>2</configVersion>
                                <userRemoteConfigs>
                                    <hudson.plugins.git.UserRemoteConfig>
                                        <url>git@github.com:${checklist.repoFullName}</url>
                                        <credentialsId>594af53a-b4fb-4708-8af3-d08e765f9bf0</credentialsId>
                                    </hudson.plugins.git.UserRemoteConfig>
                                </userRemoteConfigs>
                                <branches>
                                    <hudson.plugins.git.BranchSpec>
                                        <name>${
                                          checklist.jenkinsJOBBranch
                                        }</name>
                                    </hudson.plugins.git.BranchSpec>
                                </branches>
                                <doGenerateSubmoduleConfigurations>false</doGenerateSubmoduleConfigurations>
                                <submoduleCfg class="list"/>
                                <extensions/>
                            </scm>
                            <canRoam>true</canRoam>
                            <disabled>false</disabled>
                            <blockBuildWhenDownstreamBuilding>false</blockBuildWhenDownstreamBuilding>
                            <blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding>
                            <triggers/>
                            <concurrentBuild>false</concurrentBuild>
                            <builders>
                                <hudson.tasks.Shell>
                                    <command>
              npm --version
              npm install
              npm run update
              npm run cloud -- --cucumberOpts.tags="${tags}" --job="${
                              checklist.jenkinJOBName
                            }"
                                    </command>
                                </hudson.tasks.Shell>
                            </builders>
                            <publishers>
<org.jenkinsci.plugins.postbuildscript.PostBuildScript plugin="postbuildscript@2.8.1">
<config>
<scriptFiles/>
<groovyScripts/>
<buildSteps>
<org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
<results>
<string>SUCCESS</string>
</results>
<role>BOTH</role>
<buildSteps>
<hudson.tasks.Shell>
<command>
curl -H 'Content-type: application/json' -d '{"jobname":"'"$JOB_NAME"'", "repoOwner":"'"$REPOOWNER"'", "repo":"'"$REPO"'", "prNumber":"'"$NUMBER"'", "login":"'"$LOGIN"'","buildStatus":"SUCCESS","buildNumber": "'"$BUILD_NUMBER"'","buildID": "'"$BUILD_ID"'","buildDisplayName": "'"$BUILD_DISPLAY_NAME"'","executorNumber": "'"$EXECUTOR_NUMBER"'","nodeName": "'"$NODE_NAME"'","buildURL": "'"$BUILD_URL"'","jobURL": "'"$JOB_URL"'"}' https://geq6e7su7f.execute-api.us-east-1.amazonaws.com/prod/pullRequestTest
</command>
</hudson.tasks.Shell>
</buildSteps>
</org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
<org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
<results>
<string>UNSTABLE</string>
</results>
<role>BOTH</role>
<buildSteps>
<hudson.tasks.Shell>
<command>
curl -H 'Content-type: application/json' -d '{"jobname":"'"$JOB_NAME"'", "repoOwner":"'"$REPOOWNER"'", "repo":"'"$REPO"'", "prNumber":"'"$NUMBER"'", "login":"'"$LOGIN"'","buildStatus":"UNSTABLE","buildNumber": "'"$BUILD_NUMBER"'","buildID": "'"$BUILD_ID"'","buildDisplayName": "'"$BUILD_DISPLAY_NAME"'","executorNumber": "'"$EXECUTOR_NUMBER"'","nodeName": "'"$NODE_NAME"'","buildURL": "'"$BUILD_URL"'","jobURL": "'"$JOB_URL"'"}' https://geq6e7su7f.execute-api.us-east-1.amazonaws.com/prod/pullRequestTest
</command>
</hudson.tasks.Shell>
</buildSteps>
</org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
<org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
<results>
<string>FAILURE</string>
</results>
<role>BOTH</role>
<buildSteps>
<hudson.tasks.Shell>
<command>
curl -H 'Content-type: application/json' -d '{"jobname":"'"$JOB_NAME"'", "repoOwner":"'"$REPOOWNER"'", "repo":"'"$REPO"'", "prNumber":"'"$NUMBER"'", "login":"'"$LOGIN"'","buildStatus":"FAILURE","buildNumber": "'"$BUILD_NUMBER"'","buildID": "'"$BUILD_ID"'","buildDisplayName": "'"$BUILD_DISPLAY_NAME"'","executorNumber": "'"$EXECUTOR_NUMBER"'","nodeName": "'"$NODE_NAME"'","buildURL": "'"$BUILD_URL"'","jobURL": "'"$JOB_URL"'"}' https://geq6e7su7f.execute-api.us-east-1.amazonaws.com/prod/pullRequestTest
</command>
</hudson.tasks.Shell>
</buildSteps>
</org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
<org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
<results>
<string>NOT_BUILT</string>
</results>
<role>BOTH</role>
<buildSteps>
<hudson.tasks.Shell>
<command>
curl -H 'Content-type: application/json' -d '{"jobname":"'"$JOB_NAME"'", "repoOwner":"'"$REPOOWNER"'", "repo":"'"$REPO"'", "prNumber":"'"$NUMBER"'", "login":"'"$LOGIN"'","buildStatus":"NOT_BUILT","buildNumber": "'"$BUILD_NUMBER"'","buildID": "'"$BUILD_ID"'","buildDisplayName": "'"$BUILD_DISPLAY_NAME"'","executorNumber": "'"$EXECUTOR_NUMBER"'","nodeName": "'"$NODE_NAME"'","buildURL": "'"$BUILD_URL"'","jobURL": "'"$JOB_URL"'"}' https://geq6e7su7f.execute-api.us-east-1.amazonaws.com/prod/pullRequestTest
</command>
</hudson.tasks.Shell>
</buildSteps>
</org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
<org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
<results>
<string>ABORTED</string>
</results>
<role>BOTH</role>
<buildSteps>
<hudson.tasks.Shell>
<command>
curl -H 'Content-type: application/json' -d '{"jobname":"'"$JOB_NAME"'", "repoOwner":"'"$REPOOWNER"'", "repo":"'"$REPO"'", "prNumber":"'"$NUMBER"'", "login":"'"$LOGIN"'","buildStatus":"ABORTED","buildNumber": "'"$BUILD_NUMBER"'","buildID": "'"$BUILD_ID"'","buildDisplayName": "'"$BUILD_DISPLAY_NAME"'","executorNumber": "'"$EXECUTOR_NUMBER"'","nodeName": "'"$NODE_NAME"'","buildURL": "'"$BUILD_URL"'","jobURL": "'"$JOB_URL"'"}' https://geq6e7su7f.execute-api.us-east-1.amazonaws.com/prod/pullRequestTest
</command>
</hudson.tasks.Shell>
</buildSteps>
</org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
</buildSteps>
<markBuildUnstable>false</markBuildUnstable>
</config>
</org.jenkinsci.plugins.postbuildscript.PostBuildScript>
</publishers>
<buildWrappers>
<hudson.plugins.timestamper.TimestamperBuildWrapper plugin="timestamper@1.8.10"/>
<hudson.plugins.ansicolor.AnsiColorBuildWrapper plugin="ansicolor@0.5.2">
<colorMapName>xterm</colorMapName>
</hudson.plugins.ansicolor.AnsiColorBuildWrapper>
<EnvInjectBuildWrapper plugin="envinject@2.1.6">
<info>
<propertiesContent>
REPOOWNER=${checklist.repoOwner}
REPO=${(checklist.repoFullName).split('/')[1]}
NUMBER=${JSON.parse(event.body).number}
LOGIN=${JSON.parse(event.body).pull_request.user.login}
</propertiesContent>
<secureGroovyScript plugin="script-security@1.46">
<script/>
<sandbox>false</sandbox>
</secureGroovyScript>
<loadFilesFromMaster>false</loadFilesFromMaster>
</info>
</EnvInjectBuildWrapper>
<jenkins.plugins.nodejs.NodeJSBuildWrapper plugin="nodejs@1.2.6">
<nodeJSInstallationName>recent node</nodeJSInstallationName>
</jenkins.plugins.nodejs.NodeJSBuildWrapper>
</buildWrappers>
                        </project>`,
                            // tslint:disable-next-line:no-shadowed-variable
                            async (err: any, data: any) => {
                              await jenkins.add_job_to_view(
                                viewInfo.name,
                                checklist.jenkinJOBName,
                                async (err: any, data: any) => {
                                  await jenkins.job_info(
                                    checklist.jenkinJOBName,
                                    async (err: any, data: any) => {
                                      /*await octokit.issues.createComment({
                                        owner: `${checklist.repoOwner}`,
                                        repo: `${
                                          checklist.repoFullName.split('/')[1]
                                        }`,
                                        number: `${
                                          JSON.parse(event.body).number
                                        }`,
                                        body: `@${
                                          JSON.parse(event.body).pull_request
                                            .user.login
                                        }, JOB Name: ${data.fullName}
                                           JOB URL: ${data.url}`
                                      });*/
                                      await jenkins.build(
                                        checklist.jenkinJOBName,
                                        async (err: any, data: any) => {
                                          /*await octokit.pullRequests.createReview({
                                            owner: `${checklist.repoOwner}`,
                                            repo: `${checklist.repoFullName.split('/')[1]}`,
                                            number: `${JSON.parse(event.body).number}`                 
                                          });*/
                                          /*await octokit.issues.createComment({
                                            owner: `${checklist.repoOwner}`,
                                            repo: `${
                                              checklist.repoFullName.split(
                                                '/'
                                              )[1]
                                            }`,
                                            number: `${
                                              JSON.parse(event.body).number
                                            }`,
                                            body: `@${
                                              JSON.parse(event.body)
                                                .pull_request.user.login
                                            }, JOB Name: ${JSON.stringify(
                                              data
                                            )}`
                                          });*/
                                        }
                                      );
                                    }
                                  );
                                }
                              );
                            }
                          );
                        }
                      }
                    );
                  }
                });
              } else {
                await octokit.pullRequests.createReviewRequest({
                  owner: `${checklist.repoOwner}`,
                  repo: `${checklist.repoFullName.split('/')[1]}`,
                  number: `${JSON.parse(event.body).number}`,
                  reviewers: [`${botname}`]
                });
              }
            }
          
            // API GATEWAY RESPONSE: 200
            const response = {
              headers: {
                'Access-Control-Allow-Origin': '*'
              },
              statusCode: 200
              // body: JSON.stringify(`**INVALID_TITLE_FORMAT**: Title should have ':' [example: @abc and @xyz : Sample PR Title]`)
            };
            callback(null, response);
          } else if ((tags.match(/framework/g) || []).length === 1) {
            // COMMENT
            await octokit.issues.createComment({
              owner: `${checklist.repoOwner}`,
              repo: `${checklist.repoFullName.split('/')[1]}`,
              number: `${JSON.parse(event.body).number}`,
              body: `@${
                JSON.parse(event.body).pull_request.user.login
              }, I will not RUN this since it is a 'Framework' enhancement`
            });
            // POST ON SLACK
            /*await slack.chat.postMessage({
              token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
              channel: 'testing',
              // text: `Hey Andy, I'm here and under testing on other channel.`
              // tslint:disable-next-line:max-line-length
              text: `PR Title: ${checklist.pullrequestTitleFormat}\nPR Link: ${
                checklist.pullrequestHTMLUrl
              }\nAuthor: ${
                checklist.pullrequestAuthor
              }\nStatus: COMMENT \nReason: I will not RUN this since it is a 'Framework' enhancement`
            });*/
            // API GATEWAY RESPONSE: 200
            const response = {
              headers: {
                'Access-Control-Allow-Origin': '*'
              },
              statusCode: 200
              // body: JSON.stringify(`**INVALID_TITLE_FORMAT**: Title should have ':' [example: @abc and @xyz : Sample PR Title]`)
            };
            callback(null, response);
          } else {
            // COMMENT
            await octokit.issues.createComment({
              owner: `${checklist.repoOwner}`,
              repo: `${checklist.repoFullName.split('/')[1]}`,
              number: `${JSON.parse(event.body).number}`,
              body: `@${
                JSON.parse(event.body).pull_request.user.login
              }, **INVALID_TAG_FORMAT**: Tags should be unique and must be paired with either of these **@insprint/@2018-r1/@2018-r2**`
            });
            // DELETE ALL REVIEW REQUEST
            allReviewers.forEach(async user => {
              await octokit.pullRequests.deleteReviewRequest({
                owner: `${checklist.repoOwner}`,
                repo: `${checklist.repoFullName.split('/')[1]}`,
                number: `${JSON.parse(event.body).number}`,
                reviewers: [`${user}`]
              });
            });
            // POST ON SLACK
            /*await slack.chat.postMessage({
              token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
              channel: 'testing',
              // text: `Hey Andy, I'm here and under testing on other channel.`
              // tslint:disable-next-line:max-line-length
              text: `PR Title: ${checklist.pullrequestTitleFormat}\nPR Link: ${
                checklist.pullrequestHTMLUrl
              }\nAuthor: ${
                checklist.pullrequestAuthor
                // tslint:disable-next-line:max-line-length
              }\nStatus: COMMENT \nReason: **INVALID_TAG_FORMAT**: Tags should be unique and must be paired with either of these **@insprint/@2018-r1/@2018-r2**`
            });*/
            // API GATEWAY RESPONSE: 200
            const response = {
              headers: {
                'Access-Control-Allow-Origin': '*'
              },
              statusCode: 200
              // body: JSON.stringify(`**INVALID_TITLE_FORMAT**: Title should have ':' [example: @abc and @xyz : Sample PR Title]`)
            };
            callback(null, response);
          }
        } else {
          //#region Checkpoint 1: Invalid PR Title colon
          // COMMENT
          await octokit.issues.createComment({
            owner: `${checklist.repoOwner}`,
            repo: `${checklist.repoFullName.split('/')[1]}`,
            number: `${JSON.parse(event.body).number}`,
            body: `@${
              JSON.parse(event.body).pull_request.user.login
            }, **INVALID_TITLE_FORMAT**: Title should be in valid format like, {@abc and @xyz} Sample PR Title`
          });
          // DELETE ALL REVIEW REQUEST
          allReviewers.forEach(async user => {
            await octokit.pullRequests.deleteReviewRequest({
              owner: `${checklist.repoOwner}`,
              repo: `${checklist.repoFullName.split('/')[1]}`,
              number: `${JSON.parse(event.body).number}`,
              reviewers: [`${user}`]
            });
          });
          // POST ON SLACK
          /*await slack.chat.postMessage({
            token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
            channel: 'testing',
            // text: `Hey Andy, I'm here and under testing on other channel.`
            // tslint:disable-next-line:max-line-length
            text: `PR Title: ${checklist.pullrequestTitleFormat}\nPR Link: ${
              checklist.pullrequestHTMLUrl
            }\nAuthor: ${
              checklist.pullrequestAuthor
            }\nStatus: COMMENT \nReason: Title should be in valid format like, {@abc and @xyz} Sample PR Title`
          });*/
          // API GATEWAY RESPONSE: 200
          const response = {
            headers: {
              'Access-Control-Allow-Origin': '*'
            },
            statusCode: 200
            // body: JSON.stringify(`**INVALID_TITLE_FORMAT**: Title should have ':' [example: @abc and @xyz : Sample PR Title]`)
          };
          callback(null, response);
          //#endregion
        }
        break;
      //#endregion
      //#region When PR is REVIEW REQUESTED REMOVED
      case 'pull_request:review_request_removed': // PR Review Request
        const allReviewers_removed = checklist.reviewer.map(
          user => user['login']
        );
        if (
          (checklist.pullrequestTitleFormat.match(/{/g) || []).length === 1 &&
          (checklist.pullrequestTitleFormat.match(/}/g) || []).length === 1
        ) {
          const start = checklist.pullrequestTitleFormat.indexOf('{');
          const end = checklist.pullrequestTitleFormat.indexOf('}');
          const tags = checklist.pullrequestTitleFormat.slice(
            Number(start),
            Number(end)
          );
          if (
            ((tags.match(/@insprint/g) || []).length === 1 &&
              ((tags.match(/@2018-r2/g) || []).length === 0 &&
                (tags.match(/@2018-r1/g) || []).length === 0)) ||
            ((tags.match(/@2018-r2/g) || []).length === 1 &&
              ((tags.match(/@insprint/g) || []).length === 0 &&
                (tags.match(/@2018-r1/g) || []).length === 0)) ||
            ((tags.match(/@2018-r1/g) || []).length === 1 &&
              ((tags.match(/@insprint/g) || []).length === 0 &&
                (tags.match(/@2018-r2/g) || []).length === 0))
          ) {
            if (checklist.reviewer.length >= 1) {
              if (allReviewers_removed.indexOf(`${botname}`) > -1) {
                // COMMENT
                await octokit.issues.createComment({
                  owner: `${checklist.repoOwner}`,
                  repo: `${checklist.repoFullName.split('/')[1]}`,
                  number: `${JSON.parse(event.body).number}`,
                  body: `@${
                    JSON.parse(event.body).pull_request.user.login
                  }, REQUESTED_REVIEW: Build will be TRIGGERED on JENKINS`
                });
              } else {
                await octokit.pullRequests.createReviewRequest({
                  owner: `${checklist.repoOwner}`,
                  repo: `${checklist.repoFullName.split('/')[1]}`,
                  number: `${JSON.parse(event.body).number}`,
                  reviewers: [`${botname}`]
                });
              }
            } else {
              await octokit.pullRequests.createReviewRequest({
                owner: `${checklist.repoOwner}`,
                repo: `${checklist.repoFullName.split('/')[1]}`,
                number: `${JSON.parse(event.body).number}`,
                reviewers: [`${botname}`]
              });
            }
            // API GATEWAY RESPONSE: 200
            const response = {
              headers: {
                'Access-Control-Allow-Origin': '*'
              },
              statusCode: 200
              // body: JSON.stringify(`**INVALID_TITLE_FORMAT**: Title should have ':' [example: @abc and @xyz : Sample PR Title]`)
            };
            callback(null, response);
          } else if ((tags.match(/framework/g) || []).length === 1) {
            // COMMENT
            await octokit.issues.createComment({
              owner: `${checklist.repoOwner}`,
              repo: `${checklist.repoFullName.split('/')[1]}`,
              number: `${JSON.parse(event.body).number}`,
              body: `@${
                JSON.parse(event.body).pull_request.user.login
              }, I will not RUN this since it is a 'Framework' enhancement`
            });
            // DELETE ALL REVIEW REQUEST
            allReviewers_removed.forEach(async user => {
              await octokit.pullRequests.deleteReviewRequest({
                owner: `${checklist.repoOwner}`,
                repo: `${checklist.repoFullName.split('/')[1]}`,
                number: `${JSON.parse(event.body).number}`,
                reviewers: [`${user}`]
              });
            });
            // POST ON SLACK
            /*await slack.chat.postMessage({
              token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
              channel: 'testing',
              // text: `Hey Andy, I'm here and under testing on other channel.`
              // tslint:disable-next-line:max-line-length
              text: `PR Title: ${checklist.pullrequestTitleFormat}\nPR Link: ${
                checklist.pullrequestHTMLUrl
              }\nAuthor: ${
                checklist.pullrequestAuthor
              }\nStatus: COMMENT \nReason: I will not RUN this since it is a 'Framework' enhancement`
            });*/
            // API GATEWAY RESPONSE: 200
            const response = {
              headers: {
                'Access-Control-Allow-Origin': '*'
              },
              statusCode: 200
              // body: JSON.stringify(`**INVALID_TITLE_FORMAT**: Title should have ':' [example: @abc and @xyz : Sample PR Title]`)
            };
            callback(null, response);
          } else {
            // COMMENT
            await octokit.issues.createComment({
              owner: `${checklist.repoOwner}`,
              repo: `${checklist.repoFullName.split('/')[1]}`,
              number: `${JSON.parse(event.body).number}`,
              body: `@${
                JSON.parse(event.body).pull_request.user.login
              }, **INVALID_TAG_FORMAT**: Tags should be unique and must be paired with either of these **@insprint/@2018-r1/@2018-r2**`
            });
            // DELETE ALL REVIEW REQUEST
            allReviewers_removed.forEach(async user => {
              await octokit.pullRequests.deleteReviewRequest({
                owner: `${checklist.repoOwner}`,
                repo: `${checklist.repoFullName.split('/')[1]}`,
                number: `${JSON.parse(event.body).number}`,
                reviewers: [`${user}`]
              });
            });
            // POST ON SLACK
            /*await slack.chat.postMessage({
              token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
              channel: 'testing',
              // text: `Hey Andy, I'm here and under testing on other channel.`
              // tslint:disable-next-line:max-line-length
              text: `PR Title: ${checklist.pullrequestTitleFormat}\nPR Link: ${
                checklist.pullrequestHTMLUrl
              }\nAuthor: ${
                checklist.pullrequestAuthor
                // tslint:disable-next-line:max-line-length
              }\nStatus: COMMENT \nReason: **INVALID_TAG_FORMAT**: Tags should be unique and must be paired with either of these **@insprint/@2018-r1/@2018-r2**`
            });*/
            // API GATEWAY RESPONSE: 200
            const response = {
              headers: {
                'Access-Control-Allow-Origin': '*'
              },
              statusCode: 200
              // body: JSON.stringify(`**INVALID_TITLE_FORMAT**: Title should have ':' [example: @abc and @xyz : Sample PR Title]`)
            };
            callback(null, response);
          }
        } else {
          //#region Checkpoint 1: Invalid PR Title colon
          // COMMENT
          await octokit.issues.createComment({
            owner: `${checklist.repoOwner}`,
            repo: `${checklist.repoFullName.split('/')[1]}`,
            number: `${JSON.parse(event.body).number}`,
            body: `@${
              JSON.parse(event.body).pull_request.user.login
            }, **INVALID_TITLE_FORMAT**: Title should be in valid format like, {@abc and @xyz} Sample PR Title`
          });
          // DELETE ALL REVIEW REQUEST
          allReviewers_removed.forEach(async user => {
            await octokit.pullRequests.deleteReviewRequest({
              owner: `${checklist.repoOwner}`,
              repo: `${checklist.repoFullName.split('/')[1]}`,
              number: `${JSON.parse(event.body).number}`,
              reviewers: [`${user}`]
            });
          });
          // POST ON SLACK
          /*await slack.chat.postMessage({
            token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
            channel: 'testing',
            // text: `Hey Andy, I'm here and under testing on other channel.`
            // tslint:disable-next-line:max-line-length
            text: `PR Title: ${checklist.pullrequestTitleFormat}\nPR Link: ${
              checklist.pullrequestHTMLUrl
            }\nAuthor: ${
              checklist.pullrequestAuthor
            }\nStatus: COMMENT \nReason: Title should be in valid format like, {@abc and @xyz} Sample PR Title`
          });*/
          // API GATEWAY RESPONSE: 200
          const response = {
            headers: {
              'Access-Control-Allow-Origin': '*'
            },
            statusCode: 200
            // body: JSON.stringify(`**INVALID_TITLE_FORMAT**: Title should have ':' [example: @abc and @xyz : Sample PR Title]`)
          };
          callback(null, response);
          //#endregion
        }
        const pull_request_review_requested_response = {
          headers: {
            'Access-Control-Allow-Origin': '*'
          },
          statusCode: 200
          // body: JSON.stringify('sdsd')
        };
        callback(null, pull_request_review_requested_response);
        break;
      //#endregion
      //#region When PR is CLOSED/MERGED
      case 'pull_request:review_request_removed':
      case 'pull_request:closed': // PR Review Request

      jenkins.delete_job(checklist.jenkinJOBName, async(err: any, data: any) => {});
      /*await octokit.issues.createComment({
        owner: `${checklist.repoOwner}`,
        repo: `${checklist.repoFullName.split('/')[1]}`,
        number: `${JSON.parse(event.body).number}`,
        body: `@${
          JSON.parse(event.body).pull_request.user.login
        }, Jenkins JOB is closed ${checklist.jenkinJOBName}`
      });*/
      const response = {
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        statusCode: 200
        // body: JSON.stringify(`Delete ${checklist.jenkinJOBName}`)
      };
      callback(null, response);
      break;
    //#endregion
      //#region Default Case
      default:
        const unrelated_event_response = {
          headers: {
            'Access-Control-Allow-Origin': '*'
          },
          statusCode: 200
          // body: JSON.stringify('I support for pull_request:review_requested only')
        };
        callback(null, unrelated_event_response);
      //#endregion
    }
   } else {
    //#region IF REQUEST IS FROM UNTRUSTED SOURCES

    const untrusted_response = {
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      statusCode: 401.4,
      body: JSON.stringify(`Im sorry! I don't recognize you`)
    };
    callback(null, untrusted_response);
  }

    //#endregion

    //#endregion

  } else {
    const jenkinStatus = `${JSON.parse(event.body).buildStatus}`;
    switch (jenkinStatus) {
      case 'FAILURE':
      jenkins.console_output(`${JSON.parse(event.body).jobname}`, `${JSON.parse(event.body).buildNumber}`, async (err: any, data: any) => {
      await octokit.pullRequests.createReview({
        owner: `${JSON.parse(event.body).repoOwner}`,
        repo: `${JSON.parse(event.body).repo}`,
        number: `${JSON.parse(event.body).prNumber}`,
        event: 'REQUEST_CHANGES',
        // tslint:disable-next-line:max-line-length
        body: `**JOB Name**: ${JSON.parse(event.body).jobname}\n**Build Number**: ${JSON.parse(event.body).buildNumber}\n**Console Output**: \n\n${data["body"]}`
      });
    });
      break;
      case 'SUCCESS':
      jenkins.console_output(`${JSON.parse(event.body).jobname}`, `${JSON.parse(event.body).buildNumber}`, async (err: any, data: any) => {
        await octokit.pullRequests.createReview({
          owner: `${JSON.parse(event.body).repoOwner}`,
          repo: `${JSON.parse(event.body).repo}`,
          number: `${JSON.parse(event.body).prNumber}`,
          event: 'APPROVE',
          // tslint:disable-next-line:max-line-length
          body: `**JOB Name**: ${JSON.parse(event.body).jobname}\n**Build Number**: ${JSON.parse(event.body).buildNumber}\n**Console Output**: \n\n${data["body"]}`
        });
      });
      break;
      default:
      const response = {
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        statusCode: 200,
        body: JSON.stringify(`either SUCCESS or FAILURE should received from JENKINS`)
      };
      callback(null, response);
    }
    /*await slack.chat.postMessage({
      token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
      channel: 'testing',
      // text: `Hey Andy, I'm here and under testing on other channel.`
      // tslint:disable-next-line:max-line-length
      text: event.body // Build is triggered with runner cmd: ${tags}`
    });*/
    const response = {
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      statusCode: 200
      // body: JSON.stringify(`received request from jenkins`)
    };
    callback(null, response);
  }
};
