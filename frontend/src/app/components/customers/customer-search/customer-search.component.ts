import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from '../../../services/customer.service';
import { AuthService } from '../../../services/auth.service';
import { CustomerPointsResponse, CustomerSummary } from '../../../models/customer.model';
import { Business } from '../../../models/business.model';

@Component({
  selector: 'app-customer-search',
  templateUrl: './customer-search.component.html',
  styleUrls: ['./customer-search.component.css']
})
export class CustomerSearchComponent implements OnInit {
  searchForm: FormGroup;
  customerPoints: CustomerPointsResponse | null = null;
  allCustomers: CustomerSummary[] = [];
  filteredCustomers: CustomerSummary[] = [];
  recommendations: string[] = [];
  isLoading: boolean = false;
  isLoadingCustomers: boolean = false;
  errorMessage: string = '';
  business: Business | null = null;
  searchTerm: string = '';

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private authService: AuthService
  ) {
    this.searchForm = this.fb.group({
      phone_number: ['', [Validators.required, Validators.pattern(/^\+?\d{9,15}$/)]]
    });
  }

  ngOnInit(): void {
    this.loadBusinessAndCustomers();
  }

  loadBusinessAndCustomers(): void {
    this.authService.getCurrentBusiness().subscribe({
      next: (business) => {
        this.business = business;
        this.loadAllCustomers();
      },
      error: (err) => {
        console.error('Failed to load business details', err);
      }
    });
  }

  loadAllCustomers(): void {
    if (!this.business) return;
    
    this.isLoadingCustomers = true;
    this.customerService.getAllCustomers(this.business.id).subscribe({
      next: (customers) => {
        this.allCustomers = customers;
        this.filteredCustomers = customers;
        this.isLoadingCustomers = false;
      },
      error: (err) => {
        console.error('Failed to load customers', err);
        this.isLoadingCustomers = false;
      }
    });
  }

  onSearchCustomers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCustomers = this.allCustomers;
      return;
    }
    
    this.filteredCustomers = this.allCustomers.filter(customer =>
      customer.phone_number.includes(this.searchTerm.trim())
    );
  }

  selectCustomer(customer: CustomerSummary): void {
    this.searchForm.patchValue({
      phone_number: customer.phone_number
    });
    this.onSubmit();
  }

  onSubmit(): void {
    if (this.searchForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.customerPoints = null;
      this.recommendations = [];
      
      const phoneNumber = this.searchForm.value.phone_number;
      
      this.customerService.getCustomerPoints(phoneNumber).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.customerPoints = response;
          
          // Fetch recommendations after points
          this.customerService.getCustomerRecommendations(phoneNumber).subscribe({
            next: (rec) => this.recommendations = rec.recommendations,
            error: () => this.recommendations = []
          });
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.detail || 'Customer not found or has no points.';
        }
      });
    }
  }
}
