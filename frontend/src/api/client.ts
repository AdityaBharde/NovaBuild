import { User, Project, ProjectFile, SandboxStatus } from '../types';

const API_BASE = '/api/v1';

export async function loginUser(email: string, password: string): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Login failed. Please check credentials.');
  const data = await res.json();
  if (data.token) {
    localStorage.setItem('novabuild_token', data.token);
    localStorage.setItem('novabuild_user', JSON.stringify(data));
  }
  return data;
}

export async function registerUser(email: string, password: string, name: string): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) throw new Error('Registration failed.');
  const data = await res.json();
  if (data.token) {
    localStorage.setItem('novabuild_token', data.token);
    localStorage.setItem('novabuild_user', JSON.stringify(data));
  }
  return data;
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem('novabuild_user');
  return raw ? JSON.parse(raw) : null;
}

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('novabuild_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function createProject(name: string, description: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
}

export async function deploySandbox(projectId: string): Promise<SandboxStatus> {
  const res = await fetch(`${API_BASE}/sandbox/${projectId}/deploy`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to trigger preview container deployment');
  return res.json();
}

export async function getSandboxStatus(projectId: string): Promise<SandboxStatus | null> {
  const res = await fetch(`${API_BASE}/sandbox/${projectId}/status`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) return null;
  return res.json();
}
