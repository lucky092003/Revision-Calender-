import { api } from "@/lib/api";

export interface RegisterPayloadInput {
  email: string;
  username: string;
  password: string;
  full_name?: string | null;
}

export interface LoginPayloadInput {
  identifier: string;
  password: string;
}

export async function registerRequest(payload: RegisterPayloadInput) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function loginRequest(payload: LoginPayloadInput) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function meRequest() {
  const { data } = await api.get("/auth/me");
  return data;
}