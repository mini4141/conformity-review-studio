import { DynamoDBClient, CreateTableCommand, DeleteTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { BatchWriteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { ClauseStatus, Correction, Decision, FileMeta, Finding } from '@crs/shared';

export const TABLE = process.env.TABLE_NAME ?? 'crs-table';
const raw = new DynamoDBClient({ region: process.env.AWS_REGION ?? 'ap-southeast-2', endpoint: process.env.DDB_ENDPOINT || undefined });
const ddb = DynamoDBDocumentClient.from(raw, { marshallOptions: { removeUndefinedValues: true } });

const strip = <T>(item: Record<string, unknown> | undefined): T | undefined => {
  if (!item) return undefined;
  const { pk: _pk, sk: _sk, GSI1PK: _a, GSI1SK: _b, ...rest } = item;
  return rest as T;
};

async function queryAll(pk: string, skPrefix?: string, index?: string): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = [];
  let key: Record<string, unknown> | undefined;
  const pkName = index ? 'GSI1PK' : 'pk';
  const skName = index ? 'GSI1SK' : 'sk';
  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: index,
        KeyConditionExpression: skPrefix ? `${pkName} = :pk AND begins_with(${skName}, :sk)` : `${pkName} = :pk`,
        ExpressionAttributeValues: skPrefix ? { ':pk': pk, ':sk': skPrefix } : { ':pk': pk },
        ExclusiveStartKey: key,
      }),
    );
    out.push(...(res.Items ?? []));
    key = res.LastEvaluatedKey;
  } while (key);
  return out;
}

/** Local only: (re)create the single table with GSI1. In AWS the table comes from CDK. */
export async function resetLocalTable(): Promise<void> {
  try {
    await raw.send(new DeleteTableCommand({ TableName: TABLE }));
  } catch {
    /* table did not exist */
  }
  await raw.send(
    new CreateTableCommand({
      TableName: TABLE,
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        { AttributeName: 'pk', AttributeType: 'S' },
        { AttributeName: 'sk', AttributeType: 'S' },
        { AttributeName: 'GSI1PK', AttributeType: 'S' },
        { AttributeName: 'GSI1SK', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'pk', KeyType: 'HASH' },
        { AttributeName: 'sk', KeyType: 'RANGE' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'GSI1',
          KeySchema: [
            { AttributeName: 'GSI1PK', KeyType: 'HASH' },
            { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    }),
  );
  await raw.send(new DescribeTableCommand({ TableName: TABLE }));
}

async function batchPut(items: Record<string, unknown>[]): Promise<void> {
  for (let i = 0; i < items.length; i += 25) {
    const chunk = items.slice(i, i + 25).map((Item) => ({ PutRequest: { Item } }));
    let req: Record<string, typeof chunk> | undefined = { [TABLE]: chunk };
    while (req && Object.keys(req).length) {
      const res = await ddb.send(new BatchWriteCommand({ RequestItems: req }));
      req = res.UnprocessedItems as typeof req;
    }
  }
}

const fileItem = (f: FileMeta) => ({ pk: `FILE#${f.id}`, sk: 'META', GSI1PK: 'QUEUE', GSI1SK: `due#${f.due}#${f.id}`, ...f });
const findingItem = (f: Finding) => ({ pk: `FILE#${f.fileId}`, sk: `FINDING#${f.id}`, ...f });

export const repo = {
  async putFiles(files: FileMeta[]) {
    await batchPut(files.map(fileItem));
  },
  async listFiles(): Promise<FileMeta[]> {
    return (await queryAll('QUEUE', undefined, 'GSI1')).map((i) => strip<FileMeta>(i)!);
  },
  async getFile(id: string): Promise<FileMeta | undefined> {
    const r = await ddb.send(new GetCommand({ TableName: TABLE, Key: { pk: `FILE#${id}`, sk: 'META' } }));
    return strip<FileMeta>(r.Item);
  },
  async putFile(f: FileMeta) {
    await ddb.send(new PutCommand({ TableName: TABLE, Item: fileItem(f) }));
  },

  async putFindings(findings: Finding[]) {
    await batchPut(findings.map(findingItem));
  },
  async listFindings(fileId: string): Promise<Finding[]> {
    return (await queryAll(`FILE#${fileId}`, 'FINDING#')).map((i) => strip<Finding>(i)!);
  },
  async getFinding(id: string): Promise<Finding | undefined> {
    const fileId = id.split('~')[0]!;
    const r = await ddb.send(new GetCommand({ TableName: TABLE, Key: { pk: `FILE#${fileId}`, sk: `FINDING#${id}` } }));
    return strip<Finding>(r.Item);
  },
  async putFinding(f: Finding) {
    await ddb.send(new PutCommand({ TableName: TABLE, Item: findingItem(f) }));
  },
  async addCorrection(findingId: string, c: Correction) {
    await ddb.send(new PutCommand({ TableName: TABLE, Item: { pk: `FINDING#${findingId}`, sk: `CORR#${c.ts}`, ...c } }));
  },
  async listCorrections(findingId: string): Promise<Correction[]> {
    return (await queryAll(`FINDING#${findingId}`, 'CORR#')).map((i) => strip<Correction>(i)!);
  },

  async listClauseStatus(fileId: string): Promise<Record<string, ClauseStatus>> {
    const items = await queryAll(`FILE#${fileId}`, 'CLAUSE#');
    return Object.fromEntries(items.map((i) => [String(i.sk).slice(7), strip<ClauseStatus>(i)!]));
  },
  async patchClauseStatus(fileId: string, clauseId: string, patch: ClauseStatus): Promise<ClauseStatus> {
    const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};
    const sets = entries.map(([k, v], n) => {
      names[`#k${n}`] = k;
      values[`:v${n}`] = v;
      return `#k${n} = :v${n}`;
    });
    const r = await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { pk: `FILE#${fileId}`, sk: `CLAUSE#${clauseId}` },
        UpdateExpression: `SET ${sets.join(', ')}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: 'ALL_NEW',
      }),
    );
    return strip<ClauseStatus>(r.Attributes)!;
  },

  async getDecision(fileId: string): Promise<Decision | undefined> {
    const r = await ddb.send(new GetCommand({ TableName: TABLE, Key: { pk: `FILE#${fileId}`, sk: 'DECISION' } }));
    return strip<Decision>(r.Item);
  },
  async putDecision(fileId: string, d: Decision) {
    await ddb.send(new PutCommand({ TableName: TABLE, Item: { pk: `FILE#${fileId}`, sk: 'DECISION', ...d } }));
  },
};
