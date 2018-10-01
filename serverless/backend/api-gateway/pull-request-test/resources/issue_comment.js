'use strict';
const jenkinsapi = require('jenkins-api');
exports.created = async (event) => {
    const allViews = [];
    const allJobs = []
    const username = 'smunukuntla@fonteva.com';
    const token = '51dd16be6ca691a6f95e31bf1e26cfc5';
    const jenkins = jenkinsapi.init(`https://${username}:${token}@staging.fonteva.io`, {
        strictSSL: true
    });
    const viewName = 'FONTEVA_QA_ATDD_Pull_Requests_Validation'
    console.log(event);
    const JOB_NAME = `PullRequest-${JSON.parse(event['body']).issue.number}_Author-${JSON.parse(event['body']).issue.user.login}`;

    jenkins.all_views(async (err, data) => {
        if (err) {
            return console.log(err);
        }
        data.forEach(view => {
            console.log(view.name);
            allViews.push(view.name);
        });
        if (allViews.includes(viewName)) { // if view is already present just add the job to it
            jenkins.all_jobs_in_view(viewName, function (err, data) {
                if (err) {
                    return console.log(err);
                }
                data.forEach(job => {
                    allJobs.push(job.name);
                });
                if (allViews.includes(JOB_NAME)) {
                    console.log('JOB IS ALREADY CREATED AND INCLUDED IN VIEW');
                } else {
                    jenkins.create_job(JOB_NAME, `<project>
                            <actions/>
                            <description>
                        The build is to kick-start the test automation once the org is successfully finished with installing all required packages and dependencies including TDM test data.
                            </description>
                            <keepDependencies>false</keepDependencies>
                            <properties>
                                <jenkins.model.BuildDiscarderProperty>
                                    <strategy class="hudson.tasks.LogRotator">
                                        <daysToKeep>15</daysToKeep>
                                        <numToKeep>-1</numToKeep>
                                        <artifactDaysToKeep>-1</artifactDaysToKeep>
                                        <artifactNumToKeep>-1</artifactNumToKeep>
                                    </strategy>
                                </jenkins.model.BuildDiscarderProperty>
                                <com.coravy.hudson.plugins.github.GithubProjectProperty plugin="github@1.29.2">
                                    <projectUrl>https://github.com/Fonteva/fonteva-qa-atdd.git/</projectUrl>
                                    <displayName>Fonteva-QA-ATDD</displayName>
                                </com.coravy.hudson.plugins.github.GithubProjectProperty>
                                <com.chikli.hudson.plugin.naginator.NaginatorOptOutProperty plugin="naginator@1.17.2">
                                    <optOut>false</optOut>
                                </com.chikli.hudson.plugin.naginator.NaginatorOptOutProperty>
                                <com.sonyericsson.rebuild.RebuildSettings plugin="rebuild@1.28">
                                    <autoRebuild>false</autoRebuild>
                                    <rebuildDisabled>false</rebuildDisabled>
                                </com.sonyericsson.rebuild.RebuildSettings>
                                <com.synopsys.arc.jenkinsci.plugins.jobrestrictions.jobs.JobRestrictionProperty plugin="job-restrictions@0.7"/>
                                <hudson.plugins.throttleconcurrents.ThrottleJobProperty plugin="throttle-concurrents@2.0.1">
                                    <maxConcurrentPerNode>0</maxConcurrentPerNode>
                                    <maxConcurrentTotal>0</maxConcurrentTotal>
                                    <categories class="java.util.concurrent.CopyOnWriteArrayList"/>
                                    <throttleEnabled>false</throttleEnabled>
                                    <throttleOption>project</throttleOption>
                                    <limitOneJobWithMatchingParams>false</limitOneJobWithMatchingParams>
                                    <paramsToUseForLimit/>
                                </hudson.plugins.throttleconcurrents.ThrottleJobProperty>
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
                                        <name>*/2018_r1</name>
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
                        npm install robotjs
                        npm run cloud -- --cucumberOpts.tags="(@event-info or @pages) and @2018-r1" --job="${JOB_NAME}"
                                    </command>
                                </hudson.tasks.Shell>
                            </builders>
                            <publishers>
                                <htmlpublisher.HtmlPublisher plugin="htmlpublisher@1.16">
                                    <reportTargets>
                                        <htmlpublisher.HtmlPublisherTarget>
                                            <reportName>HTML Report</reportName>
                                            <reportDir>reports/html/</reportDir>
                                            <reportFiles>testrun_*.html</reportFiles>
                                            <alwaysLinkToLastBuild>false</alwaysLinkToLastBuild>
                                            <reportTitles/>
                                            <keepAll>false</keepAll>
                                            <allowMissing>false</allowMissing>
                                            <includes>**/*</includes>
                                        </htmlpublisher.HtmlPublisherTarget>
                                    </reportTargets>
                                </htmlpublisher.HtmlPublisher>
                                <hudson.plugins.parameterizedtrigger.BuildTrigger plugin="parameterized-trigger@2.35.2">
                                    <configs>
                                        <hudson.plugins.parameterizedtrigger.BuildTriggerConfig>
                                            <configs class="empty-list"/>
                                            <projects>prod_auto_nightly_EE_CC</projects>
                                            <condition>FAILED_OR_BETTER</condition>
                                            <triggerWithNoParameters>true</triggerWithNoParameters>
                                            <triggerFromChildProjects>false</triggerFromChildProjects>
                                        </hudson.plugins.parameterizedtrigger.BuildTriggerConfig>
                                    </configs>
                                </hudson.plugins.parameterizedtrigger.BuildTrigger>
                            </publishers>
                            <buildWrappers>
                                <hudson.plugins.timestamper.TimestamperBuildWrapper plugin="timestamper@1.8.10"/>
                                <hudson.plugins.ansicolor.AnsiColorBuildWrapper plugin="ansicolor@0.5.2">
                                    <colorMapName>xterm</colorMapName>
                                </hudson.plugins.ansicolor.AnsiColorBuildWrapper>
                                <jenkins.plugins.nodejs.NodeJSBuildWrapper plugin="nodejs@1.2.6">
                                    <nodeJSInstallationName>recent node</nodeJSInstallationName>
                                </jenkins.plugins.nodejs.NodeJSBuildWrapper>
                            </buildWrappers>
                        </project>`, function (err, data) {
                        if (err) {
                            return console.log(err);
                        }
                        jenkins.add_job_to_view(viewName, JOB_NAME, function (err, data) {
                            if (err) {
                                return console.log(err);
                            }
                            console.log(data)
                        });
                    });
                }
            });
        } else { // if view is not present create the view and add the job
            jenkins.create_view(viewName, function (err, data) {
                if (err) {
                    return console.log(err);
                }
                jenkins.all_jobs_in_view(viewName, function (err, data) {
                    if (err) {
                        return console.log(err);
                    }
                    data.forEach(job => {
                        allJobs.push(job.name);
                    });
                    if (allViews.includes(JOB_NAME)) {
                        console.log('JOB IS ALREADY CREATED AND INCLUDED IN VIEW');
                    } else {
                        jenkins.create_job(JOB_NAME, `<project>
                                <actions/>
                                <description>
                            The build is to kick-start the test automation once the org is successfully finished with installing all required packages and dependencies including TDM test data.
                                </description>
                                <keepDependencies>false</keepDependencies>
                                <properties>
                                    <jenkins.model.BuildDiscarderProperty>
                                        <strategy class="hudson.tasks.LogRotator">
                                            <daysToKeep>15</daysToKeep>
                                            <numToKeep>-1</numToKeep>
                                            <artifactDaysToKeep>-1</artifactDaysToKeep>
                                            <artifactNumToKeep>-1</artifactNumToKeep>
                                        </strategy>
                                    </jenkins.model.BuildDiscarderProperty>
                                    <com.coravy.hudson.plugins.github.GithubProjectProperty plugin="github@1.29.2">
                                        <projectUrl>https://github.com/Fonteva/fonteva-qa-atdd.git/</projectUrl>
                                        <displayName>Fonteva-QA-ATDD</displayName>
                                    </com.coravy.hudson.plugins.github.GithubProjectProperty>
                                    <com.chikli.hudson.plugin.naginator.NaginatorOptOutProperty plugin="naginator@1.17.2">
                                        <optOut>false</optOut>
                                    </com.chikli.hudson.plugin.naginator.NaginatorOptOutProperty>
                                    <com.sonyericsson.rebuild.RebuildSettings plugin="rebuild@1.28">
                                        <autoRebuild>false</autoRebuild>
                                        <rebuildDisabled>false</rebuildDisabled>
                                    </com.sonyericsson.rebuild.RebuildSettings>
                                    <com.synopsys.arc.jenkinsci.plugins.jobrestrictions.jobs.JobRestrictionProperty plugin="job-restrictions@0.7"/>
                                    <hudson.plugins.throttleconcurrents.ThrottleJobProperty plugin="throttle-concurrents@2.0.1">
                                        <maxConcurrentPerNode>0</maxConcurrentPerNode>
                                        <maxConcurrentTotal>0</maxConcurrentTotal>
                                        <categories class="java.util.concurrent.CopyOnWriteArrayList"/>
                                        <throttleEnabled>false</throttleEnabled>
                                        <throttleOption>project</throttleOption>
                                        <limitOneJobWithMatchingParams>false</limitOneJobWithMatchingParams>
                                        <paramsToUseForLimit/>
                                    </hudson.plugins.throttleconcurrents.ThrottleJobProperty>
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
                                            <name>*/2018_r1</name>
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
                            npm install robotjs
                            npm run cloud -- --cucumberOpts.tags="(@event-info or @pages) and @2018-r1" --job="${JOB_NAME}"
                                        </command>
                                    </hudson.tasks.Shell>
                                </builders>
                                <publishers>
                                    <htmlpublisher.HtmlPublisher plugin="htmlpublisher@1.16">
                                        <reportTargets>
                                            <htmlpublisher.HtmlPublisherTarget>
                                                <reportName>HTML Report</reportName>
                                                <reportDir>reports/html/</reportDir>
                                                <reportFiles>testrun_*.html</reportFiles>
                                                <alwaysLinkToLastBuild>false</alwaysLinkToLastBuild>
                                                <reportTitles/>
                                                <keepAll>false</keepAll>
                                                <allowMissing>false</allowMissing>
                                                <includes>**/*</includes>
                                            </htmlpublisher.HtmlPublisherTarget>
                                        </reportTargets>
                                    </htmlpublisher.HtmlPublisher>
                                    <hudson.plugins.parameterizedtrigger.BuildTrigger plugin="parameterized-trigger@2.35.2">
                                        <configs>
                                            <hudson.plugins.parameterizedtrigger.BuildTriggerConfig>
                                                <configs class="empty-list"/>
                                                <projects>prod_auto_nightly_EE_CC</projects>
                                                <condition>FAILED_OR_BETTER</condition>
                                                <triggerWithNoParameters>true</triggerWithNoParameters>
                                                <triggerFromChildProjects>false</triggerFromChildProjects>
                                            </hudson.plugins.parameterizedtrigger.BuildTriggerConfig>
                                        </configs>
                                    </hudson.plugins.parameterizedtrigger.BuildTrigger>
                                </publishers>
                                <buildWrappers>
                                    <hudson.plugins.timestamper.TimestamperBuildWrapper plugin="timestamper@1.8.10"/>
                                    <hudson.plugins.ansicolor.AnsiColorBuildWrapper plugin="ansicolor@0.5.2">
                                        <colorMapName>xterm</colorMapName>
                                    </hudson.plugins.ansicolor.AnsiColorBuildWrapper>
                                    <jenkins.plugins.nodejs.NodeJSBuildWrapper plugin="nodejs@1.2.6">
                                        <nodeJSInstallationName>recent node</nodeJSInstallationName>
                                    </jenkins.plugins.nodejs.NodeJSBuildWrapper>
                                </buildWrappers>
                            </project>`, function (err, data) {
                            if (err) {
                                return console.log(err);
                            }
                            jenkins.add_job_to_view(viewName, JOB_NAME, function (err, data) {
                                if (err) {
                                    return console.log(err);
                                }
                                console.log(data)
                            });
                        });
                    }
                });    
            });
        }
        return data;
    });
};