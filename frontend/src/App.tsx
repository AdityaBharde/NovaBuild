import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { AnimatePresence } from 'motion/react';

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
import { LandingPage } from './components/LandingPage';
import { PageTransition } from './components/common/PageTransition';
import { ScrollPopObserver } from './components/common/ScrollPopObserver';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [subscription, setSubscription] =
    useState<Subscription | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] =
    useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  const loadInitialData = async () => {
    setIsLoading(true);

    try {
      const projs = await fetchProjects();
      setProjects(projs);

      setActiveProject((current) => {
        if (current && projs.some((p) => p.id === current.id)) {
          return current;
        }

        return projs.length > 0 ? projs[0] : null;
      });

      const sub = await getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error('Error loading initial app data:', error);
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
      prev.map((project) =>
        project.id === updatedProject.id ? updatedProject : project
      )
    );

    setActiveProject((current) =>
      current?.id === updatedProject.id ? updatedProject : current
    );
  };

  const handleProjectDeleted = (id: string | number) => {
    setProjects((prev) => {
      const remaining = prev.filter((project) => project.id !== id);

      setActiveProject((current) => {
        if (current?.id !== id) {
          return current;
        }

        return remaining.length > 0 ? remaining[0] : null;
      });

      return remaining;
    });
  };

  return (
    <BrowserRouter basename={getAppBasename()}>
      <AppRoutes
        user={user}
        setUser={setUser}
        subscription={subscription}
        setSubscription={setSubscription}
        projects={projects}
        activeProject={activeProject}
        setActiveProject={setActiveProject}
        isLoading={isLoading}
        handleLogout={handleLogout}
        handleProjectCreated={handleProjectCreated}
        handleProjectUpdated={handleProjectUpdated}
        handleProjectDeleted={handleProjectDeleted}
        loadInitialData={loadInitialData}
      />
    </BrowserRouter>
  );
};

const getAppBasename = (): string => {
  if (
    typeof window !== 'undefined' &&
    window.location.pathname.startsWith('/projects/novabuild')
  ) {
    return '/projects/novabuild';
  }

  const envBase = import.meta.env.BASE_URL || '/';
  return envBase.replace(/\/+$/, '') || '/';
};

const getTransitionKey = (pathname: string) => {
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/projects') ||
    pathname.startsWith('/workspace') ||
    pathname.startsWith('/billing') ||
    pathname.startsWith('/usage') ||
    pathname.startsWith('/settings')
  ) {
    return 'app-shell';
  }

  return pathname;
};

interface AppRoutesProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  subscription: Subscription | null;
  setSubscription: React.Dispatch<React.SetStateAction<Subscription | null>>;
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: React.Dispatch<React.SetStateAction<Project | null>>;
  isLoading: boolean;
  handleLogout: () => void;
  handleProjectCreated: (newProject: Project) => void;
  handleProjectUpdated: (updatedProject: Project) => void;
  handleProjectDeleted: (id: string | number) => void;
  loadInitialData: () => Promise<void>;
}

const AppRoutes: React.FC<AppRoutesProps> = ({
  user,
  setUser,
  subscription,
  setSubscription,
  projects,
  activeProject,
  setActiveProject,
  isLoading,
  handleLogout,
  handleProjectCreated,
  handleProjectUpdated,
  handleProjectDeleted,
  loadInitialData,
}) => {
  const location = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  const isLanding = location.pathname === '/';
  const isStarBg =
    isLanding ||
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/signup');

  return (
    <>
      {isStarBg && (
        <div
          className={`persistent-stars ${isLanding ? 'persistent-stars-landing' : ''}`}
          aria-hidden="true"
        >
          <div className="star-layer star-layer-one" />
          <div className="star-layer star-layer-two" />
          <div className="star-layer star-layer-three" />
        </div>
      )}
      <ScrollPopObserver />
      <AnimatePresence mode="wait">
        <PageTransition key={getTransitionKey(location.pathname)}>
        <Routes location={location}>
        {/* Public landing page */}
        <Route
          path="/"
          element={<LandingPage />}
        />

        {/* Login */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthScreen
                mode="login"
                onSuccess={(authenticatedUser) => {
                  setUser(authenticatedUser);
                }}
              />
            )
          }
        />

        {/* Signup */}
        <Route
          path="/signup"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthScreen
                mode="signup"
                onSuccess={(authenticatedUser) => {
                  setUser(authenticatedUser);
                }}
              />
            )
          }
        />

        {/* Legacy dashboard URL */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <Navigate to="/dashboard/home" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Authenticated application */}
        <Route
          element={
            user ? (
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
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          {/* Dashboard */}
          <Route
            path="/dashboard/home"
            element={
              <DashboardPage
                user={user!}
                projects={projects}
                subscription={subscription}
                onSelectProject={setActiveProject}
                onOpenNewProjectModal={() => {
                  const button = document.querySelector('header button');

                  if (button) {
                    (button as HTMLElement).click();
                  }
                }}
                isLoading={isLoading}
              />
            }
          />

          {/* Projects */}
          <Route
            path="/projects"
            element={
              <ProjectsPage
                projects={projects}
                onSelectProject={setActiveProject}
                onOpenNewProjectModal={() => {
                  const button = document.querySelector('header button');

                  if (button) {
                    (button as HTMLElement).click();
                  }
                }}
                onProjectUpdated={handleProjectUpdated}
                onProjectDeleted={handleProjectDeleted}
                isLoading={isLoading}
              />
            }
          />

          {/* AI coding workspace */}
          <Route
            path="/workspace/:projectId"
            element={
              <WorkspacePage
                onBack={() => {}}
                onProjectLoaded={setActiveProject}
              />
            }
          />

          {/* Billing and subscriptions */}
          <Route
            path="/billing"
            element={
              <BillingPage
                subscription={subscription}
                onSubscriptionUpdated={setSubscription}
              />
            }
          />

          {/* Usage and quotas */}
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
                user={user!}
                subscription={subscription}
                onUserUpdated={setUser}
                onLogout={handleLogout}
              />
            }
          />

          {/* Default authenticated page */}
          <Route
            path="*"
            element={<Navigate to="/dashboard/home" replace />}
          />
        </Route>
        </Routes>
        </PageTransition>
      </AnimatePresence>
    </>
  );
};

export default App;
