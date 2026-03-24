import React from 'react';
import DashboardClient from './DashboardClient';
import { getDashboardData } from '@/app/actions/adminData';

export const metadata = {
  title: 'Admin Dashboard | Pulso',
};

export default async function DashboardPage() {
  const { leads, plans, stats } = await getDashboardData();
  
  return <DashboardClient initialLeads={leads} initialPlans={plans} initialStats={stats} />;
}
