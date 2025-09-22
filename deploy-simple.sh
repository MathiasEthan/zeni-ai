#!/bin/bash

set -e

# Simple deployment script - build and deploy to Cloud Run
PROJECT_ID="${PROJECT_ID:-gen-lang-client-0966393611}"
REGION="${REGION:-asia-south1}"
SERVICE_NAME="${SERVICE_NAME:-zeni-ai-frontend}"
BACKEND_URL="${BACKEND_URL:-https://zeni-agent-backend-service-7swwhfygga-el.a.run.app}"
FRONTEND_URL="${FRONTEND_URL:-https://my-frontend-service-gen-lang-client-0966393611.asia-south1.run.app}"
GOOGLE_API_KEY="${GOOGLE_API_KEY:-AIzaSyAZv27drMLj2XsDKhZ9NURMTM_hHgLJnAo}"

echo "Building Docker image..."
docker build \
    --build-arg NEXT_PUBLIC_BACKEND_URL="$BACKEND_URL" \
    --build-arg NEXT_PUBLIC_API_URL="$FRONTEND_URL" \
    --build-arg GOOGLE_API_KEY="$GOOGLE_API_KEY" \
    -t "gcr.io/$PROJECT_ID/$SERVICE_NAME:latest" \
    .

echo "Pushing image..."
docker push "gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image "gcr.io/$PROJECT_ID/$SERVICE_NAME:latest" \
    --region=$REGION \
    --platform=managed \
    --set-env-vars "NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL" \
    --set-env-vars "NEXT_PUBLIC_API_URL=$FRONTEND_URL" \
    --set-env-vars "GOOGLE_API_KEY=$GOOGLE_API_KEY" \
    --allow-unauthenticated \
    --project=$PROJECT_ID

echo "Deployment complete!"ompleted. If you need further changes or want to verify the backend integration, let me know!