#!/usr/bin/env bash
set -euo pipefail
REGION=us-east-1
FN_ARN=arn:aws:lambda:us-east-1:669688919516:function:flight-dashboard-api
echo "==> Create HTTP API"
API_ID=$(aws apigatewayv2 create-api \
  --name flight-dashboard-api \
  --protocol-type HTTP \
  --target "$FN_ARN" \
  --cors-configuration "AllowOrigins=*,AllowMethods=*,AllowHeaders=*" \
  --region "$REGION" \
  --query ApiId --output text)
echo "API_ID=$API_ID"
echo "==> Allow API Gateway to invoke Lambda"
aws lambda add-permission \
  --function-name flight-dashboard-api \
  --statement-id apigw-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:${REGION}:669688919516:${API_ID}/*/*" \
  --region "$REGION" >/dev/null
ENDPOINT=$(aws apigatewayv2 get-api --api-id "$API_ID" --region "$REGION" --query ApiEndpoint --output text)
echo "ENDPOINT=$ENDPOINT"
echo "$ENDPOINT" > /home/nashtech/Himanshu/flight-dashboard/deploy/.api-endpoint
