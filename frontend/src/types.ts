export interface User {
  userId: string | number;
  email: string;
  name: string;
  role?: string;
  token?: string;
}

export interface Project {
  id: number | string;
  name: string;
  description?: string;
  userId?: string | number;
  createdAt?: string;
  updatedAt?: string;
  role?: string;
  fileCount?: number;
}

export interface ProjectFile {
  id?: number;
  filePath: string;
  content: string;
  language?: string;
  isModified?: boolean;
  isGenerating?: boolean;
}

export interface ExecutionStep {
  id: string;
  type: 'planning' | 'tool' | 'file' | 'status';
  title: string;
  detail?: string;
  status: 'running' | 'completed' | 'error';
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  timestamp?: string;
  steps?: ExecutionStep[];
  filesCreated?: string[];
}

export interface SandboxStatus {
  projectId: string;
  containerId: string;
  status: 'STARTING' | 'RUNNING' | 'STOPPED' | 'ERROR';
  previewUrl: string;
  exposedPort: number;
}

export type StreamEventType =
  | 'message_start'
  | 'status'
  | 'tool_start'
  | 'tool_result'
  | 'text_delta'
  | 'file_changed'
  | 'message_complete'
  | 'error';

export interface StreamEvent {
  type?: StreamEventType;
  text?: string;
  status?: string;
  tool?: string;
  args?: string;
  result?: string;
  success?: boolean;
  path?: string;
  action?: 'created' | 'updated' | 'deleted';
  content?: string;
  messageId?: string;
  error?: string;
}

export interface Plan {
  id: number;
  name: string;
  stripePriceId?: string;
  maxProjects: number;
  maxTokensPerDay: number;
  maxPreviews?: number;
  unlimitedAi?: boolean;
  active?: boolean;
  price?: string;
  description?: string;
  features?: string[];
}

export interface Subscription {
  plan: Plan | null;
  status: 'ACTIVE' | 'PAST_DUE' | 'TRIALING' | 'CANCELED' | string | null;
  currentPeriodEnd: string | null;
  tokensUsedThisCycle: number | null;
}

export interface ProjectMember {
  id: number;
  projectId: number;
  userId: number;
  email: string;
  name?: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' | string;
}

export interface UserProfile {
  id: number;
  username: string;
  name: string;
}
