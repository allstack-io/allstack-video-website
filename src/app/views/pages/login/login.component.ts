import { Component, OnInit } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { Location } from "@angular/common";
import { AmplifyService } from "aws-amplify-angular";
@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"]
})
export class LoginComponent implements OnInit {
  user: any;
  userState: string;
  constructor(private amplifyService: AmplifyService, private _router: Router) {
    /*this.amplifyService = amplifyService;
    this.amplifyService.authStateChange$.subscribe(authState => {
      console.log(`State: ${authState.state}`);
      this.userState = authState.state;
      if (authState.state === 'signedIn') {
        this.user = authState.user;
        this._router.navigateByUrl('dashboards/home');
      } 
    });*/
  }
  async ngOnInit() {
    const userSettings = await this.amplifyService.auth().currentUserInfo();
    if (userSettings === null) {
      this.amplifyService
      .auth()
      .signOut()
      .then(() => {
        this._router.navigate(['']);
      })
      .catch(err => {
        return false;
      });
      // window.location.replace("/pages/login");
    }
  }
}
