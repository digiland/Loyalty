import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthInterceptor } from './interceptors/auth.interceptor';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { DashboardComponent } from './components/business/dashboard/dashboard.component';
import { AddPointsComponent } from './components/loyalty/add-points/add-points.component';
import { RedeemPointsComponent } from './components/loyalty/redeem-points/redeem-points.component';
import { CustomerSearchComponent } from './components/customers/customer-search/customer-search.component';
import { LoyaltyProgramsComponent } from './components/loyalty/loyalty-programs/loyalty-programs.component';
import { ProgramFormComponent } from './components/loyalty/program-form/program-form.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    AddPointsComponent,
    RedeemPointsComponent,
    CustomerSearchComponent,
    LoyaltyProgramsComponent,
    ProgramFormComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
