import { api } from './api';
import type { OverviewStats } from '../types/stats';

export async function getOverviewStats() {
  const response = await api.get<OverviewStats>('/stats/overview');
  return response.data;
}
