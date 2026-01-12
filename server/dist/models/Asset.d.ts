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
import { AssetStatus, ChannelType, AssetType } from '../config/constants';
interface IEmailContent {
    subjectLine?: string;
    preheader?: string;
    headline?: string;
    bodyCopy?: string;
    ctaText?: string;
}
interface IMetaAdContent {
    primaryText?: string;
    headline?: string;
    description?: string;
    ctaButton?: string;
}
export interface IAssetVersion {
    _id?: mongoose.Types.ObjectId;
    versionName: string;
    strategy?: string;
    content: IEmailContent | IMetaAdContent;
    status: AssetStatus;
    generatedAt?: Date;
    editedAt?: Date;
}
export interface IAsset extends Document {
    _id: mongoose.Types.ObjectId;
    campaignId: mongoose.Types.ObjectId;
    audienceId: mongoose.Types.ObjectId;
    channelType: ChannelType;
    assetType: AssetType;
    name: string;
    versions: IAssetVersion[];
    generationPrompt?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const Asset: mongoose.Model<IAsset, {}, {}, {}, mongoose.Document<unknown, {}, IAsset, {}, {}> & IAsset & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Asset;
//# sourceMappingURL=Asset.d.ts.map