"user strict"
const jenkinsapi = require('jenkins-api');
const username = 'smunukuntla@fonteva.com';
const jenkintoken = '51dd16be6ca691a6f95e31bf1e26cfc5';
const jenkins = jenkinsapi.init(
  `https://${username}:${jenkintoken}@jenkins.fonteva.io`,
  {
    strictSSL: true
  }
);

module.exports.cron = async (event, callback) => {
  console.log('im here');
  await jenkins.all_jobs(function(err, data) {
    if (err){ return console.log(err); }
    callback(null, data);
  });
  callback(null, 'here');
};
