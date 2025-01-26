import os
import json
import base64
import boto3
from botocore.exceptions import ClientError
from aws_lambda_typing import events, context

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('TABLE_NAME')
table = dynamodb.Table(table_name)

def handler(event: events.KinesisFirehoseEvent, context: context.context.Context):
  processed_records = []
  for record in event['records']:
    try:
      # Decode and parse Firehose record
      data = json.loads(base64.b64decode(record['data']).decode('utf-8'))

      # Write the decoded payload to DynamoDB
      with table.batch_writer() as batch:
        for item in data:
          batch.put_item(Item=item)

      # Mark the record as successfully processed
      processed_records.append({
          'recordId': record['recordId'],
          'result': 'Ok',
          'data': data
      })
    except ClientError as e:
      print(f"Error writing to DynamoDB: {e}")
      processed_records.append({
          'recordId': record['recordId'],
          'result': 'ProcessingFailed'
      })
    except Exception as e:
      print(f"Error processing record: {e}")
      processed_records.append({
          'recordId': record['recordId'],
          'result': 'ProcessingFailed'
      })

  return {'records': processed_records}
