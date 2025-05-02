import { ISession } from '@/common/interface/session.interface';
import 'express';

declare module 'express' {
  interface Request {
    session?: ISession;
  }
}
