import { LambdaRequest } from '@linzjs/lambda';
import EventBridge from 'aws-sdk/clients/eventbridge.js';
import ulid from 'ulid';
import { KxDatasetVersionDetail } from './kx.js';

interface DatasetIngestedEvent {
  id: string;
  datasetId: number;
  versionId: number;
  datasetName: string;
  type: string;
}

export class AwsEventBridgeBus {
  eventBusArn: string | undefined;
  eventBridge: EventBridge;
  events: DatasetIngestedEvent[] = [];

  constructor() {
    this.eventBusArn = process.env['EVENT_BUS_ARN'];
    this.eventBridge = new EventBridge();
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
    const entry: EventBridge.PutEventsRequestEntry = {
      Time: new Date(dataset.published_at),
      Source: 'nz.govt.linz.lds-cache',
      EventBusName: this.eventBusArn,
      Detail: JSON.stringify(event),
      DetailType: 'Dataset:Ingested',
    };
    const res = await this.eventBridge.putEvents({ Entries: [entry] }).promise();
    if (res.Entries == null) return;
    const [evt] = res.Entries;
    req.log.info({ event, eventId: evt.EventId }, 'EventBus:Send');
  }
}
