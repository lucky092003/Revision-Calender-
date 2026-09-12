export type Difficulty = "easy" | "medium" | "hard";

export type RevisionStatus = "upcoming" | "due_today" | "completed" | "overdue";

export type TopicStatus = "all" | RevisionStatus;

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  full_name?: string | null;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface Topic {
  id: number;
  title: string;
  subject: string;
  description: string | null;
  studied_on: string;
  source: string | null;
  difficulty: Difficulty;
  notes: string | null;
  created_at: string;
  updated_at: string;
  total_revisions: number;
  completed_revisions: number;
  next_revision: string | null;
  next_revision_number: number | null;
  status: TopicStatus;
}

export interface TopicPayload {
  title: string;
  subject: string;
  description?: string | null;
  studied_on: string;
  source?: string | null;
  difficulty: Difficulty;
  notes?: string | null;
}

export interface TopicUpdatePayload {
  title?: string;
  subject?: string;
  description?: string | null;
  studied_on?: string;
  source?: string | null;
  difficulty?: Difficulty;
  notes?: string | null;
}

export interface Revision {
  id: number;
  topic_id: number;
  revision_number: number;
  scheduled_date: string;
  status: RevisionStatus;
  completed_at: string | null;
}

export interface TopicBrief {
  id: number;
  title: string;
  subject: string;
  difficulty: Difficulty;
  studied_on: string;
}

export interface RevisionWithTopic extends Revision {
  topic: TopicBrief;
}

export interface TopicDetail extends Topic {
  revisions: Revision[];
}

export interface CalendarDay {
  date: string;
  revisions: RevisionWithTopic[];
}

export interface CalendarMonth {
  year: number;
  month: number;
  days: CalendarDay[];
}

export interface TopicListParams {
  q?: string;
  subject?: string;
  difficulty?: Difficulty;
  status?: TopicStatus;
  sort?: "studied_on" | "next_revision" | "created_at";
  order?: "asc" | "desc";
}