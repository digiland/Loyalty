import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { BusinessService } from '../../../services/business.service';
import { LoyaltyProgramService } from '../../../services/loyalty-program.service';
import { ReportService, RevenueStats, CustomerInsights, LoyaltyPerformance, BusinessHealth } from '../../../services/report.service';
import { Business } from '../../../models/business.model';
import { LoyaltyProgram } from '../../../models/loyalty-program.model';
import { Chart, ChartConfiguration, ChartType } from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  business: Business | null = null;
  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  
  // Basic reporting
  totalPointsIssued: number | null = null;
  totalRedemptions: number | null = null;
  customerCount: number | null = null;
  topCustomers: { phone_number: string, points: number }[] = [];
  
  // Enhanced analytics
  revenueStats: RevenueStats | null = null;
  customerInsights: CustomerInsights | null = null;
  loyaltyPerformance: LoyaltyPerformance | null = null;
  businessHealth: BusinessHealth | null = null;
  
  // Chart references
  revenueChart: Chart | null = null;
  customerSegmentChart: Chart | null = null;
  loyaltyChart: Chart | null = null;
  
  // View state
  selectedTimeframe: string = '30d';
  isLoadingAnalytics: boolean = false;
  currentDate: Date = new Date();
  
  // Loyalty program filtering
  loyaltyPrograms: LoyaltyProgram[] = [];
  selectedLoyaltyProgramId: number | null = null;
  isLoadingPrograms: boolean = false;

  constructor(
    private authService: AuthService,
    private businessService: BusinessService,
    private loyaltyProgramService: LoyaltyProgramService,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    this.loadBusinessDetails();
  }

  loadBusinessDetails(): void {
    this.authService.getCurrentBusiness().subscribe({
      next: (business) => {
        this.business = business;
        // Load loyalty programs first, then analytics
        this.loadLoyaltyPrograms();
        this.loadBasicReports();
        this.loadEnhancedAnalytics();
      },
      error: (err) => {
        console.error('Failed to load business details', err);
      }
    });
  }

  loadLoyaltyPrograms(): void {
    if (!this.business) return;
    
    this.isLoadingPrograms = true;
    this.loyaltyProgramService.getBusinessLoyaltyPrograms(this.business.id).subscribe({
      next: (programs) => {
        this.loyaltyPrograms = programs;
        this.isLoadingPrograms = false;
      },
      error: (err) => {
        console.error('Failed to load loyalty programs', err);
        this.isLoadingPrograms = false;
      }
    });
  }

  onLoyaltyProgramChange(programId: number | null): void {
    this.selectedLoyaltyProgramId = programId;
    this.loadBasicReports();
    this.loadEnhancedAnalytics();
  }

  loadBasicReports(): void {
    if (!this.business) return;
    const id = this.business.id;
    const programId = this.selectedLoyaltyProgramId || undefined;
    
    this.reportService.getTotalPointsIssued(id, programId).subscribe(r => this.totalPointsIssued = r.total_points_issued);
    this.reportService.getTotalRedemptions(id, programId).subscribe(r => this.totalRedemptions = r.total_redemptions);
    this.reportService.getCustomerCount(id, programId).subscribe(r => this.customerCount = r.customer_count);
    this.reportService.getTopCustomers(id, 10, programId).subscribe(r => this.topCustomers = r);
  }

  loadEnhancedAnalytics(): void {
    if (!this.business) return;
    
    this.isLoadingAnalytics = true;
    const id = this.business.id;
    const programId = this.selectedLoyaltyProgramId || undefined;
    
    Promise.all([
      this.reportService.getRevenueStats(id, programId).toPromise(),
      this.reportService.getCustomerInsights(id, programId).toPromise(),
      this.reportService.getLoyaltyPerformance(id, programId).toPromise(),
      this.reportService.getBusinessHealth(id, programId).toPromise()
    ]).then(([revenue, customer, loyalty, health]) => {
      this.revenueStats = revenue!;
      this.customerInsights = customer!;
      this.loyaltyPerformance = loyalty!;
      this.businessHealth = health!;
      
      // Create charts after data is loaded
      setTimeout(() => {
        this.createCharts();
      }, 100);
      
      this.isLoadingAnalytics = false;
    }).catch(err => {
      console.error('Failed to load analytics', err);
      this.isLoadingAnalytics = false;
    });
  }

  createCharts(): void {
    this.createRevenueChart();
    this.createCustomerSegmentChart();
    this.createLoyaltyChart();
  }

  createRevenueChart(): void {
    if (!this.revenueStats || !this.revenueStats.monthly_revenue.length) return;
    
    const ctx = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    if (this.revenueChart) {
      this.revenueChart.destroy();
    }

    this.revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.revenueStats.monthly_revenue.map(r => r.month),
        datasets: [{
          label: 'Monthly Revenue',
          data: this.revenueStats.monthly_revenue.map(r => r.revenue),
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Revenue Trend'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createCustomerSegmentChart(): void {
    if (!this.customerInsights) return;
    
    const ctx = document.getElementById('customerSegmentChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    if (this.customerSegmentChart) {
      this.customerSegmentChart.destroy();
    }

    this.customerSegmentChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['New Customers', 'Repeat Customers', 'High Value Customers'],
        datasets: [{
          data: [
            this.customerInsights.new_customers_this_month,
            this.customerInsights.repeat_customers,
            this.customerInsights.high_value_customers
          ],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(99, 102, 241, 0.8)',
            'rgba(245, 158, 11, 0.8)'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Customer Segments'
          }
        }
      }
    });
  }

  createLoyaltyChart(): void {
    if (!this.loyaltyPerformance) return;
    
    const ctx = document.getElementById('loyaltyChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    if (this.loyaltyChart) {
      this.loyaltyChart.destroy();
    }

    this.loyaltyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Points Issued', 'Points Redeemed', 'Outstanding Points'],
        datasets: [{
          label: 'Points',
          data: [
            this.loyaltyPerformance.total_points_issued,
            this.loyaltyPerformance.total_points_redeemed,
            this.loyaltyPerformance.outstanding_points
          ],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(99, 102, 241, 0.8)'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Loyalty Program Performance'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  refreshAnalytics(): void {
    this.currentDate = new Date();
    this.loadBasicReports();
    this.loadEnhancedAnalytics();
  }

  getGrowthTrendClass(): string {
    if (!this.businessHealth) return '';
    return this.businessHealth.growth_rate >= 0 ? 'text-green-600' : 'text-red-600';
  }

  getGrowthTrendIcon(): string {
    if (!this.businessHealth) return '';
    return this.businessHealth.growth_rate >= 0 ? '↗' : '↘';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  ngOnDestroy(): void {
    if (this.revenueChart) this.revenueChart.destroy();
    if (this.customerSegmentChart) this.customerSegmentChart.destroy();
    if (this.loyaltyChart) this.loyaltyChart.destroy();
  }
}
