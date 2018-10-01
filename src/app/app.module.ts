import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { AmplifyAngularModule, AmplifyService } from 'aws-amplify-angular';
import { MDBSpinningPreloader, CarouselModule, PopoverModule, ToastModule } from 'ng-uikit-pro-standard';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgProgressModule } from '@ngx-progressbar/core';
import { NgProgressRouterModule } from '@ngx-progressbar/router';
import { NgProgressHttpClientModule } from '@ngx-progressbar/http-client';
import { AppComponent } from './app.component';
import { AppRoutes } from './app.routes.service';
import { NavigationModule } from './main-layout/navigation/navigation.module';
import { AuthGuardService } from './services/auth-guard.service';
import { SharedModule } from './shared/shared.module';
import { ErrorModule } from './views/errors/error.module';
import { ViewsModule } from './views/views.module';
import { TabsModule, WavesModule, MaterialChipsModule } from 'ng-uikit-pro-standard';
import { UserProfileDataService } from './services/user-profile-data.service';
import { _2018SprintRunsDataService } from './services/2018-sprint-runs-data.service';
import { AvatarModule } from 'ngx-avatar';
import { _2018R1PatchRunsDataService } from './services/2018-r1-patch-data.service';
import { _2018R2VFPRunsDataService } from './services/2018-r2-vfp-runs-data.service';
// MDB Angular Pro
import { ModalModule } from 'ng-uikit-pro-standard';
// MDB Angular Pro
import { InputsModule, ButtonsModule } from 'ng-uikit-pro-standard';
// For MDB Angular Pro Accordion
import { AccordionModule } from 'ng-uikit-pro-standard';
// main layout
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    NavigationModule,
    AppRoutes,
    RouterModule,
    AccordionModule,
    InputsModule, ButtonsModule,
    FormsModule,
    SharedModule,
    ViewsModule,
    ErrorModule,
    ModalModule,
    TabsModule,
    WavesModule,
    CarouselModule,
    ToastModule.forRoot(),
    ReactiveFormsModule,
    AmplifyAngularModule,
    NgProgressModule.forRoot(),
    NgProgressHttpClientModule,
    NgProgressRouterModule,
    HttpClientModule,
    AvatarModule,
    MaterialChipsModule,
    PopoverModule
  ],
  providers: [MDBSpinningPreloader, AmplifyService, AuthGuardService, UserProfileDataService,
    _2018SprintRunsDataService,_2018R1PatchRunsDataService, _2018R2VFPRunsDataService,
    { provide: HTTP_INTERCEPTORS, useClass: NgProgressModule, multi: true }],
  bootstrap: [AppComponent],
  schemas: [ NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA ]
})
export class AppModule { }
