import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div class="max-w-md w-full">
        <!-- Logo -->
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Fractal
          </h1>
          <p class="text-gray-400 mt-2">AI-Powered Campaign Orchestration</p>
        </div>

        <!-- Login Card -->
        <div class="bg-gray-900 rounded-2xl border border-gray-800 p-8">
          <h2 class="text-2xl font-semibold text-white mb-6">Welcome back</h2>

          @if (errorMessage()) {
            <div class="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
              <p class="text-red-400 text-sm">{{ errorMessage() }}</p>
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <div class="space-y-5">
              <!-- Email -->
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  formControlName="email"
                  class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  placeholder="you@company.com"
                />
                @if (loginForm.get('email')?.touched && loginForm.get('email')?.errors?.['required']) {
                  <p class="text-red-400 text-sm mt-1">Email is required</p>
                }
                @if (loginForm.get('email')?.touched && loginForm.get('email')?.errors?.['email']) {
                  <p class="text-red-400 text-sm mt-1">Please enter a valid email</p>
                }
              </div>

              <!-- Password -->
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  formControlName="password"
                  class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  placeholder="••••••••"
                />
                @if (loginForm.get('password')?.touched && loginForm.get('password')?.errors?.['required']) {
                  <p class="text-red-400 text-sm mt-1">Password is required</p>
                }
              </div>

              <!-- Submit -->
              <button
                type="submit"
                [disabled]="loading() || loginForm.invalid"
                class="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
              >
                @if (loading()) {
                  <span class="flex items-center justify-center">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                } @else {
                  Sign in
                }
              </button>
            </div>
          </form>

          <!-- Register Link -->
          <p class="text-center text-gray-400 mt-6">
            Don't have an account?
            <a routerLink="/register" class="text-violet-400 hover:text-violet-300 font-medium ml-1">
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(error.error?.error || 'Login failed. Please try again.');
      }
    });
  }
}