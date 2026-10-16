import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import { motion, type Variants } from "motion/react";
import { PopText } from './common/PopText';
import { getStoredUser } from '../api/client';



const revealUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.14, delayChildren: 0.05 },
  },
};

const cardReveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export const LandingPage: React.FC = () => {
  const user = getStoredUser();

  const handlePreviewMouseMove = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    const preview = event.currentTarget;
    const rect = preview.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const normalizedX = (x / rect.width - 0.5) * 2;
    const normalizedY = (y / rect.height - 0.5) * 2;

    // Tilt the side nearest the pointer away from the viewer.
    preview.style.setProperty('--tilt-x', `${normalizedY * -8}deg`);
    preview.style.setProperty('--tilt-y', `${normalizedX * 10}deg`);

    // Increase the backward push as the pointer moves away from the center.
    const edgeIntensity = Math.min(
      1,
      Math.max(Math.abs(normalizedX), Math.abs(normalizedY))
    );
    preview.style.setProperty('--push-z', `${-edgeIntensity * 35}px`);

    // Keep the glow directly beneath the pointer.
    preview.style.setProperty('--mouse-x', `${x}px`);
    preview.style.setProperty('--mouse-y', `${y}px`);
  };

  const handlePreviewMouseLeave = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    const preview = event.currentTarget;
    preview.style.setProperty('--tilt-x', '0deg');
    preview.style.setProperty('--tilt-y', '0deg');
    preview.style.setProperty('--push-z', '0px');
    preview.style.setProperty('--mouse-x', '50%');
    preview.style.setProperty('--mouse-y', '50%');
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (!element) return;

    const startPosition = window.pageYOffset;
    const targetOffset = element.getBoundingClientRect().top + startPosition - 60;
    const distance = targetOffset - startPosition;
    const duration = 950;
    let startTime: number | null = null;

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = easeInOutCubic(progress);

      window.scrollTo(0, startPosition + distance * easeProgress);

      if (elapsed < duration) {
        window.requestAnimationFrame(step);
      } else {
        element.classList.remove('section-pulse-active');
        void element.offsetWidth;
        element.classList.add('section-pulse-active');
      }
    };

    window.requestAnimationFrame(step);
  };

  return (
    <main className="landing-page min-h-screen text-white">


      {/* Background star layers */}
      <div className="star-layer star-layer-one" aria-hidden="true" />
      <div className="star-layer star-layer-two" aria-hidden="true" />

      {/* Two rotating gradient circles */}
      <div className="black-hole-scene" aria-hidden="true">
        <div className="big-circle" />
        <div className="small-circle" />
      </div>
      {/* Navigation */}
      <nav className="landing-nav">
        <Link to="/" className="landing-logo" aria-label="NovaBuild home">
          <span className="logo-mark" aria-hidden="true">N</span>
          <span>NovaBuild</span>
        </Link>

        <div className="nav-links">
          <a href="#features" onClick={(e) => scrollToSection(e, 'features')}>Features</a>
          <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')}>How it works</a>
          <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')}>Pricing</a>
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <Link to="/dashboard" className="nav-signin">
                Dashboard
              </Link>
              <Link to="/dashboard" className="nav-cta">
                Open workspace
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-signin">
                Sign in
              </Link>
              <Link to="/signup" className="nav-cta">
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <motion.section
        className="hero-content"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      >
        <div className="hero-badge">
          YOUR AI-POWERED DEVELOPMENT WORKSPACE
        </div>

        <PopText as="h1" className="hero-title" amount={0.2}>
          Turn your ideas
          <br />
          into <span>working software.</span>
        </PopText>

        <PopText as="p" className="hero-description" amount={0.2}>
          From your first prompt to a running application.
          Plan projects, generate code, and build in one
          unified development workspace.
        </PopText>

        <div className="hero-actions">
          <Link
            to={user ? "/dashboard" : "/signup"}
            className="hero-button hero-button-primary"
          >
            {user ? "Open workspace" : "Start building"}
          </Link>

          <a
            href="#features"
            onClick={(e) => scrollToSection(e, 'features')}
            className="hero-button hero-button-secondary"
          >
            Explore features
          </a>
        </div>

        <p className="hero-footnote">
          Your idea. Your code. Your workspace.
        </p>
      </motion.section>

      {/* Product preview */}
      <motion.section
        className="product-preview"
        aria-label="NovaBuild product preview"
        variants={revealUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.12 }}
      >
        <div
          className="preview-interactive"
          onMouseMove={handlePreviewMouseMove}
          onMouseLeave={handlePreviewMouseLeave}
        >
        <div className="preview-window">
          <div className="preview-topbar">
            <div className="window-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>

            <div className="preview-address">app.novabuild.dev/workspace</div>
            <div className="preview-status">
              <span className="status-dot" /> Workspace
            </div>
          </div>

          <div className="preview-body">
            <aside className="preview-sidebar">
              <div className="preview-brand">N <span>NovaBuild</span></div>
              <p className="preview-label">WORKSPACE</p>
              <div className="preview-nav-item active"><span>Overview</span></div>
              <div className="preview-nav-item"><span>Projects</span></div>
              <div className="preview-nav-item"><span>Activity</span></div>
              <div className="preview-nav-item"><span>Settings</span></div>

              <div className="preview-project">
                <p className="preview-label">YOUR PROJECT</p>
                <div className="file-item"><span>saas-dashboard</span></div>
                <div className="file-item indent"><span>src</span></div>
                <div className="file-item indent"><span>components</span></div>
                <div className="file-item indent"><span>App.tsx</span></div>
                <div className="file-item indent"><span>index.css</span></div>
              </div>
            </aside>

            <div className="preview-editor">
              <div className="editor-tabs">
                <span className="editor-tab active">App.tsx</span>
                <span className="editor-tab">index.css</span>
              </div>

              <div className="code-content">
                <div><span className="code-line">01</span> <span className="code-purple">import</span> React <span className="code-purple">from</span> <span className="code-green">'react'</span>;</div>
                <div><span className="code-line">02</span> <span className="code-purple">import</span> {'{'} Dashboard {'}'} <span className="code-purple">from</span> <span className="code-green">'./components'</span>;</div>
                <div><span className="code-line">03</span></div>
                <div><span className="code-line">04</span> <span className="code-purple">export default function</span> <span className="code-blue">App</span>() {'{'}</div>
                <div><span className="code-line">05</span>   <span className="code-purple">return</span> (</div>
                <div><span className="code-line">06</span>     <span className="code-pink">&lt;main</span> <span className="code-blue">className</span>=<span className="code-green">"app-shell"</span><span className="code-pink">&gt;</span></div>
                <div><span className="code-line">07</span>       <span className="code-pink">&lt;Dashboard /&gt;</span></div>
                <div><span className="code-line">08</span>     <span className="code-pink">&lt;/main&gt;</span></div>
                <div><span className="code-line">09</span>   );</div>
                <div><span className="code-line">10</span> {'}'}</div>
              </div>

              <div className="editor-bottom">
                <span>TypeScript</span>
                <span>UTF-8</span>
                <span>Ready</span>
              </div>
            </div>

            <aside className="preview-assistant">
              <div className="assistant-heading">
                <div>
                  <strong>AI Assistant</strong>
                  <p>NovaBuild Intelligence</p>
                </div>
              </div>

              <div className="assistant-message">
                <p>What would you like to build today?</p>
              </div>

              <div className="assistant-prompt">
                Create a modern dashboard with analytics, projects, and a clean dark interface.
              </div>

              <div className="assistant-response">
                <span className="status-dot" />
                Ready to help you build
              </div>

              <div className="assistant-input">
                Ask NovaBuild anything...
                <span>↑</span>
              </div>
            </aside>
          </div>
        </div>
        <PopText as="p" className="preview-caption">
          One workspace. From the first line of code to the final build.
        </PopText>
        </div>
      </motion.section>

      {/* Features */}
      <motion.section
        id="features"
        className="landing-section"
        variants={revealUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.12 }}
      >
        <div className="section-heading">
          <p className="section-eyebrow">BUILT FOR YOUR WORKFLOW</p>
          <PopText as="h2">
            Everything you need to <span>build.</span>
          </PopText>
          <PopText as="p">
            Spend less time switching tools and more time turning ideas into software.
          </PopText>
        </div>

        <motion.div
          className="feature-grid"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
        >
          <motion.article
            className="feature-card"
            variants={cardReveal}
            whileHover={{ y: -10, scale: 1.04, boxShadow: "0 20px 48px rgba(0,0,0,0.45)" }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          >
            <PopText as="h3">AI-assisted development</PopText>
            <p>
              Describe what you want to build and use AI assistance to help
              plan and implement your project.
            </p>
          </motion.article>

          <motion.article
            className="feature-card"
            variants={cardReveal}
            whileHover={{ y: -10, scale: 1.04, boxShadow: "0 20px 48px rgba(0,0,0,0.45)" }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          >
            <PopText as="h3">A focused workspace</PopText>
            <p>
              Keep your project files, editing workflow, and development
              tools together in one place.
            </p>
          </motion.article>

          <motion.article
            className="feature-card"
            variants={cardReveal}
            whileHover={{ y: -10, scale: 1.04, boxShadow: "0 20px 48px rgba(0,0,0,0.45)" }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          >
            <PopText as="h3">Projects that stay organized</PopText>
            <p>
              Manage your projects and return to your work without losing
              track of what you are building.
            </p>
          </motion.article>
        </motion.div>
      </motion.section>

      {/* How it works */}
      <motion.section
        id="how-it-works"
        className="landing-section workflow-section"
        variants={revealUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.12 }}
      >
        <div className="section-heading">
          <p className="section-eyebrow">A SIMPLER WORKFLOW</p>
          <PopText as="h2">
            From idea to <span>implementation.</span>
          </PopText>
        </div>

        <motion.div
          className="workflow-grid"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
        >
          <motion.article
            className="workflow-step"
            variants={cardReveal}
            whileHover={{ y: -10, scale: 1.04, boxShadow: "0 20px 48px rgba(0,0,0,0.45)" }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          >
            <span className="step-number">01</span>
            <PopText as="h3">Start with an idea</PopText>
            <p>Describe your project and define what you want to create.</p>
          </motion.article>

          <motion.article
            className="workflow-step"
            variants={cardReveal}
            whileHover={{ y: -10, scale: 1.04, boxShadow: "0 20px 48px rgba(0,0,0,0.45)" }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          >
            <span className="step-number">02</span>
            <PopText as="h3">Build in your workspace</PopText>
            <p>Organize files and work with AI-assisted development tools.</p>
          </motion.article>

          <motion.article
            className="workflow-step"
            variants={cardReveal}
            whileHover={{ y: -10, scale: 1.04, boxShadow: "0 20px 48px rgba(0,0,0,0.45)" }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          >
            <span className="step-number">03</span>
            <PopText as="h3">Iterate and improve</PopText>
            <p>Review your work, refine your implementation, and keep moving.</p>
          </motion.article>
        </motion.div>
      </motion.section>

      {/* Final CTA */}
      <motion.section
        id="pricing"
        className="landing-cta"
        variants={revealUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <p className="section-eyebrow">YOUR NEXT PROJECT STARTS HERE</p>
        <PopText as="h2">Ready to bring your idea to life?</PopText>
        <PopText as="p">Open your workspace and start building with NovaBuild.</PopText>
        <Link
          to={user ? "/dashboard" : "/signup"}
          className="hero-button hero-button-primary"
        >
          {user ? "Open workspace" : "Get started"}
        </Link>
      </motion.section>

      {/* Footer */}
      <motion.footer
        className="landing-footer"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      >
        <Link to="/" className="landing-logo">
          <span className="logo-mark" aria-hidden="true">N</span>
          <span>NovaBuild</span>
        </Link>

        <p>Built for people who turn ideas into software.</p>

        <div className="footer-links">
          <a href="#features" onClick={(e) => scrollToSection(e, 'features')}>Features</a>
          <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')}>How it works</a>
          <Link to={user ? "/dashboard" : "/login"}>
            {user ? "Dashboard" : "Sign in"}
          </Link>
        </div>

        <span className="footer-copyright">
          © {new Date().getFullYear()} NovaBuild
        </span>
      </motion.footer>
    </main>
  );
};


export default LandingPage;
