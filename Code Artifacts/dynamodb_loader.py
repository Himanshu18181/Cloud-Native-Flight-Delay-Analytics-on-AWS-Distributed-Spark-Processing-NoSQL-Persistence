#!/usr/bin/env python3
"""Load the Spark JSON aggregates from S3 into DynamoDB."""
import json
import sys
from decimal import Decimal

import boto3

REGION = "us-east-1"
BUCKET = "flight-delay-project-669688"
PREFIX = "react_dashboard_data"

DATASETS = {
    "airlines":     ("flight_airlines",  "airline",  lambda r: r.get("AIRLINE")),
    "airports":     ("flight_airports",  "airport",  lambda r: r.get("ORIGIN_AIRPORT")),
    "monthly":      ("flight_monthly",   "ym",       lambda r: f"{int(r.get('YEAR', 0)):04d}-{int(r.get('MONTH', 0)):02d}"),
    "delaySummary": ("flight_summary",   "metric",   lambda r: "global"),
}

s3 = boto3.client("s3", region_name=REGION)
ddb = boto3.resource("dynamodb", region_name=REGION)


def to_dynamo_value(value):
    if isinstance(value, float):
        return Decimal(str(round(value, 6)))
    if isinstance(value, list):
        return [to_dynamo_value(v) for v in value]
    if isinstance(value, dict):
        return {k: to_dynamo_value(v) for k, v in value.items()}
    return value


def fetch_records(folder):
    prefix = f"{PREFIX}/{folder}/"
    records = []
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=BUCKET, Prefix=prefix):
        for obj in page.get("Contents", []) or []:
            key = obj["Key"]
            if "part-" not in key or not key.endswith(".json"):
                continue
            body = s3.get_object(Bucket=BUCKET, Key=key)["Body"].read().decode("utf-8")
            for line in body.splitlines():
                line = line.strip()
                if line:
                    records.append(json.loads(line))
    return records


def load(folder, table_name, pk_field, key_builder):
    table = ddb.Table(table_name)
    records = fetch_records(folder)
    if not records:
        print(f"  [{folder}] no records found in S3, skipping", flush=True)
        return 0

    written = 0
    with table.batch_writer(overwrite_by_pkeys=[pk_field]) as batch:
        for rec in records:
            pk_val = key_builder(rec)
            if pk_val is None:
                continue
            item = {pk_field: str(pk_val)}
            item.update(to_dynamo_value(rec))
            batch.put_item(Item=item)
            written += 1
    print(f"  [{folder}] -> {table_name}: {written} items", flush=True)
    return written


def main():
    print(f"Loading S3 results into DynamoDB (region={REGION})", flush=True)
    total = 0
    for folder, (table, pk, key_builder) in DATASETS.items():
        try:
            total += load(folder, table, pk, key_builder)
        except Exception as exc:
            print(f"  [{folder}] FAILED: {exc}", file=sys.stderr, flush=True)
            return 1
    print(f"Done. {total} items written across {len(DATASETS)} tables.", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
