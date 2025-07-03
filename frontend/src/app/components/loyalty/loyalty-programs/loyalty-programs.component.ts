import { Component, OnInit } from '@angular/core';
import { LoyaltyProgramService } from '../../../services/loyalty-program.service';
import { LoyaltyProgram, LoyaltyProgramType } from '../../../models/loyalty-program.model';
import { Router } from '@angular/router';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-loyalty-programs',
  templateUrl: './loyalty-programs.component.html',
  styleUrls: ['./loyalty-programs.component.css']
})
export class LoyaltyProgramsComponent implements OnInit {
  loyaltyPrograms: LoyaltyProgram[] = [];
  loading = false;
  error = '';
  businessId: number = 0;

  // Enum for display purposes
  programTypes = LoyaltyProgramType;

  constructor(
    private loyaltyProgramService: LoyaltyProgramService,
    private router: Router,
    public toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadBusinessId();
    this.loadPrograms();
  }

  loadBusinessId(): void {
    const currentBusiness = this.authService.currentBusinessValue;
    if (currentBusiness && currentBusiness.id) {
      this.businessId = currentBusiness.id;
    } else {
      // Try to load current business from API
      this.authService.getCurrentBusiness().subscribe({
        next: (business) => {
          this.businessId = business.id;
        },
        error: (error) => {
          console.error('Error loading business data:', error);
          this.error = 'User session invalid. Please log in again.';
        }
      });
    }
  }

  loadPrograms(): void {
    if (!this.businessId) {
      this.error = 'Business ID not found. Please log in again.';
      return;
    }

    this.loading = true;
    this.loyaltyProgramService.getBusinessLoyaltyPrograms(this.businessId)
      .subscribe({
        next: (programs) => {
          this.loyaltyPrograms = programs;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error loading loyalty programs: ' + err.message;
          this.loading = false;
        }
      });
  }

  createNewProgram(type: LoyaltyProgramType): void {
    this.router.navigate(['/loyalty-programs/create'], { queryParams: { type } });
    this.toastService.show('Redirecting to create new program', 'info');
  }

  editProgram(program: LoyaltyProgram): void {
    this.router.navigate(['/loyalty-programs/edit', program.id]);
    this.toastService.show('Redirecting to edit program', 'info');
  }

  deleteProgram(program: LoyaltyProgram): void {
    if (confirm(`Are you sure you want to delete the ${program.name} program?`)) {
      this.loyaltyProgramService.deleteLoyaltyProgram(program.id)
        .subscribe({
          next: () => {
            this.loyaltyPrograms = this.loyaltyPrograms.filter(p => p.id !== program.id);
            this.toastService.show('Program deleted successfully', 'success');
          },
          error: (err) => {
            this.error = 'Error deleting program: ' + err.message;
            this.toastService.show('Error deleting program', 'error');
          }
        });
    }
  }

  toggleProgramStatus(program: LoyaltyProgram): void {
    const updatedProgram = { active: !program.active };
    this.loyaltyProgramService.updateLoyaltyProgram(program.id, updatedProgram)
      .subscribe({
        next: (updated) => {
          const index = this.loyaltyPrograms.findIndex(p => p.id === updated.id);
          if (index !== -1) {
            this.loyaltyPrograms[index] = updated;
            this.toastService.show(`Program ${updated.active ? 'activated' : 'deactivated'} successfully`, 'success');
          }
        },
        error: (err) => {
          this.error = 'Error updating program status: ' + err.message;
          this.toastService.show('Error updating program status', 'error');
        }
      });
  }

  // Helper methods for displaying program type and details
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

  getProgramSpecificDetails(program: LoyaltyProgram): string {
    switch (program.program_type) {
      case LoyaltyProgramType.POINTS:
        return `${program.earn_rate} points per dollar`;
      case LoyaltyProgramType.TIERED:
        return `${program.tier_levels?.length || 0} tiers, base rate: ${program.earn_rate} points per dollar`;
      case LoyaltyProgramType.PAID:
        return `$${program.membership_fee} for ${program.membership_period_days || 365} days`;
      case LoyaltyProgramType.REFERRAL:
        return `${program.earn_rate} points per referral`;
      case LoyaltyProgramType.CASHBACK:
        return `${program.earn_rate}% cashback`;
      default:
        return '';
    }
  }
}
