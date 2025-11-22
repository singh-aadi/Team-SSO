/**
 * 📄 PREMIUM PDF REPORT GENERATOR
 * 
 * Generates 25-30 page comprehensive investment reports:
 * - Professional design with borders and sections
 * - No emojis (safe typography only)
 * - Hyperlinks to sources
 * - Deep sector analysis
 * - Founder profiles with backgrounds
 * - Funding history timeline
 * - 6 core metrics + industry-specific KPIs
 * - Competitive landscape with web-validated data
 * - Risk assessment & opportunities
 * - Investment thesis
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import { PremiumReportData } from './vertex-ai-orchestrator';

const COLORS = {
  primary: '#1e40af',      // Deep blue
  secondary: '#3b82f6',    // Bright blue
  success: '#10b981',      // Green
  warning: '#f59e0b',      // Orange
  danger: '#ef4444',       // Red
  text: '#111827',         // Dark gray
  textLight: '#6b7280',    // Light gray
  border: '#cbd5e1',       // Border gray
  background: '#f8fafc',   // Light background
};

/**
 * Generate Premium PDF Report (25-30 pages)
 */
export async function generatePremiumPDF(
  data: PremiumReportData,
  deckFileName: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 60,
        size: 'A4',
        bufferPages: true,
        info: {
          Title: `${data.companyProfile.name} - Premium Investment Analysis`,
          Author: 'Team SSO Intelligence Engine',
          Subject: 'Venture Capital Investment Analysis',
        },
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      const pageBottom = doc.page.height - 80;

      // ============================================================
      // HELPER FUNCTIONS
      // ============================================================

      const checkPageBreak = (spaceNeeded: number = 120) => {
        if (doc.y + spaceNeeded > pageBottom) {
          doc.addPage();
        }
      };

      const drawBorder = (x: number, y: number, width: number, height: number, color: string = COLORS.border) => {
        doc.rect(x, y, width, height).lineWidth(1).stroke(color);
      };

      const drawSectionHeader = (title: string, addBorder: boolean = true) => {
        checkPageBreak(80);
        const y = doc.y;
        
        if (addBorder) {
          doc.rect(doc.x - 10, y - 5, doc.page.width - 120, 35)
             .fillAndStroke(COLORS.background, COLORS.border);
        }
        
        doc.fontSize(16).font('Helvetica-Bold').fillColor(COLORS.primary)
           .text(title, doc.x, y + 5);
        doc.moveDown(1.5);
        doc.fillColor(COLORS.text);
      };

      const drawSubheader = (title: string) => {
        checkPageBreak(50);
        doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.secondary).text(title);
        doc.moveDown(0.5);
        doc.fillColor(COLORS.text);
      };

      const drawScoreBar = (label: string, score: number, maxWidth: number = 300) => {
        checkPageBreak(40);
        if (label) {
          doc.fontSize(10).font('Helvetica').fillColor(COLORS.text).text(label);
        }
        const barY = doc.y + 2;
        const pct = Math.max(0, Math.min(100, score)) / 100;
        const leftMargin = 60; // Fixed left margin for consistency
        
        // Background bar (left-aligned)
        doc.rect(leftMargin, barY, maxWidth, 10).fill('#e5e7eb');
        
        // Score bar with color (left-aligned)
        const barColor = score >= 75 ? COLORS.success : score >= 50 ? COLORS.warning : COLORS.danger;
        doc.fillColor(barColor).rect(leftMargin, barY, maxWidth * pct, 10).fill();
        
        // Score text (positioned after bar)
        doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.text)
           .text(`${score}/100`, leftMargin + maxWidth + 10, barY - 1);
        
        doc.y = barY + 15;
        doc.x = leftMargin; // Reset x position
      };

      const drawInfoBox = (title: string, content: string, icon: string = '') => {
        checkPageBreak(70);
        const boxY = doc.y;
        const boxHeight = 60;
        
        doc.roundedRect(doc.x, boxY, doc.page.width - 120, boxHeight, 5)
           .fillAndStroke(COLORS.background, COLORS.border);
        
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.primary)
           .text(title, doc.x + 15, boxY + 12);
        doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
           .text(content, doc.x + 15, boxY + 30, { width: doc.page.width - 150 });
        
        doc.y = boxY + boxHeight + 10;
      };

      const drawBulletList = (items: string[], indent: number = 15) => {
        items.forEach(item => {
          checkPageBreak(30);
          doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
             .text(`• ${item}`, { indent, paragraphGap: 5 });
        });
      };

      const drawKeyValuePair = (key: string, value: string) => {
        checkPageBreak(25);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
           .text(`${key}: `, { continued: true });
        doc.font('Helvetica').fillColor(COLORS.textLight).text(value);
      };

      // ============================================================
      // PAGE 1: COVER PAGE
      // ============================================================
      
      // Top border
      doc.rect(0, 0, doc.page.width, 3).fill(COLORS.primary);
      
      // Company name
      doc.moveDown(4);
      doc.fontSize(32).font('Helvetica-Bold').fillColor(COLORS.primary)
         .text(data.companyProfile.name, { align: 'center' });
      
      doc.moveDown(0.5);
      doc.fontSize(14).font('Helvetica').fillColor(COLORS.textLight)
         .text(data.companyProfile.tagline || 'Investment Analysis Report', { align: 'center' });
      
      doc.moveDown(3);
      
      // Score circle
      const centerX = doc.page.width / 2;
      const scoreY = doc.y + 60;
      doc.circle(centerX, scoreY, 70).fillAndStroke(COLORS.primary, COLORS.primary);
      doc.circle(centerX, scoreY, 65).fill('white');
      
      doc.fontSize(48).font('Helvetica-Bold').fillColor(COLORS.primary)
         .text(data.overallScore.toString(), 0, scoreY - 25, { width: doc.page.width, align: 'center' });
      doc.fontSize(12).font('Helvetica').fillColor(COLORS.textLight)
         .text('SSO Score', 0, scoreY + 10, { width: doc.page.width, align: 'center' });
      
      doc.y = scoreY + 100;
      
      // Info boxes
      const infoY = doc.y;
      doc.fontSize(10).font('Helvetica').fillColor(COLORS.text);
      
      doc.text(`Industry: ${data.companyProfile.industry}`, { align: 'center' });
      doc.text(`Stage: ${data.companyProfile.stage}`, { align: 'center' });
      doc.text(`Location: ${data.companyProfile.headquarters}`, { align: 'center' });
      
      // Bottom info
      doc.fontSize(9).font('Helvetica').fillColor(COLORS.textLight)
         .text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 
                60, doc.page.height - 100, { align: 'center', width: doc.page.width - 120 });
      doc.text('Team SSO Intelligence Engine', { align: 'center' });
      doc.text('Powered by AI-Driven Analysis', { align: 'center' });

      // ============================================================
      // PAGE 2: TABLE OF CONTENTS
      // ============================================================
      doc.addPage();
      drawSectionHeader('TABLE OF CONTENTS', false);
      
      const tocItems = [
        { section: 'Executive Summary', page: 3 },
        { section: 'Company Profile', page: 4 },
        { section: 'Founder Profiles & Team', page: 6 },
        { section: 'Funding History & Financials', page: 8 },
        { section: 'Sector Classification & Analysis', page: 10 },
        { section: 'Core Investment Metrics', page: 12 },
        { section: 'Industry-Specific KPIs', page: 16 },
        { section: 'Competitive Landscape', page: 18 },
        { section: 'Risk Assessment', page: 20 },
        { section: 'Growth Opportunities', page: 22 },
        { section: 'Investment Thesis', page: 24 },
        { section: 'Data Sources & Methodology', page: 26 },
      ];
      
      tocItems.forEach(item => {
        checkPageBreak(30);
        doc.fontSize(11).font('Helvetica').fillColor(COLORS.text)
           .text(item.section, { continued: true });
        doc.text('.'.repeat(60), { continued: true });
        doc.text(item.page.toString(), { align: 'right' });
      });

      // ============================================================
      // PAGE 3: EXECUTIVE SUMMARY
      // ============================================================
      doc.addPage();
      drawSectionHeader('EXECUTIVE SUMMARY');
      
      doc.fontSize(11).font('Helvetica').fillColor(COLORS.text)
         .text(data.companyProfile.mission, { paragraphGap: 10 });
      doc.moveDown(1);
      
      drawSubheader('Investment Highlights');
      drawBulletList(data.investmentThesis.bullCase.slice(0, 5));
      doc.moveDown(1);
      
      drawSubheader('Key Metrics at a Glance');
      const metricsRow1Y = doc.y;
      drawKeyValuePair('Overall Score', `${data.overallScore}/100`);
      drawKeyValuePair('Total Funding Raised', data.fundingHistory.totalRaised);
      drawKeyValuePair('Current Revenue', data.coreMetrics.financials.currentRevenue);
      drawKeyValuePair('User Base', data.coreMetrics.traction.users);
      drawKeyValuePair('Growth Rate', data.coreMetrics.traction.growthRate);
      doc.moveDown(1);
      
      drawSubheader('Recommendation');
      const recColor = data.investmentThesis.recommendedAction.toUpperCase().includes('INVEST') 
        ? COLORS.success : data.investmentThesis.recommendedAction.toUpperCase().includes('PASS')
        ? COLORS.danger : COLORS.warning;
      
      doc.fontSize(14).font('Helvetica-Bold').fillColor(recColor)
         .text(data.investmentThesis.recommendedAction);
      doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
         .text(data.investmentThesis.valuation, { paragraphGap: 8 });

      // ============================================================
      // PAGE 4-5: COMPANY PROFILE
      // ============================================================
      doc.addPage();
      drawSectionHeader('COMPANY PROFILE');
      
      drawSubheader('Company Overview');
      drawKeyValuePair('Company Name', data.companyProfile.name);
      drawKeyValuePair('Tagline', data.companyProfile.tagline);
      drawKeyValuePair('Industry', data.companyProfile.industry);
      drawKeyValuePair('Founded', data.companyProfile.foundedYear);
      drawKeyValuePair('Headquarters', data.companyProfile.headquarters);
      drawKeyValuePair('Stage', data.companyProfile.stage);
      
      if (data.companyProfile.website) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
           .text('Website: ', { continued: true });
        doc.font('Helvetica').fillColor(COLORS.secondary)
           .text(data.companyProfile.website, { link: data.companyProfile.website, underline: true });
      }
      doc.moveDown(1.5);
      
      drawSubheader('Mission Statement');
      doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
         .text(data.companyProfile.mission, { paragraphGap: 10 });
      doc.moveDown(1);
      
      drawSubheader('Problem & Solution');
      drawInfoBox('Problem Addressed', data.coreMetrics.problemSolution.painPointAddressed);
      drawInfoBox('Solution Innovation', data.coreMetrics.problemSolution.solutionInnovation);
      drawInfoBox('Unique Value Proposition', data.coreMetrics.problemSolution.uniqueValueProp);

      // ============================================================
      // PAGE 6-7: FOUNDER PROFILES
      // ============================================================
      doc.addPage();
      drawSectionHeader('FOUNDER PROFILES & TEAM');
      
      data.founderProfiles.forEach((founder, idx) => {
        checkPageBreak(180);
        
        // SIMPLE VERTICAL LAYOUT (no boxes, no fixed positions)
        doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.primary)
           .text(`${idx + 1}. ${founder.name}`);
        doc.fontSize(10).font('Helvetica-Oblique').fillColor(COLORS.textLight)
           .text(founder.role);
        doc.moveDown(0.3);
        
        // Background
        doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
           .text(founder.background, { width: doc.page.width - 120, paragraphGap: 5 });
        
        // Education
        if (founder.education) {
          doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
             .text('Education: ', { continued: true });
          doc.font('Helvetica').text(founder.education);
        }
        
        // Previous companies
        if (founder.previousCompanies && founder.previousCompanies.length > 0) {
          doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
             .text('Previous Companies: ', { continued: true });
          doc.font('Helvetica').text(founder.previousCompanies.join(', '));
        }
        
        // Expertise
        if (founder.expertise && founder.expertise.length > 0) {
          doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
             .text('Expertise: ', { continued: true });
          doc.font('Helvetica').text(founder.expertise.join(', '));
        }
        
        // LinkedIn
        if (founder.linkedIn) {
          doc.fontSize(9).font('Helvetica').fillColor(COLORS.secondary)
             .text('LinkedIn Profile', { link: founder.linkedIn, underline: true });
        }
        
        doc.moveDown(1.5);
        
        // Separator line
        if (idx < data.founderProfiles.length - 1) {
          doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - 60, doc.y)
             .stroke(COLORS.border);
          doc.moveDown(1);
        }
      });
      
      doc.moveDown(1);
      drawSubheader('Team Assessment');
      drawKeyValuePair('Team Strength Score', `${data.coreMetrics.team.score}/100`);
      drawKeyValuePair('Domain Expertise', data.coreMetrics.team.domainExpertise);
      drawKeyValuePair('Execution Capability', data.coreMetrics.team.executionCapability);
      
      if (data.coreMetrics.team.advisors.length > 0) {
        doc.moveDown(0.5);
        drawSubheader('Key Advisors');
        drawBulletList(data.coreMetrics.team.advisors);
      }

      // ============================================================
      // PAGE 8-9: FUNDING HISTORY
      // ============================================================
      doc.addPage();
      drawSectionHeader('FUNDING HISTORY & FINANCIALS');
      
      drawSubheader('Funding Overview');
      drawKeyValuePair('Total Raised', data.fundingHistory.totalRaised);
      drawKeyValuePair('Current Runway', data.fundingHistory.currentRunway);
      drawKeyValuePair('Monthly Burn Rate', data.fundingHistory.burnRate);
      doc.moveDown(1);
      
      drawSubheader('Funding Rounds');
      data.fundingHistory.rounds.forEach((round, idx) => {
        checkPageBreak(120);
        
        // Clean box layout (similar to founder profiles)
        doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.primary)
           .text(`${idx + 1}. ${round.roundType}`);
        doc.moveDown(0.2);
        
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
           .text('Amount: ', { continued: true });
        doc.font('Helvetica').text(round.amount);
        
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
           .text('Date: ', { continued: true });
        doc.font('Helvetica').text(round.date);
        
        if (round.valuation) {
          doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
             .text('Valuation: ', { continued: true });
          doc.font('Helvetica').text(round.valuation);
        }
        
        if (round.leadInvestors.length > 0) {
          doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
             .text('Lead Investors: ', { continued: true });
          doc.font('Helvetica').text(round.leadInvestors.join(', '));
        }
        
        doc.moveDown(1);
        
        // Separator line
        if (idx < data.fundingHistory.rounds.length - 1) {
          doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - 60, doc.y)
             .stroke(COLORS.border);
          doc.moveDown(0.5);
        }
      });
      
      doc.moveDown(1);
      drawSubheader('Financial Metrics');
      drawKeyValuePair('Current Revenue', data.coreMetrics.financials.currentRevenue);
      drawKeyValuePair('Projected Revenue', data.coreMetrics.financials.projectedRevenue);
      drawKeyValuePair('Path to Profitability', data.coreMetrics.financials.profitabilityTimeline);
      drawKeyValuePair('Cash Position', data.coreMetrics.financials.cashPosition);
      drawKeyValuePair('Funding Needs', data.coreMetrics.financials.fundingNeeds);

      // ============================================================
      // PAGE 10-11: SECTOR CLASSIFICATION
      // ============================================================
      doc.addPage();
      drawSectionHeader('SECTOR CLASSIFICATION & DEEP ANALYSIS');
      
      drawSubheader('Primary Classification');
      drawKeyValuePair('Primary Sector', data.sectorClassification.primarySector);
      drawKeyValuePair('Sub-Sectors', data.sectorClassification.subSectors.join(', '));
      doc.moveDown(1);
      
      drawSubheader('Deep Sector Breakdown');
      const deepClass = data.sectorClassification.deepClassification;
      
      // VERTICAL hierarchy (straight line layout)
      drawKeyValuePair('Category', deepClass.category);
      drawKeyValuePair('Subcategory', deepClass.subcategory);
      drawKeyValuePair('Niche', deepClass.niche);
      doc.moveDown(0.5);
      
      drawSubheader('Specific Focus Areas');
      drawBulletList(deepClass.specificFocus);
      doc.moveDown(1);
      
      drawSubheader('Regulatory Environment');
      doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
         .text(data.sectorClassification.regulatoryEnvironment, { paragraphGap: 8 });

      // ============================================================
      // PAGE 12-15: CORE METRICS (6 METRICS)
      // ============================================================
      doc.addPage();
      drawSectionHeader('CORE INVESTMENT METRICS');
      
      // Metric 1: Problem & Solution
      checkPageBreak(250);
      drawSubheader('1. Problem & Solution Analysis');
      drawScoreBar('', data.coreMetrics.problemSolution.score, 280);
      doc.moveDown(0.5);
      drawKeyValuePair('Problem Clarity', data.coreMetrics.problemSolution.problemClarity);
      drawKeyValuePair('Solution Innovation', data.coreMetrics.problemSolution.solutionInnovation);
      drawKeyValuePair('Competitive Differentiation', data.coreMetrics.problemSolution.competitiveDifferentiation);
      doc.moveDown(2);
      
      // Metric 2: Market Opportunity
      checkPageBreak(250);
      drawSubheader('2. Market Opportunity');
      drawScoreBar('', data.coreMetrics.marketOpportunity.score, 280);
      doc.moveDown(0.5);
      drawKeyValuePair('TAM (Total Addressable Market)', data.coreMetrics.marketOpportunity.tam);
      drawKeyValuePair('SAM (Serviceable Available Market)', data.coreMetrics.marketOpportunity.sam);
      drawKeyValuePair('SOM (Serviceable Obtainable Market)', data.coreMetrics.marketOpportunity.som);
      drawKeyValuePair('Market Growth Rate', data.coreMetrics.marketOpportunity.marketGrowthRate);
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text).text('Market Trends:');
      drawBulletList(data.coreMetrics.marketOpportunity.marketTrends);
      doc.moveDown(2);
      
      // Metric 3: Traction
      checkPageBreak(250);
      drawSubheader('3. Traction & Growth');
      drawScoreBar('', data.coreMetrics.traction.score, 280);
      doc.moveDown(0.5);
      drawKeyValuePair('Users/Customers', data.coreMetrics.traction.users);
      drawKeyValuePair('Revenue', data.coreMetrics.traction.revenue);
      drawKeyValuePair('Growth Rate', data.coreMetrics.traction.growthRate);
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text).text('Key Milestones:');
      drawBulletList(data.coreMetrics.traction.milestones);
      doc.moveDown(2);
      
      // Metric 4: Team
      checkPageBreak(250);
      drawSubheader('4. Team & Execution');
      drawScoreBar('', data.coreMetrics.team.score, 280);
      doc.moveDown(0.5);
      drawKeyValuePair('Founding Team Strength', data.coreMetrics.team.foundingTeamStrength);
      drawKeyValuePair('Domain Expertise', data.coreMetrics.team.domainExpertise);
      drawKeyValuePair('Execution Capability', data.coreMetrics.team.executionCapability);
      doc.moveDown(2);
      
      // Metric 5: Business Model
      checkPageBreak(250);
      drawSubheader('5. Business Model & Unit Economics');
      drawScoreBar('', data.coreMetrics.businessModel.score, 280);
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text).text('Revenue Streams:');
      drawBulletList(data.coreMetrics.businessModel.revenueStreams);
      doc.moveDown(0.5);
      drawKeyValuePair('Pricing Strategy', data.coreMetrics.businessModel.pricingStrategy);
      drawKeyValuePair('Unit Economics', data.coreMetrics.businessModel.unitEconomics);
      drawKeyValuePair('Scalability', data.coreMetrics.businessModel.scalability);
      drawKeyValuePair('Margins', data.coreMetrics.businessModel.margins);
      doc.moveDown(2);
      
      // Metric 6: Financials
      checkPageBreak(250);
      drawSubheader('6. Financials & Capital Efficiency');
      drawScoreBar('', data.coreMetrics.financials.score, 280);
      doc.moveDown(0.5);
      drawKeyValuePair('Current Revenue', data.coreMetrics.financials.currentRevenue);
      drawKeyValuePair('Projected Revenue', data.coreMetrics.financials.projectedRevenue);
      drawKeyValuePair('Profitability Timeline', data.coreMetrics.financials.profitabilityTimeline);
      drawKeyValuePair('Cash Position', data.coreMetrics.financials.cashPosition);
      drawKeyValuePair('Funding Needs', data.coreMetrics.financials.fundingNeeds);
      doc.moveDown(1);

      // ============================================================
      // PAGE 16-17: INDUSTRY-SPECIFIC METRICS
      // ============================================================
      doc.addPage();
      drawSectionHeader('INDUSTRY-SPECIFIC KPIs');
      
      doc.fontSize(10).font('Helvetica').fillColor(COLORS.textLight)
         .text(`Metrics specific to ${data.sectorClassification.primarySector} sector:`, { paragraphGap: 8 });
      doc.moveDown(0.5);
      
      // Display industry-specific metrics dynamically
      const realMetricKeys = Object.keys(data.industrySpecificMetrics).filter(key => !key.startsWith('//'));
      
      if (realMetricKeys.length === 0) {
        doc.fontSize(10).font('Helvetica-Oblique').fillColor(COLORS.textLight)
           .text('Industry-specific KPIs will be extracted from the deck and validated via web search. This section shows metrics like:', { paragraphGap: 5 });
        doc.moveDown(0.5);
        
        // Show examples based on sector
        const sector = data.sectorClassification.primarySector.toLowerCase();
        const exampleMetrics: Record<string, string[]> = {
          'healthcare': ['Regulatory Approvals', 'Clinical Validation', 'Reimbursement Strategy', 'Data Privacy Compliance'],
          'saas': ['ARR/MRR', 'Churn Rate', 'Net Promoter Score', 'LTV:CAC Ratio'],
          'fintech': ['Licenses', 'Assets Under Management', 'Transaction Volume', 'Fraud Rate'],
          'ecommerce': ['GMV', 'Average Order Value', 'Conversion Rate', 'Repeat Purchase Rate'],
          'ai': ['Model Accuracy', 'Dataset Size', 'Inference Speed', 'Compute Costs']
        };
        
        const relevantMetrics = exampleMetrics[sector] || ['Revenue Growth', 'User Metrics', 'Unit Economics', 'Key Performance Indicators'];
        drawBulletList(relevantMetrics);
      } else {
        realMetricKeys.forEach(key => {
          checkPageBreak(100);
          drawSubheader(key.replace(/([A-Z_])/g, ' $1').trim());
          
          const metrics = data.industrySpecificMetrics[key];
          if (typeof metrics === 'object') {
            Object.keys(metrics).forEach(metricKey => {
              if (!metricKey.startsWith('//')) {
                drawKeyValuePair(
                  metricKey.replace(/([A-Z_])/g, ' $1').trim(),
                  String(metrics[metricKey])
                );
              }
            });
          }
          doc.moveDown(1);
        });
      }

      // ============================================================
      // PAGE 18-19: COMPETITIVE LANDSCAPE
      // ============================================================
      doc.addPage();
      drawSectionHeader('COMPETITIVE LANDSCAPE ANALYSIS');
      
      drawSubheader('Direct Competitors');
      data.competitiveAnalysis.directCompetitors.forEach((comp, idx) => {
        checkPageBreak(150);
        
        // Clean layout (similar to founder profiles)
        doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.primary)
           .text(`${idx + 1}. ${comp.name}`);
        doc.moveDown(0.2);
        
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
           .text('Funding: ', { continued: true });
        doc.font('Helvetica').text(comp.funding);
        
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
           .text('Market Position: ', { continued: true });
        doc.font('Helvetica').text(comp.marketPosition);
        
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.success)
           .text('Strengths: ', { continued: true });
        doc.font('Helvetica').fillColor(COLORS.text).text(comp.strengths.join(', '));
        
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.danger)
           .text('Weaknesses: ', { continued: true });
        doc.font('Helvetica').fillColor(COLORS.text).text(comp.weaknesses.join(', '));
        
        doc.moveDown(1);
        
        // Separator line
        if (idx < data.competitiveAnalysis.directCompetitors.length - 1) {
          doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - 60, doc.y)
             .stroke(COLORS.border);
          doc.moveDown(0.5);
        }
      });
      
      doc.moveDown(1);
      drawSubheader('Competitive Advantages');
      drawBulletList(data.competitiveAnalysis.competitiveAdvantages);
      doc.moveDown(1);
      
      drawSubheader('Moat & Defensibility');
      doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
         .text(data.competitiveAnalysis.moat, { paragraphGap: 8 });

      // ============================================================
      // PAGE 20-21: RISK ASSESSMENT
      // ============================================================
      doc.addPage();
      drawSectionHeader('RISK ASSESSMENT');
      
      const riskCategories = [
        { title: 'Market Risks', items: data.riskAssessment.marketRisks, color: COLORS.danger },
        { title: 'Execution Risks', items: data.riskAssessment.executionRisks, color: COLORS.warning },
        { title: 'Competitive Risks', items: data.riskAssessment.competitiveRisks, color: COLORS.warning },
        { title: 'Financial Risks', items: data.riskAssessment.financialRisks, color: COLORS.danger },
        { title: 'Regulatory Risks', items: data.riskAssessment.regulatoryRisks, color: COLORS.warning },
      ];
      
      riskCategories.forEach(category => {
        if (category.items.length > 0) {
          checkPageBreak(100);
          doc.fontSize(11).font('Helvetica-Bold').fillColor(category.color).text(category.title);
          doc.moveDown(0.3);
          drawBulletList(category.items);
          doc.moveDown(1);
        }
      });
      
      drawSubheader('Mitigation Strategies');
      drawBulletList(data.riskAssessment.mitigationStrategies);

      // ============================================================
      // PAGE 22-23: OPPORTUNITIES
      // ============================================================
      doc.addPage();
      drawSectionHeader('GROWTH OPPORTUNITIES');
      
      drawSubheader('Expansion Opportunities');
      drawBulletList(data.opportunities.expansionOpportunities);
      doc.moveDown(1);
      
      drawSubheader('Partnership Potential');
      drawBulletList(data.opportunities.partnershipPotential);
      doc.moveDown(1);
      
      drawSubheader('Exit Scenarios');
      drawBulletList(data.opportunities.exitScenarios);
      doc.moveDown(1);
      
      drawSubheader('Strategic Options');
      drawBulletList(data.opportunities.strategicOptions);

      // ============================================================
      // PAGE 24-25: INVESTMENT THESIS
      // ============================================================
      doc.addPage();
      drawSectionHeader('INVESTMENT THESIS');
      
      // Bull Case (clean straight layout)
      doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.success)
         .text('BULL CASE');
      doc.moveDown(0.5);
      
      data.investmentThesis.bullCase.forEach((point, idx) => {
        doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
           .text(`${idx + 1}. ${point}`, { paragraphGap: 5 });
      });
      doc.moveDown(1.5);
      
      // Bear Case (clean straight layout)
      doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.danger)
         .text('BEAR CASE');
      doc.moveDown(0.5);
      
      data.investmentThesis.bearCase.forEach((point, idx) => {
        doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
           .text(`${idx + 1}. ${point}`, { paragraphGap: 5 });
      });
      doc.moveDown(1.5);
      
      doc.moveDown(1);
      drawSubheader('Key Assumptions');
      drawBulletList(data.investmentThesis.keyAssumptions);
      doc.moveDown(1);
      
      drawSubheader('Valuation & Terms');
      drawKeyValuePair('Valuation', data.investmentThesis.valuation);
      drawKeyValuePair('Target Ownership', data.investmentThesis.targetOwnership);
      doc.moveDown(1);
      
      // Final Recommendation Box
      const recBoxY = doc.y;
      const recActionUpper = data.investmentThesis.recommendedAction.toUpperCase();
      const recBgColor = recActionUpper.includes('INVEST') ? '#d1fae5' : 
                         recActionUpper.includes('PASS') ? '#fee2e2' : '#fef3c7';
      const recBorderColor = recActionUpper.includes('INVEST') ? COLORS.success : 
                             recActionUpper.includes('PASS') ? COLORS.danger : COLORS.warning;
      
      doc.roundedRect(doc.x, recBoxY, doc.page.width - 120, 60, 5)
         .fillAndStroke(recBgColor, recBorderColor);
      doc.fontSize(14).font('Helvetica-Bold').fillColor(recBorderColor)
         .text('RECOMMENDATION', doc.x + 15, recBoxY + 12);
      doc.fontSize(12).font('Helvetica-Bold')
         .text(data.investmentThesis.recommendedAction, doc.x + 15, recBoxY + 35);
      doc.y = recBoxY + 70;

      // ============================================================
      // PAGE 26-27: DATA SOURCES & METHODOLOGY
      // ============================================================
      doc.addPage();
      drawSectionHeader('DATA SOURCES & METHODOLOGY');
      
      drawSubheader('Analysis Confidence');
      drawKeyValuePair('Overall Confidence', data.confidence);
      doc.moveDown(1);
      
      drawSubheader('Data Sources');
      doc.fontSize(9).font('Helvetica').fillColor(COLORS.textLight)
         .text('This analysis was compiled from the following sources:', { paragraphGap: 8 });
      doc.moveDown(0.5);
      
      data.dataSources.forEach((source, idx) => {
        checkPageBreak(25);
        doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
           .text(`${idx + 1}. ${source}`, { indent: 15 });
      });
      
      doc.moveDown(1.5);
      drawSubheader('Methodology');
      doc.fontSize(10).font('Helvetica').fillColor(COLORS.text).text(
        'This report was generated using advanced AI analysis powered by Google Vertex AI with real-time web search capabilities. ' +
        'The analysis combines pitch deck content with validated external data sources including Crunchbase, LinkedIn, industry reports, ' +
        'and news sources. Scores are calculated using proprietary algorithms that weight multiple factors including market opportunity, ' +
        'team strength, traction, competitive positioning, and financial metrics.',
        { paragraphGap: 8 }
      );
      
      doc.moveDown(1);
      doc.fontSize(9).font('Helvetica').fillColor(COLORS.textLight).text(
        'Note: This analysis is for informational purposes only and should not be considered as investment advice. ' +
        'Always conduct your own due diligence before making investment decisions.',
        { paragraphGap: 8 }
      );

      // ============================================================
      // FOOTER ON ALL PAGES
      // ============================================================
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        
        // Bottom border
        doc.rect(0, doc.page.height - 3, doc.page.width, 3).fill(COLORS.primary);
        
        // Footer text
        doc.fontSize(8).font('Helvetica').fillColor(COLORS.textLight)
           .text(
             `${data.companyProfile.name} Investment Analysis | Page ${i + 1} of ${pageCount} | Team SSO Intelligence Engine`,
             60,
             doc.page.height - 50,
             { align: 'center', width: doc.page.width - 120 }
           );
      }

      doc.end();
      stream.on('finish', () => {
        console.log(`✅ Premium PDF generated: ${outputPath} (${pageCount} pages)`);
        resolve();
      });
      stream.on('error', reject);
    } catch (error) {
      console.error('❌ Premium PDF generation failed:', error);
      reject(error);
    }
  });
}
