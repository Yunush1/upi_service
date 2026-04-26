declare module 'passport-jwt' {
  import { Strategy as PassportStrategy } from 'passport-strategy';

  export interface StrategyOptions {
    secretOrKey?: string | Buffer;
    secretOrKeyProvider?: (
      request: any,
      rawJwtToken: string,
      done: (err: Error | null, secret?: string | Buffer) => void,
    ) => void;
    jwtFromRequest: (request: any) => string | null;
    passReqToCallback?: boolean;
    audience?: string;
    issuer?: string;
    algorithms?: string[];
    ignoreExpiration?: boolean;
    verifycallback?: (
      request: any,
      jwtPayload: any,
      secretOrKey: string | Buffer,
      done: (err: Error | null, user?: any, info?: any) => void,
    ) => void;
  }

  export interface ExtractJwtOptions {
    fromHeader?: boolean;
    fromBodyField?: string;
    fromUrlQueryParameter?: string;
    fromAuthHeaderAsBearerToken?: boolean;
    fromExtractors?: Array<(request: any) => string | null>;
  }

  export class Strategy extends PassportStrategy {
    constructor(options: StrategyOptions, verify: (...args: any[]) => any);
    authenticate(req: any, options?: any): void;
  }

  export const ExtractJwt: {
    fromHeader: (header_name: string) => (request: any) => string | null;
    fromBodyField: (field_name: string) => (request: any) => string | null;
    fromUrlQueryParameter: (param_name: string) => (request: any) => string | null;
    fromAuthHeaderAsBearerToken: () => (request: any) => string | null;
    fromAuthHeaderWithScheme: (auth_scheme: string) => (request: any) => string | null;
    fromExtractors: (extractors: Array<(request: any) => string | null>) => (request: any) => string | null;
  };
}
