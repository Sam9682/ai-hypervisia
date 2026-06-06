# Implementation Plan: Course Generator

## Overview

Transformer la page Oracle existante en un générateur de cours mathématiques adaptés. L'implémentation crée un nouveau module backend `app/courses/` (schemas, prompt builder, service, router), un service frontend `courseService.ts`, et une nouvelle page `CourseGeneratorPage.tsx` remplaçant l'ancienne `OraclePage`. Le système scanne `docs/cours/`, appelle un fournisseur IA pour adapter le contenu, compile en PDF via pdflatex, et offre un téléchargement temporaire (1h).

## Tasks

- [x] 1. Set up backend module structure and schemas
  - [x] 1.1 Create `app/courses/__init__.py` and `app/courses/schemas.py` with Pydantic models
    - Create the `app/courses/` directory with `__init__.py`
    - Implement `GenerateCourseRequest`, `CourseItem`, `CourseListResponse`, `GenerateResponse`, `GenerateErrorResponse` schemas as defined in the design
    - Include `GeneratedPDF` dataclass for file storage metadata
    - _Requirements: 1.1, 4.1, 5.2, 6.2_

  - [x] 1.2 Create `app/courses/prompt_builder.py` with audience-specific prompt construction
    - Implement `build_adaptation_prompt(tex_content: str, audience: str) -> str`
    - Include system prompt with pedagogy expert role
    - Implement level-specific directives: seconde/terminale (intuitive, examples, accessible vocabulary), licence/master/ingenieur (intermediate proofs, application examples), professeur/chercheur (full proofs, bibliography, formal terminology)
    - Include LaTeX constraints (preserve theorem/definition/proof/equation/align environments, amsmath/amssymb/amsthm packages)
    - Include French language directive
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 2. Implement backend course service
  - [x] 2.1 Create `app/courses/service.py` with CourseService class
    - Implement `list_courses()`: scan `docs/cours/` for subdirectories containing `.tex` files, return sorted list with formatted display names (dots → spaces)
    - Implement `generate_course(course_name, audience, ai_provider, user_id)`: read `.tex` file, build prompt, call AI provider via `get_ai_provider()` from `app/oracle/ai_providers.py`, return adapted LaTeX
    - Implement `compile_pdf(latex_content, course_name, audience, user_id)`: write temp `.tex`, run pdflatex subprocess with 120s timeout, store PDF in `storage/generated_pdfs/`, create metadata entry, return download_id
    - Implement `get_pdf(download_id, user_id)`: validate ownership, check expiration, return file path
    - Implement `cleanup_expired_pdfs()`: remove files and metadata entries older than 1 hour
    - Manage `storage/generated_pdfs/index.json` for metadata persistence
    - Handle errors: empty directory (return empty list), AI timeout (120s), compilation failure (HTTP 422 with truncated error)
    - Generate filename format: `{nom_cours}_{audience}.pdf` with special chars replaced by underscores, max 100 chars
    - _Requirements: 1.1, 1.3, 4.1, 4.2, 4.6, 5.1, 5.2, 5.3, 5.5, 6.2, 6.3_

  - [ ]* 2.2 Write unit tests for CourseService
    - Test `list_courses()` with mock filesystem (empty dir, valid courses, no .tex files)
    - Test `build_adaptation_prompt()` for each audience level
    - Test `compile_pdf()` error handling (timeout, compilation failure)
    - Test `get_pdf()` ownership validation and expiration check
    - Test `cleanup_expired_pdfs()` removes only expired entries
    - Test filename generation (special chars, truncation to 100 chars)
    - _Requirements: 1.1, 1.3, 5.1, 5.3, 5.5, 6.2, 6.3_

- [x] 3. Implement backend router with auth and rate limiting
  - [x] 3.1 Create `app/courses/router.py` with API endpoints
    - Implement `GET /api/courses/list` → returns `CourseListResponse` (authenticated)
    - Implement `POST /api/courses/generate` → accepts `GenerateCourseRequest`, returns `GenerateResponse` (authenticated, rate limited 5/hour per user)
    - Implement `GET /api/courses/download/{id}` → returns `FileResponse` with `Content-Disposition: attachment` (authenticated, ownership check)
    - Apply JWT authentication via existing `get_current_user` dependency
    - Apply rate limiting using slowapi with user_id key (5 generations per 60-minute sliding window)
    - Return appropriate HTTP errors: 401 (no/invalid token), 403 (wrong owner), 404 (expired PDF), 422 (compilation error), 429 (rate limit exceeded)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 6.1, 6.4, 6.5, 6.6_

  - [ ]* 3.2 Write unit tests for courses router
    - Test authentication enforcement on all endpoints
    - Test rate limit (5/hour) enforcement
    - Test download ownership validation (403 for wrong user)
    - Test expired PDF returns 404
    - Test successful generation flow end-to-end (mocked AI + pdflatex)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 6.5, 6.6_

- [x] 4. Register backend module and add scheduler task
  - [x] 4.1 Register courses router in `app/main.py` and add cleanup job to `app/scheduler.py`
    - Import and include `courses_router` in `app/main.py`
    - Add `cleanup_expired_pdfs_job` to `TaskScheduler` in `app/scheduler.py` running every 15 minutes
    - Create `storage/generated_pdfs/` directory and `index.json` initialization in startup if not exists
    - _Requirements: 6.3, 5.2_

- [x] 5. Checkpoint - Backend verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement frontend service and types
  - [x] 6.1 Create `frontend/src/services/courseService.ts` with API client
    - Define TypeScript interfaces: `CourseItem`, `CourseListResponse`, `GenerateCourseRequest`, `GenerateResponse`, `AudienceLevel`
    - Define `AUDIENCE_LABELS` mapping and `AI_PROVIDERS` config
    - Implement `listCourses()`: GET `/api/courses/list`
    - Implement `generateCourse(request)`: POST `/api/courses/generate`
    - Implement `getDownloadUrl(downloadId)`: construct download URL with auth token
    - Use existing `api` axios instance from `services/api.ts`
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 7. Implement frontend CourseGeneratorPage
  - [x] 7.1 Create `frontend/src/pages/CourseGeneratorPage.tsx` replacing OraclePage
    - Implement 3-section layout: (1) Course selection — scrollable list with alphabetical sort, (2) Audience selection — radio buttons with default "licence" + AI provider dropdown with default "shai", (3) Generation & Download — generate button, loading indicator, result display, download button
    - Implement course list loading on page mount with error/empty state handling
    - Implement audience level selection with visual active state
    - Implement AI provider selector (shai, kiro, openai) disabled during generation
    - Implement generate button: disabled until course + audience selected, disabled during generation
    - Implement loading state: animated indicator with informative text, all selectors disabled
    - Implement result display: LaTeX content zone with copy capability, download `.tex` button
    - Implement PDF download button: appears on success, triggers file download
    - Implement error handling: display error message, suggest retry with different provider on compilation failure, re-enable controls
    - Implement success notification: display course name, visible 5 seconds or until dismissed
    - Implement expired PDF handling: show message and offer to regenerate
    - Ensure responsive layout (desktop ≥1024px, tablet ≥768px, no horizontal scroll)
    - _Requirements: 1.2, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.3, 4.4, 4.5, 4.7, 4.8, 4.9, 5.4, 6.1, 6.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 7.2 Write unit tests for CourseGeneratorPage
    - Test initial render: default audience "licence", default provider "shai", generate button disabled
    - Test course selection enables generate button
    - Test loading state disables all controls
    - Test error display and control re-enable
    - Test empty course list message display
    - _Requirements: 2.5, 3.2, 4.4, 4.5, 4.7, 1.4_

- [x] 8. Wire frontend routing and update App
  - [x] 8.1 Update `frontend/src/App.tsx` to use CourseGeneratorPage on `/oracle` route
    - Replace `OraclePage` import with `CourseGeneratorPage`
    - Keep the `/oracle` route path unchanged
    - Update navigation label in Layout component (Oracle → Générateur de Cours)
    - Remove or keep the old `OraclePage.tsx` file (can be removed if no longer needed)
    - _Requirements: 8.1_

- [-] 9. Checkpoint - Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Ensure Dockerfile has LaTeX support
  - [x] 10.1 Verify pdflatex availability in the backend Dockerfile
    - Confirm `texlive-latex-base`, `texlive-latex-extra`, `texlive-fonts-recommended`, `texlive-lang-french` packages are installed
    - Confirm `pdflatex` is available in PATH
    - Confirm `storage/generated_pdfs/` directory is created in the image
    - _Requirements: 5.1_

- [~] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The backend reuses the existing AI provider infrastructure from `app/oracle/ai_providers.py`
- The frontend reuses the existing `api.ts` axios instance with JWT interceptor
- pdflatex is already installed in the Dockerfile (`texlive-latex-base`, `texlive-latex-extra`, `texlive-fonts-recommended`, `texlive-lang-french`)
- Rate limiting uses slowapi with a custom key based on `user_id` (not IP)
- The `storage/generated_pdfs/index.json` file tracks active PDFs and their metadata
- `CourseGeneratorPage.tsx` is already implemented and ready; task 7.1 is a verification/refinement task
- `App.tsx` still references `OraclePage` on the `/oracle` route — task 8.1 wires in the new page

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["3.2", "4.1"] },
    { "id": 4, "tasks": ["6.1"] },
    { "id": 5, "tasks": ["7.1", "10.1"] },
    { "id": 6, "tasks": ["7.2", "8.1"] }
  ]
}
```
