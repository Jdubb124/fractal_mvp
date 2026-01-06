import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
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

@Injectable({
  providedIn: 'root'
})
export class BrandGuideService {
  private brandGuideSignal = signal<BrandGuide | null>(null);
  private loadingSignal = signal<boolean>(false);
  
  brandGuide = this.brandGuideSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();

  constructor(private http: HttpClient) {}

  loadBrandGuide(): Observable<BrandGuide | null> {
    this.loadingSignal.set(true);
    return this.http.get<BrandGuide>(`${environment.apiUrl}/brand`)
      .pipe(
        tap(guide => {
          this.brandGuideSignal.set(guide);
          this.loadingSignal.set(false);
        }),
        catchError(error => {
          this.loadingSignal.set(false);
          if (error.status === 404) {
            this.brandGuideSignal.set(null);
            return of(null);
          }
          throw error;
        })
      );
  }

  createBrandGuide(guide: Partial<BrandGuide>): Observable<BrandGuide> {
    return this.http.post<BrandGuide>(`${environment.apiUrl}/brand`, guide)
      .pipe(
        tap(newGuide => {
          this.brandGuideSignal.set(newGuide);
        })
      );
  }

  updateBrandGuide(id: string, guide: Partial<BrandGuide>): Observable<BrandGuide> {
    return this.http.put<BrandGuide>(`${environment.apiUrl}/brand/${id}`, guide)
      .pipe(
        tap(updated => {
          this.brandGuideSignal.set(updated);
        })
      );
  }
}