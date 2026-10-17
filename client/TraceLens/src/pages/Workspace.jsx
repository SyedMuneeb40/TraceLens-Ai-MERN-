import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import Activity from "lucide-react/dist/esm/icons/activity";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import Bug from "lucide-react/dist/esm/icons/bug";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Clock3 from "lucide-react/dist/esm/icons/clock-3";
import FolderKanban from "lucide-react/dist/esm/icons/folder-kanban";
import LoaderCircle from "lucide-react/dist/esm/icons/loader-circle";
import LogOut from "lucide-react/dist/esm/icons/log-out";
import Plus from "lucide-react/dist/esm/icons/plus";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import Search from "lucide-react/dist/esm/icons/search";
import Settings2 from "lucide-react/dist/esm/icons/settings-2";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import SlidersHorizontal from "lucide-react/dist/esm/icons/sliders-horizontal";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import X from "lucide-react/dist/esm/icons/x";

import { logoutUserApi } from "../services/loginService";
import {
  createProjectApi,
  deleteProjectApi,
  getAllProjectApi,
  getProjectApi,
  updateProjectApi
} from "../services/projectService";
import { getAllIncidentApi } from "../services/incidentService";
import { logout } from "../store/authSlice";
import DashboardScene from "../components/dashboard/DashboardScene";
import "./Auth.css";

const emptyProjectForm = { name: "", description: "", environment: "development" };

const formatDate = (value) => {
  if (!value) return "No activity yet";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
};

const getProjectIncidents = (incidentsByProject, projectId) => incidentsByProject[projectId] || [];

const getHealth = (incidents) => {
  if (incidents.some((incident) => incident.severity === "critical" && incident.status !== "resolved")) {
    return { label: "Critical", tone: "critical" };
  }
  if (incidents.some((incident) => ["open", "investigating"].includes(incident.status))) {
    return { label: "Needs attention", tone: "attention" };
  }
  return { label: "Healthy", tone: "healthy" };
};

function MetricCard({ icon: Icon, label, value, detail, tone = "gold" }) {
  return (
    <article className={`dashboard-metric metric-${tone}`}>
      <div className="dashboard-metric-top">
        <span className="dashboard-metric-icon"><Icon size={18} /></span>
        <span className="dashboard-metric-detail">{detail}</span>
      </div>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function ProjectFormModal({ form, setForm, isEditing, isSaving, error, onClose, onSubmit }) {
  return (
    <div className="dashboard-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="project-modal-title">
        <div className="dashboard-modal-header">
          <div>
            <span className="auth-eyebrow">PROJECT CONFIGURATION</span>
            <h2 id="project-modal-title">{isEditing ? "Edit project settings" : "Create a project"}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </div>

        <form className="dashboard-form" onSubmit={onSubmit}>
          {error && <div className="dashboard-inline-error" role="alert">{error}</div>}
          <label htmlFor="project-name">Project name</label>
          <input id="project-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Payments API" maxLength={100} required />
          <label htmlFor="project-description">Description</label>
          <textarea id="project-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What does this service do?" maxLength={500} rows={4} />
          <label htmlFor="project-environment">Environment</label>
          <select id="project-environment" value={form.environment} onChange={(event) => setForm({ ...form, environment: event.target.value })}>
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
          <div className="dashboard-modal-actions">
            <button className="dashboard-button dashboard-button-quiet" type="button" onClick={onClose}>Cancel</button>
            <button className="dashboard-button dashboard-button-primary" type="submit" disabled={isSaving}>
              {isSaving && <LoaderCircle className="auth-spinner" size={16} />}
              {isSaving ? "Saving..." : isEditing ? "Save settings" : "Create project"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ProjectChooserModal({ projects, selectedProjectId, onClose, onSelect }) {
  return (
    <div className="dashboard-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="dashboard-modal project-chooser-modal" role="dialog" aria-modal="true" aria-labelledby="project-chooser-title">
        <div className="dashboard-modal-header">
          <div>
            <span className="auth-eyebrow">PROJECT OPERATIONS</span>
            <h2 id="project-chooser-title">Which project should we open?</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close project chooser"><X size={18} /></button>
        </div>
        <div className="project-chooser-list">
          {projects.map((project) => (
            <button className={`project-chooser-item ${project._id === selectedProjectId ? "selected" : ""}`} type="button" key={project._id} onClick={() => onSelect(project._id)}>
              <span className="project-list-icon"><FolderKanban size={17} /></span>
              <span><strong>{project.name}</strong><small>{project.environment} · {project.description || "No description yet"}</small></span>
              <ChevronRight size={16} />
            </button>
          ))}
          {!projects.length && <div className="dashboard-empty dashboard-empty-compact"><FolderKanban size={26} /><strong>No projects yet</strong><span>Create a project from the dashboard first.</span></div>}
        </div>
      </section>
    </div>
  );
}

function Workspace() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [projects, setProjects] = useState([]);
  const [incidentsByProject, setIncidentsByProject] = useState({});
  const [selectedProjectId, setSelectedProjectId] = useState(() => localStorage.getItem("tracelens-selected-project") || "");
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [environmentFilter, setEnvironmentFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [formError, setFormError] = useState("");
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProjectChooserOpen, setIsProjectChooserOpen] = useState(false);

  const loadDashboard = useCallback(async (preferredProjectId = "") => {
    setErrorMessage("");
    setIsRefreshing(true);

    try {
      const response = await getAllProjectApi();
      const nextProjects = response.projects || [];
      setProjects(nextProjects);
      const rememberedProjectId = localStorage.getItem("tracelens-selected-project") || "";

      const nextSelectedId = nextProjects.some((project) => project._id === preferredProjectId)
        ? preferredProjectId
        : nextProjects.some((project) => project._id === rememberedProjectId)
          ? rememberedProjectId
          : nextProjects[0]?._id || "";
      setSelectedProjectId(nextSelectedId);
      if (nextSelectedId) localStorage.setItem("tracelens-selected-project", nextSelectedId);
      else localStorage.removeItem("tracelens-selected-project");

      const incidentEntries = await Promise.all(nextProjects.map(async (project) => {
        try {
          const incidentResponse = await getAllIncidentApi(project._id);
          return [project._id, incidentResponse.incidents || []];
        } catch {
          return [project._id, []];
        }
      }));
      setIncidentsByProject(Object.fromEntries(incidentEntries));
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Unable to load your projects.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  useEffect(() => {
    if (!selectedProjectId) return;

    getProjectApi(selectedProjectId)
      .then((response) => setSelectedProject(response.project || null))
      .catch(() => setSelectedProject(projects.find((project) => project._id === selectedProjectId) || null));
  }, [projects, selectedProjectId]);

  const allIncidents = useMemo(() => Object.values(incidentsByProject).flat(), [incidentsByProject]);
  const metrics = useMemo(() => ({
    projects: projects.length,
    incidents: allIncidents.length,
    open: allIncidents.filter((incident) => ["open", "investigating"].includes(incident.status)).length,
    critical: allIncidents.filter((incident) => incident.severity === "critical" && incident.status !== "resolved").length,
    resolved: allIncidents.filter((incident) => incident.status === "resolved").length
  }), [allIncidents, projects.length]);

  const visibleProjects = useMemo(() => projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEnvironment = environmentFilter === "all" || project.environment === environmentFilter;
    return matchesSearch && matchesEnvironment;
  }), [environmentFilter, projects, searchTerm]);

  const selectedIncidents = getProjectIncidents(incidentsByProject, selectedProjectId);
  const selectedHealth = getHealth(selectedIncidents);

  const openCreateModal = () => {
    setProjectForm(emptyProjectForm);
    setFormError("");
    setModalMode("create");
  };

  const openEditModal = () => {
    if (!selectedProject) return;
    setProjectForm({
      name: selectedProject.name || "",
      description: selectedProject.description || "",
      environment: selectedProject.environment || "development"
    });
    setFormError("");
    setModalMode("edit");
  };

  const handleProjectSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setIsSavingProject(true);

    try {
      const response = modalMode === "edit"
        ? await updateProjectApi(selectedProjectId, projectForm)
        : await createProjectApi(projectForm);
      const project = response.project || response.updatedProject;
      setModalMode(null);
      await loadDashboard(project?._id || selectedProjectId);
    } catch (error) {
      setFormError(error?.response?.data?.message || "Unable to save this project.");
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleRemoveProject = async () => {
    if (!selectedProject || !window.confirm(`Remove “${selectedProject.name}”? Its incidents and analyses will also be deleted.`)) return;
    setIsDeleting(true);
    try {
      await deleteProjectApi(selectedProject._id);
      setSelectedProjectId("");
      setSelectedProject(null);
      await loadDashboard();
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Unable to remove this project.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenProject = (projectId) => {
    setSelectedProjectId(projectId);
    localStorage.setItem("tracelens-selected-project", projectId);
    setIsProjectChooserOpen(false);
    navigate(`/app/projects/${projectId}`);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUserApi();
    } finally {
      dispatch(logout());
      navigate("/", { replace: true });
    }
  };

  return (
    <main className="workspace-page dashboard-page">
      <header className="dashboard-topbar">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-mark"><Activity size={20} /></span>
          <span>TraceLens <b>AI</b></span>
        </Link>
        <div className="dashboard-topbar-actions">
          <span className="dashboard-user-chip"><span className="dashboard-avatar">{(user?.username || "U").slice(0, 1).toUpperCase()}</span>{user?.username || "User"}</span>
          <Link className="dashboard-button dashboard-button-quiet" to="/app/settings"><Settings2 size={16} /> Settings</Link>
          <button className="workspace-logout" type="button" onClick={handleLogout} disabled={isLoggingOut}>
            <LogOut size={16} /> {isLoggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </header>

      <div className="dashboard-shell">
        <aside className="dashboard-sidebar">
          <div className="dashboard-side-label">OPERATIONS</div>
          <a className="dashboard-nav-item active" href="#overview"><Activity size={17} /> Overview</a>
          <button className="dashboard-nav-item" type="button" onClick={() => setIsProjectChooserOpen(true)}><FolderKanban size={17} /> Projects <span>{projects.length}</span></button>
          <a className="dashboard-nav-item" href="#activity"><Clock3 size={17} /> Activity</a>
          {user?.role === "admin" && <Link className="dashboard-nav-item" to="/admin"><ShieldCheck size={17} /> Admin controls</Link>}
          <div className="dashboard-side-footer"><Sparkles size={16} /><span>Signal clarity<br /><b>Workspace online</b></span></div>
        </aside>

        <section className="dashboard-main" id="overview">
          <div className="dashboard-heading-row">
            <div>
              <span className="auth-eyebrow">PERSONAL OPERATIONS CENTER</span>
              <h1>Good to see you, {user?.username || "investigator"}.</h1>
              <p>Track your systems, surface the important bugs, and move from signal to fix.</p>
            </div>
            <div className="dashboard-heading-actions">
              <button className="dashboard-button dashboard-button-quiet" type="button" onClick={() => loadDashboard()} disabled={isRefreshing}><RefreshCw className={isRefreshing ? "auth-spinner" : ""} size={16} /> Refresh</button>
              <button className="dashboard-button dashboard-button-primary" type="button" onClick={openCreateModal}><Plus size={17} /> New project</button>
            </div>
          </div>

          <section className="dashboard-hero" aria-label="TraceLens investigation visual">
            <div className="dashboard-hero-copy">
              <span className="dashboard-live-badge"><span className="status-dot" /> LIVE INVESTIGATION DESK</span>
              <h2>Keep your eye on the signal.</h2>
              <p>TraceLens watches the shape of your incidents so you can spend your time understanding the cause.</p>
              <div className="dashboard-hero-note"><Bug size={17} /><span>Move your cursor across the investigator to change his focus.</span></div>
            </div>
            <DashboardScene />
          </section>

          {errorMessage && <div className="dashboard-alert" role="alert"><AlertTriangle size={17} />{errorMessage}<button type="button" onClick={() => loadDashboard()}>Try again</button></div>}

          <div className="dashboard-metrics" aria-label="Workspace metrics">
            <MetricCard icon={FolderKanban} label="Total projects" value={metrics.projects} detail={`${projects.filter((project) => project.environment === "production").length} production`} />
            <MetricCard icon={Bug} label="Total incidents" value={metrics.incidents} detail={`${metrics.resolved} resolved`} tone="blue" />
            <MetricCard icon={AlertTriangle} label="Open incidents" value={metrics.open} detail="Needs attention" tone="orange" />
            <MetricCard icon={CheckCircle2} label="Critical signals" value={metrics.critical} detail="Unresolved" tone="red" />
          </div>

          <div className="dashboard-grid" id="projects">
            <section className="dashboard-panel dashboard-projects-panel">
              <div className="dashboard-panel-heading">
                <div><span className="auth-eyebrow">YOUR SYSTEMS</span><h2>Projects</h2></div>
                <span className="dashboard-panel-count">{visibleProjects.length} shown</span>
              </div>
              <div className="dashboard-toolbar">
                <label className="dashboard-search"><Search size={16} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search projects" aria-label="Search projects" /></label>
                <label className="dashboard-filter"><SlidersHorizontal size={15} /><select value={environmentFilter} onChange={(event) => setEnvironmentFilter(event.target.value)} aria-label="Filter projects by environment"><option value="all">All environments</option><option value="development">Development</option><option value="staging">Staging</option><option value="production">Production</option></select></label>
              </div>
              {isLoading ? <div className="dashboard-empty"><LoaderCircle className="auth-spinner" size={22} /><span>Loading projects...</span></div> : visibleProjects.length === 0 ? <div className="dashboard-empty"><FolderKanban size={28} /><strong>{projects.length ? "No matching projects" : "Your workspace is ready"}</strong><span>{projects.length ? "Try a different search or filter." : "Create your first project to start tracing incidents."}</span>{!projects.length && <button className="dashboard-button dashboard-button-primary" type="button" onClick={openCreateModal}><Plus size={16} /> Create first project</button>}</div> : <div className="project-list">{visibleProjects.map((project) => {
                const projectIncidents = getProjectIncidents(incidentsByProject, project._id);
                const health = getHealth(projectIncidents);
                return <button className={`project-list-item ${selectedProjectId === project._id ? "selected" : ""}`} type="button" key={project._id} onClick={() => handleOpenProject(project._id)}>
                  <span className="project-list-icon"><FolderKanban size={18} /></span>
                  <span className="project-list-copy"><strong>{project.name}</strong><span>{project.description || "No description yet"}</span></span>
                  <span className={`health-pill health-${health.tone}`}><span />{health.label}</span>
                  <span className={`environment-pill environment-${project.environment}`}>{project.environment}</span>
                  <ChevronRight size={16} className="project-list-arrow" />
                </button>;
              })}</div>}
            </section>

            <section className="dashboard-panel dashboard-detail-panel" id="activity">
              <div className="dashboard-panel-heading">
                <div><span className="auth-eyebrow">SELECTED PROJECT</span><h2>{selectedProject?.name || "Project focus"}</h2></div>
                {selectedProject && <span className={`health-pill health-${selectedHealth.tone}`}><span />{selectedHealth.label}</span>}
              </div>
              {selectedProject ? <>
                <p className="dashboard-project-description">{selectedProject.description || "Add a description in project settings to give your team more context."}</p>
                <div className="dashboard-detail-meta"><span className={`environment-pill environment-${selectedProject.environment}`}>{selectedProject.environment}</span><span>Updated {formatDate(selectedProject.updatedAt)}</span></div>
                <div className="dashboard-detail-stats"><div><strong>{selectedIncidents.length}</strong><span>incidents</span></div><div><strong>{selectedIncidents.filter((incident) => incident.status !== "resolved").length}</strong><span>active</span></div><div><strong>{selectedIncidents.filter((incident) => incident.severity === "critical").length}</strong><span>critical</span></div></div>
                <div className="dashboard-detail-actions"><Link className="dashboard-button dashboard-button-primary" to={`/app/projects/${selectedProjectId}`}><Bug size={16} /> Open operations</Link><button className="dashboard-button dashboard-button-quiet" type="button" onClick={openEditModal}><Settings2 size={16} /> Project settings</button><button className="dashboard-icon-danger" type="button" onClick={handleRemoveProject} disabled={isDeleting} aria-label="Remove project">{isDeleting ? <LoaderCircle className="auth-spinner" size={16} /> : <Trash2 size={16} />}</button></div>
                <div className="dashboard-incident-preview"><div className="dashboard-subheading"><span>Recent incident history</span><span>{selectedIncidents.length} total</span></div>{selectedIncidents.slice(0, 3).map((incident) => <div className="incident-row" key={incident._id}><span className={`severity-dot severity-${incident.severity}`} /><span><strong>{incident.title}</strong><small>{incident.status} · {incident.occurrenceCount} occurrence{incident.occurrenceCount === 1 ? "" : "s"}</small></span><span className="incident-date">{formatDate(incident.lastSeenAt)}</span></div>)}{!selectedIncidents.length && <div className="dashboard-muted">No incidents have been processed for this project yet.</div>}</div>
              </> : <div className="dashboard-empty dashboard-empty-compact"><FolderKanban size={28} /><strong>Select a project</strong><span>Choose a project to inspect its health and incident history.</span></div>}
            </section>
          </div>
        </section>
      </div>

      {isProjectChooserOpen && <ProjectChooserModal projects={projects} selectedProjectId={selectedProjectId} onClose={() => setIsProjectChooserOpen(false)} onSelect={handleOpenProject} />}
      {modalMode && <ProjectFormModal form={projectForm} setForm={setProjectForm} isEditing={modalMode === "edit"} isSaving={isSavingProject} error={formError} onClose={() => setModalMode(null)} onSubmit={handleProjectSubmit} />}
    </main>
  );
}

export default Workspace;
