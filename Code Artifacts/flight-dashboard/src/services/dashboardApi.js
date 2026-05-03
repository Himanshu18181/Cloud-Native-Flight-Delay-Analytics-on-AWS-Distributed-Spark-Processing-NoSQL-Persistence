import axios from 'axios';
import API_BASE_URL from '../config/api';

export async function fetchDataset(type) {
  const response = await axios.get(`${API_BASE_URL}/api/data/${type}`, { timeout: 30000 });
  return response.data;
}

export async function fetchDashboardData() {
  const [airlines, airports, monthly, summary] = await Promise.all([
    fetchDataset('airlines'),
    fetchDataset('airports'),
    fetchDataset('monthly'),
    fetchDataset('delaySummary'),
  ]);

  const datasets = { airlines, airports, monthly, summary };
  const isValid = [airlines, airports, monthly].every(
    (dataset) => Array.isArray(dataset) && dataset.length > 0,
  ) && Array.isArray(summary) && summary.length > 0;

  return {
    datasets,
    isValid,
  };
}

export async function fetchPipelineSteps() {
  const response = await fetch(`${API_BASE_URL}/api/pipeline/steps`);
  if (!response.ok) {
    throw new Error('Pipeline steps request failed');
  }
  return response.json();
}

export async function runPipeline() {
  const response = await fetch(`${API_BASE_URL}/api/pipeline/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || result.error || 'Failed to start pipeline');
  }

  return result;
}