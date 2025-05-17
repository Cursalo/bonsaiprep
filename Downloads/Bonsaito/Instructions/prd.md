# Product Requirements Document (PRD) - Laravel LMS

## Overview
A robust Learning Management System (LMS) designed for easy deployment on cPanel using Laravel (PHP) and MySQL. The system supports multiple user roles, course and lesson management, quizzes, file uploads, progress tracking, notifications, and analytics.

## Features
- User roles: Admin, Instructor, Student
- User authentication and profiles
- Course management (create, edit, delete, enroll)
- Lesson management (video, text, files)
- Quizzes and assessments (auto-graded and manual)
- Progress tracking (per user, per course)
- File uploads (assignments, resources)
- Dashboards for each role
- Notifications (email, in-app)
- Reports and analytics
- Responsive design (Bootstrap)

## Tech Stack
- PHP 7.4+ (Laravel Framework)
- MySQL
- Bootstrap 5
- JavaScript (Vanilla or jQuery)

## Milestones
1. Project setup
2. Auth system (multi-role)
3. Course & lesson management
4. Quiz/assessment engine
5. File upload & management
6. Progress tracking
7. Dashboards
8. Notifications
9. Reports/analytics
10. Testing & deployment

## SAT PDF Upload, OCR, and AI Question Generation

### Description
Students can upload SAT practice PDFs. The system extracts their answers, checks which were incorrect, and uses an AI (Gemini/LLM) to generate new, similar questions for further practice.

### User Stories
- As a student, I want to upload my SAT practice PDF and get instant feedback on my performance.
- As a student, I want to receive new, similar questions for the ones I got wrong, so I can improve my skills.
- As an admin/instructor, I want to track which students are using the feature and their progress.

### Acceptance Criteria
- The system accepts PDF uploads and validates file type/size.
- OCR accurately extracts questions, answers, and student responses.
- The system identifies incorrect answers.
- For each incorrect answer, the system generates a new, similar question using Gemini/LLM.
- Students can view and answer the new questions in the LMS.
- All processing is secure, robust, and provides user feedback on progress/errors.

## Video Lesson Remediation

### Description
Admins can create or select a video lesson and author 10 new questions related to a specific skill/concept. When a student answers a question incorrectly, the system recommends the relevant video and new questions for targeted remediation.

### User Stories
- As an admin, I want to create a set of 10 questions and assign a video lesson for remediation.
- As a student, I want to receive a video lesson and new questions when I get an answer wrong, so I can learn and practice the concept.
- As an admin/instructor, I want to track which students have viewed the remediation content and their progress.

### Acceptance Criteria
- Admin can create/edit/delete video lessons and question sets.
- Admin can assign a video and 10 questions to a specific skill/concept.
- When a student answers incorrectly, the system recommends the assigned video and questions.
- Students can view the video and answer the new questions in the LMS.
- System tracks student engagement and progress with remediation content.

## Implementation Notes from New Bonsai React Codebase

### UI & Component Logic
- Lessons.tsx displays video lessons, sorted by skill mastery (SkillsProvider), with tabs for recommended, completed, and all lessons.
- VideoLesson.tsx handles video display, progress tracking, and completion marking.
- When a student answers incorrectly, the system presents a remediation module: VideoLesson + 10 new questions for the relevant skill.
- Admin workflow (to be implemented): Admin creates/edits video lessons and question sets, linking them to skills/concepts for remediation.
- UI supports tracking of video completion and student engagement with remediation content. 