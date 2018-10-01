import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import Amplify, { API, graphqlOperation } from 'aws-amplify';
import { Router } from '@angular/router';
import { AmplifyService } from 'aws-amplify-angular';

export interface UserProfile {
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  mobile: string;
}

@Injectable()
export class UserProfileDataService {
  userProfile = {} as UserProfile;
  username: string;
  email: string;

  private messageSource: BehaviorSubject<UserProfile> = new BehaviorSubject(
    null
  );
  currentMessage: Observable<UserProfile> = this.messageSource.asObservable();

  constructor(private amplifyService: AmplifyService, private _router: Router) {
    this.amplifyService = amplifyService;
    this.getUserProfile().then(() => {
      this.messageSource.next(this.userProfile);
    });
  }
  changeMessage(message: UserProfile) {
    this.getUserProfile().then(() => {
    this.messageSource.next(this.userProfile);
    });
  }
  async getUserProfile() {
        const userSettings = await this.amplifyService.auth().currentUserInfo();
        if (userSettings !== null ) {
        this.username = userSettings.username;
        this.email = userSettings.attributes.email;
        const getUserProfile = `query getUserProfile($username: String!) {
          getUserProfile(username: $username)
          }`;
        const params = {
          username: this.username
        };
        const result = await this.amplifyService
          .api()
          .graphql(graphqlOperation(getUserProfile, params));
        if (JSON.parse(result['data']['getUserProfile']).items.length === 0) {
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
            firstname: 'NA',
            lastname: 'NA',
            mobile: 'NA'
          };
          const newuser = await this.amplifyService
            .api()
            .graphql(graphqlOperation(createUserProfile, user));
          this.userProfile.username =
            newuser['data']['createUserProfile']['username'];
          this.userProfile.firstname =
            newuser['data']['createUserProfile']['firstname'];
          this.userProfile.lastname =
            newuser['data']['createUserProfile']['lastname'];
          this.userProfile.email =
            newuser['data']['createUserProfile']['email'];
          this.userProfile.mobile =
            newuser['data']['createUserProfile']['mobile'];
        } else {
          this.userProfile.username = JSON.parse(
            result['data']['getUserProfile']
          ).items[0]['username'];
          this.userProfile.firstname = JSON.parse(
            result['data']['getUserProfile']
          ).items[0]['firstname'];
          this.userProfile.lastname = JSON.parse(
            result['data']['getUserProfile']
          ).items[0]['lastname'];
          this.userProfile.email = JSON.parse(
            result['data']['getUserProfile']
          ).items[0]['email'];
          this.userProfile.mobile = JSON.parse(
            result['data']['getUserProfile']
          ).items[0]['mobile'];
        }
      }
  }
}
