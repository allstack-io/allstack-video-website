// import { JenkinsView } from './jenkin-view';
import { environment } from "../config/environment";
const jenkinsapi = require("jenkins-api");
const username = "smunukuntla@fonteva.com";
const token = "51dd16be6ca691a6f95e31bf1e26cfc5";
const jenkins = jenkinsapi.init(
  `https://${username}:${token}@jenkins.fonteva.io`,
  {
    strictSSL: true
  }
);
// const jenkinsView: JenkinsView = new JenkinsView();

export class PullRequest {
  allViews: Array<any> = [];
  view: string;

  async review_requested(body: Object): Promise<any> {
    const JOB_NAME = `PR Job - ${body["pull_request"].number} (author-${
      body["pull_request"]["user"].login
    })`;
    const BRANCH_NAME = `*/${body["pull_request"].head.ref}`;
    const TAGS = `${body["pull_request"].title.split("#")[0]}`.trim();
    await jenkins.all_views(async (err: any, data: any) => {
      if (err) {
        return err;
      }
      data.forEach((view: any) => {
        this.allViews.push(view.name);
      });
      if (this.allViews.indexOf(environment.viewName) > -1) {
      } else {
        // create the view
        await jenkins.create_view(
          environment.viewName,
          async (err: any, viewInfo: any) => {
            if (err) {
              return err;
            }
            if (viewInfo["jobs"].length === 0) {
              await jenkins.create_job(
                JOB_NAME,
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
                          <url>git@github.com:Fonteva/fonteva-qa-atdd.git</url>
                          <credentialsId>594af53a-b4fb-4708-8af3-d08e765f9bf0</credentialsId>
                      </hudson.plugins.git.UserRemoteConfig>
                  </userRemoteConfigs>
                  <branches>
                      <hudson.plugins.git.BranchSpec>
                          <name>${BRANCH_NAME}</name>
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
npm run cloud -- --cucumberOpts.tags="${TAGS}" --job="${JOB_NAME}"
                      </command>
                  </hudson.tasks.Shell>
              </builders>
              <buildWrappers>
                  <hudson.plugins.timestamper.TimestamperBuildWrapper plugin="timestamper@1.8.10"/>
                  <hudson.plugins.ansicolor.AnsiColorBuildWrapper plugin="ansicolor@0.5.2">
                      <colorMapName>xterm</colorMapName>
                  </hudson.plugins.ansicolor.AnsiColorBuildWrapper>
                  <jenkins.plugins.nodejs.NodeJSBuildWrapper plugin="nodejs@1.2.6">
                      <nodeJSInstallationName>recent node</nodeJSInstallationName>
                  </jenkins.plugins.nodejs.NodeJSBuildWrapper>
              </buildWrappers>
          </project>`,
                // tslint:disable-next-line:no-shadowed-variable
                async (err: any, data: any) => {
                  if (err) {
                    return err;
                  }
                  await jenkins.add_job_to_view(
                    viewInfo.name,
                    JOB_NAME,
                    async (err: any, data: any) => {
                      if (err) {
                        return err;
                      }
                      await jenkins.build(JOB_NAME, (err: any, data: any) => {
                        if (err){ return err; }
                        return console.log(data);
                      });
                    }
                  );
                }
              );
            }
          }
        );
      }
    });
  }
}
