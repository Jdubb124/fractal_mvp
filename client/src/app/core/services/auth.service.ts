import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';

export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  company?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  // Signals for reactive state
  private currentUserSignal = signal<User | null>(null);
  private tokenSignal = signal<string | null>(null);
  private loadingSignal = signal<boolean>(false);

  // Public computed values
  currentUser = computed(() => this.currentUserSignal());
  isAuthenticated = computed(() => !!this.tokenSignal());
  isLoading = computed(() => this.loadingSignal());

  private readonly TOKEN_KEY = 'fractal_token';
  private readonly USER_KEY = 'fractal_user';

  constructor() {
    this.loadStoredAuth();
  }

  // Load auth from localStorage on init
  private loadStoredAuth(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userJson = localStorage.getItem(this.USER_KEY);

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        this.tokenSignal.set(token);
        this.currentUserSignal.set(user);
      } catch {
        this.clearAuth();
      }
    }
  }

  // Get token for interceptor
  getToken(): string | null {
    return this.tokenSignal();
  }

  // Register new user
  register(data: RegisterRequest): Observable<AuthResponse> {
    this.loadingSignal.set(true);
    return this.api.post<AuthResponse>('/auth/register', data).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  // Login user
  login(data: LoginRequest): Observable<AuthResponse> {
    this.loadingSignal.set(true);
    return this.api.post<AuthResponse>('/auth/login', data).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  // Logout user
  logout(): void {
    this.api.post('/auth/logout', {}).subscribe({
      complete: () => {
        this.clearAuth();
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        // Clear auth even if API call fails
        this.clearAuth();
        this.router.navigate(['/auth/login']);
      },
    });
  }

  // Get current user from API
  fetchCurrentUser(): Observable<{ success: boolean; data: { user: User } }> {
    return this.api.get<{ success: boolean; data: { user: User } }>('/auth/me').pipe(
      tap(response => {
        this.currentUserSignal.set(response.data.user);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.data.user));
      })
    );
  }

  // Update user profile
  updateProfile(data: { name?: string; company?: string }): Observable<AuthResponse> {
    return this.api.put<AuthResponse>('/auth/me', data).pipe(
      tap(response => {
        this.currentUserSignal.set(response.data.user);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.data.user));
      })
    );
  }

  // Handle successful auth
  private handleAuthSuccess(response: AuthResponse): void {
    const { user, token } = response.data;
    this.tokenSignal.set(token);
    this.currentUserSignal.set(user);
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // Clear auth data
  private clearAuth(): void {
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}