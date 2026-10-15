import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, Project, Subscription } from './types';
import {
  getStoredUser,
  fetchProjects,
  getSubscription,
  logoutUser,
} from './api/client';
import { AuthScreen } from './components/auth/AuthScreen';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { ProjectsPage } from './components/projects/ProjectsPage';
import { WorkspacePage } from './components/workspace/WorkspacePage';
import { BillingPage } from './components/billing/BillingPage';
import { UsagePage } from './components/usage/UsagePage';
import { SettingsPage } from './components/settings/SettingsPage';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch user projects
      const projs = await fetchProjects();
      setProjects(projs);
      if (projs.length > 0 && !activeProject) {
        setActiveProject(projs[0]);
      }

      // 2. Fetch authoritative subscription
      const sub = await getSubscription();
      setSubscription(sub);
    } catch (e) {
      console.error('Error loading initial app data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setSubscription(null);
    setProjects([]);
    setActiveProject(null);
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
    setActiveProject(newProject);
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
    if (activeProject?.id === updatedProject.id) {
      setActiveProject(updatedProject);
    }
  };

  const handleProjectDeleted = (id: string | number) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeProject?.id === id) {
      const remaining = projects.filter((p) => p.id !== id);
      setActiveProject(remaining.length > 0 ? remaining[0] : null);
    }
  };

  if (!user) {
    return (
      <AuthScreen
        onSuccess={(authenticatedUser) => {
          setUser(authenticatedUser);
        }}
      />
    );
  }

  const getAppBasename = (): string => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/projects/novabuild')) {
      return '/projects/novabuild';
    }
    const envBase = (import.meta as any).env?.BASE_URL || '/';
    return envBase.replace(/\/+$/, '') || '/';
  };

  return (
    <BrowserRouter basename={getAppBasename()}>
      <Routes>
        {/* App Layout Route */}
        <Route
          element={
            <AppLayout
              user={user}
              subscription={subscription}
              projects={projects}
              activeProject={activeProject}
              onSelectProject={setActiveProject}
              onProjectCreated={handleProjectCreated}
              onLogout={handleLogout}
              onRefreshData={loadInitialData}
            />
          }
        >
          {/* Dashboard / Overview */}
          <Route
            path="/"
            element={
              <DashboardPage
                user={user}
                projects={projects}
                subscription={subscription}
                onSelectProject={setActiveProject}
                onOpenNewProjectModal={() => {
                  const btn = document.querySelector('header button');
                  if (btn) (btn as HTMLElement).click();
                }}
                isLoading={isLoading}
              />
            }
          />
          <Route
            path="/dashboard"
            element={<Navigate to="/" replace />}
          />

          {/* Dedicated Projects Management */}
          <Route
            path="/projects"
            element={
              <ProjectsPage
                projects={projects}
                onSelectProject={setActiveProject}
                onOpenNewProjectModal={() => {
                  const btn = document.querySelector('header button');
                  if (btn) (btn as HTMLElement).click();
                }}
                onProjectUpdated={handleProjectUpdated}
                onProjectDeleted={handleProjectDeleted}
                isLoading={isLoading}
              />
            }
          />

          {/* AI Coding Workspace */}
          <Route
            path="/workspace/:projectId"
            element={
              <WorkspacePage
                onBack={() => {}}
                onProjectLoaded={setActiveProject}
              />
            }
          />

          {/* Stripe Billing & Subscriptions */}
          <Route
            path="/billing"
            element={
              <BillingPage
                subscription={subscription}
                onSubscriptionUpdated={setSubscription}
              />
            }
          />

          {/* Usage & Quotas */}
          <Route
            path="/usage"
            element={
              <UsagePage
                projects={projects}
                subscription={subscription}
              />
            }
          />

          {/* Settings */}
          <Route
            path="/settings"
            element={
              <SettingsPage
                user={user}
                subscription={subscription}
                onUserUpdated={setUser}
                onLogout={handleLogout}
              />
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
