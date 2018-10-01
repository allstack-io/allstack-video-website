import { TestComponent } from './views/test/test/test.component';
import { HelpComponent } from './views/help/help.component';
import { Settings1Component } from './views/settings/settings1/settings1.component';
import { Settings2Component } from './views/settings/settings2/settings2.component';
import { Settings3Component } from './views/settings/settings3/settings3.component';
import { Map3Component } from './views/maps/map3/map3.component';
import { Form3Component } from './views/forms/form3/form3.component';
import { PopoversComponent } from './views/components/popovers/popovers.component';
import { TooltipsComponent } from './views/components/tooltips/tooltips.component';
import { TimePickerComponent } from './views/components/time-picker/time-picker.component';
import { DatePickerComponent } from './views/components/date-picker/date-picker.component';
import { CollapseComponent } from './views/components/collapse/collapse.component';
import { TagsComponent } from './views/components/tags/tags.component';
import { TabsComponent } from './views/components/tabs/tabs.component';
import { ProgressBarsComponent } from './views/components/progress-bars/progress-bars.component';
import { PaginationComponent } from './views/components/pagination/pagination.component';
import { ListsComponent } from './views/components/lists/lists.component';
import { PanelsComponent } from './views/components/panels/panels.component';
import { CardsComponent } from './views/components/cards/cards.component';
import { ButtonsComponent } from './views/components/buttons/buttons.component';
import { ShadowComponent } from './views/css/shadow/shadow.component';
import { ColorsComponent } from './views/css/colors/colors.component';
import { ImagesComponent } from './views/css/images/images.component';
import { UtilitiesComponent } from './views/css/utilities/utilities.component';
import { MediaObjectComponent } from './views/css/media-object/media-object.component';
import { GridComponent } from './views/css/grid/grid.component';
import { AlertComponent } from './shared/alerts/alert/alert.component';
import { Form2Component } from './views/forms/form2/form2.component';
import { Form1Component } from './views/forms/form1/form1.component';
import { Map2Component } from './views/maps/map2/map2.component';
import { Map1Component } from './views/maps/map1/map1.component';
import { IconsComponent } from './views/css/icons/icons.component';
import { TypographyComponent } from './views/css/typography/typography.component';
import { ModalsComponent } from './views/modals/modals.component';
import { Chart3Component } from './views/charts/chart3/chart3.component';
import { Table2Component } from './views/tables/table2/table2.component';
import { Chart2Component } from './views/charts/chart2/chart2.component';
import { Chart1Component } from './views/charts/chart1/chart1.component';
import { BasicTableComponent } from './views/tables/basic-table/basic-table.component';
import { Profile1Component } from './views/profile/profile1/profile1.component';
import { Profile2Component } from './views/profile/profile2/profile2.component';
import { Profile3Component } from './views/profile/profile3/profile3.component';
import { Profile4Component } from './views/profile/profile4/profile4.component';
import { RouterModule, Route } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';
import { NotFoundComponent } from './views/errors/not-found/not-found.component';
import { LoginComponent } from './views/pages/login/login.component';
import { RegisterComponent } from './views/pages/register/register.component';
import { LockComponent } from './views/pages/lock/lock.component';
import { PricingComponent } from './views/pages/pricing/pricing.component';
import { SinglePostComponent } from './views/pages/single-post/single-post.component';
import { PostListingComponent } from './views/pages/post-listing/post-listing.component';
import { CustomersComponent } from './views/pages/customers/customers.component';
import { Dashboard1Component } from './views/dashboards/dashboard1/dashboard1.component';
import { Dashboard2Component } from './views/dashboards/dashboard2/dashboard2.component';
import { Dashboard3Component } from './views/dashboards/dashboard3/dashboard3.component';
import { Dashboard4Component } from './views/dashboards/dashboard4/dashboard4.component';
import { Dashboard5Component } from './views/dashboards/dashboard5/dashboard5.component';
import { EventCalendarComponent } from './views/event-calendar/event-calendar.component';
import { AuthGuardService } from './services/auth-guard.service';
import { AppComponent } from './app.component';

const routes: Route[] = [
  // { path: '', pathMatch: 'full', redirectTo: 'pages/post-listing' },
  { path: '', pathMatch: 'full', redirectTo: '/' },
  // { path: '', pathMatch: 'full', redirectTo: 'pages/login' },
  { path: 'dashboards',
  canActivate: [AuthGuardService],
  children:
    [
      { path: 'home', component: Dashboard1Component },
      { path: '2018_r2', component: Dashboard2Component },
      { path: '2018_r1', component: Dashboard3Component },
      { path: '2018_sprint_10', component: Dashboard4Component },
      { path: 'profile', component: Dashboard5Component },
    ]
  },

  { path: 'pages', children:
    [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'lock', component: LockComponent },
      { path: 'pricing', component: PricingComponent },
      { path: 'single-post', component: SinglePostComponent },
      { path: 'post-listing', component: PostListingComponent },
      { path: 'customers', component: CustomersComponent },
    ]
  },
  { path: 'test-automation', canActivate: [AuthGuardService], children:
    [
      { path: '2018_sprint', component: Profile1Component },
      { path: '2018_r2', component: Profile2Component },
      { path: '2018_r1', component: Profile3Component },
      { path: 'configurations', component: Profile4Component }
    ]
  },
  { path: 'settings', canActivate: [AuthGuardService], children:
    [
      { path: 'settings1', component: Settings1Component },
      { path: 'settings2', component: Settings2Component },
      { path: 'settings3', component: Settings3Component }
    ]
  },
  { path: 'components', canActivate: [AuthGuardService], children:
    [
      { path: 'buttons', component: ButtonsComponent },
      { path: 'cards', component: CardsComponent },
      { path: 'panels', component: PanelsComponent },
      { path: 'lists', component: ListsComponent },
      { path: 'pagination', component: PaginationComponent },
      { path: 'progress-bars', component: ProgressBarsComponent },
      { path: 'tabs', component: TabsComponent },
      { path: 'tags', component: TagsComponent },
      { path: 'collapse', component: CollapseComponent },
      { path: 'date-picker', component: DatePickerComponent },
      { path: 'time-picker', component: TimePickerComponent },
      { path: 'tooltips', component: TooltipsComponent },
      { path: 'popovers', component: PopoversComponent },
    ]
  },
  { path: 'tables', canActivate: [AuthGuardService], children:
    [
      { path: 'table1', component: BasicTableComponent },
      { path: 'table2', component: Table2Component },
    ]
  },
  { path: 'charts', canActivate: [AuthGuardService], children:
    [
      { path: 'chart1', component: Chart1Component},
      { path: 'chart2', component: Chart2Component},
      { path: 'chart3', component: Chart3Component},
    ]
  },
  { path: 'maps', canActivate: [AuthGuardService], children:
    [
      { path: 'map1', component: Map1Component},
      { path: 'map2', component: Map2Component},
      { path: 'map3', component: Map3Component},
    ]
  },
  { path: 'css', canActivate: [AuthGuardService], children:
    [
      { path: 'grid', component: GridComponent},
      { path: 'media', component: MediaObjectComponent},
      { path: 'utilities', component: UtilitiesComponent},
      { path: 'icons', component: IconsComponent},
      { path: 'images', component: ImagesComponent},
      { path: 'typography', component: TypographyComponent},
      { path: 'colors', component: ColorsComponent},
      { path: 'shadow', component: ShadowComponent},
    ]
  },
  { path: 'forms', canActivate: [AuthGuardService], children:
    [
      { path: 'form1', component: Form1Component},
      { path: 'form2', component: Form2Component},
      { path: 'form3', component: Form3Component},
    ]
  },
  { path: 'alerts', canActivate: [AuthGuardService], component: AlertComponent},
  { path: 'modals', canActivate: [AuthGuardService], component: ModalsComponent},
  { path: 'calendar', canActivate: [AuthGuardService], component: EventCalendarComponent},
  { path: 'help', canActivate: [AuthGuardService], component: HelpComponent },
  {path: 'test', canActivate: [AuthGuardService], component: TestComponent},
  // { path: '**', component: NotFoundComponent }
  { path: '**', redirectTo: 'pages/login'}
  

];

export const AppRoutes: ModuleWithProviders = RouterModule.forRoot(routes,{ useHash: false });
