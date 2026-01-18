import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BrandGuide {
  _id?: string;
  name: string;
  colors: string[];
  tone?: string;
  coreMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BrandGuidesResponse {
  success: boolean;
  data: {
    brandGuides: BrandGuide[];
    count: number;
  };
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
  private brandGuidesSignal = signal<BrandGuide[]>([]);
  private selectedIdSignal = signal<string | null>(null);
  private loadedSignal = signal<boolean>(false);
  private loadingSignal = signal<boolean>(false);

  brandGuides = this.brandGuidesSignal.asReadonly();
  selectedBrandGuideId = this.selectedIdSignal.asReadonly();
  isLoaded = computed(() => this.loadedSignal());
  isLoading = computed(() => this.loadingSignal());
  brandGuideCount = computed(() => this.brandGuidesSignal().length);
  hasBrandGuide = computed(() => this.brandGuidesSignal().length > 0);

  selectedBrandGuide = computed(() => {
    const id = this.selectedIdSignal();
    const guides = this.brandGuidesSignal();
    return guides.find(g => g._id === id) || guides[0] || null;
  });

  constructor(private http: HttpClient) {}

  getBrandGuides(): Observable<BrandGuide[]> {
    this.loadingSignal.set(true);
    return this.http.get<BrandGuidesResponse>(`${environment.apiUrl}/brand`)
      .pipe(
        map(response => response.data.brandGuides),
        tap(guides => {
          this.brandGuidesSignal.set(guides);
          this.loadedSignal.set(true);
          this.loadingSignal.set(false);
        }),
        catchError(error => {
          this.loadedSignal.set(true);
          this.loadingSignal.set(false);
          if (error.status === 404) {
            this.brandGuidesSignal.set([]);
            return of([]);
          }
          throw error;
        })
      );
  }

  getBrandGuide(id: string): Observable<BrandGuide> {
    return this.http.get<BrandGuideResponse>(`${environment.apiUrl}/brand/${id}`)
      .pipe(
        map(response => response.data.brandGuide)
      );
  }

  createBrandGuide(guide: Partial<BrandGuide>): Observable<BrandGuide> {
    return this.http.post<BrandGuideResponse>(`${environment.apiUrl}/brand`, guide)
      .pipe(
        map(response => response.data.brandGuide),
        tap(newGuide => {
          this.brandGuidesSignal.update(guides => [newGuide, ...guides]);
          // Auto-select the new guide
          if (newGuide._id) {
            this.selectedIdSignal.set(newGuide._id);
          }
        })
      );
  }

  updateBrandGuide(id: string, guide: Partial<BrandGuide>): Observable<BrandGuide> {
    return this.http.put<BrandGuideResponse>(`${environment.apiUrl}/brand/${id}`, guide)
      .pipe(
        map(response => response.data.brandGuide),
        tap(updated => {
          this.brandGuidesSignal.update(guides =>
            guides.map(g => g._id === id ? updated : g)
          );
        })
      );
  }

  deleteBrandGuide(id: string): Observable<void> {
    return this.http.delete<{ success: boolean }>(`${environment.apiUrl}/brand/${id}`)
      .pipe(
        tap(() => {
          this.brandGuidesSignal.update(guides =>
            guides.filter(g => g._id !== id)
          );
          // Clear selection if deleted guide was selected
          if (this.selectedIdSignal() === id) {
            this.selectedIdSignal.set(null);
          }
        }),
        map(() => undefined)
      );
  }

  selectBrandGuide(id: string | null): void {
    this.selectedIdSignal.set(id);
  }
}
