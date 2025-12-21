import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface Demographics {
  ageRange?: {
    min?: number;
    max?: number;
  };
  income?: string;
  location: string[];
  other?: string;
}

export interface Audience {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  demographics: Demographics;
  propensityLevel: 'High' | 'Medium' | 'Low';
  interests: string[];
  painPoints: string[];
  preferredTone?: string;
  keyMotivators: string[];
  estimatedSize?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AudiencesResponse {
  success: boolean;
  count: number;
  data: {
    audiences: Audience[];
  };
}

export interface AudienceResponse {
  success: boolean;
  data: {
    audience: Audience;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AudienceService {
  private api = inject(ApiService);

  // Signals for reactive state
  private audiencesSignal = signal<Audience[]>([]);
  private selectedAudienceSignal = signal<Audience | null>(null);
  private loadingSignal = signal<boolean>(false);

  // Public computed values
  audiences = computed(() => this.audiencesSignal());
  activeAudiences = computed(() => this.audiencesSignal().filter(a => a.isActive));
  selectedAudience = computed(() => this.selectedAudienceSignal());
  isLoading = computed(() => this.loadingSignal());
  audienceCount = computed(() => this.audiencesSignal().length);

  // Get all audiences
  getAudiences(active?: boolean): Observable<AudiencesResponse> {
    this.loadingSignal.set(true);
    const params = active !== undefined ? { active: active.toString() } : {};
    return this.api.get<AudiencesResponse>('/audiences', params).pipe(
      tap(response => {
        this.audiencesSignal.set(response.data.audiences);
        this.loadingSignal.set(false);
      })
    );
  }

  // Get single audience
  getAudience(id: string): Observable<AudienceResponse> {
    this.loadingSignal.set(true);
    return this.api.get<AudienceResponse>(`/audiences/${id}`).pipe(
      tap(response => {
        this.selectedAudienceSignal.set(response.data.audience);
        this.loadingSignal.set(false);
      })
    );
  }

  // Create audience
  createAudience(data: Partial<Audience>): Observable<AudienceResponse> {
    this.loadingSignal.set(true);
    return this.api.post<AudienceResponse>('/audiences', data).pipe(
      tap(response => {
        this.audiencesSignal.update(audiences => [...audiences, response.data.audience]);
        this.loadingSignal.set(false);
      })
    );
  }

  // Update audience
  updateAudience(id: string, data: Partial<Audience>): Observable<AudienceResponse> {
    this.loadingSignal.set(true);
    return this.api.put<AudienceResponse>(`/audiences/${id}`, data).pipe(
      tap(response => {
        this.audiencesSignal.update(audiences =>
          audiences.map(a => (a._id === id ? response.data.audience : a))
        );
        if (this.selectedAudienceSignal()?._id === id) {
          this.selectedAudienceSignal.set(response.data.audience);
        }
        this.loadingSignal.set(false);
      })
    );
  }

  // Delete audience
  deleteAudience(id: string): Observable<{ success: boolean }> {
    return this.api.delete<{ success: boolean }>(`/audiences/${id}`).pipe(
      tap(() => {
        this.audiencesSignal.update(audiences => audiences.filter(a => a._id !== id));
        if (this.selectedAudienceSignal()?._id === id) {
          this.selectedAudienceSignal.set(null);
        }
      })
    );
  }

  // Toggle audience active status
  toggleAudienceStatus(id: string): Observable<AudienceResponse> {
    return this.api.patch<AudienceResponse>(`/audiences/${id}/toggle`).pipe(
      tap(response => {
        this.audiencesSignal.update(audiences =>
          audiences.map(a => (a._id === id ? response.data.audience : a))
        );
      })
    );
  }

  // Select an audience
  selectAudience(audience: Audience | null): void {
    this.selectedAudienceSignal.set(audience);
  }

  // Clear cache
  clearCache(): void {
    this.audiencesSignal.set([]);
    this.selectedAudienceSignal.set(null);
  }
}