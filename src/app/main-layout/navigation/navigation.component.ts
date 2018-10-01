import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { AmplifyService } from 'aws-amplify-angular';
import { Router } from '@angular/router';
import { UserProfileDataService } from '../../services/user-profile-data.service';
import { BehaviorSubject, Observable } from 'rxjs';


@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {
  @ViewChild('sidenav') sidenav: ElementRef;
  username: string;
  clicked: boolean;
  message: string;
  fullname: string;
  /*customStyle = {
    backgroundColor: '#ffffff',
   border: '1px solid #7e7e7e',
   borderRadius: '50%',
   color: '#7e7e7e',
   cursor: 'pointer'
 };*/


  constructor(private amplifyService: AmplifyService, private _router: Router, private userProfile: UserProfileDataService) {

    this.clicked = this.clicked === undefined ? false : true;
    /*this.userProfile.currentMessage.subscribe(profile => {
      console.log(profile);
      if (profile !== null) {
        console.log(profile);
         this.message = profile.firstname;
         this.fullname = `${profile.firstname} ${profile.lastname}`;
         console.log(this.fullname);
       } else {
        this.message = 'XXXX';
       }
    });*/
    this.amplifyService
      .auth()
      .currentAuthenticatedUser()
      .then(user => {
        this.username = user.username;
      });
  }

  ngOnInit() {
    this.userProfile.currentMessage.subscribe(profile => {
      // console.log(profile);
      if (profile !== null) {
        // console.log(profile);
         this.message = profile.firstname;
         this.fullname = `${profile.firstname} ${profile.lastname}`;
         // console.log(this.fullname);
       } else {
        this.message = 'XXXX';
       }
  });
}

  setClicked(val: boolean): void {
    this.clicked = val;
  }
  logOut() {
    this.amplifyService
      .auth()
      .signOut()
      .then(() => {
        // this._router.navigate(['/pages/login']);
        window.location.replace('pages/login');
      })
      .catch(err => {
        return false;
      });
  }
  avatarClicked($event){
    // console.log($event);
  }

}
