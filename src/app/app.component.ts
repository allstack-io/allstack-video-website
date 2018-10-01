import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AmplifyService } from 'aws-amplify-angular';
import Amplify, { API, graphqlOperation } from 'aws-amplify';

@Component({
  selector: 'mdb-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit {
  specialPage = false;
  userState: string;
  user: any;
  userid: string;

  constructor(private amplifyService: AmplifyService, private _router: Router) {
    
    this.amplifyService = amplifyService;
    this.amplifyService.authStateChange$.subscribe(async authState => {
      this.userState = authState.state;
      //#region user signin & signout staus update to dynamodb
      if (authState.state === 'signedIn') {
        const userSettings = await this.amplifyService.auth().currentUserInfo();
        this.specialPage = true;
        this.user = authState.user;
        this._router.navigateByUrl('dashboards/home');
        // add user status to dynamoDB
        //#region User status into UserStatus DB

        /*const myInit = {
          body: {
            userid: userSettings["id"],
            username: this.user.username,
            email: userSettings.attributes["email"],
            signin: true
          }
        };
        this.amplifyService
          .api()
          .put("fondashv2UserStatus", "/userStatus", myInit)
          .catch(error => {
            // tslint:disable-next-line:no-console
            console.log(error.response);
          });*/

        //#endregion
        /*localStorage.setItem("userid", userSettings["id"]);
        localStorage.setItem("email", userSettings.attributes["email"]);
        localStorage.setItem(
          "username",
          userSettings.attributes["email"].split("@fonteva.com")[0]
        );*/
        //#region User details to UserPreference DB

        /*const myPref = {
          body: {
            userid: userSettings['id'],
            username: this.user.username,
            email: userSettings.attributes['email']
          }
        };
        this.amplifyService
          .api()
          .post('fondashv2UserPreferences', '/userPreferences', myPref)
          .catch(error => {
            // tslint:disable-next-line:no-console
            console.log(error.response);
          });*/

        //#endregion
      } else if (authState.state === 'signedOut') {
        this.user = null;
        // window.location.replace('/pages/login');
        this._router.navigateByUrl('pages/login');
        /*if (
          localStorage.length > 0 &&
          localStorage.getItem("userid") !== null &&
          localStorage.getItem("email") !== null &&
          localStorage.getItem("username") !== null
        ) {
          // add user status to dynamoDB
          const myInit = {
            body: {
              userid: localStorage.getItem('userid'),
              username: localStorage.getItem('username'),
              email: localStorage.getItem('email'),
              signin: false
            }
          };
          this.amplifyService
            .api()
            .put('fondashv2UserStatus', '/userStatus', myInit)
            .catch(error => {
              // tslint:disable-next-line:no-console
              console.log(error.response);
            });
        }*/
      }
      //#endregion
    });
  }
  async ngOnInit() {
    await this.amplifyService.auth().currentAuthenticatedUser().then(user => {
      if (user.signInUserSession === null) {
       this._router.navigateByUrl('pages/login');
     }
    });
    // Create a New user
    /*const createUserProfile = `mutation createUserProfile(
      $userid: String!,
      $username: String!,
      $email: String) {
        createUserProfile(input: {
        userid: $userid,
        username: $username,
        email: $email
      }) {
        userid
        username
        email
      }
    }`;
    const user = {
      userid: 'fsdfsdfsdfdsf',
      username: 'asdasdsa',
      email: 'dfksdlfkls;dkfl;d',
    };
    const newuser = await this.amplifyService
      .api()
      .graphql(graphqlOperation(createUserProfile, user));
    console.log(newuser);*/
    // Update the existing user
    /*const updateUserProfile = `mutation updateUserProfile(
      $userid: String!,
      $username: String!,
      $email: String) {
        updateUserProfile(input: {
        userid: $userid,
        username: $username,
        email: $email
      }) {
        userid
        username
        email
      }
    }`;
    const user = {
      userid: 'sdasdas',
      username: 'kgjdflgkfldgkl;fdk;gfl',
      email: 'dflgdf;g;fdggflkgjklfjglkfjgkljdfkgjkfdjgkjdfkgjdfjglk',
    };
    const newuser = await this.amplifyService
      .api()
      .graphql(graphqlOperation(updateUserProfile, user));
    console.log(newuser);*/
    // Deleting the existing user
    /*const deleteUserProfile = `mutation deleteUserProfile(
      $userid: String!) {
        deleteUserProfile(input: {
        userid: $userid
      }) {
        userid
      }
    }`;
    const user = {
      userid: 'sdasdas'
    };
    const newuser = await this.amplifyService
      .api()
      .graphql(graphqlOperation(deleteUserProfile, user));
    console.log(newuser);*/
    // get a single user
    /*const getUserProfile = `query getUserProfile($userid: String!) {
      getUserProfile(
          userid: $userid
        ) {
        userid,
        username,
        email
      }
    }`;
    const user = {
      userid: 'fsdfsdfsdfdsf'
    };
    const newuser = await this.amplifyService
      .api()
      .graphql(graphqlOperation(getUserProfile, user));
    console.log(newuser);*/
    // get all users NOT WORKING
    /*const listUserProfiles = `query {
        listUserProfiles (filter: {}, limit: 10) {
          userid,
          username,
          email
      }
    }`;
    const user = {
      limit: 10
    };
    const newuser = await this.amplifyService
      .api()
      .graphql(graphqlOperation(listUserProfiles));
    console.log(newuser);*/
  }
  showBsCollapse(event: any) { console.log(event); }
    shownBsCollapse(event: any) { console.log(event); }
    hideBsCollapse(event: any) { console.log(event); }
    hiddenBsCollapse(event: any) { console.log(event); }
  
}
