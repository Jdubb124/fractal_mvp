import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  EmailAsset,
  ExportFormat,
  EmailTemplate,
  GenerateEmailsResponse,
  AIEditResponse,
  ExportEmailResponse,
} from '../models/email.types';

@Injectable({
  providedIn: 'root',
})
export class EmailExporterService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/emails`;

  // State signals
  private emailAssetsSignal = signal<EmailAsset[]>([]);
  private loadingSignal = signal<boolean>(false);
  private generatingSignal = signal<boolean>(false);
  private selectedAssetSignal = signal<EmailAsset | null>(null);

  // Public readonly signals
  emailAssets = this.emailAssetsSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();
  isGenerating = this.generatingSignal.asReadonly();
  selectedAsset = this.selectedAssetSignal.asReadonly();

  // Computed
  emailAssetCount = computed(() => this.emailAssetsSignal().length);
  hasEmailAssets = computed(() => this.emailAssetsSignal().length > 0);

  /**
   * Generate HTML email assets for a campaign
   */
  generateEmails(
    campaignId: string,
    templateId: EmailTemplate = 'minimal',
    regenerate = false
  ): Observable<GenerateEmailsResponse> {
    this.generatingSignal.set(true);
    const payload = { campaignId, templateId, regenerate };
    console.log('[EMAIL-DEBUG] Frontend: generateEmails called', payload);
    console.log('[EMAIL-DEBUG] Frontend: POST ->', `${this.baseUrl}/generate`);
    return this.http
      .post<{ success: boolean; data: GenerateEmailsResponse }>(
        `${this.baseUrl}/generate`,
        payload
      )
      .pipe(
        tap({
          next: (raw) => console.log('[EMAIL-DEBUG] Frontend: raw API response', { success: raw.success, assetCount: raw.data?.emailAssets?.length, totalGenerated: raw.data?.totalGenerated, generationTime: raw.data?.generationTime }),
          error: (err) => console.error('[EMAIL-DEBUG] Frontend: API error', { status: err.status, message: err.message, error: err.error }),
        }),
        map((res) => res.data),
        tap((result) => {
          console.log('[EMAIL-DEBUG] Frontend: mapped result', { totalGenerated: result.totalGenerated, generationTime: result.generationTime, assetIds: result.emailAssets?.map((a: any) => a._id) });
          this.emailAssetsSignal.set(result.emailAssets);
          this.generatingSignal.set(false);
        })
      );
  }

  /**
   * Get all email assets for a campaign
   */
  getEmailsByCampaign(campaignId: string): Observable<EmailAsset[]> {
    this.loadingSignal.set(true);
    return this.http
      .get<{ success: boolean; data: EmailAsset[] }>(
        `${this.baseUrl}/campaign/${campaignId}`
      )
      .pipe(
        map((res) => res.data),
        tap((assets) => {
          this.emailAssetsSignal.set(assets);
          this.loadingSignal.set(false);
        })
      );
  }

  /**
   * Get single email asset
   */
  getEmail(assetId: string): Observable<EmailAsset> {
    return this.http
      .get<{ success: boolean; data: EmailAsset }>(`${this.baseUrl}/${assetId}`)
      .pipe(
        map((res) => res.data),
        tap((asset) => {
          this.selectedAssetSignal.set(asset);
        })
      );
  }

  /**
   * Update email HTML
   */
  updateEmail(
    assetId: string,
    html: string,
    editType: 'manual' | 'ai_assisted',
    prompt?: string
  ): Observable<EmailAsset> {
    return this.http
      .put<{ success: boolean; data: { emailAsset: EmailAsset } }>(
        `${this.baseUrl}/${assetId}`,
        { html, editType, prompt }
      )
      .pipe(
        map((res) => res.data.emailAsset),
        tap((asset) => {
          this.selectedAssetSignal.set(asset);
          // Update in list
          this.emailAssetsSignal.update((assets) =>
            assets.map((a) => (a._id === assetId ? asset : a))
          );
        })
      );
  }

  /**
   * AI-assisted email editing
   */
  aiEditEmail(
    assetId: string,
    prompt: string,
    preserveStructure = true
  ): Observable<AIEditResponse> {
    return this.http
      .post<{ success: boolean; data: AIEditResponse }>(
        `${this.baseUrl}/${assetId}/ai-edit`,
        { prompt, preserveStructure }
      )
      .pipe(map((res) => res.data));
  }

  /**
   * Approve email asset
   */
  approveEmail(assetId: string): Observable<EmailAsset> {
    return this.http
      .patch<{ success: boolean; data: EmailAsset }>(
        `${this.baseUrl}/${assetId}/approve`,
        {}
      )
      .pipe(
        map((res) => res.data),
        tap((asset) => {
          this.selectedAssetSignal.set(asset);
          this.emailAssetsSignal.update((assets) =>
            assets.map((a) => (a._id === assetId ? asset : a))
          );
        })
      );
  }

  /**
   * Export single email (get content)
   */
  exportEmail(
    assetId: string,
    format: ExportFormat
  ): Observable<ExportEmailResponse> {
    return this.http
      .get<{ success: boolean; data: ExportEmailResponse }>(
        `${this.baseUrl}/${assetId}/export`,
        { params: { format, download: 'false' } }
      )
      .pipe(map((res) => res.data));
  }

  /**
   * Download single email as file
   */
  downloadEmail(assetId: string, format: ExportFormat): void {
    window.open(
      `${this.baseUrl}/${assetId}/export?format=${format}&download=true`,
      '_blank'
    );
  }

  /**
   * Bulk export emails as ZIP
   */
  bulkExportEmails(
    assetIds: string[],
    format: ExportFormat,
    organizationStrategy: 'flat' | 'by_audience' | 'by_type' = 'by_audience'
  ): void {
    this.http
      .post(
        `${this.baseUrl}/export/bulk`,
        { assetIds, format, organizationStrategy },
        { responseType: 'blob' }
      )
      .subscribe((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fractal-emails-export.zip`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  }

  /**
   * Delete email assets by campaign
   */
  deleteEmailAssetsByCampaign(
    campaignId: string
  ): Observable<{ deletedCount: number }> {
    return this.http
      .delete<{ success: boolean; data: { deletedCount: number } }>(
        `${this.baseUrl}/campaign/${campaignId}`
      )
      .pipe(
        map((res) => res.data),
        tap(() => {
          this.emailAssetsSignal.set([]);
        })
      );
  }

  /**
   * Select an asset for viewing/editing
   */
  selectAsset(asset: EmailAsset | null): void {
    this.selectedAssetSignal.set(asset);
  }

  /**
   * Clear all state
   */
  clearState(): void {
    this.emailAssetsSignal.set([]);
    this.selectedAssetSignal.set(null);
    this.loadingSignal.set(false);
    this.generatingSignal.set(false);
  }
}
