import { ISessionData } from '@/modules/auth-old/interface/session.interface';
import 'express';

declare module 'express' {
  interface Request {
    session?: ISessionData;
  }
}
