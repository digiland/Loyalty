import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { BusinessCreate } from '../../../models/business.model';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      contact_person: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', [Validators.required]],
      loyalty_rate: [1.0, [Validators.required, Validators.min(0.1)]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(group: FormGroup): {[key: string]: any} | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirm_password')?.value;
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const businessData: BusinessCreate = {
        name: this.registerForm.value.name,
        email: this.registerForm.value.email,
        contact_person: this.registerForm.value.contact_person || undefined,
        password: this.registerForm.value.password,
        loyalty_rate: this.registerForm.value.loyalty_rate
      };
      
      this.authService.register(businessData).subscribe({
        next: () => {
          // Redirect to login page after successful registration
          this.router.navigate(['/login'], { 
            queryParams: { registered: 'success' } 
          });
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.detail || 'Registration failed. Please try again.';
        }
      });
    }
  }
}
