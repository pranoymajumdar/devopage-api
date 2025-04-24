import { ISessionData } from '@/common/interface/session.interface';
import 'express';

declare module 'express' {
  interface Request {
    session?: ISessionData;
  }
}
