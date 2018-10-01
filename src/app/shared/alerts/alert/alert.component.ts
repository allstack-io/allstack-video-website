import { ToastService } from 'ng-uikit-pro-standard';
import { Component, OnInit } from '@angular/core';
@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss']
})
export class AlertComponent implements OnInit {


  constructor(private toastrService: ToastService) {}
    showSuccess() {
      this.toastrService.success('Info message');
    }
    showError() {
      this.toastrService.error('Warning message');
    }
    showInfo() {
      this.toastrService.info('Success message');
    }

    showWarning() {
      this.toastrService.warning('Error message');
    }

    showTopLeft() {
      const options = { positionClass: 'toast-top-left' };
      this.toastrService.info('Info message', '', options);
    }
    showTopCenter() {
      const options = { positionClass: 'toast-top-center' };
      this.toastrService.info('Info message', '', options);
    }
    showTopFullWidth() {
      const options = { positionClass: 'toast-top-full-width' };
      this.toastrService.info('Info message', '', options);
    }
    showTopRight() {
      const options = { positionClass: 'toast-top-right' };
      this.toastrService.info('Info message', '', options);
    }
    showBottomLeft() {
      const options = { positionClass: 'toast-bottom-left' };
      this.toastrService.info('Info message', '', options);
    }
    showBottomCenter() {
      const options = { positionClass: 'toast-bottom-center' };
      this.toastrService.info('Info message', '', options);
    }
    showBottomFullWidth() {
      const options = { positionClass: 'toast-bottom-full-width' };
      this.toastrService.info('Info message', '', options);
    }
    showBottomRight() {
      const options = { positionClass: 'toast-bottom-right' };
      this.toastrService.info('Info message', '', options);
    }

  ngOnInit() {
  }

}
