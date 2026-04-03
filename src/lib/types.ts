export type UserRole = "student" | "mentor" | "admin";
export type QuestionType = "multiple_choice" | "multiple_select" | "short_answer";
export type Difficulty = "easy" | "medium" | "hard";
export type TryoutStatus = "in_progress" | "completed" | "abandoned";
export type ApplicationStatus = "pending" | "approved" | "rejected";
export type MessageRole = "user" | "assistant";

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  bio: string | null;
  school: string | null;
  target_university_id: number | null;
  target_major_id: number | null;
  language_preference: string;
  theme_preference: string;
  study_goal: string | null;
  daily_target_minutes: number;
  created_at: string;
}

export interface University {
  id: number;
  name: string;
  short_name: string;
  location: string;
}

export interface Major {
  id: number;
  university_id: number;
  name: string;
  faculty: string;
  passing_score_estimate: number;
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  description: string;
}

export interface Question {
  id: string;
  subject_id: number;
  type: QuestionType;
  difficulty: Difficulty;
  content: string;
  options: { key: string; text: string }[] | null;
  correct_answer: string | string[];
  explanation: string;
  created_at: string;
  subject?: Subject;
}

export interface UserAnswer {
  id: string;
  user_id: string;
  question_id: string;
  answer: string | string[];
  is_correct: boolean;
  time_spent_seconds: number;
  created_at: string;
}

export interface Bookmark {
  user_id: string;
  question_id: string;
  created_at: string;
}

export interface Tryout {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  sections?: TryoutSection[];
}

export interface TryoutSection {
  id: string;
  tryout_id: string;
  subject_id: number;
  duration_minutes: number;
  order_index: number;
  subject?: Subject;
  questions?: TryoutQuestion[];
}

export interface TryoutQuestion {
  id: string;
  section_id: string;
  question_id: string;
  order_index: number;
  question?: Question;
}

export interface TryoutAttempt {
  id: string;
  user_id: string;
  tryout_id: string;
  started_at: string;
  finished_at: string | null;
  total_score: number | null;
  status: TryoutStatus;
  tryout?: Tryout;
}

export interface TryoutAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  section_id: string;
  answer: string | string[] | null;
  is_correct: boolean | null;
  time_spent_seconds: number;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface UserStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  discord_link: string | null;
  max_members: number;
  created_at: string;
  member_count?: number;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: "owner" | "moderator" | "member";
  joined_at: string;
  profile?: Profile;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  type: "text" | "file" | "system";
  created_at: string;
  profile?: Profile;
}

export interface UserPerformance {
  id: string;
  user_id: string;
  subject_id: number;
  total_questions: number;
  correct_answers: number;
  accuracy: number;
  avg_time_seconds: number;
  period_start: string;
  period_end: string;
  subject?: Subject;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
}

export interface UserBadge {
  user_id: string;
  badge_id: number;
  earned_at: string;
  badge?: Badge;
}

export interface DashboardStats {
  totalQuestions: number;
  totalCorrect: number;
  totalTryouts: number;
  avgAccuracy: number;
  streak: UserStreak | null;
  recentActivity: { date: string; count: number }[];
}
