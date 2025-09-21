# Zeni AI - Demo Application

A demonstration Next.js application that showcases PDF text extraction and AI research paper evaluation with sample hardcoded responses.

## Features

- **PDF Text Extraction**: Upload PDF files and extract text content (uses sample hardcoded responses)
- **AI Research Debate**: Simulated AI debate about research paper quality with sample conversation
- **Dark/Light Theme**: Toggle between dark and light modes
- **Responsive Design**: Works on desktop and mobile devices

## Demo Data

This application uses hardcoded sample responses to demonstrate functionality:

- PDF text extraction returns a sample research paper content
- AI debate shows a simulated conversation between "Pro Researcher" and "Critical Reviewer" agents
- All responses are hardcoded for demonstration purposes

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

## Project Structure

```
├── app/                     # Next.js app directory
│   ├── chat/               # AI debate chat interface
│   ├── pdf-extractor/      # PDF text extraction interface
│   └── layout.tsx          # Root layout component
├── components/             # Reusable UI components
│   └── ui/                # UI component library
├── lib/                   # Utilities and API services
│   ├── pdf-api.ts         # PDF processing (hardcoded responses)
│   └── utils.ts           # General utilities
└── public/               # Static assets
```

## Technology Stack

- **Framework**: Next.js 15.5.3 with App Router
- **UI**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React & Tabler Icons
- **File Upload**: React Dropzone

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Integration Notes

This is a demo version with hardcoded responses. To integrate with real AI services:

1. Replace the hardcoded responses in `lib/pdf-api.ts` with actual PDF processing
2. Replace the sample debate logic in the components with real AI API calls
3. Add environment variables for API keys and configuration
4. Implement proper error handling for API failures

## Demo Features

- Upload any PDF file to see sample text extraction
- Start an AI debate to see simulated conversation
- Switch between different views and themes
- All functionality works without any backend dependencies