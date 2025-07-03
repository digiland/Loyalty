import { Component, OnInit } from '@angular/core';
import { ReferralService } from '../../services/referral.service';
import { AuthService } from '../../services/auth.service';

interface Referral {
  referral_id: number;
  status: string;
  referrer_phone?: string;
  referred_phone: string;
  business_id: number;
}

@Component({
  selector: 'app-referrals-page',
  templateUrl: './referrals-page.component.html',
  styleUrls: ['./referrals-page.component.css']
})
export class ReferralsPageComponent implements OnInit {
  referrals: Referral[] = [];
  isLoading = false;
  error = '';
  businessId: number | null = null;

  constructor(
    private referralService: ReferralService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentBusiness().subscribe(b => {
      this.businessId = b.id;
      this.fetchAllReferrals();
    });
  }

  fetchAllReferrals() {
    if (!this.businessId) return;
    this.isLoading = true;
    this.error = '';
    this.referralService.getAllReferrals(this.businessId).subscribe({
      next: (data) => {
        this.isLoading = false;
        this.referrals = data;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.detail || 'Failed to load referrals.';
      }
    });
  }

  onCompleteReferral(referral: Referral) {
    const points = prompt('Enter points to award to referrer:', '10');
    if (!points || isNaN(+points)) return;
    this.isLoading = true;
    this.referralService.completeReferral(referral.referral_id, +points).subscribe({
      next: () => {
        this.isLoading = false;
        referral.status = 'completed';
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.detail || 'Failed to complete referral.';
      }
    });
  }
}
