/// <reference types="mongoose/types/aggregate" />
/// <reference types="mongoose/types/callback" />
/// <reference types="mongoose/types/collection" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/expressions" />
/// <reference types="mongoose/types/helpers" />
/// <reference types="mongoose/types/middlewares" />
/// <reference types="mongoose/types/indexes" />
/// <reference types="mongoose/types/models" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/populate" />
/// <reference types="mongoose/types/query" />
/// <reference types="mongoose/types/schemaoptions" />
/// <reference types="mongoose/types/session" />
/// <reference types="mongoose/types/types" />
/// <reference types="mongoose/types/utility" />
/// <reference types="mongoose/types/validation" />
/// <reference types="mongoose/types/virtuals" />
/// <reference types="mongoose/types/schematypes" />
/// <reference types="mongoose/types/inferschematype" />
/// <reference types="mongoose/types/inferrawdoctype" />
import mongoose, { Document } from 'mongoose';
import { CampaignStatus, ChannelType, UrgencyLevel } from '../config/constants';
interface ICampaignSegment {
    audienceId: mongoose.Types.ObjectId;
    customInstructions?: string;
}
interface ICampaignChannel {
    type: ChannelType;
    enabled: boolean;
    purpose?: string;
}
interface ICampaignContextSummary {
    name: string;
    objective?: string;
    keyMessages: string[];
    cta?: string;
    urgency: UrgencyLevel;
    segmentCount: number;
    channels: ChannelType[];
}
export interface ICampaign extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    brandGuideId: mongoose.Types.ObjectId;
    name: string;
    objective?: string;
    description?: string;
    status: CampaignStatus;
    segments: ICampaignSegment[];
    channels: ICampaignChannel[];
    keyMessages: string[];
    callToAction?: string;
    urgencyLevel: UrgencyLevel;
    startDate?: Date;
    endDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    expectedAssetCount: number;
    contextSummary: ICampaignContextSummary;
}
declare const Campaign: mongoose.Model<ICampaign, {}, {}, {}, mongoose.Document<unknown, {}, ICampaign, {}, {}> & ICampaign & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Campaign;
//# sourceMappingURL=Campaign.d.ts.map