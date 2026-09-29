export interface User {
  userId: string;
  email: string;
  name: string;
  role: string;
  token?: string;
}

export interface Project {
  id: number | string;
  name: string;
  description?: string;
  userId: string;
  createdAt?: string;
}

export interface ProjectFile {
  id?: number;
  filePath: string;
  content: string;
  language?: string;
}

export interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  timestamp?: string;
}

export interface SandboxStatus {
  projectId: string;
  containerId: string;
  status: 'STARTING' | 'RUNNING' | 'STOPPED' | 'ERROR';
  previewUrl: string;
  exposedPort: number;
}
