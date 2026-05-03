#!/usr/bin/env python3
"""Fetch US public holidays from the Nager.Date API, archive raw JSON to S3, and normalise into DynamoDB."""
import sys
import urllib.request
import json
import boto3
from decimal import Decimal

REGION = "us-east-1"
TABLE = "flight_holidays"
BUCKET = "flight-delay-project-669688"
RAW_PREFIX = "raw/holidays"
COUNTRY = "US"
YEARS = range(2015, 2025)
API = "https://date.nager.at/api/v3/PublicHolidays/{year}/{country}"

ddb = boto3.resource("dynamodb", region_name=REGION).Table(TABLE)
s3 = boto3.client("s3", region_name=REGION)


def fetch_year(year):
    url = API.format(year=year, country=COUNTRY)
    with urllib.request.urlopen(url, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def archive_year(year, holidays):
    key = f"{RAW_PREFIX}/{year}.json"
    body = json.dumps(holidays, separators=(",", ":")).encode("utf-8")
    s3.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=body,
        ContentType="application/json",
    )
    return key


def main():
    print(f"Retrieving US holidays {YEARS.start}-{YEARS.stop - 1} from Nager.Date API", flush=True)
    written = 0
    with ddb.batch_writer(overwrite_by_pkeys=["date"]) as batch:
        for year in YEARS:
            try:
                holidays = fetch_year(year)
            except Exception as exc:
                print(f"  {year}: API error {exc}", file=sys.stderr, flush=True)
                continue
            try:
                key = archive_year(year, holidays)
                print(f"  {year}: archived raw payload to s3://{BUCKET}/{key}", flush=True)
            except Exception as exc:
                print(f"  {year}: S3 archive warning {exc}", file=sys.stderr, flush=True)
            for h in holidays:
                item = {
                    "date": h["date"],
                    "name": h.get("name", ""),
                    "localName": h.get("localName", ""),
                    "year": Decimal(str(year)),
                    "month": Decimal(str(int(h["date"].split("-")[1]))),
                    "day": Decimal(str(int(h["date"].split("-")[2]))),
                    "fixed": bool(h.get("fixed", False)),
                    "global": bool(h.get("global", False)),
                    "types": h.get("types") or [],
                }
                batch.put_item(Item=item)
                written += 1
            print(f"  {year}: {len(holidays)} holidays", flush=True)
    print(f"Done. {written} items written to {TABLE}.", flush=True)


if __name__ == "__main__":
    main()
