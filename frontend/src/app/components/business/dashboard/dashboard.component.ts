import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { BusinessService } from '../../../services/business.service';
import { Business } from '../../../models/business.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  business: Business | null = null;
  loyaltyForm: FormGroup;
  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private businessService: BusinessService,
    private fb: FormBuilder
  ) {
    this.loyaltyForm = this.fb.group({
      loyalty_rate: [1.0, [Validators.required, Validators.min(0.1)]]
    });
  }

  ngOnInit(): void {
    this.loadBusinessDetails();
  }

  loadBusinessDetails(): void {
    this.authService.getCurrentBusiness().subscribe({
      next: (business) => {
        this.business = business;
        this.loyaltyForm.patchValue({
          loyalty_rate: business.loyalty_rate
        });
      },
      error: (err) => {
        console.error('Failed to load business details', err);
      }
    });
  }

  updateLoyaltyRate(): void {
    if (this.loyaltyForm.valid && this.business) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      const loyaltyRate = this.loyaltyForm.value.loyalty_rate;
      
      this.businessService.setLoyaltyRate(this.business.id, loyaltyRate).subscribe({
        next: (updatedBusiness) => {
          this.isLoading = false;
          this.business = updatedBusiness;
          this.successMessage = 'Loyalty rate updated successfully!';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.detail || 'Failed to update loyalty rate.';
        }
      });
    }
  }
}
