# Backend Guidelines

## Overview
The backend is built with Laravel (PHP) and MySQL, designed for modularity, security, and scalability.

## Folder Structure
- `app/` - Application logic (models, controllers, services)
- `routes/` - Route definitions
- `database/` - Migrations and seeders
- `resources/` - Views and language files
- `public/` - Publicly accessible files (entry point: index.php)

## Main Technologies
- Laravel Framework
- MySQL
- Composer (dependency management)

## Best Practices

### Code Quality & Maintainability
- **SOLID Principles:** Adhere to SOLID design principles to create maintainable and flexible code.
    - **Single Responsibility Principle (SRP):** Classes and methods should have one specific responsibility. Move business logic to Service classes, validation to Form Request classes, and query logic to Models or Repositories.
- **PSR Standards:** Follow PHP Standard Recommendations (PSR-1, PSR-2/PSR-12, PSR-4) for coding style and autoloading. Use tools like PHP_CodeSniffer and PHP-CS-Fixer to enforce standards.
- **DRY (Don't Repeat Yourself):** Avoid code duplication by using Eloquent scopes, Blade components, traits, helper functions, and service classes.
- **Naming Conventions:** Strictly follow Laravel's naming conventions for controllers, models, migrations, routes, etc.
- **Readability:** Use descriptive names for variables, methods, and classes. Prefer clear code over excessive comments.
- **Dependency Injection & IoC Container:** Utilize Laravel's Inversion of Control container and dependency injection to manage class dependencies, promoting loose coupling and testability.
- **Configuration:** Access environment variables through `config()` files, not directly with `env()` outside of configuration files.
- **Service Classes:** Encapsulate business logic within service classes to keep controllers lean.
- **Repository Pattern (Optional):** For complex applications, consider the repository pattern to abstract data layer logic.

### Database Interactions
- **Eloquent ORM:** Prefer Eloquent for database interactions.
    - **Eager Loading:** Prevent N+1 problems by using `with()` and `load()` to eager load relationships.
    - **Efficient Queries:** Write optimized queries. Use `chunk()` or `cursor()` for processing large datasets.
    - **Mass Assignment:** Utilize mass assignment securely by defining `$fillable` or `$guarded` properties in models.
- **Migrations:** Always use migrations for database schema changes. Keep migrations small and focused.
- **Seeders & Factories:** Use seeders and model factories for populating the database with test and default data.
- **Avoid Raw SQL:** Minimize raw SQL queries. If necessary, use parameterized queries to prevent SQL injection.

### Security
- **Input Validation:** Rigorously validate all incoming data using Laravel's validation features, preferably within Form Request classes.
- **Authentication & Authorization:**
    - Implement strong authentication.
    - Use Laravel's Gates and Policies for robust authorization and access control.
- **Prevent SQL Injection:** Eloquent and Query Builder provide good protection when used correctly (avoid raw queries where possible).
- **Prevent XSS:** Blade templates escape output by default (`{{ }}`). Be cautious with unescaped data (`{!! !!}`). Implement Content Security Policy (CSP).
- **CSRF Protection:** Ensure `@csrf` token is used in all forms.
- **HTTPS:** Enforce HTTPS in production.
- **Secrets Management:** Store sensitive credentials in `.env` and access via `config()` files. Never commit `.env` to version control.
- **Rate Limiting:** Implement rate limiting on authentication routes and sensitive APIs.
- **File Uploads:** Securely handle file uploads by validating types, sizes, and potentially scanning for malware.
- **Keep Dependencies Updated:** Regularly run `composer update` to get the latest security patches for Laravel and third-party packages.
- **Disable Debug Mode in Production:** Ensure `APP_DEBUG` is `false` in production environments.

### Error Handling & Logging
- **Centralized Exception Handling:** Customize `App/Exceptions/Handler.php` for global exception handling.
- **Comprehensive Logging:** Configure Laravel's logging (Monolog) effectively. Use appropriate log levels and channels for different environments. Consider services like Sentry or Papertrail for production.
- **User-Friendly Error Pages:** Provide clear and user-friendly error pages for common HTTP errors (404, 500, etc.).

### Testing
- **Write Tests:** Implement unit, feature, and integration tests using PHPUnit.
- **Test-Driven Development (TDD):** Consider adopting TDD practices.
- **Coverage:** Aim for good test coverage for critical parts of the application.

## Best Practices
- Use Eloquent ORM for database interactions
- Follow MVC pattern
- Use environment variables for sensitive config
- Write tests for critical features
- Use Laravel's built-in validation and security features

## File Uploader with OCR & AI Question Generation

### Overview
The backend supports uploading SAT practice PDFs. It uses OCR to extract answers, checks which were incorrect, and uses an AI (Gemini/LLM) to generate new, similar questions for targeted practice.

### Workflow
1. **Student uploads SAT PDF.**
2. **OCR extracts text and parses answers.**
3. **System checks which answers were incorrect.**
4. **For each incorrect answer, the system prompts Gemini/LLM to generate a new question on the same concept.**
5. **Student receives new, personalized practice questions.**

### Tech Stack
- PDF Parsing/OCR: Tesseract OCR (via PHP wrapper), Spatie/pdf-to-text, or smalot/pdfparser.
- AI Integration: Gemini API (or OpenAI API) via HTTP requests from Laravel.
- Queues: Laravel Queues for background processing of OCR and AI calls.

### Best Practices
- Validate and sanitize uploads, restrict file types and size, scan for malware.
- Log and report OCR/AI errors, provide user feedback.
- Use queues for heavy processing, cache results.
- Abstract OCR and AI logic for future upgrades.
- Unit and integration tests for upload, parsing, and AI workflows.

### Example Gemini Prompt
```
Given this SAT question and the student's wrong answer, generate a new, similar question targeting the same skill:
Original Question: [insert question]
Correct Answer: [insert answer]
Student's Answer: [insert answer]
```

### References
- https://github.com/thiagoalessio/tesseract-ocr-for-php
- https://github.com/spatie/pdf-to-text
- https://ai.google.dev/
- https://laravel.com/docs/queues 

## Video Lesson Logic & Admin Remediation

### Overview
The backend supports associating specific video lessons with wrong answers. When a student answers incorrectly, the system can recommend a targeted video lesson. Admins can create a set of 10 new questions and assign a remediation video for students who need extra help.

### Workflow
1. Admin creates or selects a video lesson relevant to a skill/concept.
2. Admin creates 10 new questions related to the video/skill.
3. When a student answers a question incorrectly, the system links the relevant video lesson and new questions for remediation.
4. Student receives the video and new questions for targeted practice.

### Tech Stack
- Video hosting: YouTube, Vimeo, or self-hosted (link stored in DB)
- Admin UI for question and video management
- Student UI for viewing assigned videos and questions

### Best Practices
- Store video links and question sets in the database, associated with skills/concepts.
- Allow admins to easily manage (CRUD) videos and question sets.
- Track student engagement with remediation content. 

## Implementation Notes from New Bonsai React Codebase

### Component Structure
- **VideoLesson.tsx**: React component for displaying a video lesson, tracking watch progress, and marking completion. Accepts props for video metadata, skill association, and completion callback. Designed for both general and remediation video delivery.
- **Lessons.tsx**: Page that fetches and displays a list of video lessons, sorted by skill mastery. Integrates with SkillsProvider to recommend videos for weaker skills and supports filtering (recommended, completed, all). Handles marking videos as completed and updating UI accordingly.
- **SkillsProvider.tsx**: Provides skill mastery data to components, enabling personalized recommendations and remediation.

### Remediation & Recommendation Logic
- When a student answers a question incorrectly, the system can look up the associated skill and fetch the remediation video and question set for that skill.
- The UI presents the VideoLesson component and new questions as a remediation module.
- Lessons.tsx supports tabs for recommended, completed, and all lessons, and can be extended to show remediation-specific content.

### Admin Workflow (to be implemented)
- Admin UI should allow creation/editing of video lessons and authoring of 10-question sets per skill.
- Videos and question sets are linked to skills/concepts in the database.

### Tracking & Analytics
- VideoLesson uses a completion callback to update backend/user progress.
- Student engagement with remediation content can be tracked and analyzed.

### Best Practices
- Use React context (SkillsProvider) for skill state management.
- Modularize video, quiz, and skill logic for maintainability.
- Ensure backend API supports CRUD for videos, questions, and skill associations. 