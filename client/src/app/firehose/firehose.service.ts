import { Injectable } from '@angular/core';
import * as AWS from 'aws-sdk';
import { Observable, from } from 'rxjs';
import { environment } from "../../environment";

@Injectable({
  providedIn: 'root',
})
export class FirehoseService {
  private readonly _firehose: AWS.Firehose;

  constructor() {
    AWS.config.update({
      region: environment.AWS_REGION,
      credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: environment.AWS_IDENTITY_POOL,
      }),
    });

    this._firehose = new AWS.Firehose();
  }

  sendRecordingToFirehose(data: CanvasRecording[]): Observable<AWS.Firehose.PutRecordOutput> {
    const params = {
      DeliveryStreamName: environment.AWS_FIREHOSE_STREAM,
      Record: {
        Data: JSON.stringify(data.map(r => r.toJSON())),
      },
    };
    return from(this._firehose.putRecord(params).promise());
  }
}

export class CanvasRecording {
  private readonly _id: string;
  private readonly _timestamp: Date;
  private readonly _coordinateX: number;
  private readonly _coordinateY: number;
  private readonly _isDrawing: boolean;
  
  constructor(
    id: string,
    timestamp: Date,
    coordinateX: number,
    coordinateY: number,
    isDrawing: boolean
  ) {
    this._id = id;
    this._timestamp = timestamp;
    this._coordinateX = coordinateX;
    this._coordinateY = coordinateY;
    this._isDrawing = isDrawing;
  }

  get id(): string { return this._id; }
  get timestamp(): Date { return this._timestamp; }
  get coordinateX(): number { return this._coordinateX; }
  get coordinateY(): number{ return this._coordinateY; }
  get isDrawing(): boolean{ return this._isDrawing; }

  toJSON(): any {
    return {
      id: this.id,
      timestamp: this.timestamp,
      coordinateX: this.coordinateX,
      coordinateY: this.coordinateY,
      isDrawing: this.isDrawing,
    }
  }
}
