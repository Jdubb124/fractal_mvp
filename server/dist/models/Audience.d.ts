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
import { PropensityLevel } from '../config/constants';
interface IDemographics {
    ageRange?: {
        min?: number;
        max?: number;
    };
    income?: string;
    location: string[];
    other?: string;
}
export interface IAudienceSummary {
    name: string;
    description?: string;
    demographics: string;
    propensity: PropensityLevel;
    interests: string;
    painPoints: string;
    motivators: string;
    tone?: string;
}
export interface IAudience extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    demographics: IDemographics;
    propensityLevel: PropensityLevel;
    interests: string[];
    painPoints: string[];
    preferredTone?: string;
    keyMotivators: string[];
    estimatedSize?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    summary: IAudienceSummary;
}
declare const Audience: mongoose.Model<IAudience, {}, {}, {}, mongoose.Document<unknown, {}, IAudience, {}, {}> & IAudience & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Audience;
//# sourceMappingURL=Audience.d.ts.map