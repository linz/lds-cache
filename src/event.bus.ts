import { LambdaRequest } from '@linzjs/lambda';
import EventBridge from 'aws-sdk/clients/eventbridge.js';
import { KxDataset } from './kx.dataset.js';

interface DatasetIngestedEvent {
  datasetId: number;
  versionId: number;
  type: string;
}

export class AwsEventBridgeBus {
  eventBusArn: string;
  eventBridge: EventBridge;

  constructor() {
    const eventBusArn = process.env['EVENT_BUS_ARN'];
    if (eventBusArn == null) throw new Error('Missing $EVENT_BUS_ARN');
    this.eventBusArn = eventBusArn;
    this.eventBridge = new EventBridge();
  }

  async putDatasetIngestedEvent(req: LambdaRequest, dataset: KxDataset): Promise<void> {
    const version = await dataset.getLatestVersion();
    const event: DatasetIngestedEvent = {
      datasetId: dataset.id,
      versionId: version.version.id,
      type: 'Ingested',
    };
    const entry: EventBridge.PutEventsRequestEntry = {
      Time: new Date(dataset.info.published_at),
      Source: 'nz.govt.linz.lds-cache',
      EventBusName: this.eventBusArn,
      Detail: JSON.stringify(event),
      DetailType: 'Dataset:Ingested',
    };
    const res = await this.eventBridge.putEvents({ Entries: [entry] }).promise();
    req.log.info({ event, eventId: res.Entries![0].EventId }, 'EventBus:Send');
  }
}
