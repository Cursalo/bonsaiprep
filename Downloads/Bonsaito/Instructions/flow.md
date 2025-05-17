# Development & Deployment Flow

## 1. Local Development
- Clone the repository
- Install dependencies with Composer
- Set up `.env` and database
- Run migrations and seeders
- Develop features in feature branches

## 2. Testing
- Write and run automated tests (Unit, Feature) using PHPUnit.
- Aim for high test coverage of critical application paths.
- Perform manual QA in local/staging environment.
- Consider browser testing with Laravel Dusk for frontend interactions.
- **Code Reviews:** Conduct code reviews before merging feature branches to ensure quality and adherence to best practices.

## 3. Staging Environment (Recommended)
- Deploy to a staging environment that mirrors production as closely as possible.
- Perform final UAT (User Acceptance Testing) on staging.

## 4. Deployment to cPanel (Production)
- **Backup:** Before deployment, ensure you have a recent backup of your production database and application files.
- Upload files to `public_html` via FTP or cPanel File Manager (or use a deployment script if possible).
- Set up database via cPanel.
- Update `.env` with production credentials (ensure `APP_ENV=production` and `APP_DEBUG=false`).
- Run `composer install --no-dev --optimize-autoloader`.
- Run `php artisan migrate --force` (the `--force` flag is needed for production).
- Run `php artisan config:cache`.
- Run `php artisan route:cache`.
- Run `php artisan view:cache` (if applicable).
- Set correct file permissions for `storage/` and `bootstrap/cache/`.
- Compile frontend assets for production (`npm run production` or `vite build`).

## 5. Post-Deployment
- Verify app functionality thoroughly in the production environment.
- Monitor logs and application performance (e.g., using Laravel Telescope, Sentry, or New Relic).
- Have a rollback plan in case of critical issues

## 5. SAT PDF Upload, OCR, and AI Question Generation Flow
- Student uploads SAT practice PDF via the LMS interface.
- System validates and stores the file.
- Background job (queue) runs OCR to extract questions, answers, and student responses.
- System checks which answers were incorrect.
- For each incorrect answer, a background job sends a prompt to Gemini/LLM to generate a new, similar question.
- New questions are stored and presented to the student for targeted practice.
- User receives progress/status updates throughout the process.

## 6. Video Lesson Remediation Flow
- Admin creates or selects a video lesson for a specific skill/concept.
- Admin creates 10 new questions related to the video/skill.
- When a student answers a question incorrectly, the system links the relevant video lesson and new questions for remediation.
- Student receives the video and new questions for targeted practice.
- System tracks student engagement with remediation content.

## 7. New Bonsai UI & Remediation Flow
- Lessons.tsx fetches and displays video lessons, sorted by skill mastery using SkillsProvider.
- Tabs allow filtering by recommended, completed, and all lessons.
- When a student answers a question incorrectly, the system fetches the remediation video and question set for that skill and presents them as a remediation module (VideoLesson + new questions).
- VideoLesson.tsx tracks watch progress and marks completion, updating user progress.
- Admin workflow (to be implemented): Admin creates/edits video lessons and 10-question sets, linking them to skills/concepts for remediation. 