"use strict"
const slack = require('slack');
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
  token: ' a878b18e2cf86c91b294e12b9a86a770d1cfa0d4' // 64bfd77ac5a6760de1c27650c287e2b93dd8781a fonteva-qa-atdd-pr-validation
});
const jenkinsapi = require('jenkins-api');
const username = 'smunukuntla@fonteva.com';
const jenkintoken = '51dd16be6ca691a6f95e31bf1e26cfc5';
const jenkins = jenkinsapi.init(
  `https://${username}:${jenkintoken}@jenkins.fonteva.io`, {
    strictSSL: true
  }
);
module.exports.cron = async (event, context) => {
  await jenkins.all_jobs(function (err, data) {
    slack.chat.postMessage({
      token: 'xoxb-2976455686-442476039217-WMYfOXR9hTihXqq2AmTNqM0U',
      channel: 'testing',
      text: `Error: ${err}, Data: ${data}`
    });
  });
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  };
};