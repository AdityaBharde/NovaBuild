import { User, Project, ProjectFile, SandboxStatus, Subscription, Plan, UserProfile } from '../types';

export const getBasePath = (): string => {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/projects/novabuild')) {
    return '/projects/novabuild';
  }
  const envBase = (import.meta as any).env?.BASE_URL || '/';
  return envBase.replace(/\/+$/, '');
};

export const BASE_PATH = getBasePath();
export const GATEWAY_BASE = `${BASE_PATH}/api/v1`;
export const ACCOUNT_DIRECT = `${BASE_PATH}/api/v1`;
export const CHAT_STREAM_URL = `${GATEWAY_BASE}/chat/stream`;

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('novabuild_user');
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse stored user:', e);
    localStorage.removeItem('novabuild_user');
    localStorage.removeItem('novabuild_token');
    return null;
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('novabuild_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function logoutUser(): void {
  localStorage.removeItem('novabuild_token');
  localStorage.removeItem('novabuild_user');
}

// ----------------- AUTH & USER -----------------

export async function loginUser(email: string, password: string): Promise<User> {
  let res = await fetch(`${GATEWAY_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password }),
  });
  if (!res.ok) {
    res = await fetch(`${BASE_PATH}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password }),
    });
  }
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'Login failed. Please check credentials.');
  }
  const data = await res.json();
  const user: User = {
    userId: data.user?.id || data.userId || '1',
    email: data.user?.username || email,
    name: data.user?.name || email.split('@')[0],
    role: 'USER',
    token: data.token,
  };
  localStorage.setItem('novabuild_token', data.token);
  localStorage.setItem('novabuild_user', JSON.stringify(user));
  return user;
}

export async function registerUser(email: string, password: string, name: string): Promise<User> {
  let res = await fetch(`${GATEWAY_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password, name }),
  });
  if (!res.ok) {
    res = await fetch(`${BASE_PATH}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password, name }),
    });
  }
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'Registration failed.');
  }
  const data = await res.json();
  const user: User = {
    userId: data.user?.id || data.userId || '1',
    email: data.user?.username || email,
    name: data.user?.name || name,
    role: 'USER',
    token: data.token,
  };
  localStorage.setItem('novabuild_token', data.token);
  localStorage.setItem('novabuild_user', JSON.stringify(user));
  return user;
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    let res = await fetch(`${GATEWAY_BASE}/users/me`, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) {
      res = await fetch(`${ACCOUNT_DIRECT}/users/me`, {
        headers: { ...getAuthHeaders() },
      });
    }
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('Could not fetch user profile:', e);
    return null;
  }
}

export async function updateUserProfile(data: { name?: string; password?: string }): Promise<UserProfile> {
  let res = await fetch(`${GATEWAY_BASE}/users/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    res = await fetch(`${ACCOUNT_DIRECT}/users/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
  }
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'Failed to update profile');
  }
  const updated: UserProfile = await res.json();
  const stored = getStoredUser();
  if (stored) {
    stored.name = updated.name;
    localStorage.setItem('novabuild_user', JSON.stringify(stored));
  }
  return updated;
}

// ----------------- PROJECTS -----------------

export async function fetchProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${GATEWAY_BASE}/projects`, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('Failed to fetch projects', e);
    return [];
  }
}

export async function getProjectById(projectId: string | number): Promise<Project | null> {
  try {
    const res = await fetch(`${GATEWAY_BASE}/projects/${projectId}`, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error(`Failed to fetch project ${projectId}`, e);
    return null;
  }
}

export async function createProject(name: string, description?: string): Promise<Project> {
  const res = await fetch(`${GATEWAY_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'Failed to create project');
  }
  return await res.json();
}

export async function updateProject(projectId: string | number, name: string): Promise<Project> {
  const res = await fetch(`${GATEWAY_BASE}/projects/${projectId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'Failed to rename project');
  }
  return await res.json();
}

export async function deleteProject(projectId: string | number): Promise<void> {
  const res = await fetch(`${GATEWAY_BASE}/projects/${projectId}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'Failed to delete project');
  }
}

// ----------------- FILES & WORKSPACE -----------------

export async function getProjectFiles(projectId: string | number): Promise<{ path: string }[]> {
  try {
    const res = await fetch(`${GATEWAY_BASE}/projects/${projectId}/files`, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.files || [];
  } catch (e) {
    console.error(`Failed to fetch files for project ${projectId}`, e);
    return [];
  }
}

export async function getFileContent(projectId: string | number, path: string): Promise<string> {
  const res = await fetch(`${GATEWAY_BASE}/projects/${projectId}/files/content?path=${encodeURIComponent(path)}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch file content');
  return await res.text();
}

export async function saveFileContent(projectId: string | number, path: string, content: string): Promise<void> {
  const res = await fetch(`${GATEWAY_BASE}/projects/${projectId}/files/content?path=${encodeURIComponent(path)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain', ...getAuthHeaders() },
    body: content,
  });
  if (!res.ok) throw new Error('Failed to save file');
}

export async function deleteFile(projectId: string | number, path: string): Promise<void> {
  const res = await fetch(`${GATEWAY_BASE}/projects/${projectId}/files?path=${encodeURIComponent(path)}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to delete file');
}

// ----------------- SANDBOX / PREVIEW -----------------

export async function deploySandbox(projectId: string | number): Promise<SandboxStatus> {
  const res = await fetch(`${GATEWAY_BASE}/projects/${projectId}/deploy`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to trigger preview container deployment');
  return await res.json();
}

export async function getSandboxStatus(projectId: string | number): Promise<SandboxStatus | null> {
  try {
    const res = await fetch(`${GATEWAY_BASE}/sandbox/${projectId}/status`, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function getChatHistory(projectId: string | number) {
  try {
    const res = await fetch(`${GATEWAY_BASE}/chat/projects/${projectId}`, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
}

// ----------------- BILLING & STRIPE -----------------

export async function getSubscription(): Promise<Subscription | null> {
  try {
    let res = await fetch(`${GATEWAY_BASE}/billing/subscription`, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) {
      res = await fetch(`${ACCOUNT_DIRECT}/api/me/subscription`, {
        headers: { ...getAuthHeaders() },
      });
    }
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('Could not fetch subscription:', e);
    return null;
  }
}

export async function getPlans(): Promise<Plan[]> {
  try {
    let res = await fetch(`${GATEWAY_BASE}/billing/plans`, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) {
      res = await fetch(`${ACCOUNT_DIRECT}/billing/plans`, {
        headers: { ...getAuthHeaders() },
      });
    }
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((p: any) => ({
          ...p,
          price: p.price || (p.stripePriceId === 'price_1TxWRkRtRKfmvNxlPXtP7g4f' || p.id === 1 ? '₹499/mo' : '₹1,499/mo'),
        }));
      }
    }
  } catch (e) {
    console.warn('Failed to load plans from server, using configured defaults', e);
  }

  // Authoritative default plans matching account-service DB seed:
  return [
    {
      id: 0,
      name: 'Starter',
      price: '₹0',
      maxProjects: 3,
      maxTokensPerDay: 50000,
      maxPreviews: 1,
      unlimitedAi: false,
      active: true,
      description: 'Ideal for trying out NovaBuild and experimenting with AI coding.',
      features: [
        'Up to 3 active projects',
        'Daily AI generation allowance',
        'Real-time Monaco code editor',
        'Instant HTML & React preview',
        'Community support',
      ],
    },
    {
      id: 1,
      name: 'Pro Plan',
      stripePriceId: 'price_1TxWRkRtRKfmvNxlPXtP7g4f',
      price: '₹499/mo',
      maxProjects: 10,
      maxTokensPerDay: 1000000,
      maxPreviews: 3,
      unlimitedAi: true,
      active: true,
      description: 'Built for developers needing unlimited AI power and faster builds.',
      features: [
        'Up to 10 active projects',
        'Expanded daily AI capacity',
        'Unlimited AI agent iterations',
        '3 concurrent preview containers',
        'Full Stripe customer portal',
        'Priority build queue & support',
      ],
    },
    {
      id: 2,
      name: 'Business',
      stripePriceId: 'price_1TxWZDRtRKfmvNxlQYerhkN2',
      price: '₹1,499/mo',
      maxProjects: 20,
      maxTokensPerDay: 1000000000,
      maxPreviews: 5,
      unlimitedAi: true,
      active: true,
      description: 'For growing teams requiring dedicated throughput and high capacity.',
      features: [
        'Up to 20 active projects',
        'High-throughput dedicated AI capacity',
        '5 concurrent container sandboxes',
        'Multi-user workspace collaboration',
        'Custom domain support',
        '24/7 dedicated support',
      ],
    },
  ];
}

export async function createCheckoutSession(planId: number): Promise<{ checkoutUrl: string }> {
  const returnUrl = typeof window !== 'undefined' ? window.location.origin : 'https://novabuild.adityabharde.dev';
  let res = await fetch(`${GATEWAY_BASE}/billing/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ planId, returnUrl }),
  });
  if (!res.ok) {
    res = await fetch(`${ACCOUNT_DIRECT}/api/payments/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ planId, returnUrl }),
    });
  }
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'Failed to create Stripe checkout session');
  }
  return await res.json();
}

export async function syncCheckoutSession(sessionId?: string): Promise<Subscription | null> {
  try {
    const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
    let res = await fetch(`${GATEWAY_BASE}/billing/sync${query}`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) {
      res = await fetch(`${ACCOUNT_DIRECT}/api/payments/sync${query}`, {
        method: 'POST',
        headers: { ...getAuthHeaders() },
      });
    }
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Failed to sync checkout session with server:', e);
  }
  return await getSubscription();
}

export async function createCustomerPortalSession(): Promise<{ portalUrl: string }> {
  let res = await fetch(`${GATEWAY_BASE}/billing/portal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  if (!res.ok) {
    res = await fetch(`${ACCOUNT_DIRECT}/api/payments/portal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    });
  }
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'Failed to open Stripe Customer Portal');
  }
  return await res.json();
}
