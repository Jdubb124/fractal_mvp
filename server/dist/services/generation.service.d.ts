import { ICampaign, IBrandGuide } from '../models';
interface EmailContent {
    subjectLine: string;
    preheader: string;
    headline: string;
    bodyCopy: string;
    ctaText: string;
}
interface MetaAdContent {
    primaryText: string;
    headline: string;
    description: string;
    ctaButton: string;
}
export declare function generateCampaignAssets(campaign: ICampaign, brandGuide: IBrandGuide): Promise<any[]>;
export declare function regenerateAsset(asset: any, instructions?: string, strategy?: string): Promise<any>;
export declare function generateSingleContent(brandGuide: IBrandGuide, campaign: ICampaign, audience: any, channelType: string, strategy: string): Promise<EmailContent | MetaAdContent>;
export {};
//# sourceMappingURL=generation.service.d.ts.map