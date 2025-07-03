import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { LoyaltyService } from '../../../services/loyalty.service';
import { LoyaltyProgramService } from '../../../services/loyalty-program.service';
import { CustomerService } from '../../../services/customer.service';
import { Business } from '../../../models/business.model';
import { RedemptionCreate } from '../../../models/transaction.model';
import { CustomerPointsResponse } from '../../../models/customer.model';
import { CustomerMembershipWithProgram, AvailableReward, LoyaltyProgramType } from '../../../models/loyalty-program.model';

@Component({
  selector: 'app-redeem-points',
  templateUrl: './redeem-points.component.html',
  styleUrls: ['./redeem-points.component.css']
})
export class RedeemPointsComponent implements OnInit {
  redeemForm: FormGroup;
  business: Business | null = null;
  customerPoints: CustomerPointsResponse | null = null;
  customerMemberships: CustomerMembershipWithProgram[] = [];
  availableRewards: AvailableReward[] = [];
  isLoading: boolean = false;
  isLookingUp: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  lookupError: string = '';
  selectedReward: AvailableReward | null = null;
  showManualEntry: boolean = false;
  LoyaltyProgramType = LoyaltyProgramType; // Make enum available in template

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private loyaltyService: LoyaltyService,
    private loyaltyProgramService: LoyaltyProgramService,
    private customerService: CustomerService
  ) {
    this.redeemForm = this.fb.group({
      customer_phone_number: ['', [Validators.required, Validators.pattern(/^\+?\d{9,15}$/)]],
      points_to_redeem: [0, [Validators.required, Validators.min(1)]],
      reward_description: ['', [Validators.required, Validators.minLength(3)]],
      loyalty_program_id: [null]
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
      this.customerMemberships = [];
      this.availableRewards = [];
      
      // Load customer points and memberships
      Promise.all([
        this.customerService.getCustomerPoints(phoneNumber).toPromise(),
        this.loyaltyProgramService.getCustomerMembershipsForBusiness(phoneNumber).toPromise(),
        this.loyaltyProgramService.getCustomerAvailableRewards(phoneNumber).toPromise()
      ]).then(([points, memberships, rewards]) => {
        this.isLookingUp = false;
        
        if (points) {
          this.customerPoints = points;
          this.customerMemberships = memberships || [];
          this.availableRewards = rewards || [];
          
          // Set max points to redeem based on total points
          const control = this.redeemForm.get('points_to_redeem');
          if (control) {
            control.setValidators([
              Validators.required,
              Validators.min(1),
              Validators.max(points.total_points)
            ]);
            control.updateValueAndValidity();
          }
        } else {
          this.lookupError = 'Customer not found or has no points.';
        }
      }).catch(err => {
        this.isLookingUp = false;
        this.lookupError = err.error?.detail || 'Customer not found or has no points.';
      });
    } else {
      this.lookupError = 'Please enter a valid phone number.';
    }
  }

  onSubmit(): void {
    if (this.redeemForm.valid && this.business && this.customerPoints && this.validatePointsForProgram()) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const redemption: RedemptionCreate = {
        business_id: this.business.id,
        customer_phone_number: this.redeemForm.value.customer_phone_number,
        points_to_redeem: this.redeemForm.value.points_to_redeem,
        reward_description: this.redeemForm.value.reward_description,
        loyalty_program_id: this.redeemForm.value.loyalty_program_id || undefined
      };

      // Use the appropriate service method based on whether a loyalty program is selected
      const redeemService = redemption.loyalty_program_id 
        ? this.loyaltyProgramService.redeemReward(redemption)
        : this.loyaltyService.redeemPoints(redemption);

      redeemService.subscribe({
        next: (result) => {
          this.isLoading = false;
          this.successMessage = `Success! ${redemption.points_to_redeem} points redeemed for "${redemption.reward_description}" for customer ${redemption.customer_phone_number}.`;
          this.resetForm();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.detail || 'Failed to redeem points. Please try again.';
        }
      });
    } else if (!this.validatePointsForProgram()) {
      this.errorMessage = 'Insufficient points for this redemption.';
    }
  }

  resetForm(): void {
    this.redeemForm.reset({
      customer_phone_number: '',
      points_to_redeem: 0,
      reward_description: '',
      loyalty_program_id: null
    });
    this.customerPoints = null;
    this.customerMemberships = [];
    this.availableRewards = [];
    this.selectedReward = null;
    this.showManualEntry = false;
    setTimeout(() => this.successMessage = '', 5000);
  }

  selectReward(availableReward: AvailableReward): void {
    this.selectedReward = availableReward;
    this.showManualEntry = false;
    
    // Pre-fill the form with the reward information
    this.redeemForm.patchValue({
      points_to_redeem: availableReward.reward.points_required,
      reward_description: availableReward.reward.name,
      loyalty_program_id: availableReward.reward.loyalty_program_id
    });
  }

  clearRewardSelection(): void {
    this.selectedReward = null;
    this.showManualEntry = true;
    
    // Clear the form
    this.redeemForm.patchValue({
      points_to_redeem: 0,
      reward_description: '',
      loyalty_program_id: null
    });
  }

  canRedeemReward(availableReward: AvailableReward): boolean {
    return availableReward.customer_points >= availableReward.reward.points_required;
  }

  getAvailablePointsForProgram(loyaltyProgramId: number): number {
    const membership = this.customerMemberships.find(m => m.loyalty_program_id === loyaltyProgramId);
    return membership ? membership.points : 0;
  }

  getProgramName(loyaltyProgramId: number): string {
    const membership = this.customerMemberships.find(m => m.loyalty_program_id === loyaltyProgramId);
    return membership?.loyalty_program?.name || `Program ${loyaltyProgramId}`;
  }

  validatePointsForProgram(): boolean {
    const pointsToRedeem = this.redeemForm.value.points_to_redeem;
    const selectedProgramId = this.redeemForm.value.loyalty_program_id;
    
    if (!pointsToRedeem || pointsToRedeem <= 0) {
      return false;
    }
    
    if (selectedProgramId) {
      const availablePoints = this.getAvailablePointsForProgram(selectedProgramId);
      return pointsToRedeem <= availablePoints;
    } else {
      // Using legacy total points
      return this.customerPoints ? pointsToRedeem <= this.customerPoints.total_points : false;
    }
  }

  onLoyaltyProgramChange(): void {
    // Reset points and reward selection when program changes
    this.selectedReward = null;
    this.redeemForm.patchValue({
      points_to_redeem: 0,
      reward_description: ''
    });
    
    // Update points validation based on selected program
    const selectedProgramId = this.redeemForm.value.loyalty_program_id;
    const pointsControl = this.redeemForm.get('points_to_redeem');
    
    if (pointsControl && selectedProgramId) {
      const availablePoints = this.getAvailablePointsForProgram(selectedProgramId);
      pointsControl.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(availablePoints)
      ]);
    } else if (pointsControl && this.customerPoints) {
      pointsControl.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(this.customerPoints.total_points)
      ]);
    }
    
    if (pointsControl) {
      pointsControl.updateValueAndValidity();
    }
  }
}
