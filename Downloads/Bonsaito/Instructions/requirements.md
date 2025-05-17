# LMS Requirements

## Server Requirements
- PHP 7.4+ with required extensions (OpenSSL, PDO, Mbstring, Tokenizer, XML, Ctype, JSON, BCMath)
- MySQL 5.7+
- Composer
- cPanel access

## Functional Requirements
- User authentication (multi-role)
- Course and lesson management
- Quizzes and assessments
- File uploads
- Progress tracking
- Dashboards
- Notifications
- Reports/analytics
- Responsive UI

## Security Requirements
- Password hashing (Laravel's default Bcrypt/Argon2)
- Input validation (using Laravel validation rules, Form Requests)
- CSRF protection (Laravel's built-in)
- XSS protection (Blade escaping by default, Content Security Policy)
- SQL Injection protection (via Eloquent/Query Builder)
- Role-based access control (RBAC) using Laravel Gates & Policies
- HTTPS enforced in production
- Regular security updates for Laravel and dependencies
- Secure file upload handling
- Rate limiting on sensitive endpoints

## Performance Requirements
- Efficient database queries (eager loading, indexing)
- Caching mechanisms implemented (config, route, view, query, application)
- Optimized frontend asset loading
- Use of queues for long-running background tasks
- Scalable architecture to handle [X] concurrent users (define target)
- Average page load time under [Y] seconds (define target)

## Reliability & Maintainability Requirements
- Comprehensive error logging and monitoring
- Adherence to coding standards (PSR) and Laravel best practices
- Modular code structure (SRP, services, repositories if applicable)
- Automated testing (Unit, Feature) with good coverage
- Clear and up-to-date documentation (code comments, external docs)
- Regular database backups

## SAT PDF Upload, OCR, and AI Question Generation Requirements

### Technical
- Support for PDF file uploads (max size, allowed types)
- Integration with OCR library (Tesseract, Spatie/pdf-to-text, or smalot/pdfparser)
- Integration with Gemini/LLM API for question generation
- Use of Laravel Queues for background processing
- Storage of extracted and generated data in the database

### Functional
- Students can upload SAT practice PDFs
- System extracts and parses questions, answers, and student responses
- System identifies incorrect answers
- System generates new, similar questions for incorrect answers
- Students can view and answer new questions in the LMS
- Progress/status feedback to users

### Security
- Validate and sanitize uploads
- Restrict file types and size
- Scan for malware
- Secure API communication with Gemini/LLM
- Error handling and logging for OCR/AI processes

## Video Lesson Remediation Requirements

### Technical
- Admin UI for creating/editing/deleting video lessons and question sets
- Database schema for associating videos and question sets with skills/concepts
- Student UI for viewing assigned videos and questions
- Tracking of student engagement with remediation content

### Functional
- Admin can create/edit/delete video lessons
- Admin can create/edit/delete sets of 10 questions
- Admin can assign a video and question set to a skill/concept
- When a student answers incorrectly, the system recommends the assigned video and questions
- Students can view the video and answer the new questions in the LMS
- System tracks which students have viewed remediation content and their progress

### Security
- Role-based access control for admin features
- Input validation for video URLs and question content
- Secure storage of video links and question data

## New Bonsai UI & Component Requirements

### Technical
- Lessons.tsx displays and filters video lessons by skill mastery (SkillsProvider)
- VideoLesson.tsx tracks video progress and completion
- SkillsProvider supplies skill data for recommendations and remediation
- UI presents remediation modules (VideoLesson + 10 new questions) for wrong answers
- Admin UI (to be implemented) for CRUD of videos and question sets, linked to skills/concepts
- Integration with backend APIs for video, question, and skill management

### Functional
- Students see recommended, completed, and all lessons
- Remediation modules are shown after wrong answers
- Video and question completion is tracked in the UI and backend
- Admins can create/edit/delete videos and question sets, and link them to skills

### Security
- Role-based access for admin features
- Input validation for video/question creation
- Secure API communication for all CRUD operations 