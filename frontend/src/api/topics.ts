import { api } from "@/lib/api";
import type {
  CalendarMonth,
  Revision,
  RevisionWithTopic,
  Topic,
  TopicDetail,
  TopicListParams,
  TopicPayload,
  TopicUpdatePayload,
} from "@/types";

export async function listTopics(params: TopicListParams): Promise<Topic[]> {
  const { data } = await api.get<Topic[]>("/topics", { params: cleanParams({ ...params }) });
  return data;
}

export async function getTopic(id: number): Promise<TopicDetail> {
  const { data } = await api.get<TopicDetail>(`/topics/${id}`);
  return data;
}

export async function createTopic(payload: TopicPayload): Promise<TopicDetail> {
  const { data } = await api.post<TopicDetail>("/topics", payload);
  return data;
}

export async function updateTopic(id: number, payload: TopicUpdatePayload): Promise<TopicDetail> {
  const { data } = await api.put<TopicDetail>(`/topics/${id}`, payload);
  return data;
}

export async function deleteTopic(id: number): Promise<void> {
  await api.delete(`/topics/${id}`);
}

export async function revisionsToday(): Promise<RevisionWithTopic[]> {
  const { data } = await api.get<RevisionWithTopic[]>("/revisions/today");
  return data;
}

export async function revisionsUpcoming(limit = 50): Promise<RevisionWithTopic[]> {
  const { data } = await api.get<RevisionWithTopic[]>("/revisions/upcoming", {
    params: { limit },
  });
  return data;
}

export async function calendarMonth(year: number, month: number): Promise<CalendarMonth> {
  const { data } = await api.get<CalendarMonth>("/revisions/calendar", {
    params: { year, month },
  });
  return data;
}

export async function completeRevision(revisionId: number): Promise<Revision> {
  const { data } = await api.post<Revision>(`/revisions/${revisionId}/complete`);
  return data;
}

function cleanParams(params: Record<string, unknown>): Record<string, string | number> {
  const cleaned: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      cleaned[key] = typeof value === "string" ? value : (value as number);
    }
  }
  return cleaned;
}