const {
  ListStepsCommand,
  DescribeStepCommand,
  AddJobFlowStepsCommand,
} = require('@aws-sdk/client-emr');
const { emr, CLUSTER_ID, SCRIPT_PATH } = require('./aws');

const STATES = {
  NOT_STARTED: 'NOT_STARTED',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  DATA_READY: 'DATA_READY',
};

const PHASES = ['extract', 'transform', 'analyze', 'load', 'serve'];

let active = { jobId: null, startedAt: null, phase: null, finished: false };

async function latestStep() {
  try {
    const r = await emr.send(new ListStepsCommand({
      ClusterId: CLUSTER_ID,
      StepStates: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'],
    }));
    const step = (r.Steps || []).find((s) => /flight|react/i.test(s.Name));
    if (!step) return null;
    return {
      id: step.Id,
      name: step.Name,
      status: step.Status?.State,
      startTime: step.Status?.Timeline?.StartDateTime,
      endTime: step.Status?.Timeline?.EndDateTime,
      createdTime: step.Status?.Timeline?.CreationDateTime,
    };
  } catch (err) {
    console.error('EMR ListSteps error:', err.message);
    return null;
  }
}

async function describeStep(stepId) {
  const r = await emr.send(new DescribeStepCommand({ ClusterId: CLUSTER_ID, StepId: stepId }));
  const s = r.Step;
  return {
    id: s.Id,
    name: s.Name,
    status: s.Status?.State,
    timeline: s.Status?.Timeline,
    config: s.Config,
  };
}

async function submitJob() {
  const r = await emr.send(new AddJobFlowStepsCommand({
    JobFlowId: CLUSTER_ID,
    Steps: [{
      Name: 'React-Dashboard-Pipeline',
      ActionOnFailure: 'CONTINUE',
      HadoopJarStep: { Jar: 'command-runner.jar', Args: ['spark-submit', SCRIPT_PATH] },
    }],
  }));
  const stepId = r.StepIds?.[0];
  if (!stepId) throw new Error('EMR returned no step id');
  active = { jobId: stepId, startedAt: Date.now(), phase: 'extract', finished: false };
  return stepId;
}

function phaseIndex(elapsed, jobStatus) {
  if (jobStatus === 'COMPLETED') return 4;
  if (elapsed > 1100) return 4;
  if (elapsed > 800) return 3;
  if (elapsed > 480) return 2;
  if (elapsed > 180) return 1;
  return 0;
}

function buildSteps(currentIdx, terminal) {
  return PHASES.map((id, i) => ({
    id,
    name: id.toUpperCase(),
    state: terminal === 'failed' && i === currentIdx ? 'failed'
      : i < currentIdx ? 'completed'
      : i === currentIdx ? (terminal === 'completed' ? 'completed' : 'running')
      : 'pending',
  }));
}

module.exports = {
  STATES,
  PHASES,
  state: () => active,
  setFinished: (phase) => { active.finished = true; active.phase = phase; },
  latestStep,
  describeStep,
  submitJob,
  phaseIndex,
  buildSteps,
};
