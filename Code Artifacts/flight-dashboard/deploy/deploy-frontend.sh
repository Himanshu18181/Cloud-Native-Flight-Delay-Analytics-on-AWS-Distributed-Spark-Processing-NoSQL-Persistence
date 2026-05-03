#!/usr/bin/env bash
set -euo pipefail
REGION=us-east-1
BUCKET=flight-dashboard-frontend-669688919516
BUILD_DIR=/home/nashtech/Himanshu/flight-dashboard/build

echo "==> Create bucket $BUCKET (idempotent)"
if ! aws s3api head-bucket --bucket "$BUCKET" --region "$REGION" 2>/dev/null; then
  aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" >/dev/null
fi

echo "==> Disable Block Public Access (needed for static website hosting)"
aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false >/dev/null

echo "==> Configure static website hosting"
aws s3api put-bucket-website --bucket "$BUCKET" --website-configuration '{
  "IndexDocument": {"Suffix": "index.html"},
  "ErrorDocument": {"Key": "index.html"}
}' >/dev/null

echo "==> Apply public-read bucket policy"
cat > /tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadForWebsite",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::${BUCKET}/*"
  }]
}
EOF
aws s3api put-bucket-policy --bucket "$BUCKET" --policy file:///tmp/bucket-policy.json >/dev/null

echo "==> Sync build/ to s3://$BUCKET"
# Static assets get long cache, index.html no-cache
aws s3 sync "$BUILD_DIR" "s3://$BUCKET" --delete \
  --exclude "index.html" --exclude "asset-manifest.json" \
  --cache-control "public,max-age=31536000,immutable" >/dev/null
aws s3 cp "$BUILD_DIR/index.html" "s3://$BUCKET/index.html" \
  --cache-control "no-cache,no-store,must-revalidate" \
  --content-type "text/html" >/dev/null
aws s3 cp "$BUILD_DIR/asset-manifest.json" "s3://$BUCKET/asset-manifest.json" \
  --cache-control "no-cache" --content-type "application/json" >/dev/null 2>&1 || true

WEBSITE_URL="http://${BUCKET}.s3-website-${REGION}.amazonaws.com"
echo "WEBSITE_URL=$WEBSITE_URL"
echo "$WEBSITE_URL" > /home/nashtech/Himanshu/flight-dashboard/deploy/.website-url
