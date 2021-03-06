import {
  Component,
  OnInit,
  HostListener,
  ViewChildren,
  QueryList,
  ElementRef
} from "@angular/core";
import { Http } from "@angular/http";
import { Angular5Csv } from "angular5-csv/Angular5-csv";
import { _2018R2VFPRunsDataService } from "../../../services/2018-r2-vfp-runs-data.service";
const dateFormat = require("dateformat");
@Component({
  selector: "profile2",
  templateUrl: "./profile2.component.html",
  styleUrls: ["./profile2.component.scss"]
})
export class Profile2Component implements OnInit {
  logs = [];
  options = {
    fieldSeparator: ",",
    quoteStrings: '"',
    decimalseparator: ".",
    showLabels: true,
    showTitle: true,
    useBom: true,
    headers: ["Run ID", "Build", "Status", "T|P|F|S|U", "Report", "Summary"]
  };
  @ViewChildren("list")
  list: QueryList<ElementRef>;
  paginators: Array<any> = [];
  activePage = 1;
  firstVisibleIndex = 1;
  lastVisibleIndex = 10;
  tableData = [];
  sorted = false;
  searchText: string;
  firstPageNumber = 1;
  lastPageNumber: number;
  maxVisibleItems = 10;
  timeStamp = dateFormat(Date.now(), "mmm d, yyyy");

  constructor(private _2018R2VFPRuns: _2018R2VFPRunsDataService) {}

  ngOnInit() {
    this._2018R2VFPRuns.currentMessage.subscribe(runs => {
      if (runs !== null) {
        runs["Items"].forEach((element: any) => {
          this.tableData.push({
            Id: element.testRunID["S"],
            Build: element.buildName["S"],
            Status: element.status["S"],
            Metrics: {
              total: `${element.totalScenarios["S"]}`,
              passed: `${element.passedScenarios["S"]}`,
              failed: `${element.failedScenarios["S"]}`,
              skipped: `${element.skippedScenarios["S"]}`,
              undefined: `${element.undefinedScenarios["S"]}`
            },
            Report: element.report["S"],
            Logs: element.logs["S"],
            TimeStamp: element.timeStamp["S"],
            Duration: element.totalDuration["S"]
          });
        });
      }
    });

    setTimeout(() => {
      for (let i = 1; i <= this.tableData.length; i++) {
        if (i % this.maxVisibleItems === 0) {
          this.paginators.push(i / this.maxVisibleItems);
        }
      }
      if (this.tableData.length % this.paginators.length !== 0) {
        this.paginators.push(this.paginators.length + 1);
      }
      this.lastPageNumber = this.paginators.length;
      this.lastVisibleIndex = this.maxVisibleItems;
    }, 200);
  }

  @HostListener("input")
  oninput() {
    this.paginators = [];
    for (let i = 1; i <= this.search().length; i++) {
      if (
        !(this.paginators.indexOf(Math.ceil(i / this.maxVisibleItems)) !== -1)
      ) {
        this.paginators.push(Math.ceil(i / this.maxVisibleItems));
      }
    }
    this.lastPageNumber = this.paginators.length;
  }
  changePage(event: any) {
    if (event.target.text >= 1 && event.target.text <= this.maxVisibleItems) {
      this.activePage = +event.target.text;
      this.firstVisibleIndex =
        this.activePage * this.maxVisibleItems - this.maxVisibleItems + 1;
      this.lastVisibleIndex = this.activePage * this.maxVisibleItems;
    }
  }

  nextPage() {
    this.activePage += 1;
    this.firstVisibleIndex =
      this.activePage * this.maxVisibleItems - this.maxVisibleItems + 1;
    this.lastVisibleIndex = this.activePage * this.maxVisibleItems;
  }
  previousPage() {
    this.activePage -= 1;
    this.firstVisibleIndex =
      this.activePage * this.maxVisibleItems - this.maxVisibleItems + 1;
    this.lastVisibleIndex = this.activePage * this.maxVisibleItems;
  }

  firstPage() {
    this.activePage = 1;
    this.firstVisibleIndex =
      this.activePage * this.maxVisibleItems - this.maxVisibleItems + 1;
    this.lastVisibleIndex = this.activePage * this.maxVisibleItems;
  }

  lastPage() {
    this.activePage = this.lastPageNumber;
    this.firstVisibleIndex =
      this.activePage * this.maxVisibleItems - this.maxVisibleItems + 1;
    this.lastVisibleIndex = this.activePage * this.maxVisibleItems;
  }

  sortBy(by: string | any): void {
    if (by === "Id") {
      this.search().reverse();
    } else {
      this.search().sort((a: any, b: any) => {
        if (a[by] < b[by]) {
          return this.sorted ? 1 : -1;
        }
        if (a[by] > b[by]) {
          return this.sorted ? -1 : 1;
        }
        return 0;
      });
    }
    this.sorted = !this.sorted;
  }

  filterIt(arr: any, searchKey: any) {
    return arr.filter((obj: any) => {
      return Object.keys(obj).some(key => {
        return obj[key].includes(searchKey);
      });
    });
  }

  search() {
    if (!this.searchText) {
      return this.tableData;
    }
    if (this.searchText) {
      return this.filterIt(this.tableData, this.searchText);
    }
  }

  generateCsv() {
    new Angular5Csv(this.search(), "data-table", this.options);
  }
  showModal(k) {
    this.logs = JSON.parse(this.tableData[k].Logs);
    console.log(this.logs);
  }
}
