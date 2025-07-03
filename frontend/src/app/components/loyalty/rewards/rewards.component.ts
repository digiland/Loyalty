import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoyaltyProgramService } from '../../../services/loyalty-program.service';
import { Reward, RewardCreate, LoyaltyProgram } from '../../../models/loyalty-program.model';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-rewards',
  templateUrl: './rewards.component.html',
  styleUrls: ['./rewards.component.css']
})
export class RewardsComponent implements OnInit {
  @Input() loyaltyProgram!: LoyaltyProgram;
  
  rewards: Reward[] = [];
  rewardForm: FormGroup;
  loading = false;
  error = '';
  isCreating = false;

  constructor(
    private fb: FormBuilder,
    private loyaltyProgramService: LoyaltyProgramService,
    private toastService: ToastService
  ) {
    this.rewardForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      points_required: [100, [Validators.required, Validators.min(1)]],
      is_active: [true],
      stock_limit: [null, [Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadRewards();
  }

  loadRewards(): void {
    if (!this.loyaltyProgram?.id) return;
    
    this.loading = true;
    this.loyaltyProgramService.getProgramRewards(this.loyaltyProgram.id)
      .subscribe({
        next: (rewards) => {
          this.rewards = rewards;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error loading rewards: ' + err.message;
          this.loading = false;
        }
      });
  }

  toggleCreateForm(): void {
    this.isCreating = !this.isCreating;
    if (!this.isCreating) {
      this.rewardForm.reset({
        name: '',
        description: '',
        points_required: 100,
        is_active: true,
        stock_limit: null
      });
    }
  }

  createReward(): void {
    if (this.rewardForm.invalid || !this.loyaltyProgram?.id) return;

    const rewardData: RewardCreate = {
      loyalty_program_id: this.loyaltyProgram.id,
      ...this.rewardForm.value
    };

    this.loyaltyProgramService.createReward(rewardData)
      .subscribe({
        next: (reward) => {
          this.rewards.push(reward);
          this.toggleCreateForm();
          this.toastService.show('Reward created successfully', 'success');
        },
        error: (err) => {
          this.error = 'Error creating reward: ' + err.message;
          this.toastService.show('Error creating reward', 'error');
        }
      });
  }
}
