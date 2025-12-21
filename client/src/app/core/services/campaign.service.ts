import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Audience } from './audience.service';

export interface CampaignSegment {
  audienceId: string | Audience;
  customInstructions?: string;
}

export interface CampaignChannel {
  type: 'email' | 'meta_ads';
  enabled: boolean;
  purpose?: string;
}

export interface Campaign {
  _id: string;
  userId: string;
  brandGuideId: string;
  name: string;
  objective?: string;
  description?: string;
  status: 'draft' | 'generated' | 'approved' | 'archived';
  segments: CampaignSegment[];
  channels: CampaignChannel[];
  keyMessages: string[];
  callToAction?: string;
  urgencyLevel: 'low' | 'medium' | 'high';
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  expectedAssetCount?: number;
}

export interface Asset {
  _id: string;
  campaignId: string;
  audienceId: string | Audience;
  channelType: 'email' | 'meta_ads';
  assetType: string;
  name: string;
  versions: AssetVersion[];
  generationPrompt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetVersion {
  _id?: string;
  versionName: string;
  strategy?: string;
  content: EmailContent | MetaAdContent;
  status: 'pending' | 'generated' | 'edited' | 'approved';
  generatedAt?: string;
  editedAt?: string;
}

export interface EmailContent {
  subjectLine?: string;
  preheader?: string;
  headline?: string;
  bodyCopy?: string;
  ctaText?: string;
}

export interface MetaAdContent {
  primaryText?: string;
  headline?: string;
  description?: string;
  ctaButton?: string;
}

export interface CampaignsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  pages: number;
  data: {
    campaigns: Campaign[];
  };
}

export interface CampaignResponse {
  success: boolean;
  data: {
    campaign: Campaign;
    assets?: Asset[];
    stats?: {
      segmentCount: number;
      channelCount: number;
      assetCount: number;
      expectedAssetCount: number;
    };
  };
}

export interface GenerateResponse {
  success: boolean;
  message: string;
  data: {
    campaign: Campaign;
    assets: Asset[];
    generatedCount: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class CampaignService {
  private api = inject(ApiService);

  // Signals for reactive state
  private campaignsSignal = signal<Campaign[]>([]);
  private selectedCampaignSignal = signal<Campaign | null>(null);
  private campaignAssetsSignal = signal<Asset[]>([]);
  private loadingSignal = signal<boolean>(false);
  private generatingSignal = signal<boolean>(false);

  // Public computed values
  campaigns = computed(() => this.campaignsSignal());
  selectedCampaign = computed(() => this.selectedCampaignSignal());
  campaignAssets = computed(() => this.campaignAssetsSignal());
  isLoading = computed(() => this.loadingSignal());
  isGenerating = computed(() => this.generatingSignal());
  campaignCount = computed(() => this.campaignsSignal().length);

  // Get all campaigns
  getCampaigns(params?: { status?: string; limit?: number; page?: number }): Observable<CampaignsResponse> {
    this.loadingSignal.set(true);
    return this.api.get<CampaignsResponse>('/campaigns', params).pipe(
      tap(response => {
        this.campaignsSignal.set(response.data.campaigns);
        this.loadingSignal.set(false);
      })
    );
  }

  // Get single campaign with assets
  getCampaign(id: string): Observable<CampaignResponse> {
    this.loadingSignal.set(true);
    return this.api.get<CampaignResponse>(`/campaigns/${id}`).pipe(
      tap(response => {
        this.selectedCampaignSignal.set(response.data.campaign);
        this.campaignAssetsSignal.set(response.data.assets || []);
        this.loadingSignal.set(false);
      })
    );
  }

  // Create campaign
  createCampaign(data: Partial<Campaign>): Observable<CampaignResponse> {
    this.loadingSignal.set(true);
    return this.api.post<CampaignResponse>('/campaigns', data).pipe(
      tap(response => {
        this.campaignsSignal.update(campaigns => [response.data.campaign, ...campaigns]);
        this.loadingSignal.set(false);
      })
    );
  }

  // Update campaign
  updateCampaign(id: string, data: Partial<Campaign>): Observable<CampaignResponse> {
    this.loadingSignal.set(true);
    return this.api.put<CampaignResponse>(`/campaigns/${id}`, data).pipe(
      tap(response => {
        this.campaignsSignal.update(campaigns =>
          campaigns.map(c => (c._id === id ? response.data.campaign : c))
        );
        if (this.selectedCampaignSignal()?._id === id) {
          this.selectedCampaignSignal.set(response.data.campaign);
        }
        this.loadingSignal.set(false);
      })
    );
  }

  // Delete campaign
  deleteCampaign(id: string): Observable<{ success: boolean }> {
    return this.api.delete<{ success: boolean }>(`/campaigns/${id}`).pipe(
      tap(() => {
        this.campaignsSignal.update(campaigns => campaigns.filter(c => c._id !== id));
        if (this.selectedCampaignSignal()?._id === id) {
          this.selectedCampaignSignal.set(null);
          this.campaignAssetsSignal.set([]);
        }
      })
    );
  }

  // Generate assets for campaign
  generateAssets(id: string): Observable<GenerateResponse> {
    this.generatingSignal.set(true);
    return this.api.post<GenerateResponse>(`/campaigns/${id}/generate`, {}).pipe(
      tap(response => {
        // Update campaign status
        this.campaignsSignal.update(campaigns =>
          campaigns.map(c => (c._id === id ? response.data.campaign : c))
        );
        if (this.selectedCampaignSignal()?._id === id) {
          this.selectedCampaignSignal.set(response.data.campaign);
          this.campaignAssetsSignal.set(response.data.assets);
        }
        this.generatingSignal.set(false);
      })
    );
  }

  // Duplicate campaign
  duplicateCampaign(id: string): Observable<CampaignResponse> {
    return this.api.post<CampaignResponse>(`/campaigns/${id}/duplicate`, {}).pipe(
      tap(response => {
        this.campaignsSignal.update(campaigns => [response.data.campaign, ...campaigns]);
      })
    );
  }

  // Export campaign
  exportCampaign(id: string): Observable<any> {
    return this.api.get(`/campaigns/${id}/export`);
  }

  // Select campaign
  selectCampaign(campaign: Campaign | null): void {
    this.selectedCampaignSignal.set(campaign);
    if (!campaign) {
      this.campaignAssetsSignal.set([]);
    }
  }

  // Clear cache
  clearCache(): void {
    this.campaignsSignal.set([]);
    this.selectedCampaignSignal.set(null);
    this.campaignAssetsSignal.set([]);
  }
}