import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Amplify, { graphqlOperation } from 'aws-amplify';
import { AmplifyService } from 'aws-amplify-angular';
import { ToastService } from 'ng-uikit-pro-standard';
import { UserProfileDataService } from '../../../services/user-profile-data.service';

export interface UserProfile {
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  mobile: string;
}
@Component({
  selector: 'app-dashboard5',
  templateUrl: './dashboard5.component.html',
  styleUrls: ['./dashboard5.component.scss']
})
export class Dashboard5Component implements OnInit {
  options = {
    toastClass: 'opacity',
    closeButton: true,
    progressBar: true,
    positionClass: 'toast-bottom-right',
    tapToDismiss: true
  };
  usrProfileForm: FormGroup;
  _userProfile = {} as UserProfile;
  _currentProfile = {} as UserProfile;
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  mobile: string;
  submitted = false;
  // userid: string;
  message: string;

  constructor(
    private amplifyService: AmplifyService,
    private formBuilder: FormBuilder,
    private userProfile: UserProfileDataService,
    private toast: ToastService
  ) {
  }

  async ngOnInit() {
    this.usrProfileForm = this.formBuilder.group({
      userName: [{ value: '', disabled: true }, Validators.required],
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      email: [{ value: '', disabled: true }, [Validators.required]],
      mobile: ['', Validators.required]
    });
    this.userProfile.currentMessage.subscribe(profile => {
      if (profile !== null) {
        this.username = profile.username;
        this.email = profile.email;
        this.usrProfileForm.controls['firstname'].setValue(profile.firstname);
        this.usrProfileForm.controls['lastname'].setValue(profile.lastname);
        this.usrProfileForm.controls['mobile'].setValue(profile.mobile);
      }
      this._currentProfile.firstname = this.usrProfileForm.value.firstname;
      this._currentProfile.lastname = this.usrProfileForm.value.lastname;
      this._currentProfile.mobile = this.usrProfileForm.value.mobile;
    });
  }
  async onSubmit() {
    this.submitted = true;
    if (this.usrProfileForm.invalid) {
      return;
    }

    if (
      this._currentProfile.firstname !== this.usrProfileForm.value.firstname ||
      this._currentProfile.lastname !== this.usrProfileForm.value.lastname ||
      this._currentProfile.mobile !== this.usrProfileForm.value.mobile
    ) {
      const createUserProfile = `mutation createUserProfile( 
      $username: String!,
      $email: String!,
      $firstname: String,
      $lastname: String,
      $mobile: String)
      {
        createUserProfile (
          username: $username,
          email: $email,
          firstname: $firstname,
          lastname: $lastname,
          mobile: $mobile
        ) {
          username,
          email,
          firstname,
          lastname,
          mobile
        }
      }`;
      const user = {
        username: this.username,
        email: this.email,
        firstname: this.usrProfileForm.value.firstname,
        lastname: this.usrProfileForm.value.lastname,
        mobile: this.usrProfileForm.value.mobile
      };
      const newuser = await this.amplifyService
        .api()
        .graphql(graphqlOperation(createUserProfile, user));
      this._userProfile = {
        username: newuser['data']['createUserProfile']['username'],
        email: newuser['data']['createUserProfile']['email'],
        firstname: newuser['data']['createUserProfile']['firstname'],
        lastname: newuser['data']['createUserProfile']['lastname'],
        mobile: newuser['data']['createUserProfile']['mobile']
      };
      this.userProfile.changeMessage(this._userProfile);
      this.toast.success('Profile Saved', 'Success', this.options);
    }
  }
  onImageSelected( file ) {
    const key = `profile/${file.name}`;
    this.amplifyService.storage().put( key, file, {
      'level': 'private',
      'contentType': file.type
    })
    .then (result => console.log('selected: ', result))
    .catch(err => console.log('selected error: ', err));
}
  onImagePreviewLoaded($event) {
    console.log('in onImagePreviewLoaded');
    console.log($event);
  }
}