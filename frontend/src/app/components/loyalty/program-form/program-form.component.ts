import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  LoyaltyProgramType, 
  LoyaltyProgramCreate,
  LoyaltyProgram
} from '../../../models/loyalty-program.model';
import { LoyaltyProgramService } from '../../../services/loyalty-program.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-program-form',
  templateUrl: './program-form.component.html',
  styleUrls: ['./program-form.component.css']
})
export class ProgramFormComponent implements OnInit {
  programForm!: FormGroup;
  programType: LoyaltyProgramType = LoyaltyProgramType.POINTS;
  isEditMode = false;
  programId?: number;
  loading = false;
  error = '';
  businessId: number = 0;
  currentProgram?: LoyaltyProgram;

  // Enum for template
  programTypes = LoyaltyProgramType;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private loyaltyProgramService: LoyaltyProgramService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('Initializing Program Form Component');
    this.loadBusinessId();

    // Check if we're editing an existing program
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        console.log(`Editing existing program with ID: ${id}`);
        this.isEditMode = true;
        this.programId = +id;
        this.loadProgramData(this.programId);
      } else {
        // For new program, check if type is specified in query params
        this.route.queryParamMap.subscribe(queryParams => {
          const type = queryParams.get('type') as LoyaltyProgramType;
          console.log(`Creating new program, requested type: ${type}`);
          
          if (type && Object.values(LoyaltyProgramType).includes(type)) {
            this.programType = type;
            console.log(`Setting program type to: ${this.programType}`);
          } else {
            console.log(`Using default program type: ${this.programType}`);
          }
          
          this.initForm();
        });
      }
    });
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

  loadProgramData(programId: number): void {
    this.loading = true;
    this.loyaltyProgramService.getLoyaltyProgram(programId)
      .subscribe({
        next: (program) => {
          this.currentProgram = program;
          this.programType = program.program_type;
          this.initForm();
          this.patchFormWithProgramData(program);
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error loading program data: ' + err.message;
          this.loading = false;
        }
      });
  }

  initForm(): void {
    // Define base form controls for all program types
    const formControls: {[key: string]: any} = {
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      earn_rate: [1.0, [Validators.required, Validators.min(0.01)]],
      active: [true]
    };

    // Add program-specific fields
    if (this.programType === LoyaltyProgramType.TIERED) {
      formControls['tier_levels'] = this.fb.array([this.createTierFormGroup()]);
    } 
    else if (this.programType === LoyaltyProgramType.PAID) {
      formControls['membership_fee'] = ['', [Validators.required, Validators.min(0.01)]];
      formControls['membership_period_days'] = [365, [Validators.required, Validators.min(1)]];
      formControls['membership_benefits'] = ['', [Validators.required, Validators.maxLength(1000)]];
    }
    else if (this.programType === LoyaltyProgramType.REFERRAL) {
      // Add any referral-specific fields if needed
    }
    else if (this.programType === LoyaltyProgramType.CASHBACK) {
      // For cashback, earn_rate is already included in base controls
    }

    // Create the form with all needed controls
    this.programForm = this.fb.group(formControls);
  }

  patchFormWithProgramData(program: LoyaltyProgram): void {
    // Patch base fields
    this.programForm.patchValue({
      name: program.name,
      description: program.description,
      earn_rate: program.earn_rate,
      active: program.active !== undefined ? program.active : true
    });

    // Patch program-specific fields based on program type
    if (program.program_type === LoyaltyProgramType.TIERED) {
      if (program.tier_levels && program.tier_levels.length > 0) {
        // Clear the default tier level
        const tierLevelsArray = this.programForm.get('tier_levels') as FormArray;
        if (tierLevelsArray) {
          tierLevelsArray.clear();
          
          // Add each tier level from the program
          program.tier_levels.forEach(tier => {
            tierLevelsArray.push(this.fb.group({
              name: [tier.name, Validators.required],
              min_points: [tier.min_points, [Validators.required, Validators.min(0)]],
              benefits: [tier.benefits, Validators.required],
              multiplier: [tier.multiplier, [Validators.required, Validators.min(1)]]
            }));
          });
        }
      }
    } else if (program.program_type === LoyaltyProgramType.PAID) {
      this.programForm.patchValue({
        membership_fee: program.membership_fee,
        membership_period_days: program.membership_period_days || 365,
        membership_benefits: program.membership_benefits
      });
    }
    // Add cases for other program types if they have specific fields
  }

  // Helper for creating tier form groups
  createTierFormGroup() {
    return this.fb.group({
      name: ['', Validators.required],
      min_points: [0, [Validators.required, Validators.min(0)]],
      benefits: ['', Validators.required],
      multiplier: [1.0, [Validators.required, Validators.min(1)]]
    });
  }

  // Getter for easy access to tier levels FormArray
  get tierLevels() {
    const tierLevels = this.programForm.get('tier_levels');
    if (!tierLevels) {
      // If tier_levels doesn't exist in the form, create it
      const tierLevelsArray = this.fb.array([this.createTierFormGroup()]);
      this.programForm.addControl('tier_levels', tierLevelsArray);
      return tierLevelsArray;
    }
    return tierLevels as FormArray;
  }

  addTierLevel() {
    this.tierLevels.push(this.createTierFormGroup());
  }

  removeTierLevel(index: number) {
    this.tierLevels.removeAt(index);
  }

  onSubmit() {
    if (this.programForm.invalid) {
      this.markFormGroupTouched(this.programForm);
      return;
    }

    this.loading = true;
    const formData = this.programForm.value;
    console.log('Form data:', formData);

    // Create the base program data shared by all program types
    let programData: any = {
      name: formData.name,
      program_type: this.programType,
      description: formData.description,
      earn_rate: formData.earn_rate,
      active: formData.active !== undefined ? formData.active : true
    };

    // Add program-specific properties based on program type
    switch (this.programType) {
      case LoyaltyProgramType.TIERED:
        if (formData.tier_levels && formData.tier_levels.length > 0) {
          programData.tier_levels = formData.tier_levels;
        } else {
          this.error = 'At least one tier level is required';
          this.loading = false;
          return;
        }
        break;
        
      case LoyaltyProgramType.PAID:
        programData.membership_fee = formData.membership_fee;
        programData.membership_period_days = formData.membership_period_days;
        programData.membership_benefits = formData.membership_benefits;
        break;
        
      case LoyaltyProgramType.REFERRAL:
        // Add any referral-specific properties if needed
        break;
        
      case LoyaltyProgramType.CASHBACK:
        // For cashback, the earn rate represents the cashback percentage
        break;
        
      case LoyaltyProgramType.POINTS:
        // Points is the default program type, no additional properties needed
        break;
        
      default:
        this.error = 'Unknown program type';
        this.loading = false;
        return;
    }

    console.log('Prepared program data:', programData);

    if (this.isEditMode && this.programId) {
      // Update existing program
      this.loyaltyProgramService.updateLoyaltyProgram(this.programId, programData)
        .subscribe({
          next: (response) => {
            console.log('Program updated successfully:', response);
            this.router.navigate(['/loyalty-programs']);
          },
          error: (err) => {
            console.error('Error updating program:', err);
            this.error = 'Error updating program: ' + (err.message || err.error || 'Unknown error');
            this.loading = false;
          }
        });
    } else {
      // Create new program
      const createData: LoyaltyProgramCreate = {
        program_data: programData,
        business_id: this.businessId
      };

      this.loyaltyProgramService.createLoyaltyProgram(createData)
        .subscribe({
          next: (response) => {
            console.log('Program created successfully:', response);
            this.router.navigate(['/loyalty-programs']);
          },
          error: (err) => {
            console.error('Error creating program:', err);
            this.error = 'Error creating program: ' + (err.message || err.error || 'Unknown error');
            this.loading = false;
          }
        });
    }
  }

  // Helper to validate all form fields
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }

      if (control instanceof FormArray) {
        for (const controlItem of control.controls) {
          if (controlItem instanceof FormGroup) {
            this.markFormGroupTouched(controlItem);
          }
        }
      }
    });
  }

  // Helper for displaying form control errors
  hasError(controlName: string, errorName: string, formArrayName?: string, index?: number) {
    if (!this.programForm) return false;
    let control;
    
    if (formArrayName && index !== undefined) {
      const formArray = this.programForm.get(formArrayName) as FormArray;
      if (formArray && formArray.controls[index]) {
        control = (formArray.controls[index] as FormGroup).get(controlName);
      }
    } else {
      control = this.programForm.get(controlName);
    }
    
    return control && control.touched && control.hasError(errorName);
  }

  getFormControlClass(controlName: string, formArrayName?: string, index?: number) {
    if (!this.programForm) return '';
    let control;
    
    if (formArrayName && index !== undefined) {
      const formArray = this.programForm.get(formArrayName) as FormArray;
      if (formArray && formArray.controls[index]) {
        control = (formArray.controls[index] as FormGroup).get(controlName);
      }
    } else {
      control = this.programForm.get(controlName);
    }
    
    if (!control || !control.touched) return '';
    return control.invalid ? 'border-red-500' : 'border-green-500';
  }

  getTypeLabel(type: LoyaltyProgramType): string {
    const labels = {
      [LoyaltyProgramType.POINTS]: 'Points Program',
      [LoyaltyProgramType.TIERED]: 'Tiered Program',
      [LoyaltyProgramType.PAID]: 'Paid Membership Program',
      [LoyaltyProgramType.REFERRAL]: 'Referral Program',
      [LoyaltyProgramType.CASHBACK]: 'Cashback Program'
    };
    return labels[type] || type;
  }

  getTypeDescription(type: LoyaltyProgramType): string {
    const descriptions = {
      [LoyaltyProgramType.POINTS]: 'Reward customers with points for every purchase they make.',
      [LoyaltyProgramType.TIERED]: 'Create different tiers with increasing benefits based on customer points.',
      [LoyaltyProgramType.PAID]: 'Offer premium benefits for customers who pay a membership fee.',
      [LoyaltyProgramType.REFERRAL]: 'Reward customers who refer others to your business.',
      [LoyaltyProgramType.CASHBACK]: 'Give customers cash back on their purchases.'
    };
    return descriptions[type] || '';
  }
}
