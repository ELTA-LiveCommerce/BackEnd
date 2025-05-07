import { Injectable, Logger } from '@nestjs/common';
import * as util from 'util';

import { SafeOnEvent } from '../decorator/safe-on-event';

const MAX_STRING_LENGTH = 1000;

@Injectable()
export class EventListenerService {
  private readonly logger = new Logger('EventListener');

  @SafeOnEvent('**')
  async eventLogger(payload: any) {
    const displayPayload = (() => {
      const result = util.inspect(payload, {
        depth: 10,
        colors: false,
        compact: false,
      });
      return result.length > MAX_STRING_LENGTH ? result.slice(0, MAX_STRING_LENGTH) + '...' : result;
    })();
    const isMultiLine = displayPayload.includes('\n');
    if (isMultiLine) {
      this.logger.debug(`Event emitted:\n${displayPayload}`);
    } else {
      this.logger.debug(`Event emitted: ${displayPayload}`);
    }
  }
}
