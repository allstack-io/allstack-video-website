import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import Amplify, { API, graphqlOperation } from 'aws-amplify';
import { AmplifyService } from 'aws-amplify-angular';
const dateFormat = require("dateformat");
export interface Run {
  browser: string;
  buildName: string;
  endTime: string;
  executedOn: string;
  platform: string;
  releaseTag: string;
  report: string;
  runDate: string;
  startTime: string;
  status: string;
  testRunID: string;
  timeStamp: string;
  totalDuration: string;
  user: string;
  version: string;
}

@Injectable()
export class _2018R1PatchRunsDataService {
  run = {} as Run;
  private messageSource: BehaviorSubject<Run> = new BehaviorSubject(null);
  currentMessage: Observable<Run> = this.messageSource.asObservable();

  constructor(private amplifyService: AmplifyService) {
    this.getRuns().then(() => {
      this.messageSource.next(this.run);
    });
  }
  changeMessage(message: Run) {
    this.getRuns().then(() => {
      this.messageSource.next(this.run);

    });
  }
  async getRuns() {
    const listRuns = `query listRuns($runDate: String, $tableName: String!){
      listRuns (runDate: $runDate, tableName: $tableName)
    }`;
    const data = {
      runDate: dateFormat(Date.now(), "mmm dd, yyyy"),
      tableName: 'nightly_runs_prod_patch'
    };
    const runs = await this.amplifyService
      .api()
      .graphql(graphqlOperation(listRuns, data));
    // console.log(`Data is : ${JSON.parse(runs['data'].listRuns)}`);
    this.run = JSON.parse(runs['data'].listRuns);
  }
}
