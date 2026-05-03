#!/usr/bin/env bash
set -euo pipefail
BUCKET=flight-dashboard-frontend-669688919516
REGION=us-east-1
ORIGIN_DOMAIN="${BUCKET}.s3-website-${REGION}.amazonaws.com"
CALLER_REF="flight-dashboard-$(date +%s)"

cat > /tmp/cf-config.json <<EOF
{
  "CallerReference": "${CALLER_REF}",
  "Comment": "Flight Delay Dashboard frontend",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "s3website-origin",
      "DomainName": "${ORIGIN_DOMAIN}",
      "CustomOriginConfig": {
        "HTTPPort": 80,
        "HTTPSPort": 443,
        "OriginProtocolPolicy": "http-only",
        "OriginSslProtocols": {"Quantity": 1, "Items": ["TLSv1.2"]},
        "OriginReadTimeout": 30,
        "OriginKeepaliveTimeout": 5
      },
      "CustomHeaders": {"Quantity": 0}
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "s3website-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]}
    },
    "Compress": true,
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6"
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {"ErrorCode": 403, "ResponsePagePath": "/index.html", "ResponseCode": "200", "ErrorCachingMinTTL": 10},
      {"ErrorCode": 404, "ResponsePagePath": "/index.html", "ResponseCode": "200", "ErrorCachingMinTTL": 10}
    ]
  },
  "PriceClass": "PriceClass_100",
  "ViewerCertificate": {"CloudFrontDefaultCertificate": true},
  "HttpVersion": "http2"
}
EOF

echo "==> Creating CloudFront distribution"
RESULT=$(aws cloudfront create-distribution --distribution-config file:///tmp/cf-config.json --no-cli-pager 2>&1)
DIST_ID=$(echo "$RESULT" | python3 -c "import sys,json;print(json.load(sys.stdin)['Distribution']['Id'])")
DOMAIN=$(echo "$RESULT" | python3 -c "import sys,json;print(json.load(sys.stdin)['Distribution']['DomainName'])")
echo "DIST_ID=$DIST_ID"
echo "DOMAIN=$DOMAIN"
echo "$DOMAIN" > /home/nashtech/Himanshu/flight-dashboard/deploy/.cf-domain
echo "$DIST_ID" > /home/nashtech/Himanshu/flight-dashboard/deploy/.cf-dist-id
echo "Public URL: https://$DOMAIN"
echo "(Distribution takes 5-15 min to fully deploy globally)"
