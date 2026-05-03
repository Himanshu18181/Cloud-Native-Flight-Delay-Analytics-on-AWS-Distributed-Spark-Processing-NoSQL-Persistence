================================================================
H9DISS1 - Data Intensive Scalable Systems Project
Cloud Native Flight Delay Analytics on AWS: Distributed Spark Processing, NoSQL Persistence, and a Serverless React Dashboard
Student: x24230308
================================================================

REPOSITORY CONTENTS
-------------------
flight_react_spark_v6.py     PySpark ETL job submitted to Amazon EMR.
                             Reads BTS CSVs from S3, harmonises 2015
                             vs 2018-2024 schemas, computes airline /
                             airport / monthly / summary aggregates,
                             writes them to DynamoDB and S3 JSON.
dynamodb_loader.py           Reload utility that re-populates DynamoDB
                             from existing S3 JSON aggregates without
                             rerunning EMR.
holidays_loader.py           Programmatic holiday-API loader. Calls
                             the Nager.Date REST API once per year,
                             archives raw JSON to S3, and writes
                             normalised items to DynamoDB.
flight-dashboard/            React 18 single-page application
                             (AeroDelay Analytics) with Express+Lambda
                             API, deployment scripts, and tests.
report_images/               Screenshots used in the report.

REPRODUCING THE PIPELINE FROM A CLEAN AWS ACCOUNT
-------------------------------------------------
Prerequisites:
  * AWS CLI v2 configured with credentials (administrator or a role
    that can create S3, EMR, DynamoDB, IAM, Lambda, API Gateway,
    CloudFront resources)
  * Python 3.11+, Node 18+, pdflatex (for rebuilding the report)

Step 1: Stage the raw data
  aws s3 mb s3://flight-delay-project-<unique-suffix>
  # Upload BTS On-Time Performance CSVs (2015, 2018-2024) to:
  #   s3://flight-delay-project-<suffix>/raw/

Step 2: Create the DynamoDB tables (on-demand billing)
  python -c "import boto3; ..."   # see flight-dashboard/deploy/
  # Tables: flight_airlines, flight_airports, flight_monthly,
  #         flight_summary, flight_holidays

Step 3: Run the Spark step on EMR
  # Submit flight_react_spark_v6.py to a 1+2 node EMR 6 cluster.
  # The job reads s3://.../raw/, writes DynamoDB items directly,
  # and publishes JSON aggregates to s3://.../react_dashboard_data/.

Step 4: Run the holiday loader
  python holidays_loader.py
  # Idempotent: pulls 2015-2024 from https://date.nager.at/Api,
  # archives raw JSON to S3, normalises into flight_holidays.

Step 5: (Optional) Re-populate DynamoDB without rerunning EMR
  python dynamodb_loader.py

Step 6: Deploy the dashboard
  cd flight-dashboard
  npm install
  npm run build
  bash deploy/deploy-backend.sh        # Lambda + API Gateway
  bash deploy/deploy-frontend.sh       # React build to S3
  bash deploy/deploy-cloudfront.sh     # CloudFront distribution

Local development (no AWS required, uses cached JSON):
  cd flight-dashboard
  npm install
  npm run dev          # Express on :5000, React on :3000

NOTES
-----
* All scripts are idempotent. Reruns overwrite by primary key.
* No AWS access keys are committed; all AWS calls use the default
  credentials chain or EC2/EMR instance profiles.
* Raw datasets are intentionally NOT included in the zip due to size
  (BTS CSVs ~ several GB). They must be downloaded directly from
  https://www.transtats.bts.gov/.
