import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { SecurityOverview } from '../../types';

interface RiskGaugeProps {
  overview: SecurityOverview;
}

const LEVEL_COLOR: Record<SecurityOverview['riskLevel'], string> = {
  nominal: '#10B981',
  elevated: '#F59E0B',
  critical: '#EF4444',
};

const LEVEL_LABEL: Record<SecurityOverview['riskLevel'], string> = {
  nominal: 'NOMINAL',
  elevated: 'ELEVATED',
  critical: 'CRITICAL',
};

export const RiskGauge: React.FC<RiskGaugeProps> = ({ overview }) => {
  const { riskScore, riskLevel, riskTrend } = overview;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, riskScore)) / 100) * circumference;
  const color = LEVEL_COLOR[riskLevel];

  const TrendIcon = riskTrend < 0 ? ArrowDownRight : riskTrend > 0 ? ArrowUpRight : Minus;
  const trendGood = riskTrend <= 0;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-44 h-44">
        <svg width="176" height="176" viewBox="0 0 176 176" className="-rotate-90">
          <circle cx="88" cy="88" r={radius} fill="none" stroke="#1E293B" strokeWidth="12" />
          <circle
            cx="88"
            cy="88"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.4s ease', filter: `drop-shadow(0 0 6px ${color}66)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold text-white count-up leading-none">{riskScore}</span>
          <span className="text-xxs font-bold tracking-widest mt-1.5" style={{ color }}>
            {LEVEL_LABEL[riskLevel]}
          </span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <p className="text-xxs text-gray-500 uppercase font-semibold tracking-wide">Composite Risk Score</p>
        <p className={`text-xs font-semibold mt-1 flex items-center justify-center gap-1 ${trendGood ? 'text-green-400' : 'text-red-400'}`}>
          <TrendIcon size={13} />
          {Math.abs(riskTrend)}% vs. prior period
        </p>
      </div>
    </div>
  );
};
