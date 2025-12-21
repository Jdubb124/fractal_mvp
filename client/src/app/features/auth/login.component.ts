import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-bg-dark flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-gradient-to-br from-accent-primary via-accent-secondary to-channel rounded-xl flex items-center justify-center mx-auto mb-4">
            <span class="text-white font-mono font-bold text-2xl">F</span>
          </div>
          <h1 class="text-2xl font-bold text-gradient">Welcome to Fractal</h1>
          <p class="text-text-secondary mt-2">Sign in to your account</p>
        </div>

        <!-- Login Form -->
        <div class="card">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            @if (error()) {
              <div class="mb-4 p-3 bg-error/10 border border-error/20 rounded-md text-error text-sm">
                {{ error() }}
              </div>
            }

            <div class="mb-4">
              <label class="form-label">Email</label>
              <input
                type="email"
                formControlName="email"
                class="form-input"
                placeholder="you@example.com"
                [class.border-error]="form.get('email')?.invalid && form.get('email')?.touched"
              />
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <p class="text-error text-xs mt-1">Please enter a valid email</p>
              }
            </div>

            <div class="mb-6">
              <label class="form-label">Password</label>
              <input
                type="password"
                formControlName="password"
                class="form-input"
                placeholder="••••••••"
                [class.border-error]="form.get('password')?.invalid && form.get('password')?.touched"
              />
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <p class="text-error text-xs mt-1">Password is required</p>
              }
            </div>

            <button
              type="submit"
              [disabled]="form.invalid || authService.isLoading()"
              class="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              @if (authService.isLoading()) {
                <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Signing in...
              } @else {
                Sign In
              }
            </button>
          </form>

          <p class="text-center text-text-secondary text-sm mt-6">
            Don't have an account?
            <a routerLink="/auth/register" class="text-accent-primary hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  authService = inject(AuthService);

  error = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  onSubmit(): void {
    if (this.form.invalid) return;

    this.error.set(null);

    this.authService.login(this.form.value).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.error.set(err.message || 'Login failed. Please try again.');
      },
    });
  }
}