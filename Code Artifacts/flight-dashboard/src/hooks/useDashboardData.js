import { useCallback, useEffect, useState } from 'react';
import { fetchDashboardData } from '../services/dashboardApi';

function useDashboardData() {
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [page, setPage] = useState('loading');

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const { datasets, isValid } = await fetchDashboardData();

      if (isValid) {
        setRawData({
          airlines: datasets.airlines,
          airports: datasets.airports,
          monthly: datasets.monthly,
          summary: datasets.summary[0],
        });
        setLastUpdated(Date.now());
        setPage('dashboard');
        return { ok: true };
      }
      setRawData(null);
      setPage('etl');
      return { ok: false, reason: 'invalid' };
    } catch (err) {
      setRawData(null);
      setPage('etl');
      return { ok: false, reason: 'error', error: err };
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(() => loadData({ silent: true }), [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    rawData,
    loading,
    refreshing,
    lastUpdated,
    page,
    setPage,
    loadData,
    refresh,
  };
}

export default useDashboardData;