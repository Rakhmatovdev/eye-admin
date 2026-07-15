import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { SecurityOverview } from '../../types';

interface SecurityChartsProps {
  overview: SecurityOverview;
}

export const SecurityChart: React.FC<SecurityChartsProps> = ({ overview }) => {
  return (
    <div className="glass p-5 rounded-2xl border border-gray-800">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-white">Incident Volume — 7 Day Trend</h3>
        <p className="text-xxs text-gray-500 mt-0.5">Stacked by severity, daily count</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={overview.trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradCritical" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradHigh" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradMedium" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradLow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip />
          <Area type="monotone" dataKey="critical" stackId="1" stroke="#EF4444" fill="url(#gradCritical)" strokeWidth={2} />
          <Area type="monotone" dataKey="high" stackId="1" stroke="#F59E0B" fill="url(#gradHigh)" strokeWidth={2} />
          <Area type="monotone" dataKey="medium" stackId="1" stroke="#06B6D4" fill="url(#gradMedium)" strokeWidth={2} />
          <Area type="monotone" dataKey="low" stackId="1" stroke="#10B981" fill="url(#gradLow)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SeverityDonut: React.FC<SecurityChartsProps> = ({ overview }) => {
  const total = overview.severityBreakdown.reduce((s, d) => s + d.value, 0);
  return (
    <div className="glass p-5 rounded-2xl border border-gray-800">
      <div className="mb-1">
        <h3 className="text-sm font-bold text-white">Open Incidents by Severity</h3>
        <p className="text-xxs text-gray-500 mt-0.5">Current snapshot</p>
      </div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={overview.severityBreakdown}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              stroke="none"
            >
              {overview.severityBreakdown.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend
              verticalAlign="bottom"
              height={24}
              formatter={(value) => <span className="text-xxs text-gray-400 capitalize">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <p className="text-2xl font-extrabold text-white leading-none">{total}</p>
          <p className="text-xxs text-gray-500 mt-0.5">open</p>
        </div>
      </div>
    </div>
  );
};
