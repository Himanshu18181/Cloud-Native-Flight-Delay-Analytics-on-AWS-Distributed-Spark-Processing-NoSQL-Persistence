const express = require('express');
const cors = require('cors');

const { TABLES, HOLIDAYS_TABLE, CLUSTER_ID } = require('./lib/aws');
const { scanTable, readFromS3, listOutputFiles } = require('./lib/store');
const pipeline = require('./lib/pipeline');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_TYPES = Object.keys(TABLES);
const { STATES, PHASES } = pipeline;

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/pipeline/status', async (_req, res) => {
  try {
    const dataFiles = await listOutputFiles(DATA_TYPES);
    const allExist = dataFiles.every((f) => f.exists);
    const latestJob = await pipeline.latestStep();
    const active = pipeline.state();

    if (active.jobId && !active.finished) {
      const elapsed = (Date.now() - active.startedAt) / 1000;
      const status = latestJob?.status;

      if (status === 'FAILED') {
        pipeline.setFinished('failed');
        return res.json({ state: STATES.FAILED, message: 'Pipeline job failed on EMR', dataFiles, latestJob });
      }
      if (status === 'COMPLETED' && elapsed > 120 && allExist) {
        pipeline.setFinished('serve');
        return res.json({ state: STATES.DATA_READY, message: 'Pipeline completed', dataFiles, latestJob });
      }

      const phase = PHASES[pipeline.phaseIndex(elapsed, status)];
      return res.json({
        state: STATES.RUNNING,
        message: `Pipeline running — ${phase.toUpperCase()} (${Math.floor(elapsed)}s)`,
        dataFiles,
        latestJob: latestJob || { id: active.jobId, status: 'RUNNING' },
      });
    }

    if (allExist) return res.json({ state: STATES.DATA_READY, message: 'Data ready', dataFiles, latestJob });
    if (!latestJob) return res.json({ state: STATES.NOT_STARTED, message: 'No pipeline run yet', dataFiles, latestJob: null });

    const state = latestJob.status === 'FAILED' || (latestJob.status === 'COMPLETED' && !allExist)
      ? STATES.FAILED : STATES.RUNNING;
    res.json({ state, message: `Pipeline ${latestJob.status.toLowerCase()}`, dataFiles, latestJob });
  } catch (err) {
    console.error('pipeline/status:', err.message);
    res.status(500).json({ error: 'Failed to get pipeline status', details: err.message });
  }
});

app.post('/api/pipeline/run', async (_req, res) => {
  try {
    const stepId = await pipeline.submitJob();
    res.json({
      success: true,
      message: 'Pipeline job submitted',
      stepId,
      clusterId: CLUSTER_ID,
      estimatedTime: '15-20 minutes',
    });
  } catch (err) {
    const msg = err.message || '';
    if (/AccessDenied|Unauthorized|Signature|Subscription/.test(msg)) {
      return res.status(403).json({ error: 'AWS credentials not authorized', details: msg });
    }
    if (/ClusterNotFound|NodeConfiguration/.test(msg)) {
      return res.status(400).json({ error: 'EMR cluster not available', details: msg });
    }
    console.error('pipeline/run:', msg);
    res.status(500).json({ error: 'Failed to submit pipeline job', details: msg });
  }
});

app.get('/api/pipeline/job/:jobId', async (req, res) => {
  try {
    res.json(await pipeline.describeStep(req.params.jobId));
  } catch (err) {
    res.status(500).json({ error: 'Failed to get job details', details: err.message });
  }
});

app.get('/api/pipeline/steps', async (_req, res) => {
  try {
    const dataFiles = await listOutputFiles(DATA_TYPES);
    const allExist = dataFiles.every((f) => f.exists);
    const latestJob = await pipeline.latestStep().catch(() => null);
    const active = pipeline.state();

    let steps;
    if (active.jobId && !active.finished) {
      const elapsed = (Date.now() - active.startedAt) / 1000;
      const status = latestJob?.status;
      if (status === 'FAILED') {
        const idx = Math.max(0, PHASES.indexOf(active.phase));
        steps = pipeline.buildSteps(idx, 'failed');
      } else if (status === 'COMPLETED' && allExist) {
        pipeline.setFinished('serve');
        steps = pipeline.buildSteps(PHASES.length - 1, 'completed');
      } else {
        steps = pipeline.buildSteps(pipeline.phaseIndex(elapsed, status), null);
      }
    } else if (allExist) {
      steps = pipeline.buildSteps(PHASES.length - 1, 'completed');
    } else if (latestJob) {
      const start = latestJob.startTime ? new Date(latestJob.startTime).getTime() : Date.now();
      const elapsed = (Date.now() - start) / 1000;
      const idx = pipeline.phaseIndex(elapsed, latestJob.status);
      const terminal = latestJob.status === 'FAILED' ? 'failed'
        : latestJob.status === 'COMPLETED' && !allExist ? 'failed'
        : null;
      steps = pipeline.buildSteps(idx, terminal);
    } else {
      steps = pipeline.buildSteps(-1, null);
    }

    res.json({ steps, dataFiles, latestJob });
  } catch (err) {
    console.error('pipeline/steps:', err.message);
    res.status(500).json({ error: 'Failed to get step details', details: err.message });
  }
});

app.get('/api/data/:dataType', async (req, res) => {
  const table = TABLES[req.params.dataType];
  if (!table) return res.status(400).json({ error: 'Invalid data type' });

  try {
    let records = await scanTable(table);
    let source = 'dynamodb';
    if (!records.length) {
      const s3Records = await readFromS3(req.params.dataType);
      if (!s3Records?.length) return res.status(404).json({ error: `Data not ready for ${req.params.dataType}` });
      records = s3Records;
      source = 's3';
    }
    res.set('X-Data-Source', source).json(records);
  } catch (err) {
    console.error(`data/${req.params.dataType}:`, err.message);
    try {
      const s3Records = await readFromS3(req.params.dataType);
      if (s3Records?.length) return res.set('X-Data-Source', 's3-fallback').json(s3Records);
    } catch {}
    res.status(500).json({ error: `Failed to load ${req.params.dataType}`, details: err.message });
  }
});

app.get('/api/holidays', async (_req, res) => {
  try {
    const items = await scanTable(HOLIDAYS_TABLE);
    items.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load holidays', details: err.message });
  }
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Flight delay backend listening on :${PORT}`));
}

module.exports = app;
