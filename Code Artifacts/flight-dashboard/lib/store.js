const { ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb, s3, BUCKET } = require('./aws');

async function scanTable(table) {
  const items = [];
  let ExclusiveStartKey;
  do {
    const r = await ddb.send(new ScanCommand({ TableName: table, ExclusiveStartKey }));
    if (r.Items) items.push(...r.Items);
    ExclusiveStartKey = r.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

async function readFromS3(dataType) {
  const list = await s3.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: `react_dashboard_data/${dataType}/`,
  }));
  const part = (list.Contents || [])
    .find((o) => o.Key.includes('part-') && o.Key.endsWith('.json'));
  if (!part) return null;

  const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: part.Key }));
  const chunks = [];
  for await (const c of obj.Body) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8')
    .split('\n').filter(Boolean).map(JSON.parse);
}

async function listOutputFiles(types) {
  return Promise.all(types.map(async (file) => {
    try {
      const r = await s3.send(new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: `react_dashboard_data/${file}/`,
        MaxKeys: 5,
      }));
      return { file, exists: !!(r.Contents && r.Contents.length) };
    } catch {
      return { file, exists: false };
    }
  }));
}

module.exports = { scanTable, readFromS3, listOutputFiles };
