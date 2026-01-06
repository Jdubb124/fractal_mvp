import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Channel {
  type: 'email' | 'meta_ads';
  enabled: boolean;
  purpose?: string;
}

export interface Segment {
  audienceId: string;
  customInstructions?: string;
}

export interface Campaign {
  _id?: string;
  name: string;
  objective?: string;
  description?: string;
  status: 'draft' | 'generated' | 'approved' | 'archived';
  segments: Segment[];
  channels: Channel[];
  keyMessages: string[];
  callToAction?: string;
  urgencyLevel?: 'low' | 'medium' | 'high';
  startDate?: Date;
  endDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CampaignService {
  private campaignsSignal = signal<Campaign[]>([]);
  private loadingSignal = signal<boolean>(false);
  
  campaigns = this.campaignsSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();

  constructor(private http: HttpClient) {}

  loadCampaigns(): Observable<Campaign[]> {
    this.loadingSignal.set(true);
    return this.http.get<Campaign[]>(`${environment.apiUrl}/campaigns`)
      .pipe(
        tap(campaigns => {
          this.campaignsSignal.set(campaigns);
          this.loadingSignal.set(false);
        })
      );
  }

  getCampaign(id: string): Observable<Campaign> {
    return this.http.get<Campaign>(`${environment.apiUrl}/campaigns/${id}`);
  }

  createCampaign(campaign: Partial<Campaign>): Observable<Campaign> {
    return this.http.post<Campaign>(`${environment.apiUrl}/campaigns`, campaign)
      .pipe(
        tap(newCampaign => {
          this.campaignsSignal.update(campaigns => [newCampaign, ...campaigns]);
        })
      );
  }

  updateCampaign(id: string, campaign: Partial<Campaign>): Observable<Campaign> {
    return this.http.put<Campaign>(`${environment.apiUrl}/campaigns/${id}`, campaign)
      .pipe(
        tap(updated => {
          this.campaignsSignal.update(campaigns => 
            campaigns.map(c => c._id === id ? updated : c)
          );
        })
      );
  }

  deleteCampaign(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/campaigns/${id}`)
      .pipe(
        tap(() => {
          this.campaignsSignal.update(campaigns => 
            campaigns.filter(c => c._id !== id)
          );
        })
      );
  }

  generateCampaign(id: string): Observable<Campaign> {
    return this.http.post<Campaign>(`${environment.apiUrl}/campaigns/${id}/generate`, {});
  }
}