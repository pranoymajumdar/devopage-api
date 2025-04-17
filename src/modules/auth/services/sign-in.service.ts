import { Injectable } from '@nestjs/common';
import { SessionService } from './session.service';

@Injectable()
export class SignInService {
  constructor(private readonly sessionService: SessionService) {}
  async signIn(): Promise<unknown> {
    return;
  }
}
