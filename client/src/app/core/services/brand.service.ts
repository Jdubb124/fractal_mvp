import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BrandGuide {
  _id?: string;
  companyName: string;
  industry?: string;
  voiceAttributes: string[];
  toneGuidelines?: string;
  valueProposition?: string;
  keyMessages: string[];
  avoidPhrases?: string[];
  primaryColors?: string[];
  logoUrl?: string;
  targetAudience?: string;
  competitorContext?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BrandGuideResponse {
  success: boolean;
  data: {
    brandGuide: BrandGuide;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BrandService {
  private brandGuideSignal = signal<BrandGuide | null>(null);
  private loadedSignal = signal<boolean>(false);
  
  brandGuide = this.brandGuideSignal.asReadonly();
  hasBrandGuide = computed(() => this.brandGuideSignal() !== null);
  isLoaded = computed(() => this.loadedSignal());

  constructor(private http: HttpClient) {}

  getBrandGuide(): Observable<BrandGuide | null> {
    this.loadedSignal.set(true);
    return this.http.get<BrandGuideResponse | BrandGuide>(`${environment.apiUrl}/brand`)
      .pipe(
        map(response => {
          // Handle both response formats
          if ('data' in response && response.data) {
            return response.data.brandGuide || response.data;
          }
          return response as BrandGuide;
        }),
        tap(guide => {
          this.brandGuideSignal.set(guide);
          this.loadedSignal.set(true);
        }),
        catchError(error => {
          this.loadedSignal.set(true);
          if (error.status === 404) {
            this.brandGuideSignal.set(null);
            return of(null);
          }
          throw error;
        })
      );
  }

  createBrandGuide(guide: Partial<BrandGuide>): Observable<BrandGuide> {
    return this.http.post<BrandGuideResponse | BrandGuide>(`${environment.apiUrl}/brand`, guide)
      .pipe(
        map(response => {
          if ('data' in response && response.data) {
            return response.data.brandGuide || response.data;
          }
          return response as BrandGuide;
        }),
        tap(newGuide => {
          this.brandGuideSignal.set(newGuide);
        })
      );
  }

  updateBrandGuide(id: string, guide: Partial<BrandGuide>): Observable<BrandGuide> {
    return this.http.put<BrandGuideResponse | BrandGuide>(`${environment.apiUrl}/brand/${id}`, guide)
      .pipe(
        map(response => {
          if ('data' in response && response.data) {
            return response.data.brandGuide || response.data;
          }
          return response as BrandGuide;
        }),
        tap(updated => {
          this.brandGuideSignal.set(updated);
        })
      );
  }
}

