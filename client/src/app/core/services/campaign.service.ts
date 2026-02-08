import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
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
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AssetVersion {
  _id?: string;
  versionName: string;
  strategy?: string;
  content: any;
  status: 'pending' | 'generated' | 'edited' | 'approved';
  generatedAt?: Date;
  editedAt?: Date;
}

export interface Asset {
  _id?: string;
  campaignId: string;
  audienceId: string;
  channelType: 'email' | 'meta_ads';
  assetType: string;
  name: string;
  versions: AssetVersion[];
  generationPrompt?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CampaignDetailResponse {
  success: boolean;
  data: {
    campaign: Campaign;
    assets: Asset[];
    stats?: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CampaignService {
  private campaignsSignal = signal<Campaign[]>([]);
  private loadingSignal = signal<boolean>(false);
  private generatingSignal = signal<boolean>(false);

  campaigns = this.campaignsSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();
  isLoading = this.loadingSignal.asReadonly();
  isGenerating = this.generatingSignal.asReadonly();
  campaignCount = computed(() => this.campaignsSignal().length);

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

  getCampaigns(options?: { limit?: number }): Observable<any> {
    this.loadingSignal.set(true);
    const params = options?.limit ? `?limit=${options.limit}` : '';
    return this.http.get<any>(`${environment.apiUrl}/campaigns${params}`)
      .pipe(
        tap(response => {
          const campaigns = response.data?.campaigns || response.campaigns || response;
          this.campaignsSignal.set(Array.isArray(campaigns) ? campaigns : []);
          this.loadingSignal.set(false);
        })
      );
  }

  getCampaign(id: string): Observable<CampaignDetailResponse> {
    this.loadingSignal.set(true);
    return this.http.get<CampaignDetailResponse>(`${environment.apiUrl}/campaigns/${id}`)
      .pipe(
        tap(() => this.loadingSignal.set(false))
      );
  }

  createCampaign(campaign: Partial<Campaign>): Observable<Campaign> {
    return this.http.post<{ success: boolean; data: { campaign: Campaign } }>(`${environment.apiUrl}/campaigns`, campaign)
      .pipe(
        map(response => response.data.campaign),
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

  generateAssets(id: string): Observable<CampaignDetailResponse> {
    this.generatingSignal.set(true);
    return this.http.post<CampaignDetailResponse>(`${environment.apiUrl}/campaigns/${id}/generate`, {})
      .pipe(
        tap(() => this.generatingSignal.set(false))
      );
  }

  regenerateVersion(
    assetId: string,
    versionId: string,
    customInstructions?: string
  ): Observable<{ success: boolean; data: { asset: Asset } }> {
    return this.http.post<{ success: boolean; data: { asset: Asset } }>(
      `${environment.apiUrl}/assets/${assetId}/versions/${versionId}/regenerate`,
      { customInstructions }
    );
  }

  approveVersion(
    assetId: string,
    versionId: string
  ): Observable<{ success: boolean; data: { asset: Asset } }> {
    return this.http.patch<{ success: boolean; data: { asset: Asset } }>(
      `${environment.apiUrl}/assets/${assetId}/versions/${versionId}/approve`,
      {}
    );
  }
}