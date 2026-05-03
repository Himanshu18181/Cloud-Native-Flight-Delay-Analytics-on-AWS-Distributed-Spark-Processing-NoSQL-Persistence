#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

ROLE_NAME=flight-dashboard-lambda-role
FUNCTION_NAME=flight-dashboard-api
REGION=us-east-1
ACCOUNT_ID=669688919516

echo "==> Ensuring IAM role $ROLE_NAME"
if ! aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document "file://$ROOT/deploy/trust-policy.json" >/dev/null
  echo "   role created"
else
  echo "   role already exists"
fi

aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole >/dev/null

aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name flight-dashboard-access \
  --policy-document "file://$ROOT/deploy/lambda-policy.json" >/dev/null

ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
echo "   ROLE_ARN=$ROLE_ARN"

echo "==> Building deployment package"
cd "$ROOT"
rm -f deploy/lambda.zip
# Production-only deps for the Lambda package
npm prune --omit=dev --silent || true
zip -qr deploy/lambda.zip server.js lambda.js lib node_modules package.json
# Restore dev deps for local development
npm install --silent >/dev/null 2>&1 || true
SIZE=$(du -h deploy/lambda.zip | cut -f1)
echo "   package size: $SIZE"

echo "==> Deploying Lambda $FUNCTION_NAME"
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" >/dev/null 2>&1; then
  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file "fileb://$ROOT/deploy/lambda.zip" \
    --region "$REGION" >/dev/null
  aws lambda wait function-updated --function-name "$FUNCTION_NAME" --region "$REGION"
  aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --handler lambda.handler \
    --runtime nodejs20.x \
    --timeout 30 \
    --memory-size 512 \
    --role "$ROLE_ARN" \
    --region "$REGION" >/dev/null
  echo "   updated"
else
  # Newly created roles can take a few seconds to be assumable
  for i in 1 2 3 4 5; do
    if aws lambda create-function \
      --function-name "$FUNCTION_NAME" \
      --runtime nodejs20.x \
      --role "$ROLE_ARN" \
      --handler lambda.handler \
      --timeout 30 \
      --memory-size 512 \
      --zip-file "fileb://$ROOT/deploy/lambda.zip" \
      --region "$REGION" >/dev/null 2>&1; then
      echo "   created"
      break
    fi
    echo "   waiting for role to propagate ($i/5)..."
    sleep 6
  done
fi

echo "==> Configuring Function URL with public access + CORS"
URL_INFO=$(aws lambda get-function-url-config --function-name "$FUNCTION_NAME" --region "$REGION" 2>/dev/null || echo "")
if [ -z "$URL_INFO" ]; then
  aws lambda create-function-url-config \
    --function-name "$FUNCTION_NAME" \
    --auth-type NONE \
    --cors '{"AllowOrigins":["*"],"AllowMethods":["GET","POST","OPTIONS"],"AllowHeaders":["*"],"MaxAge":86400}' \
    --region "$REGION" >/dev/null
  aws lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id PublicFunctionUrlAccess \
    --action lambda:InvokeFunctionUrl \
    --principal "*" \
    --function-url-auth-type NONE \
    --region "$REGION" >/dev/null
else
  aws lambda update-function-url-config \
    --function-name "$FUNCTION_NAME" \
    --auth-type NONE \
    --cors '{"AllowOrigins":["*"],"AllowMethods":["GET","POST","OPTIONS"],"AllowHeaders":["*"],"MaxAge":86400}' \
    --region "$REGION" >/dev/null
fi

FUNCTION_URL=$(aws lambda get-function-url-config --function-name "$FUNCTION_NAME" --region "$REGION" --query FunctionUrl --output text)
echo "   FUNCTION_URL=$FUNCTION_URL"
echo "$FUNCTION_URL" > deploy/.function-url
echo "DONE"
