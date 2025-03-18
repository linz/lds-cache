import type { PutEventsRequestEntry } from '@aws-sdk/client-eventbridge';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import type { LambdaRequest } from '@linzjs/lambda';
import ulid from 'ulid';

import type { KxDatasetVersionDetail } from './kx.ts';

interface DatasetIngestedEvent {
  id: string;
  datasetId: number;
  versionId: number;
  datasetName: string;
  type: string;
}

export class AwsEventBridgeBus {
  eventBusArn: string | undefined;
  eventBridgeClient: EventBridgeClient;
  events: DatasetIngestedEvent[] = [];

  constructor() {
    this.eventBusArn = process.env['EVENT_BUS_ARN'];
    this.eventBridgeClient = new EventBridgeClient();
    this.reset();
  }

  reset(): void {
    this.events = [];
  }

  async putDatasetIngestedEvent(req: LambdaRequest, dataset: KxDatasetVersionDetail): Promise<void> {
    if (this.eventBusArn == null) return;
    const event: DatasetIngestedEvent = {
      id: ulid.ulid(),
      datasetId: dataset.id,
      versionId: dataset.version.id,
      datasetName: dataset.title,
      type: 'Ingested',
    };
    this.events.push(event);
    const entry: PutEventsRequestEntry = {
      Time: new Date(dataset.published_at),
      Source: 'nz.govt.linz.lds-cache',
      EventBusName: this.eventBusArn,
      Detail: JSON.stringify(event),
      DetailType: 'Dataset:Ingested',
    };
    const putEventsCommand = new PutEventsCommand({ Entries: [entry] });
    const res = await this.eventBridgeClient.send(putEventsCommand);
    if (res.Entries == null) return;
    const [evt] = res.Entries;
    if (evt == null) return;
    req.log.info({ event, eventId: evt.EventId }, 'EventBus:Send');
  }
}
