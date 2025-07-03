import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { LoyaltyService } from '../../../services/loyalty.service';
import { CustomerService } from '../../../services/customer.service';
import { Business } from '../../../models/business.model';
import { RedemptionCreate } from '../../../models/transaction.model';
import { CustomerPointsResponse } from '../../../models/customer.model';

@Component({
  selector: 'app-redeem-points',
  templateUrl: './redeem-points.component.html',
  styleUrls: ['./redeem-points.component.css']
})
export class RedeemPointsComponent implements OnInit {
  redeemForm: FormGroup;
  business: Business | null = null;
  customerPoints: CustomerPointsResponse | null = null;
  isLoading: boolean = false;
  isLookingUp: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  lookupError: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private loyaltyService: LoyaltyService,
    private customerService: CustomerService
  ) {
    this.redeemForm = this.fb.group({
      customer_phone_number: ['', [Validators.required, Validators.pattern(/^\+?\d{9,15}$/)]],
      points_to_redeem: [0, [Validators.required, Validators.min(1)]],
      reward_description: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit(): void {
    this.loadBusinessDetails();
  }

  loadBusinessDetails(): void {
    this.authService.getCurrentBusiness().subscribe({
      next: (business) => {
        this.business = business;
      },
      error: (err) => {
        console.error('Failed to load business details', err);
      }
    });
  }

  lookupCustomer(): void {
    const phoneNumber = this.redeemForm.value.customer_phone_number;
    
    if (phoneNumber && phoneNumber.match(/^\+?\d{9,15}$/)) {
      this.isLookingUp = true;
      this.lookupError = '';
      this.customerPoints = null;
      
      this.customerService.getCustomerPoints(phoneNumber).subscribe({
        next: (response) => {
          this.isLookingUp = false;
          this.customerPoints = response;
          
          // Set max points to redeem
          const control = this.redeemForm.get('points_to_redeem');
          if (control) {
            control.setValidators([
              Validators.required,
              Validators.min(1),
              Validators.max(response.total_points)
            ]);
            control.updateValueAndValidity();
          }
        },
        error: (err) => {
          this.isLookingUp = false;
          this.lookupError = err.error?.detail || 'Customer not found or has no points.';
        }
      });
    } else {
      this.lookupError = 'Please enter a valid phone number.';
    }
  }

  onSubmit(): void {
    if (this.redeemForm.valid && this.business && this.customerPoints) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const redemption: RedemptionCreate = {
        business_id: this.business.id,
        customer_phone_number: this.redeemForm.value.customer_phone_number,
        points_to_redeem: this.redeemForm.value.points_to_redeem,
        reward_description: this.redeemForm.value.reward_description
      };

      this.loyaltyService.redeemPoints(redemption).subscribe({
        next: (result) => {
          this.isLoading = false;
          this.successMessage = `Success! ${redemption.points_to_redeem} points redeemed for customer ${redemption.customer_phone_number}.`;
          this.redeemForm.reset({
            customer_phone_number: '',
            points_to_redeem: 0,
            reward_description: ''
          });
          this.customerPoints = null;
          setTimeout(() => this.successMessage = '', 5000);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.detail || 'Failed to redeem points. Please try again.';
        }
      });
    }
  }
}
