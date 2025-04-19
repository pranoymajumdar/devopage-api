import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger: Logger = new Logger(EmailService.name);
  constructor() {}
}
