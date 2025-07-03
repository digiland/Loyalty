import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Check if the user is logged in
  const token = localStorage.getItem('token');
  
  if (token) {
    return true;
  }
  
  // Redirect to login page if not authenticated
  router.navigate(['/login']);
  return false;
};
