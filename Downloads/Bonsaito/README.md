# Bonsaito - SAT Practice Question Generator

Bonsaito is an application that helps students prepare for the SAT by generating personalized practice questions based on their SAT practice test reports.

## Features

- Upload SAT practice test reports (PDF or TXT format)
- Paste text directly from SAT score reports
- Automatically extract and analyze test data
- Generate 10 personalized practice questions based on the student's performance
- Organize questions by topic and difficulty level
- Provide detailed explanations for each question

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm
- A Google AI Studio (Gemini) API key

### Environment Setup

1. Create a `.env.local` file in the root directory with the following variables:

```
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google AI (Gemini) API Key
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

### Getting a Gemini API Key

1. Visit the [Google AI Studio](https://ai.google.dev/) website
2. Sign in with your Google account
3. Navigate to the API Keys section
4. Create a new API key
5. Copy the API key and paste it into your `.env.local` file

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Build for production
npm run build
```

## Technical Details

The application uses:

- React for the frontend
- Supabase for backend and storage
- Google's Gemini AI for generating personalized practice questions

### AI Integration

The application uses the Gemini API to analyze SAT reports and generate personalized practice questions. The integration is implemented in `src/services/aiService.ts`.

If the Gemini API key is not configured or if the API call fails, the application falls back to using template-based question generation to ensure reliability.

## Deployment

The application can be deployed to Vercel by connecting your GitHub repository to Vercel and setting up the necessary environment variables in the Vercel dashboard.

Make sure to add all the environment variables mentioned in the Environment Setup section to your Vercel project settings.

## License

[MIT License](LICENSE) 