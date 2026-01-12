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
export interface IBrandGuideContext {
    company: string;
    industry?: string;
    voice: string;
    tone?: string;
    valueProposition?: string;
    keyMessages: string[];
    avoid: string[];
    audience?: string;
    competitors?: string;
}
export interface IBrandGuide extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    companyName: string;
    industry?: string;
    voiceAttributes: string[];
    toneGuidelines?: string;
    valueProposition?: string;
    keyMessages: string[];
    avoidPhrases: string[];
    primaryColors: string[];
    logoUrl?: string;
    targetAudience?: string;
    competitorContext?: string;
    createdAt: Date;
    updatedAt: Date;
    fullContext: IBrandGuideContext;
}
declare const BrandGuide: mongoose.Model<IBrandGuide, {}, {}, {}, mongoose.Document<unknown, {}, IBrandGuide, {}, {}> & IBrandGuide & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default BrandGuide;
//# sourceMappingURL=BrandGuide.d.ts.map