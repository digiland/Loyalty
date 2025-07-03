import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { DashboardComponent } from './components/business/dashboard/dashboard.component';
import { AddPointsComponent } from './components/loyalty/add-points/add-points.component';
import { RedeemPointsComponent } from './components/loyalty/redeem-points/redeem-points.component';
import { CustomerSearchComponent } from './components/customers/customer-search/customer-search.component';
import { LoyaltyProgramsComponent } from './components/loyalty/loyalty-programs/loyalty-programs.component';
import { ProgramFormComponent } from './components/loyalty/program-form/program-form.component';
import { authGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'add-points', component: AddPointsComponent, canActivate: [authGuard] },
  { path: 'redeem-points', component: RedeemPointsComponent, canActivate: [authGuard] },
  { path: 'customers', component: CustomerSearchComponent, canActivate: [authGuard] },
  { path: 'loyalty-programs', component: LoyaltyProgramsComponent, canActivate: [authGuard] },
  { path: 'loyalty-programs/create', component: ProgramFormComponent, canActivate: [authGuard] },
  { path: 'loyalty-programs/edit/:id', component: ProgramFormComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
