import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  selector: 'app-referral-management',
  templateUrl: './referral-management.component.html',
  styleUrls: ['./referral-management.component.css']
})
export class ReferralManagementComponent implements OnInit {
  referralForm: FormGroup;
  referrals: Referral[] = [];
  isLoading = false;
  message = '';
  error = '';
  businessId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private referralService: ReferralService,
    private authService: AuthService
  ) {
    this.referralForm = this.fb.group({
      new_customer_phone: ['', [Validators.required, Validators.pattern(/^\+?\d{9,15}$/)]],
      referrer_phone: ['']
    });
  }

  ngOnInit(): void {
    this.authService.getCurrentBusiness().subscribe(b => {
      this.businessId = b.id;
      this.loadReferrals();
    });
  }

  loadReferrals() {
    // For MVP, you can fetch all referrals from a new endpoint or keep a local list after creation.
    // Here, we only show referrals created in this session.
  }

  onTrackReferral() {
    if (!this.businessId || this.referralForm.invalid) return;
    this.isLoading = true;
    this.message = '';
    this.error = '';
    const { new_customer_phone, referrer_phone } = this.referralForm.value;
    this.referralService.trackReferral(this.businessId, new_customer_phone, referrer_phone).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.message = 'Referral tracked!';
        this.referrals.push({
          referral_id: res.referral_id,
          status: res.status,
          referred_phone: new_customer_phone,
          referrer_phone: referrer_phone,
          business_id: this.businessId!
        });
        this.referralForm.reset();
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.detail || 'Failed to track referral.';
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
        this.message = 'Referral completed and points awarded!';
        referral.status = 'completed';
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.detail || 'Failed to complete referral.';
      }
    });
  }
}
