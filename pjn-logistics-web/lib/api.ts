import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface DashboardStats {
  summary: {
    totalDevices: number;
    inStock: number;
    deployed: number;
    returned: number;
    scrap: number;
    totalWorkOrders: number;
  };
  conditions: {
    new: number;
    second: number;
    damaged: number;
  };
  topTechnicians: {
    name: string;
    totalJobs: number;
  }[];
  areaStats: {
    area: string;
    totalOrders: number;
  }[];
}

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const response = await axios.get(`${API_BASE_URL}/dashboard/stats`);
  return response.data.data;
};