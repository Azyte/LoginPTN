-- LoginPTN Database Performance Optimization
-- This script creates B-Tree indexes on foreign keys and frequently filtered columns.
-- Without these, PostgreSQL performs Sequential Scans on large tables.

-- 1. Tryout Attempts (Optimizes: Fetching user's tryout history)
CREATE INDEX IF NOT EXISTS idx_tryout_attempts_user_id ON public.tryout_attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_tryout_attempts_tryout_id ON public.tryout_attempts (tryout_id);

-- 2. User Answers (Optimizes: Global Leaderboard & Answer History)
CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON public.user_answers (user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON public.user_answers (question_id);

-- 3. Tryout Answers (Optimizes: Fetching result details from a tryout attempt)
CREATE INDEX IF NOT EXISTS idx_tryout_answers_attempt_id ON public.tryout_answers (attempt_id);
CREATE INDEX IF NOT EXISTS idx_tryout_answers_question_id ON public.tryout_answers (question_id);

-- 4. Questions & Tryout Structure (Optimizes: Bank Soal fetching by subject)
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON public.questions (subject_id);
CREATE INDEX IF NOT EXISTS idx_tryout_questions_section_id ON public.tryout_questions (section_id);
CREATE INDEX IF NOT EXISTS idx_tryout_questions_question_id ON public.tryout_questions (question_id);

-- 5. Bookmarks (Optimizes: Bank Soal bookmark indicator per folder)
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks (user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_question_id ON public.bookmarks (question_id);
