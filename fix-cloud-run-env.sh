#!/bin/bash

# Cloud Run Deployment Fix Script
# This script helps fix the NS_ERROR_CONNECTION_REFUSED issue by setting proper environment variables

set -e

echo "🔧 Fixing Cloud Run Environment Variables"
echo "=========================================="

# Configuration
PROJECT_ID="gen-lang-client-0966393611"  # Replace with your actual project ID
REGION="asia-south1"
FRONTEND_SERVICE_NAME="my-frontend-service"  # Replace with your actual service name
BACKEND_URL="https://zeni-agent-backend-service-gen-lang-client-0966393611.asia-south1.run.app"
FRONTEND_URL="https://my-frontend-service-gen-lang-client-0966393611.asia-south1.run.app"

echo "📋 Configuration:"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Frontend Service: $FRONTEND_SERVICE_NAME"
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Function to update Cloud Run service environment variables
update_cloud_run_env() {
    echo "🚀 Updating Cloud Run service environment variables..."
    
    gcloud run services update $FRONTEND_SERVICE_NAME \
        --set-env-vars NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL,NEXT_PUBLIC_API_URL=$FRONTEND_URL \
        --region=$REGION \
        --project=$PROJECT_ID
    
    if [ $? -eq 0 ]; then
        echo "✅ Environment variables updated successfully!"
    else
        echo "❌ Failed to update environment variables"
        exit 1
    fi
}

# Function to verify the deployment
verify_deployment() {
    echo "🔍 Verifying deployment..."
    
    # Get the service URL
    SERVICE_URL=$(gcloud run services describe $FRONTEND_SERVICE_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --format="value(status.url)")
    
    echo "📡 Service URL: $SERVICE_URL"
    echo "🧪 Test the deployment by visiting: $SERVICE_URL"
    echo ""
    echo "🔎 Check browser console to verify it's using the correct backend URL:"
    echo "   Should see: $BACKEND_URL/api/debate"
    echo "   Should NOT see: http://localhost:5000/api/debate"
}

# Main execution
echo "Would you like to:"
echo "1. Update environment variables"
echo "2. Verify current deployment"
echo "3. Both"
read -p "Enter your choice (1/2/3): " choice

case $choice in
    1)
        update_cloud_run_env
        ;;
    2)
        verify_deployment
        ;;
    3)
        update_cloud_run_env
        echo ""
        verify_deployment
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "🎉 Done! Your frontend should now connect to the correct backend URL."
echo "💡 Remember to test your application to ensure the fix works."