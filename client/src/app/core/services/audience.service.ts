import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Audience {
  _id: string;
  name: string;
  description?: string;
  demographics?: {
    ageRange?: { min: number; max: number };
    income?: string;
    location: string[];
    other?: string;
  };
  propensityLevel: 'low' | 'medium' | 'high';
  interests: string[];
  painPoints: string[];
  preferredTone?: string;
  keyMotivators: string[];
  estimatedSize?: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AudiencesResponse {
  success: boolean;
  count: number;
  data: {
    audiences: Audience[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class AudienceService {
  private audiencesSignal = signal<Audience[]>([]);
  
  audiences = this.audiencesSignal.asReadonly();
  audienceCount = computed(() => this.audiencesSignal().length);

  constructor(private http: HttpClient) {}

  getAudiences(params?: { active?: boolean }): Observable<Audience[]> {
    const queryParams: any = {};
    if (params?.active !== undefined) {
      queryParams.active = params.active.toString();
    }

    return this.http.get<AudiencesResponse>(`${environment.apiUrl}/audiences`, { params: queryParams })
      .pipe(
        map(response => response.data.audiences),
        tap(audiences => {
          this.audiencesSignal.set(audiences);
        })
      );
  }

  getAudience(id: string): Observable<Audience> {
    return this.http.get<{ success: boolean; data: { audience: Audience } }>(`${environment.apiUrl}/audiences/${id}`)
      .pipe(
        map(response => response.data.audience)
      );
  }

  createAudience(audience: Partial<Audience>): Observable<Audience> {
    return this.http.post<{ success: boolean; data: { audience: Audience } }>(`${environment.apiUrl}/audiences`, audience)
      .pipe(
        map(response => response.data.audience),
        tap(newAudience => {
          this.audiencesSignal.update(audiences => [newAudience, ...audiences]);
        })
      );
  }

  updateAudience(id: string, audience: Partial<Audience>): Observable<Audience> {
    return this.http.put<{ success: boolean; data: { audience: Audience } }>(`${environment.apiUrl}/audiences/${id}`, audience)
      .pipe(
        map(response => response.data.audience),
        tap(updated => {
          this.audiencesSignal.update(audiences => 
            audiences.map(a => a._id === id ? updated : a)
          );
        })
      );
  }

  deleteAudience(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/audiences/${id}`)
      .pipe(
        tap(() => {
          this.audiencesSignal.update(audiences => 
            audiences.filter(a => a._id !== id)
          );
        })
      );
  }
}

