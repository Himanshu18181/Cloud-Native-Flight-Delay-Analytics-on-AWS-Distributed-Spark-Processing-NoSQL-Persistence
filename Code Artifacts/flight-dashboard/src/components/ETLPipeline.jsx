import React, { useState, useEffect, useCallback, useRef } from 'react';
import './ETLPipeline.css';
import { fetchPipelineSteps, runPipeline } from '../services/dashboardApi';

const ETL_STEPS = [
  {
    id: 'extract',
    name: 'EXTRACT',
    title: 'Data Extraction',
    description: 'Read 2015 & 2018-2024 flight datasets from S3',
    detail: '48M+ records across multiple CSV files',
    icon: '📥',
  },
  {
    id: 'transform',
    name: 'TRANSFORM',
    title: 'Schema Standardization',
    description: 'Unify column names, data types, and validate quality',
    detail: 'Map AIRLINE_DELAY→CARRIER_DELAY, AIR_SYSTEM_DELAY→NAS_DELAY, etc.',
    icon: '🔄',
  },
  {
    id: 'analyze',
    name: 'ANALYZE',
    title: 'Metrics Computation',
    description: 'Compute airline, airport, monthly aggregations',
    detail: 'Average delays, cancellation rates, traffic volumes',
    icon: '📊',
  },
  {
    id: 'load',
    name: 'LOAD',
    title: 'Export to S3',
    description: 'Write JSON datasets to react_dashboard_data/',
    detail: 'airlines.json, airports.json, monthly.json, delaySummary.json',
    icon: '📤',
  },
  {
    id: 'serve',
    name: 'SERVE',
    title: 'Dashboard Ready',
    description: 'Data available for dashboard consumption',
    detail: 'Auto-detected and loaded by React frontend',
    icon: '🚀',
  },
];

function ETLPipeline({ onNavigateDashboard }) {
  const [pipelineState, setPipelineState] = useState('idle');
  const [stepStates, setStepStates] = useState({});
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [dataFiles, setDataFiles] = useState([]);
  const [latestJob, setLatestJob] = useState(null);
  const logsEndRef = useRef(null);
  const timerRef = useRef(null);
  const lastLoggedState = useRef(null);

  const addLog = useCallback((msg, level = 'info') => {
    const ts = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { ts, msg, level }]);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    if (pipelineState === 'running' && startTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [pipelineState, startTime]);

  const checkStatus = useCallback(async () => {
    try {
      const stepsData = await fetchPipelineSteps();

      setDataFiles(stepsData.dataFiles || []);
      if (stepsData.latestJob) setLatestJob(stepsData.latestJob);

      const newStepStates = {};
      let hasRunning = false;
      let hasFailed = false;
      let allDone = true;

      (stepsData.steps || []).forEach(bs => {
        newStepStates[bs.id] = bs.state;
        if (bs.state === 'running') hasRunning = true;
        if (bs.state === 'failed') hasFailed = true;
        if (bs.state !== 'completed') allDone = false;
      });

      setStepStates(newStepStates);

      if (hasFailed) {
        if (pipelineState !== 'failed') {
          setPipelineState('failed');
          if (lastLoggedState.current !== 'failed') {
            addLog('Pipeline FAILED — check error details', 'error');
            lastLoggedState.current = 'failed';
          }
        }
      } else if (hasRunning) {
        if (pipelineState !== 'running') {
          setPipelineState('running');
        }
        const runningStep = (stepsData.steps || []).find(s => s.state === 'running');
        if (runningStep && lastLoggedState.current !== `running-${runningStep.id}`) {
          const stepDef = ETL_STEPS.find(s => s.id === runningStep.id);
          addLog(`▶ ${runningStep.name}: ${stepDef?.title || ''} — in progress`, 'info');

          (stepsData.steps || []).forEach(s => {
            if (s.state === 'completed') {
              const prev = lastLoggedState.current;
              if (!prev || !prev.includes(s.id)) {
                const sd = ETL_STEPS.find(x => x.id === s.id);
                addLog(`✓ ${s.name}: ${sd?.title || ''} — completed`, 'success');
              }
            }
          });

          lastLoggedState.current = `running-${runningStep.id}`;
        }
      } else if (allDone && Object.keys(newStepStates).length > 0) {
        if (pipelineState !== 'completed' && pipelineState !== 'idle') {
          setPipelineState('completed');
          if (lastLoggedState.current !== 'completed') {
            addLog('All ETL steps completed — data is ready!', 'success');
            lastLoggedState.current = 'completed';
          }
        }
      }

    } catch (err) {
      setError('Failed to connect to backend: ' + err.message);
    }
  }, [pipelineState, addLog]);

  useEffect(() => {
    checkStatus();
    const iv = setInterval(checkStatus, 3000);
    return () => clearInterval(iv);
  }, [checkStatus]);

  const handleRunPipeline = async () => {
    setPipelineState('submitting');
    setError(null);
    setLogs([]);
    setStepStates({});
    addLog('Submitting pipeline job to EMR cluster...', 'info');

    try {
      const result = await runPipeline();

      const now = Date.now();
      setStartTime(now);
      setPipelineState('running');
      setLatestJob({ id: result.stepId, name: 'React-Dashboard-Pipeline', status: 'PENDING' });
      addLog(`Job submitted: ${result.stepId}`, 'success');
      addLog(`Cluster: ${result.clusterId}`, 'info');
      addLog(`Estimated time: ${result.estimatedTime}`, 'info');
      addLog('Starting EXTRACT phase...', 'info');
      setStepStates({ extract: 'running', transform: 'pending', analyze: 'pending', load: 'pending', serve: 'pending' });
    } catch (err) {
      setPipelineState('failed');
      setError(err.message);
      addLog(`FAILED: ${err.message}`, 'error');
    }
  };

  const prevStepStatesRef = useRef({});
  useEffect(() => {
    const prev = prevStepStatesRef.current;
    ETL_STEPS.forEach(step => {
      const prevState = prev[step.id];
      const curState = stepStates[step.id];
      if (prevState !== curState && curState) {
        if (curState === 'running') {
          addLog(`▶ ${step.name}: ${step.title} — started`, 'info');
        } else if (curState === 'completed' && prevState === 'running') {
          addLog(`✓ ${step.name}: ${step.title} — completed`, 'success');
        } else if (curState === 'failed') {
          addLog(`✗ ${step.name}: ${step.title} — FAILED`, 'error');
        }
      }
    });
    prevStepStatesRef.current = { ...stepStates };
  }, [stepStates, addLog]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const completedSteps = Object.values(stepStates).filter(s => s === 'completed').length;
  const totalSteps = ETL_STEPS.length;
  const progressPct = (completedSteps / totalSteps) * 100;

  const isRunning = pipelineState === 'running';
  const isComplete = pipelineState === 'completed';
  const isFailed = pipelineState === 'failed';
  const isIdle = pipelineState === 'idle';
  const isSubmitting = pipelineState === 'submitting';

  return (
    <div className="etl-page">
      <header className="etl-header">
        <div className="etl-header-left">
          <h1>⚙️ ETL Pipeline</h1>
          <span className="etl-subtitle">Flight Delay Data Engineering</span>
        </div>
        <div className="etl-header-right">
          {isComplete && (
            <button className="btn-nav-dashboard" onClick={onNavigateDashboard}>
              📊 View Dashboard →
            </button>
          )}
          <button className="btn-nav-back" onClick={onNavigateDashboard}>
            ← Dashboard
          </button>
        </div>
      </header>

      <div className="etl-content">
        <div className="etl-left">
          <div className={`etl-status-bar status-${pipelineState}`}>
            <div className="status-indicator">
              {isIdle && <span className="status-dot idle" />}
              {isSubmitting && <span className="status-dot submitting" />}
              {isRunning && <span className="status-dot running" />}
              {isComplete && <span className="status-dot completed" />}
              {isFailed && <span className="status-dot failed" />}
              <span className="status-text">
                {isIdle && 'Ready to Run'}
                {isSubmitting && 'Submitting...'}
                {isRunning && 'Pipeline Running'}
                {isComplete && 'Pipeline Complete'}
                {isFailed && 'Pipeline Failed'}
              </span>
            </div>
            {isRunning && (
              <div className="elapsed-timer">
                🕐 {formatTime(elapsedTime)}
              </div>
            )}
          </div>

          <div className="etl-progress-bar">
            <div className="etl-progress-track">
              <div
                className={`etl-progress-fill ${isFailed ? 'failed' : ''}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="etl-progress-label">{completedSteps} / {totalSteps} steps</span>
          </div>

          <div className="etl-steps">
            {ETL_STEPS.map((step, idx) => {
              const state = stepStates[step.id] || 'pending';
              return (
                <div key={step.id} className={`etl-step-card step-${state}`}>
                  <div className="step-number">
                    {state === 'completed' && <span className="step-check">✓</span>}
                    {state === 'running' && <span className="step-spinner" />}
                    {state === 'failed' && <span className="step-x">✗</span>}
                    {state === 'pending' && <span className="step-num">{idx + 1}</span>}
                  </div>
                  <div className="step-content">
                    <div className="step-header">
                      <span className="step-icon">{step.icon}</span>
                      <span className="step-name">{step.name}</span>
                      <span className={`step-badge badge-${state}`}>
                        {state === 'completed' && 'Done'}
                        {state === 'running' && 'Running'}
                        {state === 'failed' && 'Failed'}
                        {state === 'pending' && 'Waiting'}
                      </span>
                    </div>
                    <h4 className="step-title">{step.title}</h4>
                    <p className="step-desc">{step.description}</p>
                    <p className="step-detail">{step.detail}</p>
                  </div>
                  {idx < ETL_STEPS.length - 1 && (
                    <div className={`step-connector connector-${state}`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="etl-actions">
            {(isIdle || isFailed) && (
              <button className="btn-run-pipeline" onClick={handleRunPipeline} disabled={isSubmitting}>
                {isFailed ? '🔄 Retry Pipeline' : '▶️ Run Pipeline'}
              </button>
            )}
            {isSubmitting && (
              <button className="btn-run-pipeline" disabled>
                ⏳ Submitting...
              </button>
            )}
            {isRunning && (
              <button className="btn-running" disabled>
                ⏳ Pipeline Running — auto-polling every 3s
              </button>
            )}
            {isComplete && (
              <div className="etl-complete-actions">
                <button className="btn-dashboard" onClick={onNavigateDashboard}>
                  📊 Open Dashboard
                </button>
                <button className="btn-rerun" onClick={handleRunPipeline}>
                  🔄 Re-run Pipeline
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="etl-right">
          <div className="etl-panel logs-panel">
            <div className="panel-header">
              <h3>📋 Live Logs</h3>
              {logs.length > 0 && (
                <button className="btn-clear-logs" onClick={() => setLogs([])}>Clear</button>
              )}
            </div>
            <div className="logs-container">
              {logs.length === 0 ? (
                <div className="logs-empty">No logs yet. Run the pipeline to see activity.</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={`log-entry log-${log.level}`}>
                    <span className="log-ts">{log.ts}</span>
                    <span className="log-msg">{log.msg}</span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

          <div className="etl-panel files-panel">
            <div className="panel-header">
              <h3>📁 Output Files</h3>
            </div>
            <div className="files-grid">
              {(dataFiles.length > 0 ? dataFiles : [
                { file: 'airlines', exists: false },
                { file: 'airports', exists: false },
                { file: 'monthly', exists: false },
                { file: 'delaySummary', exists: false },
              ]).map(f => (
                <div key={f.file} className={`file-card ${f.exists ? 'file-ready' : 'file-waiting'}`}>
                  <span className="file-icon">{f.exists ? '✅' : '⏳'}</span>
                  <span className="file-name">{f.file}.json</span>
                  <span className={`file-status ${f.exists ? 'ready' : 'waiting'}`}>
                    {f.exists ? 'Ready' : 'Waiting'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="etl-panel job-panel">
            <div className="panel-header">
              <h3>🔧 Job Details</h3>
            </div>
            <div className="job-details-grid">
              <div className="job-row">
                <span className="job-label">Cluster</span>
                <code className="job-value">j-3AUQOHYTC9PXZ</code>
              </div>
              <div className="job-row">
                <span className="job-label">Script</span>
                <code className="job-value">flight_react_spark_v6.py</code>
              </div>
              <div className="job-row">
                <span className="job-label">Data Source</span>
                <code className="job-value">s3://flight-delay-project-669688/raw/</code>
              </div>
              <div className="job-row">
                <span className="job-label">Output</span>
                <code className="job-value">s3://.../react_dashboard_data/</code>
              </div>
              {latestJob && (
                <>
                  <div className="job-row">
                    <span className="job-label">Job ID</span>
                    <code className="job-value">{latestJob.id}</code>
                  </div>
                  <div className="job-row">
                    <span className="job-label">Status</span>
                    <span className={`job-status job-status-${latestJob.status?.toLowerCase()}`}>
                      {latestJob.status}
                    </span>
                  </div>
                  {latestJob.startTime && (
                    <div className="job-row">
                      <span className="job-label">Started</span>
                      <span className="job-value">{new Date(latestJob.startTime).toLocaleString()}</span>
                    </div>
                  )}
                  {latestJob.endTime && (
                    <div className="job-row">
                      <span className="job-label">Ended</span>
                      <span className="job-value">{new Date(latestJob.endTime).toLocaleString()}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {(isFailed || error) && (
            <div className="etl-panel error-panel">
              <div className="panel-header">
                <h3>⚠️ Error Details</h3>
              </div>
              <div className="error-content">
                {error && <p className="error-message">{error}</p>}
                <div className="troubleshoot-section">
                  <h4>🔧 Troubleshooting</h4>
                  <ol>
                    <li>Verify EMR cluster <code>j-3AUQOHYTC9PXZ</code> is running</li>
                    <li>Check AWS credentials are set</li>
                    <li>Verify S3 bucket <code>flight-delay-project-669688</code> access</li>
                    <li>Check source files in <code>s3://.../raw/</code></li>
                    <li>View logs: <code>tail -f /tmp/flight_etl.log</code></li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          <div className="etl-panel arch-panel">
            <div className="panel-header">
              <h3>🏗️ Architecture</h3>
            </div>
            <div className="arch-flow">
              <div className="arch-node source">
                <span className="arch-icon">🗄️</span>
                <span>S3 Raw Data</span>
                <small>48M+ flights</small>
              </div>
              <div className="arch-arrow">→</div>
              <div className="arch-node process">
                <span className="arch-icon">⚡</span>
                <span>EMR / Spark</span>
                <small>Distributed ETL</small>
              </div>
              <div className="arch-arrow">→</div>
              <div className="arch-node output">
                <span className="arch-icon">📊</span>
                <span>S3 JSON</span>
                <small>Dashboard Data</small>
              </div>
              <div className="arch-arrow">→</div>
              <div className="arch-node serve">
                <span className="arch-icon">🖥️</span>
                <span>React App</span>
                <small>Live Dashboard</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ETLPipeline;
