import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World! how are you doing?';
  }
  addHello(): string {
    return 'Hello World added!';
  }
}
