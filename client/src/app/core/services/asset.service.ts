import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Asset, AssetVersion } from './campaign.service';

export interface AssetResponse {
  success: boolean;
  data: {
    asset: Asset;
  };
}

export interface AssetsResponse {
  success: boolean;
  count: number;
  data: {
    assets: Asset[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class AssetService {
  private api = inject(ApiService);

  // Signals for reactive state
  private selectedAssetSignal = signal<Asset | null>(null);
  private loadingSignal = signal<boolean>(false);
  private regeneratingSignal = signal<boolean>(false);

  // Public computed values
  selectedAsset = computed(() => this.selectedAssetSignal());
  isLoading = computed(() => this.loadingSignal());
  isRegenerating = computed(() => this.regeneratingSignal());

  // Get single asset
  getAsset(id: string): Observable<AssetResponse> {
    this.loadingSignal.set(true);
    return this.api.get<AssetResponse>(`/assets/${id}`).pipe(
      tap(response => {
        this.selectedAssetSignal.set(response.data.asset);
        this.loadingSignal.set(false);
      })
    );
  }

  // Get assets by campaign
  getAssetsByCampaign(
    campaignId: string,
    params?: { channelType?: string; audienceId?: string }
  ): Observable<AssetsResponse> {
    this.loadingSignal.set(true);
    return this.api.get<AssetsResponse>(`/assets/campaign/${campaignId}`, params).pipe(
      tap(() => {
        this.loadingSignal.set(false);
      })
    );
  }

  // Update asset
  updateAsset(id: string, data: Partial<Asset>): Observable<AssetResponse> {
    this.loadingSignal.set(true);
    return this.api.put<AssetResponse>(`/assets/${id}`, data).pipe(
      tap(response => {
        this.selectedAssetSignal.set(response.data.asset);
        this.loadingSignal.set(false);
      })
    );
  }

  // Update specific version
  updateVersion(
    assetId: string,
    versionId: string,
    data: Partial<AssetVersion>
  ): Observable<AssetResponse> {
    this.loadingSignal.set(true);
    return this.api.put<AssetResponse>(`/assets/${assetId}/versions/${versionId}`, data).pipe(
      tap(response => {
        this.selectedAssetSignal.set(response.data.asset);
        this.loadingSignal.set(false);
      })
    );
  }

  // Approve version
  approveVersion(assetId: string, versionId: string): Observable<AssetResponse> {
    return this.api.patch<AssetResponse>(`/assets/${assetId}/versions/${versionId}/approve`).pipe(
      tap(response => {
        this.selectedAssetSignal.set(response.data.asset);
      })
    );
  }

  // Regenerate asset
  regenerateAsset(
    id: string,
    options?: { instructions?: string; strategy?: string }
  ): Observable<AssetResponse> {
    this.regeneratingSignal.set(true);
    return this.api.post<AssetResponse>(`/assets/${id}/regenerate`, options || {}).pipe(
      tap(response => {
        this.selectedAssetSignal.set(response.data.asset);
        this.regeneratingSignal.set(false);
      })
    );
  }

  // Delete asset
  deleteAsset(id: string): Observable<{ success: boolean }> {
    return this.api.delete<{ success: boolean }>(`/assets/${id}`).pipe(
      tap(() => {
        if (this.selectedAssetSignal()?._id === id) {
          this.selectedAssetSignal.set(null);
        }
      })
    );
  }

  // Select asset
  selectAsset(asset: Asset | null): void {
    this.selectedAssetSignal.set(asset);
  }

  // Clear cache
  clearCache(): void {
    this.selectedAssetSignal.set(null);
  }
}