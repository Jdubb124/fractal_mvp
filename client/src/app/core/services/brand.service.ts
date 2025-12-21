import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface BrandGuide {
  _id: string;
  userId: string;
  companyName: string;
  industry?: string;
  voiceAttributes: string[];
  toneGuidelines?: string;
  valueProposition?: string;
  keyMessages: string[];
  avoidPhrases: string[];
  primaryColors: string[];
  logoUrl?: string;
  targetAudience?: string;
  competitorContext?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandGuideResponse {
  success: boolean;
  data: {
    brandGuide: BrandGuide | null;
    exists: boolean;
  };
}

@Injectable({
  providedIn: 'root',
})
export class BrandService {
  private api = inject(ApiService);

  // Signals for reactive state
  private brandGuideSignal = signal<BrandGuide | null>(null);
  private loadingSignal = signal<boolean>(false);
  private loadedSignal = signal<boolean>(false);

  // Public computed values
  brandGuide = computed(() => this.brandGuideSignal());
  isLoading = computed(() => this.loadingSignal());
  hasBrandGuide = computed(() => !!this.brandGuideSignal());
  isLoaded = computed(() => this.loadedSignal());

  // Get brand guide
  getBrandGuide(): Observable<BrandGuideResponse> {
    this.loadingSignal.set(true);
    return this.api.get<BrandGuideResponse>('/brand').pipe(
      tap(response => {
        this.brandGuideSignal.set(response.data.brandGuide);
        this.loadingSignal.set(false);
        this.loadedSignal.set(true);
      })
    );
  }

  // Create brand guide
  createBrandGuide(data: Partial<BrandGuide>): Observable<{ success: boolean; data: { brandGuide: BrandGuide } }> {
    this.loadingSignal.set(true);
    return this.api.post<{ success: boolean; data: { brandGuide: BrandGuide } }>('/brand', data).pipe(
      tap(response => {
        this.brandGuideSignal.set(response.data.brandGuide);
        this.loadingSignal.set(false);
      })
    );
  }

  // Update brand guide
  updateBrandGuide(id: string, data: Partial<BrandGuide>): Observable<{ success: boolean; data: { brandGuide: BrandGuide } }> {
    this.loadingSignal.set(true);
    return this.api.put<{ success: boolean; data: { brandGuide: BrandGuide } }>(`/brand/${id}`, data).pipe(
      tap(response => {
        this.brandGuideSignal.set(response.data.brandGuide);
        this.loadingSignal.set(false);
      })
    );
  }

  // Delete brand guide
  deleteBrandGuide(id: string): Observable<{ success: boolean }> {
    return this.api.delete<{ success: boolean }>(`/brand/${id}`).pipe(
      tap(() => {
        this.brandGuideSignal.set(null);
      })
    );
  }

  // Clear cached data
  clearCache(): void {
    this.brandGuideSignal.set(null);
    this.loadedSignal.set(false);
  }
}