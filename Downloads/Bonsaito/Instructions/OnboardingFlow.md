# User Onboarding Flow

This document provides technical details about the 8-step onboarding flow that collects user information after the first login.

## Overview

The onboarding flow collects essential information about users to personalize their learning experience:

1. First Name & Last Name
2. Age
3. Country & City
4. Current SAT Score
5. Target SAT Score
6. Motivation
7. SAT Score Report (text & PDF upload)
8. Review & Submit

## Technical Implementation

### Components

- **OnboardingFlow.tsx**: Main component that manages the multi-step wizard
- **PdfUploader.tsx**: Component for uploading and processing PDF files
- **App.tsx**: Updated to check for first login and redirect to onboarding

### Database

The user data is stored in the `user_onboarding` table in Supabase with the following schema:

```sql
CREATE TABLE user_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  age INTEGER CHECK (age > 0),
  country TEXT,
  city TEXT,
  sat_score INTEGER CHECK (sat_score >= 400 AND sat_score <= 1600),
  target_sat_score INTEGER NOT NULL CHECK (target_sat_score >= 1000 AND target_sat_score <= 1600),
  motivation TEXT,
  score_report TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);
```

### Storage

PDF files are stored in a Supabase Storage bucket called `uploads`.

### Edge Functions

- **ocr-pdf**: Edge function for extracting text from uploaded PDF files (currently uses mock data)

## Features

- Modern gradient backgrounds for each step
- Smooth page transitions and micro-animations
- Form validation
- Progress saving in localStorage
- Mobile responsive design
- SAT score report text extraction
- Country selection with flags
- City auto-suggestion based on country

## Flow Logic

1. When a user logs in for the first time, they are redirected to the onboarding flow
2. Each step validates input before proceeding to the next
3. Users can navigate back and forth between steps
4. Progress is saved automatically to localStorage in case of page reload
5. On final submission, data is saved to Supabase and localStorage is cleared
6. After completion, user is redirected to the dashboard

## Customization

To modify the onboarding flow:

- Add additional steps by extending the `steps` array and adding corresponding case handlers
- Modify field validations in the `validateStep` function
- Change gradient backgrounds by updating the `gradients` array
- Add or remove fields from the `OnboardingData` interface and update the Supabase insert

## Technical Debt & Future Improvements

1. Implement actual PDF text extraction in the Edge Function
2. Add better error handling for network issues
3. Implement a progress indicator for large file uploads
4. Add animations for form field validation
5. Implement a way to skip onboarding but remind later 