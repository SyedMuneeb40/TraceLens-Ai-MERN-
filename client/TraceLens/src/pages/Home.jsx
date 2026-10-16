import { useState } from "react";
import { motion } from "framer-motion";

import Activity from 'lucide-react/dist/esm/icons/activity';
import ArrowDownRight from 'lucide-react/dist/esm/icons/arrow-down-right';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Search from 'lucide-react/dist/esm/icons/search';
import BrainCircuit from 'lucide-react/dist/esm/icons/brain-circuit';
import GitBranch from 'lucide-react/dist/esm/icons/git-branch';
import Terminal from 'lucide-react/dist/esm/icons/terminal';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Menu from 'lucide-react/dist/esm/icons/menu';
import X from 'lucide-react/dist/esm/icons/x';

import "./Home.css";

const features = [
  {
    icon: Search,
    number: "01",
    title: "Find the signal",
    description:
      "Turn noisy application logs into structured incidents and useful evidence."
  },
  {
    icon: BrainCircuit,
    number: "02",
    title: "Investigate with AI",
    description:
      "Explore possible causes, suggested fixes and missing information with local AI."
  },
  {
    icon: GitBranch,
    number: "03",
    title: "Learn from history",
    description:
      "Retrieve similar past incidents to give investigations useful historical context."
  }
];

const workflow = [
  "Submit application logs",
  "Parse and group incidents",
  "Retrieve related incidents",
  "Generate evidence-backed analysis"
];

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="home-page">
      <nav className="navbar">
        <a href="#home" className="brand" onClick={closeMenu}>
          <span className="brand-mark">
            <Activity size={22} />
          </span>
          <span>
            TraceLens<span className="brand-ai"> AI</span>
          </span>
        </a>

        <button
          className="mobile-menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <div className={`nav-links ${menuOpen ? "nav-open" : ""}`}>
          <a href="#features" onClick={closeMenu}>Features</a>
          <a href="#workflow" onClick={closeMenu}>How it works</a>
          <a href="#about" onClick={closeMenu}>About</a>
          <a href="#get-started" onClick={closeMenu} className="nav-cta">
            Get started <ArrowRight size={16} />
          </a>
        </div>
      </nav>

      <section className="hero section-container" id="home">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
        >
          <div className="eyebrow">
            <span className="status-dot" />
            AI-ASSISTED INCIDENT INVESTIGATION
          </div>

          <h1>
            Debug smarter.
            <br />
            <span className="gradient-text">Understand deeper.</span>
          </h1>

          <p className="hero-description">
            Turn application logs into structured incidents, traceable
            evidence and AI-assisted investigations — without losing sight
            of what the evidence actually says.
          </p>

          <div className="hero-actions" id="get-started">
            <a href="#workflow" className="button-primary">
              Explore the workflow <ArrowRight size={18} />
            </a>

            <a href="#features" className="button-secondary">
              Discover features <ArrowDownRight size={18} />
            </a>
          </div>

          <div className="hero-trust">
            <ShieldCheck size={18} />
            <span>Evidence-first analysis</span>
            <span className="trust-divider">·</span>
            <span>Local AI runtime</span>
          </div>
        </motion.div>

        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          <div className="orb orb-one" />
          <div className="orb orb-two" />

          <div className="preview-card">
            <div className="preview-topbar">
              <div className="window-dots">
                <span />
                <span />
                <span />
              </div>
              <span className="preview-label">INVESTIGATION PREVIEW</span>
              <Terminal size={17} />
            </div>

            <div className="preview-content">
              <div className="preview-heading">
                <div>
                  <span className="muted-label">INCIDENT / DEMO</span>
                  <h3>Cart request failure</h3>
                </div>
                <span className="severity-badge">HIGH</span>
              </div>

              <div className="preview-metric-row">
                <div className="preview-metric">
                  <span>TYPE</span>
                  <strong>TypeError</strong>
                </div>
                <div className="preview-metric">
                  <span>ENDPOINT</span>
                  <strong>POST /api/cart</strong>
                </div>
              </div>

              <div className="evidence-panel">
                <div className="evidence-heading">
                  <CheckCircle2 size={17} />
                  <span>Evidence reference</span>
                  <span className="evidence-count">DEMO</span>
                </div>

                <code>
                  Cannot read properties of undefined
                </code>

                <p>
                  Example evidence only. Real results will come from your
                  backend analysis.
                </p>
              </div>

              <div className="preview-analysis">
                <div className="analysis-icon">
                  <BrainCircuit size={20} />
                </div>
                <div>
                  <strong>AI-assisted investigation</strong>
                  <p>Possible cause · Evidence · Suggested fix</p>
                </div>
                <ArrowRight size={18} />
              </div>
            </div>
          </div>

          <div className="floating-chip chip-top">
            <span className="chip-pulse" />
            Evidence-first
          </div>

          <div className="floating-chip chip-bottom">
            <Activity size={16} />
            Historical context
          </div>
        </motion.div>
      </section>

      <section className="feature-section section-container" id="features">
        <div className="section-heading">
          <span className="eyebrow">BUILT FOR INVESTIGATION</span>
          <h2>
            From raw logs to <span className="gradient-text">real insight.</span>
          </h2>
          <p>
            A structured workflow that helps developers understand failures,
            inspect supporting evidence and investigate recurring problems.
          </p>
        </div>

        <div className="feature-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.article
                className="feature-card"
                key={feature.number}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: index * 0.12 }}
                whileHover={{ y: -6 }}
              >
                <div className="feature-card-top">
                  <span className="feature-icon">
                    <Icon size={23} />
                  </span>
                  <span className="feature-number">{feature.number}</span>
                </div>

                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <ArrowRight className="feature-arrow" size={19} />
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="workflow-section" id="workflow">
        <div className="section-container workflow-inner">
          <div className="workflow-copy">
            <span className="eyebrow">A CLEARER DEBUGGING FLOW</span>
            <h2>
              Less guesswork.
              <br />
              <span className="gradient-text">More context.</span>
            </h2>
            <p>
              TraceLens AI connects log processing, historical retrieval
              and AI analysis in one investigation workflow.
            </p>
          </div>

          <div className="workflow-list">
            {workflow.map((step, index) => (
              <motion.div
                className="workflow-step"
                key={step}
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <span className="workflow-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{step}</span>
                {index === workflow.length - 1 && (
                  <CheckCircle2 size={19} className="workflow-check" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section section-container" id="about">
        <div className="about-icon">
          <ShieldCheck size={27} />
        </div>
        <span className="eyebrow">DESIGNED AROUND EVIDENCE</span>
        <h2>AI should explain its reasoning, not hide it.</h2>
        <p>
          TraceLens AI is designed to connect its investigation hypotheses
          to stored evidence references, show historical context separately
          and identify information that is still missing. An AI hypothesis
          remains a hypothesis — not a guarantee of root-cause certainty.
        </p>
      </section>

      <footer className="site-footer">
        <div className="footer-inner section-container">
          <a href="#home" className="brand footer-brand">
            <span className="brand-mark">
              <Activity size={20} />
            </span>
            <span>
              TraceLens<span className="brand-ai"> AI</span>
            </span>
          </a>

          <p>
            Developed by <strong>Syed Muneeb</strong>
          </p>

          <div className="footer-links">
            <a
              href="https://github.com/SyedMuneeb40"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <a
              href="https://linkedin.com/in/syed-muneeb-dev"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
          </div>
        </div>

        <div className="footer-bottom section-container">
          <span>TraceLens AI · Evidence-backed incident investigation</span>
          <a href="#home">Back to top ↑</a>
        </div>
      </footer>
    </main>
  );
}

export default Home;