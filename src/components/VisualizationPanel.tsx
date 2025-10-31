import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

interface AnalysisData {
  problemScore: number;
  solutionScore: number;
  marketScore: number;
  tractionScore: number;
  teamScore: number;
  financialsScore: number;
  overallScore: number;
}

interface VisualizationPanelProps {
  analysis: AnalysisData;
  sections: Array<{
    sectionName: string;
    sectionScore: number;
  }>;
}

export function VisualizationPanel({ analysis, sections }: VisualizationPanelProps) {
  // Data for Radar Chart (Spider Chart)
  const radarData = [
    { subject: 'Problem & Solution', value: analysis.problemScore, fullMark: 100 },
    { subject: 'Market Opportunity', value: analysis.marketScore, fullMark: 100 },
    { subject: 'Traction & Growth', value: analysis.tractionScore, fullMark: 100 },
    { subject: 'Team & Execution', value: analysis.teamScore, fullMark: 100 },
    { subject: 'Business Model', value: analysis.financialsScore, fullMark: 100 },
  ];

  // Data for Bar Chart
  const barData = sections.map(section => ({
    name: section.sectionName.length > 20 
      ? section.sectionName.substring(0, 20) + '...' 
      : section.sectionName,
    score: section.sectionScore,
  }));

  // Color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Gauge */}
      <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-8">
        <div className="text-center">
          <div className="relative inline-block">
            <svg className="w-48 h-48" viewBox="0 0 200 200">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="20"
              />
              {/* Score circle */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke={getScoreColor(analysis.overallScore)}
                strokeWidth="20"
                strokeDasharray={`${(analysis.overallScore / 100) * 502} 502`}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
                className="transition-all duration-1000 ease-out"
              />
              {/* Center text */}
              <text
                x="100"
                y="95"
                textAnchor="middle"
                className="text-5xl font-bold fill-slate-900"
              >
                {analysis.overallScore}
              </text>
              <text
                x="100"
                y="115"
                textAnchor="middle"
                className="text-sm fill-slate-600"
              >
                / 100
              </text>
              <text
                x="100"
                y="135"
                textAnchor="middle"
                className="text-2xl font-bold"
                fill={getScoreColor(analysis.overallScore)}
              >
                {getScoreGrade(analysis.overallScore)}
              </text>
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mt-4">SSO Readiness Score™</h3>
          <p className="text-slate-600 mt-2">Investment Readiness Assessment</p>
        </div>
      </div>

      {/* Radar Chart - Category Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance Radar</h3>
        <p className="text-sm text-slate-600 mb-6">Multi-dimensional analysis across key investment criteria</p>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: '#475569', fontSize: 12 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
            />
            <Radar
              name="Score"
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '8px 12px'
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart - Section Scores */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Section Performance</h3>
        <p className="text-sm text-slate-600 mb-6">Detailed breakdown by deck section</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b' }} />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={150}
              tick={{ fill: '#475569', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '8px 12px'
              }}
            />
            <Bar dataKey="score" radius={[0, 8, 8, 0]}>
              {barData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Score Distribution */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Problem & Solution', score: analysis.problemScore },
          { label: 'Market Opportunity', score: analysis.marketScore },
          { label: 'Traction & Growth', score: analysis.tractionScore },
          { label: 'Team & Execution', score: analysis.teamScore },
          { label: 'Business Model', score: analysis.financialsScore },
          { label: 'Overall', score: analysis.overallScore }
        ].map((item, index) => (
          <div key={index} className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">{item.label}</span>
              <span 
                className="text-lg font-bold"
                style={{ color: getScoreColor(item.score) }}
              >
                {item.score}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${item.score}%`,
                  backgroundColor: getScoreColor(item.score)
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
