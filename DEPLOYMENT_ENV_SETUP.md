# Deployment Environment Variables Setup

## The Problem
Your deployed frontend is trying to connect to `http://localhost:5000/api/debate` instead of your actual backend service URL. This happens when the `NEXT_PUBLIC_BACKEND_URL` environment variable is not properly set during the **build process** in your production deployment.

## 🚨 Important: Build-Time vs Runtime Variables
Next.js `NEXT_PUBLIC_*` variables must be available during **build time**, not just runtime. The error occurs because these variables weren't available when the application was built.

## 🛠️ Quick Fix Solutions

### Option 1: Use the Automated Deploy Script (Recommended)
```bash
# Run the deployment script that handles everything automatically
./deploy.sh
```

### Option 2: Use Cloud Build (Automated CI/CD)
```bash
# Submit build with proper environment variables
gcloud builds submit --config cloudbuild.yaml .
```

### Option 3: Manual Cloud Run Update
If you just need to update an existing deployment:
```bash
gcloud run services update YOUR_SERVICE_NAME \
  --set-env-vars NEXT_PUBLIC_BACKEND_URL=https://zeni-agent-backend-service-7swwhfygga-el.a.run.app \
  --set-env-vars NEXT_PUBLIC_API_URL=https://my-frontend-service-gen-lang-client-0966393611.asia-south1.run.app \
  --region=asia-south1
```

## 📋 Detailed Solution Steps

### For Google Cloud Run Deployment

1. **Build with Environment Variables:**
   ```bash
   # Build Docker image with proper build arguments
   docker build \
     --build-arg NEXT_PUBLIC_BACKEND_URL=https://zeni-agent-backend-service-gen-lang-client-0966393611.asia-south1.run.app \
     --build-arg NEXT_PUBLIC_API_URL=https://my-frontend-service-gen-lang-client-0966393611.asia-south1.run.app \
     -t gcr.io/gen-lang-client-0966393611/zeni-ai-frontend .
   ```

2. **Deploy with Environment Variables:**
   ```bash
   gcloud run deploy zeni-ai-frontend \
     --image gcr.io/gen-lang-client-0966393611/zeni-ai-frontend \
     --set-env-vars NEXT_PUBLIC_BACKEND_URL=https://zeni-agent-backend-service-gen-lang-client-0966393611.asia-south1.run.app \
     --set-env-vars NEXT_PUBLIC_API_URL=https://my-frontend-service-gen-lang-client-0966393611.asia-south1.run.app \
     --region=asia-south1 \
     --allow-unauthenticated
   ```

3. **Using Cloud Run Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to Cloud Run > Your Service
   - Click "Edit & Deploy New Revision"
   - Go to "Variables & Secrets" tab
   - Add these environment variables:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://zeni-agent-backend-service-gen-lang-client-0966393611.asia-south1.run.app
   NEXT_PUBLIC_API_URL=https://my-frontend-service-gen-lang-client-0966393611.asia-south1.run.app
   ```

### For Docker Deployment
```bash
# Build with environment variables
docker build \
  --build-arg NEXT_PUBLIC_BACKEND_URL=https://zeni-agent-backend-service-gen-lang-client-0966393611.asia-south1.run.app \
  --build-arg NEXT_PUBLIC_API_URL=https://my-frontend-service-gen-lang-client-0966393611.asia-south1.run.app \
  -t zeni-ai-frontend .

# Run with environment variables (as backup)
docker run \
  -e NEXT_PUBLIC_BACKEND_URL=https://zeni-agent-backend-service-gen-lang-client-0966393611.asia-south1.run.app \
  -e NEXT_PUBLIC_API_URL=https://my-frontend-service-gen-lang-client-0966393611.asia-south1.run.app \
  -p 8080:8080 \
  zeni-ai-frontend
```

### For Other Platforms

- **Vercel**: 
  1. Add environment variables in project settings
  2. Redeploy from Git or CLI
  
- **Netlify**: 
  1. Add environment variables in site settings
  2. Trigger new build
  
- **Heroku**: 
  ```bash
  heroku config:set NEXT_PUBLIC_BACKEND_URL=https://zeni-agent-backend-service-gen-lang-client-0966393611.asia-south1.run.app
  heroku config:set NEXT_PUBLIC_API_URL=https://my-frontend-service-gen-lang-client-0966393611.asia-south1.run.app
  ```

## 🔧 Files Created/Updated

1. **`cloudbuild.yaml`** - Automated Cloud Build configuration
2. **`deploy.sh`** - Interactive deployment script
3. **`.env.production`** - Production environment template
4. **`next.config.ts`** - Updated to better handle environment variables

## ✅ Verification Steps

1. **Check Build Logs:**
   Look for environment variables being set during build:
   ```
   ENV NEXT_PUBLIC_BACKEND_URL=https://zeni-agent-backend-service...
   ```

2. **Test Deployment:**
   ```bash
   # Use the test script
   node test-backend-url.js
   ```

3. **Browser Console:**
   - Visit your deployed frontend
   - Open browser console
   - Look for network requests
   - Should see requests to your backend URL, NOT localhost:5000

4. **Direct API Test:**
   ```bash
   curl -X POST "YOUR_FRONTEND_URL/api/knowledge-graph" \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

## 🚨 Common Issues & Solutions

### Issue: Still seeing localhost:5000
**Solution:** The build didn't include environment variables. Rebuild with proper build args.

### Issue: Environment variables not taking effect
**Solution:** Clear Docker cache and rebuild:
```bash
docker system prune -a
# Then rebuild with environment variables
```

### Issue: "NS_ERROR_CONNECTION_REFUSED"
**Solution:** Backend URL is incorrect or backend service is down. Verify:
```bash
curl https://zeni-agent-backend-service-gen-lang-client-0966393611.asia-south1.run.app/health
```

## 📝 Important Notes

1. **Environment Variable Prefix**: Next.js requires client-side environment variables to be prefixed with `NEXT_PUBLIC_`
2. **Build-Time Requirement**: These variables must be available during build, not just runtime
3. **No Trailing Slashes**: Ensure backend URLs don't have trailing slashes
4. **Rebuild Required**: After changing environment variables, you must rebuild and redeploy
5. **Security**: Never commit API keys to version control. Use CI/CD secrets or environment variable injection

## 🔄 Troubleshooting Commands

```bash
# Check current environment variables in Cloud Run
gcloud run services describe YOUR_SERVICE_NAME --region=asia-south1

# Test environment variable configuration locally
NEXT_PUBLIC_BACKEND_URL=https://zeni-agent-backend-service-gen-lang-client-0966393611.asia-south1.run.app npm run build

# Verify backend service is running
curl https://zeni-agent-backend-service-gen-lang-client-0966393611.asia-south1.run.app

# Check frontend build output for embedded URLs
grep -r "localhost:5000" .next/
```