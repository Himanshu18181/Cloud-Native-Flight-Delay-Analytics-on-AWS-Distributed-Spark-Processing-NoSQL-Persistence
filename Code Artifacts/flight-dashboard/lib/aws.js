const { EMRClient } = require('@aws-sdk/client-emr');
const { S3Client } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const REGION = process.env.AWS_REGION || 'us-east-1';
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

const config = { region: REGION };
if (!isLambda && process.env.AWS_ACCESS_KEY_ID) {
  config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN }),
  };
}

module.exports = {
  emr: new EMRClient(config),
  s3: new S3Client(config),
  ddb: DynamoDBDocumentClient.from(new DynamoDBClient(config)),

  CLUSTER_ID: process.env.EMR_CLUSTER_ID || 'j-3AUQOHYTC9PXZ',
  BUCKET: process.env.DATA_BUCKET || 'flight-delay-project-669688',
  SCRIPT_PATH: process.env.SPARK_SCRIPT_PATH
    || 's3://flight-delay-project-669688/scripts/flight_react_spark_v6.py',

  TABLES: {
    airlines: 'flight_airlines',
    airports: 'flight_airports',
    monthly: 'flight_monthly',
    delaySummary: 'flight_summary',
  },
  HOLIDAYS_TABLE: 'flight_holidays',
};
