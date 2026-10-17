import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Activity from "lucide-react/dist/esm/icons/activity";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Clipboard from "lucide-react/dist/esm/icons/clipboard";
import Clock3 from "lucide-react/dist/esm/icons/clock-3";
import Code2 from "lucide-react/dist/esm/icons/code-2";
import Download from "lucide-react/dist/esm/icons/download";
import FileText from "lucide-react/dist/esm/icons/file-text";
import FolderKanban from "lucide-react/dist/esm/icons/folder-kanban";
import History from "lucide-react/dist/esm/icons/history";
import LoaderCircle from "lucide-react/dist/esm/icons/loader-circle";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import Search from "lucide-react/dist/esm/icons/search";
import Send from "lucide-react/dist/esm/icons/send";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Terminal from "lucide-react/dist/esm/icons/terminal";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { getProjectApi } from "../services/projectService";
import {
  getAllIncidentApi,
  getIncidentApi,
  processIncidentApi,
  searchIncidentApi,
  updateIncidentPatchApi
} from "../services/incidentService";
import { analyzeIncidentApi, getAllAnalyzeApi, getAnalyzeApi } from "../services/analysisService";
import "./Auth.css";

const formatDateTime = (value) => {
  if (!value) return "Unknown time";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
};

const getApiError = (error, fallback) => error?.response?.data?.message || fallback;
const confidencePercent = (value) => `${Math.round(Number(value || 0) * 100)}%`;
const chartTooltipStyle = { background: "#171811", border: "1px solid rgba(250, 204, 21, 0.2)", borderRadius: 8, color: "#e9e4cb", fontSize: 10 };
const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);

const createIncidentReport = ({ project, incident, analysis, relatedIncidents }) => {
  const logs = (incident.logs || []).map((log) => `<article><b>${escapeHtml(log.level || "LOG")} · ${escapeHtml(log.timestamp || "No timestamp")}</b><p>${escapeHtml(log.message)}</p>${log.stackTrace ? `<pre>${escapeHtml(log.stackTrace)}</pre>` : ""}</article>`).join("");
  const hypotheses = (analysis?.hypotheses || []).map((hypothesis) => `<section><h3>${escapeHtml(hypothesis.cause)} <span>${confidencePercent(hypothesis.confidence)} confidence</span></h3><p><b>Suggested fix:</b> ${escapeHtml(hypothesis.suggestedFix)}</p>${(hypothesis.evidence || []).map((item) => `<small>Evidence ${escapeHtml(item.sourceLineId)}: ${escapeHtml(item.explanation)}</small>`).join("<br />")}</section>`).join("");
  const related = (relatedIncidents || []).map((item) => `<li>${escapeHtml(item.title)} · ${escapeHtml(item.status)} · ${confidencePercent(item.similarityScore ?? item.score)} similar</li>`).join("");

  return `<!doctype html><html><head><meta charset="utf-8" /><title>TraceLens Incident Report</title><style>body{font-family:Arial,sans-serif;color:#202018;padding:36px;line-height:1.5}h1{margin-bottom:4px}h2{margin-top:28px;border-bottom:1px solid #ddd;padding-bottom:6px}h3{margin-bottom:5px}h3 span{float:right;font-size:12px;color:#687548}table{border-collapse:collapse;width:100%}td{border:1px solid #ddd;padding:8px}td:first-child{font-weight:bold;width:180px;background:#f5f5e8}article,section{margin:10px 0;padding:12px;border:1px solid #ddd;border-radius:6px}article b,small{color:#687548}pre{white-space:pre-wrap;background:#f4f4ee;padding:10px;font-size:11px}footer{margin-top:30px;color:#777;font-size:11px}</style></head><body><h1>TraceLens Incident Report</h1><p>${escapeHtml(project.name)} · ${escapeHtml(project.environment)}</p><h2>Incident details</h2><table><tr><td>Title</td><td>${escapeHtml(incident.title)}</td></tr><tr><td>Status</td><td>${escapeHtml(incident.status)}</td></tr><tr><td>Severity</td><td>${escapeHtml(incident.severity)}</td></tr><tr><td>Error type</td><td>${escapeHtml(incident.errorType || "Error")}</td></tr><tr><td>Endpoint</td><td>${escapeHtml(incident.endpoint || "Unknown")}</td></tr><tr><td>Occurrences</td><td>${escapeHtml(incident.occurrenceCount || 1)}</td></tr><tr><td>First seen</td><td>${escapeHtml(formatDateTime(incident.firstSeenAt))}</td></tr><tr><td>Last seen</td><td>${escapeHtml(formatDateTime(incident.lastSeenAt))}</td></tr></table><h2>Analysis</h2>${analysis ? `<p>${escapeHtml(analysis.summary)}</p><p><b>Overall confidence:</b> ${confidencePercent(analysis.overallConfidence)} · <b>Evidence verified:</b> ${analysis.evidenceVerified ? "Yes" : "No"}</p>${hypotheses}` : "<p>No analysis has been generated for this incident.</p>"}<h2>Stored evidence</h2>${logs || "<p>No stored evidence.</p>"}<h2>Similar incidents</h2>${related ? `<ul>${related}</ul>` : "<p>No similar incidents were included.</p>"}<footer>Generated by TraceLens on ${escapeHtml(formatDateTime(new Date()))}</footer></body></html>`;
};

function ProjectAnalytics({ incidents, analyses }) {
  const statusData = [
    { name: "Open", value: incidents.filter((incident) => incident.status === "open").length, color: "#f87171" },
    { name: "Investigating", value: incidents.filter((incident) => incident.status === "investigating").length, color: "#fb923c" },
    { name: "Resolved", value: incidents.filter((incident) => incident.status === "resolved").length, color: "#a3e635" },
    { name: "Ignored", value: incidents.filter((incident) => incident.status === "ignored").length, color: "#94a3b8" }
  ];
  const severityData = ["critical", "high", "medium", "low"].map((severity) => ({
    name: severity,
    incidents: incidents.filter((incident) => incident.severity === severity).length
  }));
  const trendData = Object.entries(incidents.reduce((result, incident) => {
    const key = incident.lastSeenAt ? new Date(incident.lastSeenAt).toLocaleDateString("en", { month: "short", day: "numeric" }) : "Unknown";
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {})).map(([date, count]) => ({ date, incidents: count })).slice(-10);
  const averageConfidence = analyses.length
    ? analyses.reduce((sum, analysis) => sum + Number(analysis.overallConfidence || 0), 0) / analyses.length
    : 0;
  const verifiedAnalyses = analyses.filter((analysis) => analysis.evidenceVerified).length;

  return (
    <section className="operations-analytics">
      <div className="operations-analytics-heading"><div><span className="auth-eyebrow">PROJECT SIGNALS</span><h2>Metrics and analysis quality</h2></div><span>Based on this project only</span></div>
      <div className="operations-chart-grid">
        <article className="operations-chart-card"><div className="operations-chart-heading"><span>Incident status</span><small>{incidents.length} total</small></div><div className="operations-chart-body"><ResponsiveContainer width="55%" height={190}><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={74} paddingAngle={3}>{statusData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip contentStyle={chartTooltipStyle} /></PieChart></ResponsiveContainer><div className="operations-chart-legend">{statusData.map((item) => <span key={item.name}><i style={{ background: item.color }} />{item.name}<b>{item.value}</b></span>)}</div></div></article>
        <article className="operations-chart-card"><div className="operations-chart-heading"><span>Severity mix</span><small>Current incidents</small></div><ResponsiveContainer width="100%" height={190}><BarChart data={severityData} margin={{ top: 8, right: 5, left: -22, bottom: 0 }}><CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} /><XAxis dataKey="name" tick={{ fill: "#817b66", fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fill: "#817b66", fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={chartTooltipStyle} /><Bar dataKey="incidents" fill="#facc15" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></article>
        <article className="operations-chart-card operations-chart-wide"><div className="operations-chart-heading"><span>Incident activity</span><small>Last {trendData.length || 0} observed dates</small></div><ResponsiveContainer width="100%" height={190}><LineChart data={trendData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}><CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} /><XAxis dataKey="date" tick={{ fill: "#817b66", fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fill: "#817b66", fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={chartTooltipStyle} /><Line type="monotone" dataKey="incidents" stroke="#facc15" strokeWidth={2} dot={{ r: 3, fill: "#facc15" }} /></LineChart></ResponsiveContainer></article>
        <article className="operations-chart-card operations-quality-card"><div className="operations-chart-heading"><span>Analysis quality</span><small>Confidence, not claimed accuracy</small></div><div className="operations-quality-number"><strong>{confidencePercent(averageConfidence)}</strong><span>average confidence</span></div><div className="operations-quality-stats"><span><b>{analyses.length}</b> analyses</span><span><b>{verifiedAnalyses}</b> evidence verified</span><span><b>{analyses.length ? confidencePercent(verifiedAnalyses / analyses.length) : "0%"}</b> verified rate</span></div></article>
      </div>
    </section>
  );
}

function Metric({ icon: Icon, label, value, tone = "gold" }) {
  return (
    <article className={`operations-metric operations-metric-${tone}`}>
      <span><Icon size={17} /></span>
      <strong>{value}</strong>
      <small>{label}</small>
    </article>
  );
}

function IncidentListItem({ incident, selected, onSelect }) {
  return (
    <button className={`operations-incident-item ${selected ? "selected" : ""}`} type="button" onClick={onSelect}>
      <span className={`severity-dot severity-${incident.severity}`} />
      <span className="operations-incident-copy">
        <strong>{incident.title || "Untitled incident"}</strong>
        <small>{incident.errorType || "Error"} · {incident.endpoint || "Unknown endpoint"}</small>
      </span>
      <span className="operations-incident-meta">
        <b className={`operations-status operations-status-${incident.status}`}>{incident.status}</b>
        <small>{incident.occurrenceCount || 1}×</small>
      </span>
    </button>
  );
}

function EvidenceLog({ log, index, onCopy }) {
  const evidence = [log.message, log.stackTrace].filter(Boolean).join("\n");

  return (
    <article className="operations-log-entry">
      <div className="operations-log-heading">
        <span><b>{log.level || "LOG"}</b><small>{log.sourceLineId || `line-${index + 1}`}</small></span>
        <span>{formatDateTime(log.timestamp)}<button type="button" onClick={() => onCopy(evidence)} aria-label="Copy evidence"><Clipboard size={13} /></button></span>
      </div>
      <p>{log.message}</p>
      {log.endpoint && <small className="operations-log-context">Endpoint: {log.endpoint}</small>}
      {log.requestId && <small className="operations-log-context">Request: {log.requestId}</small>}
      {log.stackTrace && <pre>{log.stackTrace}</pre>}
    </article>
  );
}

function AnalysisView({ analysis, onCopy }) {
  if (!analysis) {
    return <div className="operations-empty operations-empty-small"><Sparkles size={24} /><strong>No analysis selected</strong><span>Generate an evidence-backed analysis for this incident.</span></div>;
  }

  return (
    <div className="operations-analysis-content">
      <div className="operations-analysis-summary">
        <div><span className="auth-eyebrow">AI SUMMARY</span><p>{analysis.summary}</p></div>
        <div className="operations-confidence"><strong>{confidencePercent(analysis.overallConfidence)}</strong><span>overall confidence</span></div>
      </div>
      <div className="operations-analysis-meta"><span>{analysis.modelName}</span><span>{analysis.runtime}</span><span>{analysis.durationMs}ms</span><span>{formatDateTime(analysis.createdAt)}</span></div>
      <div className="operations-hypotheses">
        {(analysis.hypotheses || []).map((hypothesis, index) => (
          <article className="operations-hypothesis" key={`${hypothesis.cause}-${index}`}>
            <div className="operations-hypothesis-heading"><span>Hypothesis {index + 1}</span><b>{confidencePercent(hypothesis.confidence)}</b></div>
            <h4>{hypothesis.cause}</h4>
            <div className="operations-fix"><span>Suggested fix</span><p>{hypothesis.suggestedFix}</p><button type="button" onClick={() => onCopy(hypothesis.suggestedFix)}><Clipboard size={13} /> Copy fix</button></div>
            <div className="operations-evidence-links"><span>Evidence references</span>{(hypothesis.evidence || []).map((item) => <small key={item.sourceLineId}>{item.sourceLineId}: {item.explanation}</small>)}</div>
          </article>
        ))}
      </div>
      {analysis.missingInformation?.length > 0 && <div className="operations-missing"><b>Missing information</b>{analysis.missingInformation.map((item) => <span key={item}>• {item}</span>)}</div>}
      {analysis.historicalReferences?.length > 0 && <div className="operations-history-links"><b>Historical references</b>{analysis.historicalReferences.map((item) => <span key={String(item.incident)}>{item.title} · {confidencePercent(item.similarityScore)} similar</span>)}</div>}
    </div>
  );
}

function ProjectOperations() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [projectAnalyses, setProjectAnalyses] = useState([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState("");
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [relatedIncidents, setRelatedIncidents] = useState([]);
  const [rawLogs, setRawLogs] = useState("");
  const [incidentSearch, setIncidentSearch] = useState("");
  const [similarQuery, setSimilarQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const loadIncidents = useCallback(async (preferredId = "") => {
    const response = await getAllIncidentApi(projectId);
    const nextIncidents = response.incidents || [];
    setIncidents(nextIncidents);
    setSelectedIncidentId((currentId) => {
      if (preferredId && nextIncidents.some((incident) => incident._id === preferredId)) return preferredId;
      if (currentId && nextIncidents.some((incident) => incident._id === currentId)) return currentId;
      return nextIncidents[0]?._id || "";
    });
    return nextIncidents;
  }, [projectId]);

  const loadProjectAnalyses = useCallback(async (projectIncidents) => {
    const analysisEntries = await Promise.all(projectIncidents.map(async (incident) => {
      try {
        const response = await getAllAnalyzeApi(projectId, incident._id);
        return response.analyses || [];
      } catch {
        return [];
      }
    }));
    setProjectAnalyses(analysisEntries.flat());
  }, [projectId]);

  const loadProject = useCallback(async () => {
    setPageError("");
    setIsRefreshing(true);
    try {
      const [projectResponse, nextIncidents] = await Promise.all([
        getProjectApi(projectId),
        loadIncidents()
      ]);
      setProject(projectResponse.project || null);
      await loadProjectAnalyses(nextIncidents);
    } catch (error) {
      setPageError(getApiError(error, "Unable to load this project."));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [loadIncidents, loadProjectAnalyses, projectId]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadProject(), 0);
    return () => window.clearTimeout(timer);
  }, [loadProject]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!selectedIncidentId) {
        setSelectedIncident(null);
        setAnalyses([]);
        setSelectedAnalysis(null);
        return;
      }

      setPageError("");
      Promise.all([getIncidentApi(projectId, selectedIncidentId), getAllAnalyzeApi(projectId, selectedIncidentId)])
        .then(([incidentResponse, analysisResponse]) => {
          if (!active) return;
          setSelectedIncident(incidentResponse.incident || null);
          const nextAnalyses = analysisResponse.analyses || [];
          setAnalyses(nextAnalyses);
          setSelectedAnalysis(nextAnalyses[0] || null);
        })
        .catch((error) => {
          if (active) setPageError(getApiError(error, "Unable to load incident details."));
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [projectId, selectedIncidentId]);

  const filteredIncidents = useMemo(() => incidents.filter((incident) => {
    const searchable = [incident.title, incident.errorType, incident.endpoint, incident.status].filter(Boolean).join(" ").toLowerCase();
    return (!incidentSearch || searchable.includes(incidentSearch.toLowerCase()))
      && (severityFilter === "all" || incident.severity === severityFilter)
      && (statusFilter === "all" || incident.status === statusFilter);
  }), [incidentSearch, incidents, severityFilter, statusFilter]);

  const metrics = useMemo(() => ({
    total: incidents.length,
    active: incidents.filter((incident) => ["open", "investigating"].includes(incident.status)).length,
    critical: incidents.filter((incident) => incident.severity === "critical" && incident.status !== "resolved").length,
    occurrences: incidents.reduce((sum, incident) => sum + (incident.occurrenceCount || 0), 0),
    analyses: projectAnalyses.length,
    averageConfidence: projectAnalyses.length
      ? projectAnalyses.reduce((sum, analysis) => sum + Number(analysis.overallConfidence || 0), 0) / projectAnalyses.length
      : 0
  }), [incidents, projectAnalyses]);

  const copyText = async (value) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setActionMessage("Copied to clipboard.");
  };

  const downloadEvidence = () => {
    if (!selectedIncident) return;
    const text = (selectedIncident.logs || []).map((log) => [log.timestamp, log.level, log.message, log.stackTrace].filter(Boolean).join(" | ")).join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selectedIncident.errorType || "incident"}-${selectedIncident._id}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setActionMessage("Evidence download started.");
  };

  const downloadWordReport = () => {
    if (!selectedIncident) return;
    const report = createIncidentReport({ project, incident: selectedIncident, analysis: selectedAnalysis, relatedIncidents });
    const url = URL.createObjectURL(new Blob([report], { type: "application/msword" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `tracelens-${selectedIncident.errorType || "incident"}-${selectedIncident._id}.doc`;
    anchor.click();
    URL.revokeObjectURL(url);
    setActionMessage("Word report download started.");
  };

  const printPdfReport = () => {
    if (!selectedIncident) return;
    const reportWindow = window.open("", "_blank", "width=920,height=760");
    if (!reportWindow) {
      setPageError("Allow pop-ups to create the PDF report.");
      return;
    }
    reportWindow.document.write(createIncidentReport({ project, incident: selectedIncident, analysis: selectedAnalysis, relatedIncidents }));
    reportWindow.document.close();
    reportWindow.focus();
    window.setTimeout(() => reportWindow.print(), 300);
    setActionMessage("PDF print window opened. Choose Save as PDF.");
  };

  const handleProcess = async (event) => {
    event.preventDefault();
    if (!rawLogs.trim()) {
      setPageError("Paste a non-empty log before processing.");
      return;
    }
    setPageError("");
    setActionMessage("");
    setIsProcessing(true);
    try {
      const response = await processIncidentApi(projectId, rawLogs);
      const incident = response.incident;
      setRawLogs("");
      setRelatedIncidents(response.relatedIncidents || []);
      const nextIncidents = await loadIncidents(incident?._id || "");
      await loadProjectAnalyses(nextIncidents);
      setActionMessage(response.action === "updated" ? "Existing incident updated successfully." : "New incident created successfully.");
    } catch (error) {
      setPageError(getApiError(error, "Unable to process these logs."));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimilarSearch = async (event) => {
    event.preventDefault();
    if (!similarQuery.trim()) return;
    setIsSearching(true);
    setPageError("");
    try {
      const response = await searchIncidentApi(projectId, similarQuery, 8);
      setRelatedIncidents(response.incidents || []);
    } catch (error) {
      setPageError(getApiError(error, "Unable to search similar incidents."));
    } finally {
      setIsSearching(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedIncident) return;
    setIsAnalyzing(true);
    setPageError("");
    try {
      const response = await analyzeIncidentApi(projectId, selectedIncident._id);
      const historyResponse = await getAllAnalyzeApi(projectId, selectedIncident._id);
      setAnalyses(historyResponse.analyses || []);
      setProjectAnalyses((currentAnalyses) => {
        const nextAnalyses = [...(historyResponse.analyses || []), ...currentAnalyses];
        return nextAnalyses.filter((analysis, index, items) => items.findIndex((item) => item._id === analysis._id) === index);
      });
      setSelectedAnalysis(response.analysis || historyResponse.analyses?.[0] || null);
      setActionMessage("Evidence-backed analysis completed.");
    } catch (error) {
      setPageError(getApiError(error, "Unable to generate analysis."));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStatusChange = async (status) => {
    if (!selectedIncident || status === selectedIncident.status) return;
    setIsUpdatingStatus(true);
    setPageError("");
    try {
      const response = await updateIncidentPatchApi(projectId, selectedIncident._id, status);
      setSelectedIncident(response.incident);
      setIncidents((currentIncidents) => currentIncidents.map((incident) => incident._id === response.incident._id ? response.incident : incident));
      setActionMessage("Incident status updated successfully.");
    } catch (error) {
      setPageError(getApiError(error, "Unable to update incident status."));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAnalysisSelect = async (analysisId) => {
    try {
      const response = await getAnalyzeApi(analysisId);
      setSelectedAnalysis(response.analysis || null);
    } catch (error) {
      setPageError(getApiError(error, "Unable to load this analysis."));
    }
  };

  if (isLoading) {
    return <main className="operations-page operations-loading"><LoaderCircle className="auth-spinner" size={28} /><span>Loading project operations...</span></main>;
  }

  if (!project) {
    return <main className="operations-page operations-loading"><AlertTriangle size={28} /><strong>{pageError || "Project not found."}</strong><Link className="dashboard-button dashboard-button-primary" to="/app">Back to dashboard</Link></main>;
  }

  return (
    <main className="operations-page">
      <header className="dashboard-topbar operations-topbar">
        <Link to="/app" className="auth-brand"><span className="auth-brand-mark"><Activity size={20} /></span><span>TraceLens <b>AI</b></span></Link>
        <Link to="/app" className="dashboard-button dashboard-button-quiet"><ArrowLeft size={16} /> Back to dashboard</Link>
      </header>

      <div className="operations-shell">
        <div className="operations-heading">
          <div><span className="auth-eyebrow">PROJECT INVESTIGATION DESK</span><h1>{project.name}</h1><p>{project.description || "Process logs, investigate incidents, and find evidence-backed fixes."}</p></div>
          <div className="operations-project-badge"><FolderKanban size={17} /><span>{project.environment}</span><small>Created {formatDateTime(project.createdAt)}</small></div>
        </div>

        {pageError && <div className="dashboard-alert" role="alert"><AlertTriangle size={17} />{pageError}<button type="button" onClick={() => loadProject()}>Try again</button></div>}
        {actionMessage && <div className="operations-success" role="status"><CheckCircle2 size={16} />{actionMessage}</div>}

        <div className="operations-metrics">
          <Metric icon={BarChart3} label="Total incidents" value={metrics.total} />
          <Metric icon={AlertTriangle} label="Active signals" value={metrics.active} tone="orange" />
          <Metric icon={AlertTriangle} label="Critical incidents" value={metrics.critical} tone="red" />
          <Metric icon={History} label="Total occurrences" value={metrics.occurrences} tone="blue" />
          <Metric icon={Sparkles} label="Analyses generated" value={metrics.analyses} tone="blue" />
          <Metric icon={CheckCircle2} label="Average confidence" value={confidencePercent(metrics.averageConfidence)} tone="gold" />
        </div>

        <ProjectAnalytics incidents={incidents} analyses={projectAnalyses} />

        <section className="operations-panel operations-log-panel">
          <div className="operations-panel-heading"><div><span className="auth-eyebrow">INGEST SIGNAL</span><h2>Process application logs</h2></div><span className="operations-api-chip"><Terminal size={13} /> POST /incidents/process</span></div>
          <form onSubmit={handleProcess}>
            <textarea className="operations-log-input" value={rawLogs} onChange={(event) => setRawLogs(event.target.value)} placeholder={'Paste your logs here...\n2025-01-01T12:00:00Z ERROR PaymentError: timeout\n  at processPayment (payments.js:42:11)'} spellCheck="false" />
            <div className="operations-log-actions"><span>{rawLogs.length.toLocaleString()} characters · secrets are redacted by the backend</span><button className="dashboard-button dashboard-button-primary" type="submit" disabled={isProcessing}>{isProcessing ? <LoaderCircle className="auth-spinner" size={16} /> : <Send size={16} />}{isProcessing ? "Processing..." : "Process logs"}</button></div>
          </form>
        </section>

        <div className="operations-main-grid">
          <section className="operations-panel operations-history-panel">
            <div className="operations-panel-heading"><div><span className="auth-eyebrow">PROJECT HISTORY</span><h2>Incidents</h2></div><button className="operations-refresh-button" type="button" onClick={() => loadProject()} disabled={isRefreshing} aria-label="Refresh incidents"><RefreshCw className={isRefreshing ? "auth-spinner" : ""} size={16} /></button></div>
            <div className="operations-filters"><label className="dashboard-search"><Search size={15} /><input value={incidentSearch} onChange={(event) => setIncidentSearch(event.target.value)} placeholder="Search incidents" aria-label="Search incidents" /></label><select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} aria-label="Filter by severity"><option value="all">All severity</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status"><option value="all">All status</option><option value="open">Open</option><option value="investigating">Investigating</option><option value="resolved">Resolved</option><option value="ignored">Ignored</option></select></div>
            <div className="operations-incident-list">{filteredIncidents.map((incident) => <IncidentListItem key={incident._id} incident={incident} selected={selectedIncidentId === incident._id} onSelect={() => setSelectedIncidentId(incident._id)} />)}{!filteredIncidents.length && <div className="operations-empty"><FileText size={24} /><strong>{incidents.length ? "No matching incidents" : "No incidents yet"}</strong><span>{incidents.length ? "Try another filter." : "Process logs above to create the first incident."}</span></div>}</div>
          </section>

          <section className="operations-panel operations-activity-panel">
            <div className="operations-panel-heading"><div><span className="auth-eyebrow">RECENT ACTIVITY</span><h2>Project timeline</h2></div><Clock3 size={18} className="operations-heading-icon" /></div>
            <div className="operations-timeline"><div><span className="timeline-dot timeline-dot-gold" /><section><strong>Project created</strong><small>{formatDateTime(project.createdAt)}</small></section></div><div><span className="timeline-dot timeline-dot-blue" /><section><strong>Project last updated</strong><small>{formatDateTime(project.updatedAt)}</small></section></div>{incidents.slice(0, 5).map((incident) => <div key={incident._id}><span className={`timeline-dot timeline-dot-${incident.severity}`} /><section><strong>{incident.title}</strong><small>{incident.action === "updated" ? "Incident updated" : "Incident observed"} · {formatDateTime(incident.lastSeenAt)}</small></section></div>)}{!incidents.length && <p className="dashboard-muted">Your project activity will appear here.</p>}</div>
          </section>
        </div>

        {selectedIncident && <section className="operations-panel operations-detail-panel">
          <div className="operations-panel-heading"><div><span className="auth-eyebrow">INCIDENT DETAIL</span><h2>{selectedIncident.title}</h2></div><div className="operations-detail-actions"><button className="dashboard-button dashboard-button-quiet" type="button" onClick={downloadEvidence}><Download size={15} /> Evidence</button><button className="dashboard-button dashboard-button-quiet" type="button" onClick={downloadWordReport}><FileText size={15} /> Word report</button><button className="dashboard-button dashboard-button-quiet" type="button" onClick={printPdfReport}><FileText size={15} /> PDF report</button><button className="dashboard-button dashboard-button-primary" type="button" onClick={handleAnalyze} disabled={isAnalyzing}>{isAnalyzing ? <LoaderCircle className="auth-spinner" size={16} /> : <Sparkles size={16} />}{isAnalyzing ? "Analyzing..." : "Generate analysis"}</button></div></div>
          <div className="operations-detail-summary"><div><select className="operations-status-select" value={selectedIncident.status} onChange={(event) => handleStatusChange(event.target.value)} disabled={isUpdatingStatus} aria-label="Change incident status"><option value="open">Open</option><option value="investigating">Investigating</option><option value="resolved">Fixed / Resolved</option><option value="ignored">Closed / Ignored</option></select><span className={`operations-severity operations-severity-${selectedIncident.severity}`}>{selectedIncident.severity}</span></div><span>Type: {selectedIncident.errorType || "Error"}</span><span>Endpoint: {selectedIncident.endpoint || "Unknown"}</span><span>{selectedIncident.occurrenceCount || 1} occurrences</span><span>Last seen {formatDateTime(selectedIncident.lastSeenAt)}</span></div>
          <div className="operations-detail-grid"><div><div className="operations-section-title"><Code2 size={15} /> Stored evidence <span>{selectedIncident.logs?.length || 0} lines</span></div><div className="operations-log-list">{(selectedIncident.logs || []).map((log, index) => <EvidenceLog key={`${log.sourceLineId}-${index}`} log={log} index={index} onCopy={copyText} />)}</div></div><div><div className="operations-section-title"><Sparkles size={15} /> Analysis history <span>{analyses.length}</span></div><div className="operations-analysis-history">{analyses.map((analysis) => <button type="button" className={`operations-analysis-item ${selectedAnalysis?._id === analysis._id ? "selected" : ""}`} key={analysis._id} onClick={() => handleAnalysisSelect(analysis._id)}><span><strong>{confidencePercent(analysis.overallConfidence)} confidence</strong><small>{formatDateTime(analysis.createdAt)}</small></span><span>{analysis.hypotheses?.length || 0} hypotheses</span></button>)}{!analyses.length && <p className="dashboard-muted">No analysis generated yet.</p>}</div></div></div>
          <div className="operations-analysis-view"><AnalysisView analysis={selectedAnalysis} onCopy={copyText} /></div>
        </section>}

        <section className="operations-panel operations-similar-panel">
          <div className="operations-panel-heading"><div><span className="auth-eyebrow">PATTERN MATCHING</span><h2>Similar incidents</h2></div><span className="operations-api-chip"><Search size={13} /> Project scoped</span></div>
          <form className="operations-similar-search" onSubmit={handleSimilarSearch}><input value={similarQuery} onChange={(event) => setSimilarQuery(event.target.value)} placeholder="Search this project's incident history" aria-label="Search similar incidents" /><button className="dashboard-button dashboard-button-quiet" type="submit" disabled={isSearching}>{isSearching ? <LoaderCircle className="auth-spinner" size={15} /> : <Search size={15} />} Search</button></form>
          <div className="operations-similar-list">{relatedIncidents.map((incident) => <article key={incident._id} className="operations-similar-card"><div><span className={`severity-dot severity-${incident.severity}`} /><strong>{incident.title}</strong></div><span className="operations-similarity-score">{incident.similarityScore ?? incident.score ? confidencePercent(incident.similarityScore ?? incident.score) : "Matched"}</span><small>{incident.errorType || "Error"} · {incident.status} · {incident.occurrenceCount || 1} occurrences</small>{(incident.historicalEvidence?.[0]?.message || incident.logs?.[0]?.message) && <p>{incident.historicalEvidence?.[0]?.message || incident.logs?.[0]?.message}</p>}</article>)}{!relatedIncidents.length && <div className="operations-empty operations-empty-small"><Search size={23} /><span>Process logs or search for patterns to see related incidents.</span></div>}</div>
        </section>
      </div>
    </main>
  );
}

export default ProjectOperations;
