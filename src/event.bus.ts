import { LambdaRequest } from '@linzjs/lambda';
import EventBridge from 'aws-sdk/clients/eventbridge.js';
import { KxDataset } from './kx.dataset.js';

interface DatasetIngestedEvent {
  datasetId: number;
  versionId: number;
  datasetName: string;
  type: string;
}

export class AwsEventBridgeBus {
  eventBusArn: string | undefined;
  eventBridge: EventBridge;

  constructor() {
    this.eventBusArn = process.env['EVENT_BUS_ARN'];
    this.eventBridge = new EventBridge();
  }

  async putDatasetIngestedEvent(req: LambdaRequest, dataset: KxDataset): Promise<void> {
    if (this.eventBusArn == null) return;
    const version = await dataset.getLatestVersion();
    const event: DatasetIngestedEvent = {
      datasetId: dataset.id,
      versionId: version.version.id,
      datasetName: dataset.title,
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
    if (res.Entries == null) return;
    const [evt] = res.Entries;
    req.log.info({ event, eventId: evt.EventId }, 'EventBus:Send');
  }
}
