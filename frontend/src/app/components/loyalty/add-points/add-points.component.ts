import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { LoyaltyService } from '../../../services/loyalty.service';
import { Business } from '../../../models/business.model';
import { TransactionCreate } from '../../../models/transaction.model';
import { LoyaltyProgram, LoyaltyProgramType } from '../../../models/loyalty-program.model';

@Component({
  selector: 'app-add-points',
  templateUrl: './add-points.component.html',
  styleUrls: ['./add-points.component.css']
})
export class AddPointsComponent implements OnInit {
  addPointsForm: FormGroup;
  business: Business | null = null;
  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  pointsToBeEarned: number = 0;
  cashbackAmount: number = 0;
  
  // Loyalty programs
  loyaltyPrograms: LoyaltyProgram[] = [];
  selectedProgram: LoyaltyProgram | null = null;
  
  // Make enum available to template
  programTypes = LoyaltyProgramType;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private loyaltyService: LoyaltyService
  ) {
    this.addPointsForm = this.fb.group({
      customer_phone_number: ['', [Validators.required, Validators.pattern(/^\+?\d{9,15}$/)]],
      amount_spent: [0, [Validators.required, Validators.min(0.01)]],
      loyalty_program_id: [null]
    });

    // Calculate rewards whenever amount or program changes
    this.addPointsForm.get('amount_spent')?.valueChanges.subscribe(amount => {
      this.calculateRewards();
    });
    
    this.addPointsForm.get('loyalty_program_id')?.valueChanges.subscribe(programId => {
      this.selectedProgram = this.loyaltyPrograms.find(p => p.id === +programId) || null;
      this.calculateRewards();
    });
  }

  ngOnInit(): void {
    this.loadBusinessDetails();
  }

  loadBusinessDetails(): void {
    this.authService.getCurrentBusiness().subscribe({
      next: (business) => {
        this.business = business;
        this.loadLoyaltyPrograms();
      },
      error: (err) => {
        console.error('Failed to load business details', err);
      }
    });
  }
  
  loadLoyaltyPrograms(): void {
    if (!this.business?.id) return;
    
    this.loyaltyService.getActiveLoyaltyPrograms(this.business.id).subscribe({
      next: (programs) => {
        this.loyaltyPrograms = programs.filter(p => p.active);
        this.calculateRewards();
      },
      error: (err) => {
        console.error('Failed to load loyalty programs', err);
        this.calculateRewards(); // Fall back to legacy calculation
      }
    });
  }

  calculateRewards(): void {
    const amount = this.addPointsForm?.value.amount_spent || 0;
    
    // Reset values
    this.pointsToBeEarned = 0;
    this.cashbackAmount = 0;
    
    if (amount <= 0) return;
    
    // If a specific program is selected, calculate based on that program
    if (this.selectedProgram) {
      switch (this.selectedProgram.program_type) {
        case LoyaltyProgramType.POINTS:
        case LoyaltyProgramType.TIERED:
        case LoyaltyProgramType.PAID:
          this.pointsToBeEarned = Math.floor(amount * this.selectedProgram.earn_rate);
          break;
        case LoyaltyProgramType.CASHBACK:
          this.cashbackAmount = +(amount * this.selectedProgram.earn_rate / 100).toFixed(2);
          break;
        case LoyaltyProgramType.REFERRAL:
          // Referral programs don't apply to regular transactions
          break;
      }
    } 
    // Otherwise fall back to legacy calculation
    else if (this.business) {
      this.pointsToBeEarned = Math.floor(amount * this.business.loyalty_rate);
    }
  }

  getProgramTypeDisplay(type: LoyaltyProgramType): string {
    const displayNames = {
      [LoyaltyProgramType.POINTS]: 'Points',
      [LoyaltyProgramType.TIERED]: 'Tiered',
      [LoyaltyProgramType.PAID]: 'Paid Membership',
      [LoyaltyProgramType.REFERRAL]: 'Referral',
      [LoyaltyProgramType.CASHBACK]: 'Cashback'
    };
    return displayNames[type] || type;
  }

  onSubmit(): void {
    if (this.addPointsForm.valid && this.business) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const transaction: TransactionCreate = {
        business_id: this.business.id,
        customer_phone_number: this.addPointsForm.value.customer_phone_number,
        amount_spent: this.addPointsForm.value.amount_spent,
        loyalty_program_id: this.addPointsForm.value.loyalty_program_id || undefined
      };

      this.loyaltyService.addPointsWithProgram(transaction).subscribe({
        next: (result) => {
          this.isLoading = false;
          
          let successMsg = '';
          if (this.selectedProgram?.program_type === LoyaltyProgramType.CASHBACK) {
            successMsg = `Success! $${result.cashback_amount || 0} cashback awarded to customer ${transaction.customer_phone_number}.`;
          } else {
            successMsg = `Success! ${result.points_earned} points added for customer ${transaction.customer_phone_number}.`;
          }
          
          this.successMessage = successMsg;
          this.addPointsForm.reset({
            customer_phone_number: '',
            amount_spent: 0,
            loyalty_program_id: null
          });
          setTimeout(() => this.successMessage = '', 5000);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.detail || 'Failed to add points. Please try again.';
        }
      });
    }
  }
}
