#!/bin/bash

# Production Build and Deploy Script
# This script ensures environment variables are properly set during build and deployment

set -e

echo "🚀 Building and Deploying Zeni AI Frontend"
echo "=========================================="

# Default configuration - update these for your environment
PROJECT_ID="${PROJECT_ID:-gen-lang-client-0966393611}"
REGION="${REGION:-asia-south1}"
SERVICE_NAME="${SERVICE_NAME:-zeni-ai-frontend}"
BACKEND_URL="${BACKEND_URL:-https://zeni-agent-backend-service-gen-lang-client-0966393611.asia-south1.run.app}"
FRONTEND_URL="${FRONTEND_URL:-https://my-frontend-service-gen-lang-client-0966393611.asia-south1.run.app}"
GOOGLE_API_KEY="${GOOGLE_API_KEY:-AIzaSyAZv27drMLj2XsDKhZ9NURMTM_hHgLJnAo}"

echo "📋 Configuration:"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Name: $SERVICE_NAME"
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Function to build Docker image with proper environment variables
build_image() {
    echo "🔨 Building Docker image with environment variables..."
    
    docker build \
        --build-arg NEXT_PUBLIC_BACKEND_URL="$BACKEND_URL" \
        --build-arg NEXT_PUBLIC_API_URL="$FRONTEND_URL" \
        --build-arg GOOGLE_API_KEY="$GOOGLE_API_KEY" \
        -t "gcr.io/$PROJECT_ID/$SERVICE_NAME:latest" \
        .
    
    if [ $? -eq 0 ]; then
        echo "✅ Docker image built successfully!"
    else
        echo "❌ Failed to build Docker image"
        exit 1
    fi
}

# Function to push image to Container Registry
push_image() {
    echo "📤 Pushing image to Google Container Registry..."
    
    docker push "gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"
    
    if [ $? -eq 0 ]; then
        echo "✅ Image pushed successfully!"
    else
        echo "❌ Failed to push image"
        exit 1
    fi
}

# Function to deploy to Cloud Run
deploy_to_cloud_run() {
    echo "🚀 Deploying to Cloud Run..."
    
    gcloud run deploy $SERVICE_NAME \
        --image "gcr.io/$PROJECT_ID/$SERVICE_NAME:latest" \
        --region=$REGION \
        --platform=managed \
        --set-env-vars "NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL" \
        --set-env-vars "NEXT_PUBLIC_API_URL=$FRONTEND_URL" \
        --set-env-vars "GOOGLE_API_KEY=$GOOGLE_API_KEY" \
        --allow-unauthenticated \
        --project=$PROJECT_ID
    
    if [ $? -eq 0 ]; then
        echo "✅ Deployed successfully!"
    else
        echo "❌ Failed to deploy"
        exit 1
    fi
}

# Function to verify deployment
verify_deployment() {
    echo "🔍 Verifying deployment..."
    
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --format="value(status.url)")
    
    echo "📡 Service URL: $SERVICE_URL"
    echo ""
    echo "🧪 Testing environment variables..."
    
    # Test if the backend URL is correctly set
    if curl -s "$SERVICE_URL" | grep -q "localhost:5000"; then
        echo "⚠️  WARNING: Still detecting localhost URLs. Check environment variables."
    else
        echo "✅ No localhost URLs detected. Environment variables appear correct."
    fi
    
    echo ""
    echo "🔎 Manual verification steps:"
    echo "1. Visit: $SERVICE_URL"
    echo "2. Open browser console"
    echo "3. Look for network requests to $BACKEND_URL"
    echo "4. Should NOT see requests to localhost:5000"
}

# Main menu
echo "What would you like to do?"
echo "1. Full build and deploy (recommended)"
echo "2. Build image only"
echo "3. Deploy existing image"
echo "4. Update environment variables only"
echo "5. Verify current deployment"
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "🔄 Starting full build and deploy process..."
        build_image
        push_image
        deploy_to_cloud_run
        verify_deployment
        ;;
    2)
        build_image
        ;;
    3)
        deploy_to_cloud_run
        verify_deployment
        ;;
    4)
        echo "🔧 Updating environment variables for existing service..."
        gcloud run services update $SERVICE_NAME \
            --set-env-vars "NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL" \
            --set-env-vars "NEXT_PUBLIC_API_URL=$FRONTEND_URL" \
            --region=$REGION \
            --project=$PROJECT_ID
        verify_deployment
        ;;
    5)
        verify_deployment
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "🎉 Operation completed!"
echo "💡 If you're still seeing localhost errors, ensure your build process"
echo "   includes the environment variables at build time, not just runtime."