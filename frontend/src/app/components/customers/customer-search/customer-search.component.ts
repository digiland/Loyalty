import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from '../../../services/customer.service';
import { CustomerPointsResponse } from '../../../models/customer.model';

@Component({
  selector: 'app-customer-search',
  templateUrl: './customer-search.component.html',
  styleUrls: ['./customer-search.component.css']
})
export class CustomerSearchComponent {
  searchForm: FormGroup;
  customerPoints: CustomerPointsResponse | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService
  ) {
    this.searchForm = this.fb.group({
      phone_number: ['', [Validators.required, Validators.pattern(/^\+?\d{9,15}$/)]]
    });
  }

  onSubmit(): void {
    if (this.searchForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.customerPoints = null;
      
      const phoneNumber = this.searchForm.value.phone_number;
      
      this.customerService.getCustomerPoints(phoneNumber).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.customerPoints = response;
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.detail || 'Customer not found or has no points.';
        }
      });
    }
  }
}
