import React, { useState } from 'react';

interface Metric {
  key: string;
  label: string;
  definition: string;
  detail: string;
  value?: number;
  benchmark?: number;
}

interface VerticalMetrics {
  id: string;
  name: string;
  description: string;
  metrics: Metric[];
}

const verticalMetrics: VerticalMetrics[] = [
  {
    id: 'saas',
    name: 'SaaS',
    description: 'Software as a Service metrics focus on customer acquisition, retention, and recurring revenue.',
    metrics: [
      {
        key: 'cac',
        label: 'Customer Acquisition Cost (CAC)',
        definition: 'Cost of acquiring a new customer',
        detail: 'Total sales and marketing expenses divided by number of new customers acquired in a period.',
      },
      {
        key: 'ltv',
        label: 'Lifetime Value (LTV)',
        definition: 'Expected net profit per customer over lifecycle',
        detail: 'Calculated as average revenue per customer multiplied by gross margin and average customer lifespan.',
      },
      {
        key: 'mrr',
        label: 'Monthly Recurring Revenue (MRR)',
        definition: 'Predictable subscription revenue',
        detail: 'Sum of all active subscriptions normalized to a monthly value.',
      }
    ]
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Healthcare metrics focus on patient care, retention, and clinical outcomes.',
    metrics: [
      {
        key: 'pac',
        label: 'Patient Acquisition Cost (PAC)',
        definition: 'Cost of acquiring a new patient',
        detail: 'Marketing and outreach expenses divided by number of new patients onboarded.',
      },
      {
        key: 'prr',
        label: 'Patient Retention Rate (PRR)',
        definition: 'Percentage of patients returning for care',
        detail: 'Number of returning patients divided by total patients in a given period.',
      },
      {
        key: 'arpp',
        label: 'Average Revenue Per Patient (ARPP)',
        definition: 'Average earnings per patient',
        detail: 'Total revenue divided by number of active patients.',
      },
      {
        key: 'coi',
        label: 'Clinical Outcomes Index (COI)',
        definition: 'Measure of treatment effectiveness',
        detail: 'Composite score based on recovery rates, readmissions, and patient satisfaction.',
      }
    ]
  },
  {
    id: 'cleantech',
    name: 'Cleantech',
    description: 'Cleantech metrics focus on environmental impact, efficiency, and regulatory compliance.',
    metrics: [
      {
        key: 'caco',
        label: 'Carbon Abatement Cost (CACo)',
        definition: 'Cost to reduce one ton of CO2',
        detail: 'Total operational costs divided by tons of CO2 emissions reduced.',
      },
      {
        key: 'eer',
        label: 'Energy Efficiency Ratio (EER)',
        definition: 'Output vs. energy consumed',
        detail: 'Ratio of useful output to energy input, higher values indicate better efficiency.',
      },
      {
        key: 'rar',
        label: 'Renewable Adoption Rate (RAR)',
        definition: 'Growth in renewable tech users',
        detail: 'Percentage increase in customers adopting renewable technology solutions.',
      },
      {
        key: 'rcs',
        label: 'Regulatory Compliance Score (RCS)',
        definition: 'Adherence to environmental rules',
        detail: 'Composite score based on compliance with environmental regulations and standards.',
      }
    ]
  },
  {
    id: 'deeptech',
    name: 'DeepTech',
    description: 'DeepTech metrics focus on research, development, and intellectual property.',
    metrics: [
      {
        key: 'rdi',
        label: 'R&D Intensity (RDI)',
        definition: '% of budget spent on research and development',
        detail: 'R&D expenses as a percentage of total operating budget.',
      },
      {
        key: 'trl',
        label: 'Technology Readiness Level (TRL)',
        definition: 'Maturity of tech (scale 1–9)',
        detail: 'NASA-originated scale measuring technology maturity from basic research to market-ready.',
      },
      {
        key: 'pps',
        label: 'Patent Portfolio Strength (PPS)',
        definition: 'Number + quality of patents',
        detail: 'Composite score based on patent count, citations, and technological significance.',
      },
      {
        key: 'ttc',
        label: 'Time-to-Commercialization (TTC)',
        definition: 'Time from lab to market',
        detail: 'Average time taken to convert research projects into commercial products.',
      }
    ]
  },
  {
    id: 'fintech',
    name: 'FinTech',
    description: 'FinTech metrics focus on transaction volume, user revenue, and risk management.',
    metrics: [
      {
        key: 'tv',
        label: 'Transaction Volume (TV)',
        definition: 'Number of transactions processed',
        detail: 'Total number of financial transactions processed through the platform.',
      },
      {
        key: 'arpu',
        label: 'Average Revenue Per User (ARPU)',
        definition: 'Earnings per active user',
        detail: 'Total revenue divided by number of active users in a given period.',
      },
      {
        key: 'dr',
        label: 'Default Rate (DR)',
        definition: '% of users defaulting on loans/credit',
        detail: 'Percentage of users failing to meet financial obligations.',
      },
      {
        key: 'cfri',
        label: 'Compliance & Fraud Risk Index (CFRI)',
        definition: 'Exposure to risk',
        detail: 'Composite score measuring regulatory compliance and fraud prevention effectiveness.',
      }
    ]
  },
  {
    id: 'consumer',
    name: 'Consumer',
    description: 'Consumer metrics focus on customer behavior, satisfaction, and purchase patterns.',
    metrics: [
      {
        key: 'ccr',
        label: 'Customer Churn Rate (CCR)',
        definition: '% of customers lost in a period',
        detail: 'Number of customers lost divided by total customers at start of period.',
      },
      {
        key: 'nps',
        label: 'Net Promoter Score (NPS)',
        definition: 'Customer satisfaction/loyalty measure',
        detail: 'Percentage of promoters minus percentage of detractors in customer base.',
      },
      {
        key: 'aov',
        label: 'Average Order Value (AOV)',
        definition: 'Average spend per transaction',
        detail: 'Total revenue divided by number of orders in a given period.',
      },
      {
        key: 'rpr',
        label: 'Repeat Purchase Rate (RPR)',
        definition: '% of customers buying again',
        detail: 'Number of customers making repeat purchases divided by total customers.',
      }
    ]
  }
];

export function VerticalBenchmarks() {
  const [selectedVertical, setSelectedVertical] = useState<string>('saas');

  const currentVertical = verticalMetrics.find(v => v.id === selectedVertical);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Vertical Benchmarks</h1>
      
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {verticalMetrics.map((vertical) => (
          <button
            key={vertical.id}
            onClick={() => setSelectedVertical(vertical.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              selectedVertical === vertical.id
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {vertical.name}
          </button>
        ))}
      </div>

      {currentVertical && (
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">{currentVertical.name}</h2>
            <p className="text-slate-600 mb-4">{currentVertical.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentVertical.metrics.map((metric) => (
              <div key={metric.key} className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-slate-800 mb-2">{metric.label}</h3>
                <p className="text-sm text-slate-600 mb-4">{metric.definition}</p>
                <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded">{metric.detail}</p>
                
                {metric.value !== undefined && metric.benchmark !== undefined && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-600">Current</span>
                      <span className="font-medium">{metric.value}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Industry Benchmark</span>
                      <span className="font-medium">{metric.benchmark}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
