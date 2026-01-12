/// <reference types="qs" />
import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models';
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
            userId?: string;
        }
    }
}
export declare const protect: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => void;
export declare const generateToken: (userId: string) => string;
export declare const optionalAuth: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map