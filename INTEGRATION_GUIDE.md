# Zeni AI - Argument Model Integration

## Overview

The argument model has been successfully integrated with the chat page using Flask. The system now supports real-time AI-powered debates between two agents analyzing uploaded research papers.

## Architecture

```
Next.js Frontend (Port 3000)
    ↓ HTTP Request (File Upload)
Flask Backend (Port 5000)
    ↓ Text Extraction
Argument Model (DebateEngine)
    ↓ AI API Calls
Gemini AI Model
    ↓ Structured Responses
Chat Interface
```

## Components

### 1. Flask API Server (`agent/app.py`)
- **Health Check**: `GET /health`
- **Debate Analysis**: `POST /api/debate-json`
- Supports PDF, TXT, DOC, DOCX file uploads
- CORS enabled for Next.js integration

### 2. Argument Model (`agent/argument/model.py`)
- `DebateEngine` class with configurable AI agents
- Support for both file paths and direct content input
- Structured JSON response format
- Mock support for testing without API keys

### 3. Chat Container (`components/ui/chat-container.tsx`)
- Real API integration replacing mock data
- Progressive message loading with realistic delays
- Error handling for API failures
- TypeScript support with proper typing

### 4. File Processing
- Multi-format support: PDF, TXT, DOC, DOCX
- Automatic text extraction
- Temporary file handling with cleanup
- Error handling for unsupported formats

## Setup Instructions

### Prerequisites
- Python 3.7+
- Node.js 18+
- Google Gemini API key (for production use)

### Backend Setup

1. **Navigate to agent directory**:
   ```bash
   cd /home/ethan/code/zeni-ai/agent
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set environment variables** (optional for testing):
   ```bash
   export GOOGLE_API_KEY="your-gemini-api-key-here"
   ```

4. **Start Flask server**:
   ```bash
   python app.py
   ```
   
   Or use the provided script:
   ```bash
   chmod +x start-backend.sh
   ./start-backend.sh
   ```

### Frontend Setup

1. **Navigate to project root**:
   ```bash
   cd /home/ethan/code/zeni-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open browser**:
   ```
   http://localhost:3000/chat
   ```

## API Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "argument_model_api"
}
```

### Debate Analysis
```http
POST /api/debate-json
Content-Type: multipart/form-data

{
  "file": <uploaded_file>
}
```

**Response:**
```json
{
  "messages": [
    {
      "role": "system|pro|con",
      "content": "Message content",
      "timestamp": 1234567890,
      "point_number": 1,
      "is_conclusion": false
    }
  ],
  "metadata": {
    "file_name": "document.pdf",
    "total_messages": 14,
    "score": 75,
    "debate_duration": 2.5
  }
}
```

## Message Flow

1. **File Upload**: User uploads document via chat interface
2. **API Call**: Frontend sends file to Flask backend
3. **Text Extraction**: Backend extracts text from uploaded file
4. **Debate Analysis**: DebateEngine processes content with AI agents
5. **Progressive Display**: Messages appear in chat with realistic delays
6. **Final Assessment**: System provides overall score and analysis

## Testing

### Integration Tests
```bash
cd agent
python comprehensive_test.py
```

### Manual Testing
1. Start Flask backend: `python app.py`
2. Start Next.js frontend: `npm run dev`
3. Navigate to `/chat`
4. Upload a research paper
5. Watch the AI debate unfold

## Production Considerations

1. **Environment Variables**:
   - Set `GOOGLE_API_KEY` for Gemini AI access
   - Consider using environment-specific configs

2. **Security**:
   - File size limits (16MB default)
   - File type validation
   - Temporary file cleanup
   - CORS configuration

3. **Performance**:
   - API rate limiting
   - Caching for repeated analyses
   - Error handling and retries

4. **Deployment**:
   - Use production WSGI server (Gunicorn)
   - Reverse proxy (Nginx)
   - SSL/HTTPS configuration

## Troubleshooting

### Common Issues

1. **"Connection refused" errors**:
   - Ensure Flask server is running on port 5000
   - Check firewall settings

2. **"Import errors"**:
   - Install all requirements: `pip install -r requirements.txt`
   - Check Python version compatibility

3. **"API key not set" warnings**:
   - Set GOOGLE_API_KEY environment variable
   - System works with mocked responses for testing

4. **File upload failures**:
   - Check file size (16MB limit)
   - Verify file format support
   - Ensure proper CORS headers

### Debug Mode

Start Flask in debug mode for detailed error messages:
```bash
FLASK_ENV=development python app.py
```

## Future Enhancements

1. **Real-time Streaming**: WebSocket support for live message updates
2. **Advanced File Support**: Images, videos, web URLs
3. **User Authentication**: Session management and user accounts
4. **Debate History**: Save and retrieve previous analyses
5. **Custom AI Models**: Support for different LLM providers
6. **Advanced Scoring**: More sophisticated evaluation metrics

## Success Metrics

✅ Flask API server created and functional
✅ Argument model refactored for API integration  
✅ File upload and processing implemented
✅ Chat container updated with real API calls
✅ Comprehensive testing completed
✅ Error handling and edge cases covered
✅ Documentation and setup instructions provided

The integration is complete and ready for use!