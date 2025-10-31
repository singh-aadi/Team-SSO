// Industry-specific metrics and benchmarks for enhanced PDF reports
// Updated: October 2025

export interface IndustryBenchmark {
  expectations: string;
  metrics: Record<string, string>;
}

export interface IndustryMetrics {
  keyMetrics: string[];
  benchmarks: Record<string, IndustryBenchmark>;
  vcExpectations: string[];
}

export const INDUSTRY_METRICS: Record<string, IndustryMetrics> = {
  'HealthTech': {
    keyMetrics: [
      'Patient Acquisition Cost (PAC)',
      'Clinical Validation Stage',
      'FDA/Regulatory Approval Timeline',
      'Healthcare Provider Partnerships',
      'Patient Outcome Data & Success Rate',
      'HIPAA Compliance & Data Security'
    ],
    benchmarks: {
      'Pre-Seed': {
        expectations: 'Initial concept validation, 1-2 pilot studies, regulatory pathway identified',
        metrics: { 
          PAC: '< $500', 
          clinicalStage: 'Early validation', 
          partnerships: '1-2 pilot programs' 
        }
      },
      'Seed': {
        expectations: 'MVP with early users, clinical trials initiated, FDA pathway defined, compliance roadmap',
        metrics: { 
          PAC: '< $300', 
          clinicalStage: 'Phase 1-2 trials', 
          partnerships: '3-5 healthcare providers' 
        }
      },
      'Series A': {
        expectations: 'Product-market fit proven, Phase 2/3 trials underway, provider contracts signed, reimbursement strategy defined',
        metrics: { 
          PAC: '< $200', 
          clinicalStage: 'Phase 2-3 trials', 
          partnerships: '10+ healthcare providers' 
        }
      },
      'Series B': {
        expectations: 'Market traction established, FDA approval imminent/received, scaled provider network, revenue generation',
        metrics: { 
          PAC: '< $150', 
          clinicalStage: 'FDA approved or Phase 3', 
          partnerships: '50+ providers' 
        }
      },
      'Series C+': {
        expectations: 'Market leader positioning, full regulatory approval, national/international expansion, profitability path clear',
        metrics: { 
          PAC: '< $100', 
          clinicalStage: 'FDA approved & post-market', 
          partnerships: '100+ providers' 
        }
      },
      'Growth': {
        expectations: 'Market dominance, multiple product lines, international markets, strong profitability, acquisition targets',
        metrics: { 
          PAC: '< $75', 
          clinicalStage: 'Multiple approved products', 
          partnerships: 'National/international networks' 
        }
      }
    },
    vcExpectations: [
      '✓ Clear regulatory pathway with realistic timeline',
      '✓ Clinical evidence or ongoing trials with positive results',
      '✓ HIPAA compliance and robust data security measures',
      '✓ Strong partnerships with reputable healthcare providers',
      '✓ Reimbursement strategy clearly defined and validated',
      '✓ Patient outcomes data demonstrating clinical efficacy',
      '✓ Experienced medical advisory board with domain expertise'
    ]
  },

  'FinTech': {
    keyMetrics: [
      'Monthly Transaction Volume',
      'Assets Under Management (AUM)',
      'Regulatory Compliance Status',
      'Fraud Prevention Rate',
      'Customer Acquisition Cost (CAC)',
      'Average Revenue Per User (ARPU)'
    ],
    benchmarks: {
      'Pre-Seed': {
        expectations: 'Concept validation, regulatory research, initial security framework',
        metrics: { 
          monthlyVolume: '$100K+ potential', 
          compliance: 'Research phase', 
          cac: 'Projection only' 
        }
      },
      'Seed': {
        expectations: '$1M+ monthly transaction volume, SOC 2 Type I planning, basic fraud prevention, 100+ users',
        metrics: { 
          monthlyVolume: '$1M+', 
          compliance: 'SOC 2 Type I planning', 
          cac: '< $100' 
        }
      },
      'Series A': {
        expectations: '$10M+ monthly volume, SOC 2 Type II certification, banking partnerships secured, 0.1% fraud rate, 1K+ users',
        metrics: { 
          monthlyVolume: '$10M+', 
          compliance: 'SOC 2 Type II certified', 
          cac: '< $75' 
        }
      },
      'Series B': {
        expectations: '$50M+ monthly volume, multi-state licensing, $100M+ AUM, enterprise clients, 10K+ users',
        metrics: { 
          monthlyVolume: '$50M+', 
          compliance: 'Multi-state licensed', 
          cac: '< $50' 
        }
      },
      'Series C+': {
        expectations: '$200M+ monthly volume, national licensing, $1B+ AUM, institutional partnerships',
        metrics: { 
          monthlyVolume: '$200M+', 
          compliance: 'Nationally licensed', 
          cac: '< $30' 
        }
      },
      'Growth': {
        expectations: '$1B+ monthly volume, international expansion, $10B+ AUM, market leader status',
        metrics: { 
          monthlyVolume: '$1B+', 
          compliance: 'International compliance', 
          cac: '< $20' 
        }
      }
    },
    vcExpectations: [
      '✓ Banking/payment processor partnerships secured',
      '✓ Regulatory licenses obtained (state/federal as needed)',
      '✓ Security certifications achieved (SOC 2, PCI DSS)',
      '✓ Proven fraud prevention system with <0.5% fraud rate',
      '✓ Clear path to profitability with strong unit economics',
      '✓ Compliance with all financial regulations (KYC, AML)',
      '✓ Strong risk management and audit framework'
    ]
  },

  'CleanTech': {
    keyMetrics: [
      'Carbon Reduction (tons CO2/year)',
      'Energy Efficiency Gains (%)',
      'Sustainability Certifications',
      'Environmental Impact ROI',
      'Corporate ESG Partnerships',
      'Government Grants/Incentives Secured'
    ],
    benchmarks: {
      'Seed': {
        expectations: '1K+ tons CO2 reduction potential, 1-2 pilot customers, B Corp certification planning',
        metrics: { 
          carbonReduction: '1K+ tons/year', 
          efficiency: '10-20% improvement', 
          partnerships: '1-2 pilot programs' 
        }
      },
      'Series A': {
        expectations: '10K+ tons CO2 reduction proven, B Corp certified, 10+ customers, clear profitability path',
        metrics: { 
          carbonReduction: '10K+ tons/year', 
          efficiency: '20-30% improvement', 
          partnerships: '10+ corporate clients' 
        }
      },
      'Series B': {
        expectations: '100K+ tons CO2 reduction at scale, EPA/government partnerships, corporate contracts, profitable',
        metrics: { 
          carbonReduction: '100K+ tons/year', 
          efficiency: '30-50% improvement', 
          partnerships: 'Government contracts' 
        }
      },
      'Series C+': {
        expectations: '1M+ tons CO2 reduction, national presence, Fortune 500 clients, market leadership',
        metrics: { 
          carbonReduction: '1M+ tons/year', 
          efficiency: '50%+ improvement', 
          partnerships: 'Fortune 500 clients' 
        }
      }
    },
    vcExpectations: [
      '✓ Quantifiable environmental impact with third-party validation',
      '✓ Corporate sustainability partnerships (Fortune 500 preferred)',
      '✓ Government grants, tax incentives, or subsidies secured',
      '✓ Certifications obtained (B Corp, LEED, ISO 14001)',
      '✓ Clear unit economics proving profitability despite impact focus',
      '✓ Scalable technology with IP protection',
      '✓ Regulatory compliance with environmental standards'
    ]
  },

  'Artificial Intelligence': {
    keyMetrics: [
      'Model Accuracy/Precision (%)',
      'Training Cost per Model ($)',
      'Inference Speed (ms)',
      'Data Quality Score',
      'API Usage/Scale (calls/month)',
      'AI Infrastructure Cost per Query'
    ],
    benchmarks: {
      'Seed': {
        expectations: '85%+ accuracy, prototype API functional, initial proprietary dataset, 10K+ API calls/month',
        metrics: { 
          accuracy: '85%+', 
          apiUsage: '10K+ calls/month', 
          inferenceSpeed: '< 500ms' 
        }
      },
      'Series A': {
        expectations: '90%+ accuracy, production API live, 1M+ API calls/month, paying customers, unique dataset',
        metrics: { 
          accuracy: '90%+', 
          apiUsage: '1M+ calls/month', 
          inferenceSpeed: '< 200ms' 
        }
      },
      'Series B': {
        expectations: '95%+ accuracy, multi-model deployment, 10M+ API calls/month, enterprise clients, IP portfolio',
        metrics: { 
          accuracy: '95%+', 
          apiUsage: '10M+ calls/month', 
          inferenceSpeed: '< 100ms' 
        }
      },
      'Series C+': {
        expectations: '97%+ accuracy, industry-leading models, 100M+ API calls/month, Fortune 500 clients',
        metrics: { 
          accuracy: '97%+', 
          apiUsage: '100M+ calls/month', 
          inferenceSpeed: '< 50ms' 
        }
      }
    },
    vcExpectations: [
      '✓ Proprietary training data or unique high-quality dataset',
      '✓ Clear AI differentiation vs competitors (not just API wrapper)',
      '✓ Scalable inference infrastructure with cost efficiency',
      '✓ Strong IP protection strategy (patents, trade secrets)',
      '✓ Ethical AI framework and bias mitigation measures',
      '✓ Technical team with ML/AI expertise and publications',
      '✓ Use cases with measurable ROI for customers'
    ]
  },

  'SaaS B2B': {
    keyMetrics: [
      'Monthly Recurring Revenue (MRR)',
      'Annual Recurring Revenue (ARR)',
      'Net Revenue Retention (NRR)',
      'Customer Acquisition Cost (CAC)',
      'Lifetime Value (LTV)',
      'Gross Margin (%)'
    ],
    benchmarks: {
      'Seed': {
        expectations: '$50K+ MRR, NRR 90%+, CAC payback < 12 months, 20+ paying customers',
        metrics: { 
          MRR: '$50K+', 
          NRR: '90%+', 
          CACPayback: '< 12 months' 
        }
      },
      'Series A': {
        expectations: '$1M+ ARR, NRR 110%+, LTV/CAC ratio > 3x, product-market fit proven, 100+ customers',
        metrics: { 
          ARR: '$1M+', 
          NRR: '110%+', 
          LTVCAC: '> 3x' 
        }
      },
      'Series B': {
        expectations: '$10M+ ARR, NRR 120%+, Rule of 40 achieved, enterprise customers, 500+ customers',
        metrics: { 
          ARR: '$10M+', 
          NRR: '120%+', 
          RuleOf40: 'Achieved' 
        }
      },
      'Series C+': {
        expectations: '$50M+ ARR, NRR 130%+, profitable or clear path, market leader, 1K+ customers',
        metrics: { 
          ARR: '$50M+', 
          NRR: '130%+', 
          profitability: 'Achieved or close' 
        }
      }
    },
    vcExpectations: [
      '✓ Strong net revenue retention (110%+ for Series A)',
      '✓ Efficient CAC payback period (< 12 months)',
      '✓ High gross margins (70-80%+ typical for SaaS)',
      '✓ Proven PLG or efficient sales-led motion',
      '✓ Enterprise customer contracts with multi-year commitments',
      '✓ Low churn rate (< 5% monthly for SMB, < 2% for enterprise)',
      '✓ Clear path to Rule of 40 (Growth % + Profit % ≥ 40)'
    ]
  },

  'E-commerce': {
    keyMetrics: [
      'Gross Merchandise Value (GMV)',
      'Average Order Value (AOV)',
      'Customer Lifetime Value (CLTV)',
      'Repeat Purchase Rate (%)',
      'Gross Margin (%)',
      'Monthly Active Users (MAU)'
    ],
    benchmarks: {
      'Seed': {
        expectations: '$100K+ monthly GMV, 20%+ repeat rate, $50+ AOV, product-market fit signals',
        metrics: { 
          GMV: '$100K+/month', 
          repeatRate: '20%+', 
          AOV: '$50+' 
        }
      },
      'Series A': {
        expectations: '$1M+ monthly GMV, 30%+ repeat rate, $75+ AOV, 10K+ customers, unit economics proven',
        metrics: { 
          GMV: '$1M+/month', 
          repeatRate: '30%+', 
          AOV: '$75+' 
        }
      },
      'Series B': {
        expectations: '$10M+ monthly GMV, 40%+ repeat rate, $100+ AOV, 100K+ customers, profitability path',
        metrics: { 
          GMV: '$10M+/month', 
          repeatRate: '40%+', 
          AOV: '$100+' 
        }
      }
    },
    vcExpectations: [
      '✓ Strong unit economics with healthy gross margins (> 40%)',
      '✓ High repeat purchase rate indicating customer loyalty',
      '✓ Efficient customer acquisition with CAC < 3 months payback',
      '✓ Differentiated supply chain or unique product sourcing',
      '✓ Technology moat (recommendation engine, logistics, etc.)',
      '✓ Brand strength with organic traffic and word-of-mouth',
      '✓ Clear path to profitability with scale'
    ]
  },

  'EdTech': {
    keyMetrics: [
      'Monthly Active Users (MAU)',
      'Course Completion Rate (%)',
      'Student Outcome Improvement (%)',
      'Revenue Per User',
      'Content Library Size',
      'Institutional Partnerships'
    ],
    benchmarks: {
      'Seed': {
        expectations: '1K+ MAU, 50%+ completion rate, measurable learning outcomes, 5+ pilot schools',
        metrics: { 
          MAU: '1K+', 
          completionRate: '50%+', 
          partnerships: '5+ schools' 
        }
      },
      'Series A': {
        expectations: '10K+ MAU, 60%+ completion rate, proven learning efficacy, 50+ institutional clients',
        metrics: { 
          MAU: '10K+', 
          completionRate: '60%+', 
          partnerships: '50+ institutions' 
        }
      },
      'Series B': {
        expectations: '100K+ MAU, 70%+ completion rate, accreditation secured, 200+ institutions',
        metrics: { 
          MAU: '100K+', 
          completionRate: '70%+', 
          partnerships: '200+ institutions' 
        }
      }
    },
    vcExpectations: [
      '✓ Measurable learning outcomes with third-party validation',
      '✓ Institutional partnerships (schools, universities, corporates)',
      '✓ Accreditation or certification programs if applicable',
      '✓ High engagement and completion rates',
      '✓ Scalable content creation and delivery model',
      '✓ Clear revenue model (B2B, B2C, or hybrid)',
      '✓ Compliance with educational standards and privacy laws'
    ]
  },

  'Cybersecurity': {
    keyMetrics: [
      'Threat Detection Accuracy (%)',
      'False Positive Rate (%)',
      'Response Time (minutes)',
      'Compliance Certifications',
      'Enterprise Customer Count',
      'Annual Contract Value (ACV)'
    ],
    benchmarks: {
      'Seed': {
        expectations: '95%+ detection rate, < 5% false positives, SOC 2 planning, 5+ pilot customers',
        metrics: { 
          detectionRate: '95%+', 
          falsePositives: '< 5%', 
          customers: '5+ pilots' 
        }
      },
      'Series A': {
        expectations: '98%+ detection rate, < 2% false positives, SOC 2 certified, 20+ enterprise customers',
        metrics: { 
          detectionRate: '98%+', 
          falsePositives: '< 2%', 
          customers: '20+ enterprises' 
        }
      },
      'Series B': {
        expectations: '99%+ detection rate, < 1% false positives, multiple certifications, 100+ customers',
        metrics: { 
          detectionRate: '99%+', 
          falsePositives: '< 1%', 
          customers: '100+ enterprises' 
        }
      }
    },
    vcExpectations: [
      '✓ Superior threat detection with low false positive rate',
      '✓ Security certifications (SOC 2, ISO 27001, FedRAMP)',
      '✓ Proven efficacy against real-world threats',
      '✓ Enterprise-grade security and compliance',
      '✓ Strong technical team with security expertise',
      '✓ Clear competitive differentiation vs incumbents',
      '✓ High ACV with multi-year enterprise contracts'
    ]
  },

  // Fallback for unknown industries
  'Other': {
    keyMetrics: [
      'Revenue/Revenue Growth Rate',
      'Customer Acquisition Cost (CAC)',
      'Customer Lifetime Value (LTV)',
      'Monthly Active Users/Customers',
      'Gross Margin (%)',
      'Burn Rate & Runway (months)'
    ],
    benchmarks: {
      'Pre-Seed': {
        expectations: 'Concept validation, initial traction, founding team assembled',
        metrics: { revenue: 'Pre-revenue or early', customers: '10-100 users', runway: '12+ months' }
      },
      'Seed': {
        expectations: 'Product-market fit signals, early revenue, growing user base, unit economics validated',
        metrics: { revenue: '$50K-500K ARR', customers: '100-1K users', runway: '18+ months' }
      },
      'Series A': {
        expectations: 'Product-market fit proven, revenue growth, efficient CAC, clear path to scale',
        metrics: { revenue: '$1M-5M ARR', customers: '1K-10K users', runway: '18-24 months' }
      },
      'Series B': {
        expectations: 'Market traction, revenue acceleration, path to profitability, team scaled',
        metrics: { revenue: '$10M-30M ARR', customers: '10K-100K users', runway: '24+ months' }
      },
      'Series C+': {
        expectations: 'Market leader emerging, strong revenue growth, profitability achieved or near',
        metrics: { revenue: '$50M+ ARR', customers: '100K+ users', runway: 'Profitable or 24+ months' }
      },
      'Growth': {
        expectations: 'Market dominance, profitable, international expansion, acquisition targets',
        metrics: { revenue: '$100M+ ARR', customers: '1M+ users', runway: 'Profitable' }
      }
    },
    vcExpectations: [
      '✓ Strong product-market fit with customer validation',
      '✓ Efficient unit economics (LTV/CAC > 3x)',
      '✓ Experienced founding team with domain expertise',
      '✓ Clear competitive moat or differentiation',
      '✓ Large addressable market with growth potential',
      '✓ Scalable business model with technology leverage',
      '✓ Path to profitability clearly articulated'
    ]
  }
};

// Helper function to get metrics for a specific industry and stage
export function getIndustryMetrics(industry: string, stage: string): {
  metrics: IndustryMetrics;
  stageBenchmark: IndustryBenchmark | null;
} {
  const metrics = INDUSTRY_METRICS[industry] || INDUSTRY_METRICS['Other'];
  const stageBenchmark = metrics.benchmarks[stage] || null;
  
  return { metrics, stageBenchmark };
}
