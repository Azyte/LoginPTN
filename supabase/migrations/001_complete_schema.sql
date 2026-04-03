-- LoginPTN Database Schema Migration
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'mentor', 'admin')),
  bio TEXT,
  school TEXT,
  target_university_id INTEGER,
  target_major_id INTEGER,
  language_preference TEXT NOT NULL DEFAULT 'id',
  theme_preference TEXT NOT NULL DEFAULT 'dark',
  study_goal TEXT,
  daily_target_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- UNIVERSITIES & MAJORS
-- ============================================
CREATE TABLE IF NOT EXISTS public.universities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  location TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.majors (
  id SERIAL PRIMARY KEY,
  university_id INTEGER NOT NULL REFERENCES public.universities(id),
  name TEXT NOT NULL,
  faculty TEXT NOT NULL DEFAULT '',
  passing_score_estimate NUMERIC DEFAULT 0
);

-- ============================================
-- MENTOR APPLICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.mentor_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expertise_subject TEXT NOT NULL,
  experience TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- STREAKS
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE
);

CREATE TABLE IF NOT EXISTS public.streak_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SUBJECTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.subjects (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT
);

-- ============================================
-- QUESTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id INTEGER NOT NULL REFERENCES public.subjects(id),
  type TEXT NOT NULL DEFAULT 'multiple_choice' CHECK (type IN ('multiple_choice', 'multiple_select', 'short_answer')),
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  content TEXT NOT NULL,
  options JSONB,
  correct_answer JSONB NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id),
  answer JSONB NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bookmarks (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, question_id)
);

-- ============================================
-- TRYOUTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.tryouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 195,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tryout_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tryout_id UUID NOT NULL REFERENCES public.tryouts(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES public.subjects(id),
  duration_minutes INTEGER NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.tryout_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES public.tryout_sections(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id),
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.tryout_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tryout_id UUID NOT NULL REFERENCES public.tryouts(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  total_score NUMERIC,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

CREATE TABLE IF NOT EXISTS public.tryout_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES public.tryout_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id),
  section_id UUID NOT NULL REFERENCES public.tryout_sections(id),
  answer JSONB,
  is_correct BOOLEAN,
  time_spent_seconds INTEGER DEFAULT 0
);

-- ============================================
-- AI SYSTEM
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Percakapan Baru',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- STUDY GROUPS
-- ============================================
CREATE TABLE IF NOT EXISTS public.study_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  discord_link TEXT,
  max_members INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'file', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ANALYTICS
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES public.subjects(id),
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  accuracy NUMERIC NOT NULL DEFAULT 0,
  avg_time_seconds NUMERIC DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL
);

-- ============================================
-- GAMIFICATION
-- ============================================
CREATE TABLE IF NOT EXISTS public.badges (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id INTEGER NOT NULL REFERENCES public.badges(id),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_user_answers_user ON public.user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_tryout_attempts_user ON public.tryout_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group ON public.group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_streak_logs_user_date ON public.streak_logs(user_id, activity_date);

-- ============================================
-- RLS POLICIES (Enable Row Level Security)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tryout_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update their own
CREATE POLICY "Profiles are viewable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Universities and majors: public read
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Universities are public" ON public.universities FOR SELECT USING (true);
ALTER TABLE public.majors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Majors are public" ON public.majors FOR SELECT USING (true);

-- Subjects and questions: public read
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subjects are public" ON public.subjects FOR SELECT USING (true);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions are public" ON public.questions FOR SELECT USING (true);

-- User-specific data
CREATE POLICY "Users own their answers" ON public.user_answers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own their bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own their streaks" ON public.user_streaks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own their tryout attempts" ON public.tryout_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own their AI conversations" ON public.ai_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own AI messages" ON public.ai_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users insert own AI messages" ON public.ai_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = conversation_id AND user_id = auth.uid())
);

-- Tryouts: public read
ALTER TABLE public.tryouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tryouts are public" ON public.tryouts FOR SELECT USING (true);
ALTER TABLE public.tryout_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tryout sections are public" ON public.tryout_sections FOR SELECT USING (true);
ALTER TABLE public.tryout_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tryout questions are public" ON public.tryout_questions FOR SELECT USING (true);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    'student'
  );
  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak)
  VALUES (NEW.id, 0, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SEED DATA
-- ============================================

-- Subjects
INSERT INTO public.subjects (code, name, description) VALUES
  ('PU', 'Penalaran Umum', 'Penalaran Induktif, Deduktif, dan Kuantitatif'),
  ('PK', 'Pengetahuan Kuantitatif', 'Matematika Dasar dan Logika'),
  ('PBM', 'Pemahaman Bacaan dan Menulis', 'Membaca dan Menulis Kritis'),
  ('PPU', 'Pengetahuan dan Pemahaman Umum', 'Wawasan Umum dan Sosial'),
  ('LBI', 'Literasi Bahasa Indonesia', 'Pemahaman Teks Bahasa Indonesia'),
  ('LBE', 'Literasi Bahasa Inggris', 'Reading Comprehension English'),
  ('PM', 'Penalaran Matematika', 'Problem Solving Matematika')
ON CONFLICT (code) DO NOTHING;

-- Universities
INSERT INTO public.universities (name, short_name, location) VALUES
  ('Universitas Indonesia', 'UI', 'Depok, Jawa Barat'),
  ('Universitas Gadjah Mada', 'UGM', 'Yogyakarta'),
  ('Institut Teknologi Bandung', 'ITB', 'Bandung, Jawa Barat'),
  ('Universitas Airlangga', 'UNAIR', 'Surabaya, Jawa Timur'),
  ('Institut Teknologi Sepuluh Nopember', 'ITS', 'Surabaya, Jawa Timur'),
  ('Universitas Diponegoro', 'UNDIP', 'Semarang, Jawa Tengah'),
  ('Universitas Padjadjaran', 'UNPAD', 'Bandung, Jawa Barat'),
  ('Universitas Brawijaya', 'UB', 'Malang, Jawa Timur'),
  ('Institut Pertanian Bogor', 'IPB', 'Bogor, Jawa Barat'),
  ('Universitas Hasanuddin', 'UNHAS', 'Makassar, Sulawesi Selatan'),
  ('Universitas Sebelas Maret', 'UNS', 'Surakarta, Jawa Tengah'),
  ('Universitas Sumatera Utara', 'USU', 'Medan, Sumatera Utara'),
  ('Universitas Andalas', 'UNAND', 'Padang, Sumatera Barat'),
  ('Universitas Negeri Yogyakarta', 'UNY', 'Yogyakarta'),
  ('Universitas Negeri Malang', 'UM', 'Malang, Jawa Timur'),
  ('Universitas Pendidikan Indonesia', 'UPI', 'Bandung, Jawa Barat'),
  ('Universitas Negeri Semarang', 'UNNES', 'Semarang, Jawa Tengah'),
  ('Universitas Negeri Surabaya', 'UNESA', 'Surabaya, Jawa Timur'),
  ('Universitas Jember', 'UNEJ', 'Jember, Jawa Timur'),
  ('Universitas Lampung', 'UNILA', 'Bandar Lampung, Lampung'),
  ('Universitas Sriwijaya', 'UNSRI', 'Palembang, Sumatera Selatan'),
  ('Universitas Riau', 'UNRI', 'Pekanbaru, Riau'),
  ('Universitas Udayana', 'UNUD', 'Denpasar, Bali'),
  ('Universitas Negeri Jakarta', 'UNJ', 'Jakarta'),
  ('Universitas Syiah Kuala', 'USK', 'Banda Aceh, Aceh')
ON CONFLICT DO NOTHING;

-- Badges
INSERT INTO public.badges (name, description, icon, requirement_type, requirement_value) VALUES
  ('First Step', 'Selesaikan aktivitas pertama', '🌟', 'activity', 1),
  ('3-Day Streak', 'Belajar 3 hari berturut-turut', '✨', 'streak', 3),
  ('7-Day Streak', 'Belajar 7 hari berturut-turut', '⚡', 'streak', 7),
  ('14-Day Streak', 'Belajar 14 hari berturut-turut', '🔥', 'streak', 14),
  ('SNBT Warrior', 'Belajar 30 hari berturut-turut!', '🏆', 'streak', 30),
  ('Quiz Master', 'Jawab 100 soal', '📝', 'questions', 100),
  ('Tryout Hero', 'Selesaikan 5 tryout', '🎯', 'tryouts', 5),
  ('Perfect Score', 'Dapatkan 100% di satu sesi', '💯', 'perfect', 1)
ON CONFLICT DO NOTHING;
