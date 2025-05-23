# Bonsaito - SAT Practice Question Generator

Bonsaito is an application that helps students prepare for the SAT by generating personalized practice questions based on their SAT practice test reports.

## Features

- Upload SAT practice test reports (PDF or TXT format)
- Paste text directly from SAT score reports
- Automatically extract and analyze test data
- Generate 10 personalized practice questions based on the student's performance
- Organize questions by topic and difficulty level
- Provide detailed explanations for each question

## UI/UX Features

The application has been enhanced with a beautiful, modern user interface featuring:

### Phthalo Green Theme
- Rich phthalo green gradient backgrounds
- High contrast, readable text
- Dark mode optimized for reduced eye strain
- Elegant glass-morphism effect throughout the interface

### Animation Components
- Fluid, natural animations using React Spring
- Various animation types: fade, scale, float, slide, and more
- Staggered list animations for smooth UI transitions
- Shimmer effects for buttons and interactive elements

### Custom Components
- **GlassCard**: Beautiful glass-effect cards with subtle hover animations
- **GradientButton**: Stylish gradient buttons with shimmer effects
- **LoadingSpinner**: Custom loading spinner with glow effects
- **AnimationEffects**: Collection of reusable animation components

### Enhanced Features
- 8px rounded corners throughout the interface
- Subtle shadows and depth effects
- Responsive design that looks great on all devices
- Smooth animations and transitions between pages

The UI is designed to provide a premium experience while keeping performance in mind. All animations are optimized for smooth rendering even on lower-end devices.

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

## API Configuration

### Gemini API Setup

The application uses Google's Gemini API to generate personalized SAT practice questions. To enable this feature:

1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a `.env.local` file in the project root with the following content:
   ```
   REACT_APP_GEMINI_API_KEY=your_api_key_here
   ```
3. Replace `your_api_key_here` with your actual API key

Note: If the API key is not configured, the application will fall back to using template-based question generation. 