import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
@Component({
  selector: 'app-form3',
  templateUrl: './form3.component.html',
  styleUrls: ['./form3.component.scss']
})
export class Form3Component implements OnInit {

   emailField = new FormControl('', Validators.email);
   passwordField = new FormControl('', [Validators.required, Validators.minLength(3)]);
  constructor() { }

  ngOnInit() {
  }

}
