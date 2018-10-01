import { MDBDatePickerComponent } from 'ng-uikit-pro-standard';

import { UploadFile, UploadInput, UploadOutput } from 'ng-uikit-pro-standard';
import { Component, OnInit, ViewChild, AfterViewInit, EventEmitter } from '@angular/core';
import { ClockPickerComponent } from 'ng-uikit-pro-standard';
import { humanizeBytes } from 'ng-uikit-pro-standard';
import { CompleterData } from 'ng-uikit-pro-standard';
import { CompleterService } from 'ng-uikit-pro-standard';

@Component({
  selector: 'app-form2',
  templateUrl: './form2.component.html',
  styleUrls: ['./form2.component.scss']
})
export class Form2Component implements OnInit, AfterViewInit {

  // File import
  formData: FormData;
  files: UploadFile[];
  uploadInput: EventEmitter<UploadInput>;
  humanizeBytes: Function;
  dragOver: boolean;
  model: string;
  visibility: boolean;
  // Autocomplete
  state: string;
  public searchStr: string;
  public dataService: CompleterData;

  public searchData = [
    { color: 'red' },
    { color: 'green' },
    { color: 'blue' },
    { color: 'cyan' },
    { color: 'magenta' },
    { color: 'yellow' },
    { color: 'black' },
  ];


  //Time picker
  @ViewChild("darkPicker") darkPicker: ClockPickerComponent;
  @ViewChild("datePicker") datePicker: MDBDatePickerComponent;


  constructor(public completerService: CompleterService) {
    this.dataService = completerService.local(this.searchData, 'color', 'color');
    this.files = [];
    this.uploadInput = new EventEmitter<UploadInput>();
    this.humanizeBytes = humanizeBytes;

  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    setTimeout(() => this.darkPicker.setHour("15"), 0);
    setTimeout(() => this.datePicker.onUserDateInput("2017-10-13"), 0);

  }

  range: any = 50;

  coverage() {
    if (typeof this.range === 'string' && this.range.length !== 0) {
      return this.range;
    }
  }

  showFiles() {
    let files = "";
    for (let i = 0; i < this.files.length; i++) {
      files += this.files[i].name;
      if (!(this.files.length - 1 == i)) {
        files += ", "
      }
    }
    return files;
  }

  startUpload(): void {
    const event: UploadInput = {
      type: 'uploadAll',
      url: '/upload',
      method: 'POST',
      data: { foo: 'bar' },
    };

    this.uploadInput.emit(event);
  }

  cancelUpload(id: string): void {
    this.uploadInput.emit({ type: 'cancel', id: id });
  }

  onUploadOutput(output: UploadOutput | any): void {

    if (output.type === 'allAddedToQueue') {
    } else if (output.type === 'addedToQueue') {
      this.files.push(output.file); // add file to array when added
    } else if (output.type === 'uploading') {
      // update current data in files array for uploading file
      const index = this.files.findIndex(file => file.id === output.file.id);
      this.files[index] = output.file;
    } else if (output.type === 'removed') {
      // remove file from array when removed
      this.files = this.files.filter((file: UploadFile) => file !== output.file);
    } else if (output.type === 'dragOver') {
      this.dragOver = true;
    } else if (output.type === 'dragOut') {
    } else if (output.type === 'drop') {
      this.dragOver = false;
    }
    this.showFiles();
    console.log(output);
  }

}
