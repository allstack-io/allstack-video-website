const jenkinsapi = require('jenkins-api');
const username = 'smunukuntla@fonteva.com';
const token = '51dd16be6ca691a6f95e31bf1e26cfc5';
const jenkins = jenkinsapi.init(
  `https://${username}:${token}@jenkins.fonteva.io`,
  {
    strictSSL: true
  }
);
export class JenkinsView {

  async createView(viewName: string): Promise<any> {
    return jenkins.create_view(viewName, (err: any, viewInfo: any) => {
      if (err) {
        return console.log(err);
      }
      return viewInfo;
    });
  }

  async getAllViews(): Promise<any> {
    const _views: Array<any> = [];
    return jenkins.all_views(async (err: any, data: any) => {     
      if (err) { return console.log(err); }
      data.forEach((view: any) => {
        _views.push(view.name);
      });
      return _views;
    });
  }
}
