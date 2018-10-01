
import { MDBBootstrapModulesPro } from 'ng-uikit-pro-standard';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgModule, NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationComponent } from './navigation.component';
import { NavbarComponent } from './navbar/navbar.component';
import { AvatarModule } from 'ngx-avatar';
import { AmplifyAngularModule, AmplifyService } from 'aws-amplify-angular';
@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MDBBootstrapModulesPro.forRoot(),
    AmplifyAngularModule,
    AvatarModule
  ],
  declarations: [
    NavigationComponent,
    NavbarComponent,
  ],
  exports: [
    NavigationComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA,
    CUSTOM_ELEMENTS_SCHEMA
  ],
  providers: [AmplifyService]
})
export class NavigationModule {

}
