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

      // 🎯 NEW: Draw a proper table with Criteria, Description, Assessment columns
      const drawMetricsTable = (rows: Array<{criteria: string; description: string; assessment: string}>) => {
        const leftMargin = 60;
        const tableWidth = doc.page.width - 120;
        
        // Column widths - give MORE space to Assessment (40%)
        const col1Width = tableWidth * 0.20; // Criteria: 20%
        const col2Width = tableWidth * 0.35; // Description: 35%
        const col3Width = tableWidth * 0.45; // Assessment: 45%
        
        // Header row
        const headerY = doc.y;
        const headerHeight = 25;
        
        // Header background
        doc.rect(leftMargin, headerY, tableWidth, headerHeight).fill(COLORS.primary);
        
        // Header text - center aligned
        doc.fontSize(9).font('Helvetica-Bold').fillColor('white');
        doc.text('Criteria', leftMargin, headerY + 8, { width: col1Width, align: 'center' });
        doc.text('Description', leftMargin + col1Width, headerY + 8, { width: col2Width, align: 'center' });
        doc.text('Assessment', leftMargin + col1Width + col2Width, headerY + 8, { width: col3Width, align: 'center' });
        
        doc.y = headerY + headerHeight;
        
        // Data rows
        rows.forEach((row, idx) => {
          // Calculate row height based on content (set font size first for accurate height calculation)
          doc.fontSize(9);
          const criteriaHeight = doc.heightOfString(row.criteria, { width: col1Width - 10 });
          const descHeight = doc.heightOfString(row.description, { width: col2Width - 10 });
          const assessHeight = doc.heightOfString(row.assessment, { width: col3Width - 10 });
          const rowHeight = Math.max(40, criteriaHeight + 15, descHeight + 15, assessHeight + 15);
          
          checkPageBreak(rowHeight + 10);
          
          const rowY = doc.y;
          
          // Alternate row background
          const bgColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
          doc.rect(leftMargin, rowY, tableWidth, rowHeight).fill(bgColor);
          
          // Row border
          doc.rect(leftMargin, rowY, tableWidth, rowHeight).stroke(COLORS.border);
          
          // Column separators
          doc.moveTo(leftMargin + col1Width, rowY).lineTo(leftMargin + col1Width, rowY + rowHeight).stroke(COLORS.border);
          doc.moveTo(leftMargin + col1Width + col2Width, rowY).lineTo(leftMargin + col1Width + col2Width, rowY + rowHeight).stroke(COLORS.border);
          
          // Cell content - center aligned vertically and horizontally
          const textPadding = 5;
          const verticalPadding = (rowHeight - 12) / 2;
          
          doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.text);
          doc.text(row.criteria, leftMargin + textPadding, rowY + textPadding, { 
            width: col1Width - (textPadding * 2), 
            align: 'center' 
          });
          
          doc.fontSize(9).font('Helvetica').fillColor(COLORS.textLight);
          doc.text(row.description, leftMargin + col1Width + textPadding, rowY + textPadding, { 
            width: col2Width - (textPadding * 2), 
            align: 'center' 
          });
          
          doc.fontSize(9).font('Helvetica').fillColor(COLORS.text);
          doc.text(row.assessment, leftMargin + col1Width + col2Width + textPadding, rowY + textPadding, { 
            width: col3Width - (textPadding * 2), 
            align: 'center' 
          });
          
          doc.y = rowY + rowHeight;
        });
        
        doc.moveDown(1);
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
        { section: 'VC Alignment Analysis (NEW)', page: 26 },
        { section: 'Data Sources & Methodology', page: 28 },
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
      // PAGE 4-5: COMPANY PROFILE (Left-aligned, section-wise layout)
      // ============================================================
      doc.addPage();
      drawSectionHeader('COMPANY PROFILE');
      
      const leftMargin = 60;
      const contentWidth = doc.page.width - 120;
      
      // Company Overview Box
      checkPageBreak(200);
      const overviewBoxY = doc.y;
      doc.roundedRect(leftMargin, overviewBoxY, contentWidth, 180, 5)
         .fillAndStroke('#f8fafc', COLORS.border);
      
      doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.primary)
         .text('Company Overview', leftMargin + 15, overviewBoxY + 12);
      
      let currentY = overviewBoxY + 35;
      const labelWidth = 100;
      const valueX = leftMargin + 15 + labelWidth;
      
      // Company details - left aligned with consistent spacing
      const companyDetails = [
        { label: 'Company Name:', value: data.companyProfile.name },
        { label: 'Tagline:', value: data.companyProfile.tagline },
        { label: 'Industry:', value: data.companyProfile.industry },
        { label: 'Founded:', value: data.companyProfile.foundedYear },
        { label: 'Headquarters:', value: data.companyProfile.headquarters },
        { label: 'Stage:', value: data.companyProfile.stage },
      ];
      
      companyDetails.forEach(detail => {
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
           .text(detail.label, leftMargin + 15, currentY, { width: labelWidth });
        doc.fontSize(10).font('Helvetica').fillColor(COLORS.textLight)
           .text(detail.value, valueX, currentY, { width: contentWidth - labelWidth - 30 });
        currentY += 22;
      });
      
      // Website (if available)
      if (data.companyProfile.website) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
           .text('Website:', leftMargin + 15, currentY, { width: labelWidth });
        doc.fontSize(10).font('Helvetica').fillColor(COLORS.secondary)
           .text(data.companyProfile.website, valueX, currentY, { 
             width: contentWidth - labelWidth - 30,
             link: data.companyProfile.website,
             underline: true
           });
      }
      
      doc.y = overviewBoxY + 195;
      
      // Mission Statement Section
      checkPageBreak(100);
      const missionBoxY = doc.y;
      const missionHeight = Math.max(80, doc.heightOfString(data.companyProfile.mission, { width: contentWidth - 30 }) + 45);
      
      doc.roundedRect(leftMargin, missionBoxY, contentWidth, missionHeight, 5)
         .fillAndStroke('#f0f9ff', COLORS.secondary);
      
      doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.primary)
         .text('Mission Statement', leftMargin + 15, missionBoxY + 12);
      doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
         .text(data.companyProfile.mission, leftMargin + 15, missionBoxY + 35, { 
           width: contentWidth - 30,
           align: 'left'
         });
      
      doc.y = missionBoxY + missionHeight + 15;
      
      // Problem & Solution Section
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
      // PAGE 12-15: CORE METRICS (6 METRICS) - TABLE FORMAT
      // ============================================================
      doc.addPage();
      drawSectionHeader('CORE INVESTMENT METRICS');
      
      // A. Problem & Solution Analysis
      checkPageBreak(200);
      drawSubheader('A. Problem & Solution Analysis');
      drawScoreBar('', data.coreMetrics.problemSolution.score, 280);
      doc.moveDown(0.5);
      drawMetricsTable([
        { criteria: 'Problem Clarity', description: 'How clearly the problem is defined and validated', assessment: data.coreMetrics.problemSolution.problemClarity },
        { criteria: 'Solution Innovation', description: 'Uniqueness and effectiveness of the proposed solution', assessment: data.coreMetrics.problemSolution.solutionInnovation },
        { criteria: 'Competitive Edge', description: 'Differentiation from existing solutions', assessment: data.coreMetrics.problemSolution.competitiveDifferentiation },
      ]);
      doc.moveDown(1);
      
      // B. Market Opportunity Analysis
      checkPageBreak(220);
      drawSubheader('B. Market Opportunity Analysis');
      drawScoreBar('', data.coreMetrics.marketOpportunity.score, 280);
      doc.moveDown(0.5);
      drawMetricsTable([
        { criteria: 'TAM', description: 'Total Addressable Market size', assessment: data.coreMetrics.marketOpportunity.tam },
        { criteria: 'SAM', description: 'Serviceable Available Market', assessment: data.coreMetrics.marketOpportunity.sam },
        { criteria: 'SOM', description: 'Serviceable Obtainable Market', assessment: data.coreMetrics.marketOpportunity.som },
        { criteria: 'Growth Rate', description: 'Market expansion trajectory', assessment: data.coreMetrics.marketOpportunity.marketGrowthRate },
      ]);
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text).text('Market Trends:');
      drawBulletList(data.coreMetrics.marketOpportunity.marketTrends);
      doc.moveDown(1);
      
      // C. Traction & Growth Metrics
      doc.addPage();
      checkPageBreak(200);
      drawSubheader('C. Traction & Growth Metrics');
      drawScoreBar('', data.coreMetrics.traction.score, 280);
      doc.moveDown(0.5);
      drawMetricsTable([
        { criteria: 'Users/Customers', description: 'Current user or customer base', assessment: data.coreMetrics.traction.users },
        { criteria: 'Revenue', description: 'Current revenue performance', assessment: data.coreMetrics.traction.revenue },
        { criteria: 'Growth Rate', description: 'Month-over-month or year-over-year growth', assessment: data.coreMetrics.traction.growthRate },
      ]);
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text).text('Key Milestones:');
      drawBulletList(data.coreMetrics.traction.milestones);
      doc.moveDown(1);
      
      // D. Team & Execution Capability
      checkPageBreak(200);
      drawSubheader('D. Team & Execution Capability');
      drawScoreBar('', data.coreMetrics.team.score, 280);
      doc.moveDown(0.5);
      drawMetricsTable([
        { criteria: 'Team Strength', description: 'Overall founding team caliber', assessment: data.coreMetrics.team.foundingTeamStrength },
        { criteria: 'Domain Expertise', description: 'Industry and technical knowledge', assessment: data.coreMetrics.team.domainExpertise },
        { criteria: 'Execution', description: 'Track record of delivery', assessment: data.coreMetrics.team.executionCapability },
      ]);
      doc.moveDown(1);
      
      // E. Business Model & Unit Economics
      checkPageBreak(220);
      drawSubheader('E. Business Model & Unit Economics');
      drawScoreBar('', data.coreMetrics.businessModel.score, 280);
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text).text('Revenue Streams:');
      drawBulletList(data.coreMetrics.businessModel.revenueStreams);
      doc.moveDown(0.5);
      drawMetricsTable([
        { criteria: 'Pricing', description: 'Pricing model and strategy', assessment: data.coreMetrics.businessModel.pricingStrategy },
        { criteria: 'Unit Economics', description: 'Per-unit profitability metrics', assessment: data.coreMetrics.businessModel.unitEconomics },
        { criteria: 'Scalability', description: 'Ability to scale operations', assessment: data.coreMetrics.businessModel.scalability },
        { criteria: 'Margins', description: 'Gross and net margin profile', assessment: data.coreMetrics.businessModel.margins },
      ]);
      doc.moveDown(1);
      
      // F. Financials & Capital Efficiency
      doc.addPage();
      checkPageBreak(200);
      drawSubheader('F. Financials & Capital Efficiency');
      drawScoreBar('', data.coreMetrics.financials.score, 280);
      doc.moveDown(0.5);
      drawMetricsTable([
        { criteria: 'Current Revenue', description: 'Present revenue run rate', assessment: data.coreMetrics.financials.currentRevenue },
        { criteria: 'Projected Revenue', description: 'Future revenue forecasts', assessment: data.coreMetrics.financials.projectedRevenue },
        { criteria: 'Profitability', description: 'Path to breakeven/profit', assessment: data.coreMetrics.financials.profitabilityTimeline },
        { criteria: 'Cash Position', description: 'Current cash on hand', assessment: data.coreMetrics.financials.cashPosition },
        { criteria: 'Funding Needs', description: 'Capital requirements', assessment: data.coreMetrics.financials.fundingNeeds },
      ]);
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
      
      const thesisLeftMargin = 60;
      const thesisContentWidth = doc.page.width - 120;
      
      // Bull Case Section (Green background box)
      checkPageBreak(180);
      const bullBoxY = doc.y;
      const bullPoints = data.investmentThesis.bullCase;
      const bullContentHeight = Math.max(100, (bullPoints.length * 22) + 40);
      
      doc.roundedRect(thesisLeftMargin, bullBoxY, thesisContentWidth, bullContentHeight, 5)
         .fillAndStroke('#d1fae5', COLORS.success);
      
      doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.success)
         .text('BULL CASE', thesisLeftMargin + 15, bullBoxY + 12);
      
      let bullY = bullBoxY + 35;
      bullPoints.forEach((point, idx) => {
        doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
           .text(`${idx + 1}. ${point}`, thesisLeftMargin + 15, bullY, { 
             width: thesisContentWidth - 30 
           });
        bullY += 20;
      });
      
      doc.y = bullBoxY + bullContentHeight + 15;
      
      // Bear Case Section (Red background box)
      checkPageBreak(180);
      const bearBoxY = doc.y;
      const bearPoints = data.investmentThesis.bearCase;
      const bearContentHeight = Math.max(100, (bearPoints.length * 22) + 40);
      
      doc.roundedRect(thesisLeftMargin, bearBoxY, thesisContentWidth, bearContentHeight, 5)
         .fillAndStroke('#fee2e2', COLORS.danger);
      
      doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.danger)
         .text('BEAR CASE', thesisLeftMargin + 15, bearBoxY + 12);
      
      let bearY = bearBoxY + 35;
      bearPoints.forEach((point, idx) => {
        doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
           .text(`${idx + 1}. ${point}`, thesisLeftMargin + 15, bearY, { 
             width: thesisContentWidth - 30 
           });
        bearY += 20;
      });
      
      doc.y = bearBoxY + bearContentHeight + 15;
      
      doc.moveDown(1);
      drawSubheader('Key Assumptions');
      drawBulletList(data.investmentThesis.keyAssumptions);
      doc.moveDown(1);
      
      drawSubheader('Valuation & Terms');
      drawKeyValuePair('Valuation', data.investmentThesis.valuation);
      drawKeyValuePair('Target Ownership', data.investmentThesis.targetOwnership);
      doc.moveDown(1.5);
      
      // Final Recommendation Box - CENTER ALIGNED WITH FULL GREEN HIGHLIGHT
      checkPageBreak(100);
      const recActionUpper = data.investmentThesis.recommendedAction.toUpperCase();
      const recBgColor = recActionUpper.includes('INVEST') ? '#d1fae5' : 
                         recActionUpper.includes('PASS') ? '#fee2e2' : '#fef3c7';
      const recBorderColor = recActionUpper.includes('INVEST') ? COLORS.success : 
                             recActionUpper.includes('PASS') ? COLORS.danger : COLORS.warning;
      
      // Center the recommendation box on the page
      const recBoxWidth = thesisContentWidth;
      const recBoxHeight = 80;
      const recBoxX = thesisLeftMargin;
      const recBoxY = doc.y;
      
      // Draw recommendation box with proper highlighting
      doc.roundedRect(recBoxX, recBoxY, recBoxWidth, recBoxHeight, 8)
         .lineWidth(3)
         .fillAndStroke(recBgColor, recBorderColor);
      
      // Recommendation label - center aligned
      doc.fontSize(12).font('Helvetica-Bold').fillColor(recBorderColor)
         .text('FINAL RECOMMENDATION', recBoxX, recBoxY + 15, { 
           width: recBoxWidth, 
           align: 'center' 
         });
      
      // Recommendation action - center aligned, larger font
      doc.fontSize(16).font('Helvetica-Bold').fillColor(recBorderColor)
         .text(data.investmentThesis.recommendedAction, recBoxX, recBoxY + 42, { 
           width: recBoxWidth, 
           align: 'center' 
         });
      
      doc.y = recBoxY + recBoxHeight + 20;

      // ============================================================
      // 🎯 NEW: VC ALIGNMENT ANALYSIS (IF AVAILABLE)
      // ============================================================
      if (data.vcAlignmentAnalysis) {
        doc.addPage();
        drawSectionHeader('VC ALIGNMENT ANALYSIS');
        
        doc.fontSize(10).font('Helvetica').fillColor(COLORS.text).text(
          'This section evaluates how well this startup aligns with your specific investment preferences, ' +
          'dealbreakers, positive patterns, and thesis. Each finding includes evidence from the pitch deck.',
          { paragraphGap: 10 }
        );
        doc.moveDown(1.5);

        // ============================================================
        // DEALBREAKER FLAGS (if available)
        // ============================================================
        if (data.vcAlignmentAnalysis.dealbreakerFlags && data.vcAlignmentAnalysis.dealbreakerFlags.length > 0) {
          checkPageBreak(100);
          drawSubheader('DEALBREAKER CHECK');
          doc.fontSize(9).font('Helvetica').fillColor(COLORS.textLight).text(
            'Critical criteria that would automatically disqualify this investment.',
            { paragraphGap: 8, align: 'left' }
          );
          doc.moveDown(0.5);

          const leftMargin = 60;
          const boxWidth = doc.page.width - 120;

          data.vcAlignmentAnalysis.dealbreakerFlags.forEach((flag, idx) => {
            checkPageBreak(140);
            
            const boxY = doc.y;
            
            // Color based on match status
            const bgColor = flag.matched ? '#fee2e2' : '#d1fae5';
            const borderColor = flag.matched ? COLORS.danger : COLORS.success;
            const statusText = flag.matched ? 'MATCHED - CRITICAL' : 'NOT MATCHED - Safe';
            const statusIcon = flag.matched ? 'X' : 'OK';
            
            // Calculate dynamic height based on content
            const dealbreakerHeight = doc.heightOfString(`Dealbreaker: ${flag.dealbreaker}`, { width: boxWidth - 30 });
            const reasoningHeight = doc.heightOfString(`Reasoning: ${flag.reasoning}`, { width: boxWidth - 30 });
            let contentHeight = 60 + dealbreakerHeight + reasoningHeight;
            
            if (flag.evidenceFromDeck && flag.evidenceFromDeck.length > 0) {
              const evidenceText = `Evidence: ${flag.evidenceFromDeck[0].substring(0, 150)}`;
              const evidenceHeight = doc.heightOfString(evidenceText, { width: boxWidth - 30 });
              contentHeight += evidenceHeight + 10;
            }
            
            const boxHeight = Math.max(110, contentHeight);
            
            // Draw box
            doc.roundedRect(leftMargin, boxY, boxWidth, boxHeight, 5)
               .fillAndStroke(bgColor, borderColor);
            
            // Status indicator
            doc.fontSize(11).font('Helvetica-Bold').fillColor(borderColor)
               .text(`[${statusIcon}] ${statusText}`, leftMargin + 15, boxY + 12, { align: 'left' });
            
            let currentY = boxY + 32;
            
            // Dealbreaker text
            doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
               .text(`Dealbreaker: ${flag.dealbreaker}`, leftMargin + 15, currentY, { 
                 width: boxWidth - 30, 
                 align: 'left' 
               });
            currentY += dealbreakerHeight + 8;
            
            // Reasoning
            doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
               .text(`Reasoning: ${flag.reasoning}`, leftMargin + 15, currentY, { 
                 width: boxWidth - 30, 
                 align: 'left' 
               });
            currentY += reasoningHeight + 8;
            
            // Evidence (if available and matched)
            if (flag.evidenceFromDeck && flag.evidenceFromDeck.length > 0) {
              doc.fontSize(8).font('Helvetica-Oblique').fillColor(COLORS.textLight)
                 .text(`Evidence: ${flag.evidenceFromDeck[0].substring(0, 150)}`, leftMargin + 15, currentY, { 
                   width: boxWidth - 30, 
                   align: 'left' 
                 });
            }
            
            doc.y = boxY + boxHeight + 20;
            doc.x = leftMargin;
          });
          
          doc.moveDown(1.5);
        }

        // ============================================================
        // POSITIVE PATTERN MATCHES (if available)
        // ============================================================
        if (data.vcAlignmentAnalysis.positivePatternMatches && data.vcAlignmentAnalysis.positivePatternMatches.length > 0) {
          checkPageBreak(100);
          drawSubheader('POSITIVE PATTERN MATCHES');
          doc.fontSize(9).font('Helvetica').fillColor(COLORS.textLight).text(
            'Favorable characteristics you actively look for in investment opportunities.',
            { paragraphGap: 8, align: 'left' }
          );
          doc.moveDown(0.5);

          const leftMargin = 60;
          const boxWidth = doc.page.width - 120;

          data.vcAlignmentAnalysis.positivePatternMatches.forEach((pattern, idx) => {
            checkPageBreak(140);
            
            const boxY = doc.y;
            
            // Color based on match status and strength
            let bgColor = '#fef3c7';
            let borderColor = COLORS.warning;
            let statusText = 'NOT MATCHED';
            
            if (pattern.matched) {
              if (pattern.strength === 'strong') {
                bgColor = '#d1fae5';
                borderColor = COLORS.success;
                statusText = 'STRONG MATCH';
              } else if (pattern.strength === 'moderate') {
                bgColor = '#e0f2fe';
                borderColor = COLORS.secondary;
                statusText = 'MODERATE MATCH';
              } else {
                bgColor = '#fef3c7';
                borderColor = COLORS.warning;
                statusText = 'WEAK MATCH';
              }
            }
            
            const statusIcon = pattern.matched ? 'YES' : 'NO';
            
            // Calculate dynamic height based on content
            const patternHeight = doc.heightOfString(`Pattern: ${pattern.pattern}`, { width: boxWidth - 30 });
            const reasoningHeight = doc.heightOfString(`Assessment: ${pattern.reasoning}`, { width: boxWidth - 30 });
            let contentHeight = 60 + patternHeight + reasoningHeight;
            
            if (pattern.matched && pattern.evidenceFromDeck && pattern.evidenceFromDeck.length > 0) {
              const evidenceText = `Evidence: ${pattern.evidenceFromDeck[0].substring(0, 150)}`;
              const evidenceHeight = doc.heightOfString(evidenceText, { width: boxWidth - 30 });
              contentHeight += evidenceHeight + 10;
            }
            
            const boxHeight = Math.max(110, contentHeight);
            
            // Draw box
            doc.roundedRect(leftMargin, boxY, boxWidth, boxHeight, 5)
               .fillAndStroke(bgColor, borderColor);
            
            // Status indicator
            doc.fontSize(11).font('Helvetica-Bold').fillColor(borderColor)
               .text(`[${statusIcon}] ${statusText}`, leftMargin + 15, boxY + 12, { align: 'left' });
            
            let currentY = boxY + 32;
            
            // Pattern text
            doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
               .text(`Pattern: ${pattern.pattern}`, leftMargin + 15, currentY, { 
                 width: boxWidth - 30, 
                 align: 'left' 
               });
            currentY += patternHeight + 8;
            
            // Reasoning
            doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
               .text(`Assessment: ${pattern.reasoning}`, leftMargin + 15, currentY, { 
                 width: boxWidth - 30, 
                 align: 'left' 
               });
            currentY += reasoningHeight + 8;
            
            // Evidence (if available and matched)
            if (pattern.matched && pattern.evidenceFromDeck && pattern.evidenceFromDeck.length > 0) {
              doc.fontSize(8).font('Helvetica-Oblique').fillColor(COLORS.textLight)
                 .text(`Evidence: ${pattern.evidenceFromDeck[0].substring(0, 150)}`, leftMargin + 15, currentY, { 
                   width: boxWidth - 30, 
                   align: 'left' 
                 });
            }
            
            doc.y = boxY + boxHeight + 20;
            doc.x = leftMargin;
          });
          
          doc.moveDown(1.5);
        }

        // ============================================================
        // THESIS ALIGNMENT (if available)
        // ============================================================
        if (data.vcAlignmentAnalysis.thesisAlignment) {
          checkPageBreak(200);
          drawSubheader('INVESTMENT THESIS ALIGNMENT');
          doc.fontSize(9).font('Helvetica').fillColor(COLORS.textLight).text(
            'How well does this startup fit your investment thesis and strategic focus?',
            { paragraphGap: 8, align: 'left' }
          );
          doc.moveDown(0.5);
          
          const thesis = data.vcAlignmentAnalysis.thesisAlignment;
          const leftMargin = 60;
          const pageWidth = doc.page.width;
          const boxWidth = pageWidth - 120;
          
          // Alignment Score with visual bar
          doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.text)
             .text(`Thesis Alignment Score: ${thesis.score}/100`, leftMargin, doc.y, { align: 'left' });
          doc.moveDown(0.5);
          
          const scoreBarY = doc.y;
          const scoreBarWidth = 350;
          const scorePct = thesis.score / 100;
          
          // Background bar
          doc.rect(leftMargin, scoreBarY, scoreBarWidth, 15).fill('#e5e7eb');
          
          // Score bar with gradient color
          const scoreColor = thesis.score >= 75 ? COLORS.success : 
                            thesis.score >= 50 ? COLORS.warning : COLORS.danger;
          doc.fillColor(scoreColor).rect(leftMargin, scoreBarY, scoreBarWidth * scorePct, 15).fill();
          
          // Score text
          doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
             .text(`${thesis.score}%`, leftMargin + scoreBarWidth + 15, scoreBarY + 2, { align: 'left' });
          
          doc.y = scoreBarY + 35;
          doc.x = leftMargin;
          
          // Aligned Areas (Green box)
          if (thesis.alignmentAreas && thesis.alignmentAreas.length > 0) {
            checkPageBreak(100);
            const alignBoxY = doc.y;
            const contentText = thesis.alignmentAreas.join(' | ');
            const textHeight = doc.heightOfString(contentText, { width: boxWidth - 30 });
            const boxHeight = Math.max(70, textHeight + 50);
            
            doc.roundedRect(leftMargin, alignBoxY, boxWidth, boxHeight, 5)
               .fillAndStroke('#d1fae5', COLORS.success);
            doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.success)
               .text('ALIGNED AREAS', leftMargin + 15, alignBoxY + 12, { align: 'left' });
            doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
               .text(contentText, leftMargin + 15, alignBoxY + 32, { 
                 width: boxWidth - 30, 
                 align: 'left' 
               });
            doc.y = alignBoxY + boxHeight + 20;
            doc.x = leftMargin;
          }
          
          // Misaligned Areas (Red box)
          if (thesis.misalignmentAreas && thesis.misalignmentAreas.length > 0) {
            checkPageBreak(100);
            const misalignBoxY = doc.y;
            const contentText = thesis.misalignmentAreas.join(' | ');
            const textHeight = doc.heightOfString(contentText, { width: boxWidth - 30 });
            const boxHeight = Math.max(70, textHeight + 50);
            
            doc.roundedRect(leftMargin, misalignBoxY, boxWidth, boxHeight, 5)
               .fillAndStroke('#fee2e2', COLORS.danger);
            doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.danger)
               .text('MISALIGNED AREAS', leftMargin + 15, misalignBoxY + 12, { align: 'left' });
            doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
               .text(contentText, leftMargin + 15, misalignBoxY + 32, { 
                 width: boxWidth - 30, 
                 align: 'left' 
               });
            doc.y = misalignBoxY + boxHeight + 20;
            doc.x = leftMargin;
          }
          
          // Overall Assessment
          checkPageBreak(80);
          doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
             .text('Overall Assessment:', leftMargin, doc.y, { align: 'left' });
          doc.moveDown(0.5);
          doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
             .text(thesis.overallAssessment, leftMargin, doc.y, { 
               width: boxWidth,
               align: 'left' 
             });
          doc.moveDown(2);
          doc.x = leftMargin;
        }

        // ============================================================
        // CONTEXT INTELLIGENCE INSIGHTS (if available)
        // ============================================================
        if (data.vcAlignmentAnalysis.contextIntelligenceInsights && 
            data.vcAlignmentAnalysis.contextIntelligenceInsights.length > 0) {
          checkPageBreak(100);
          drawSubheader('INSIGHTS FROM YOUR VC CONTEXT');
          doc.fontSize(9).font('Helvetica').fillColor(COLORS.textLight).text(
            'Connections and insights derived from your accumulated venture capital knowledge and network.',
            { paragraphGap: 8 }
          );
          doc.moveDown(0.5);

          data.vcAlignmentAnalysis.contextIntelligenceInsights.forEach((insight, idx) => {
            checkPageBreak(130);
            
            const boxY = doc.y;
            const boxHeight = 110;
            
            // Color based on insight type
            let bgColor = '#e0f2fe'; // Blue default
            let borderColor = COLORS.secondary;
            let iconEmoji = '💡';
            
            if (insight.insightType === 'company') {
              bgColor = '#e0f2fe';
              borderColor = COLORS.secondary;
              iconEmoji = '🏢';
            } else if (insight.insightType === 'market') {
              bgColor = '#ddd6fe';
              borderColor = '#8b5cf6';
              iconEmoji = '📊';
            } else if (insight.insightType === 'people') {
              bgColor = '#fce7f3';
              borderColor = '#ec4899';
              iconEmoji = '👥';
            } else if (insight.insightType === 'pattern') {
              bgColor = '#fef3c7';
              borderColor = COLORS.warning;
              iconEmoji = '🎯';
            }
            
            // Draw box
            doc.roundedRect(doc.x, boxY, doc.page.width - 120, boxHeight, 5)
               .fillAndStroke(bgColor, borderColor);
            
            // Type header
            doc.fontSize(10).font('Helvetica-Bold').fillColor(borderColor)
               .text(`${insight.insightType.toUpperCase()} INSIGHT`, doc.x + 15, boxY + 10);
            
            // Insight text
            doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.text)
               .text(`Insight: ${insight.insight}`, doc.x + 15, boxY + 28, { width: doc.page.width - 150 });
            
            // Relevance
            doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
               .text(`Relevance: ${insight.relevanceToDeck}`, doc.x + 15, boxY + 52, { width: doc.page.width - 150 });
            
            // Actionable implication
            doc.fontSize(9).font('Helvetica-Bold').fillColor(borderColor)
               .text(`Action: ${insight.actionableImplication}`, doc.x + 15, boxY + 80, { width: doc.page.width - 150 });
            
            doc.y = boxY + boxHeight + 12;
          });
          
          doc.moveDown(1);
        }

        // Summary box if VC alignment was analyzed
        checkPageBreak(100);
        const summaryBoxY = doc.y;
        doc.roundedRect(doc.x, summaryBoxY, doc.page.width - 120, 80, 5)
           .fillAndStroke('#f0f9ff', COLORS.primary);
        doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.primary)
           .text('VC ALIGNMENT SUMMARY', doc.x + 15, summaryBoxY + 12);
        
        let summaryText = 'This analysis has been customized based on your investment preferences, dealbreakers, and thesis. ';
        
        if (data.vcAlignmentAnalysis.dealbreakerFlags && data.vcAlignmentAnalysis.dealbreakerFlags.some(f => f.matched)) {
          summaryText += 'WARNING: One or more dealbreakers were matched. ';
        } else if (data.vcAlignmentAnalysis.dealbreakerFlags) {
          summaryText += 'All dealbreakers passed. ';
        }
        
        if (data.vcAlignmentAnalysis.positivePatternMatches) {
          const strongMatches = data.vcAlignmentAnalysis.positivePatternMatches.filter(p => p.matched && p.strength === 'strong').length;
          if (strongMatches > 0) {
            summaryText += `Found ${strongMatches} strong positive pattern match(es). `;
          }
        }
        
        if (data.vcAlignmentAnalysis.thesisAlignment) {
          summaryText += `Thesis alignment score: ${data.vcAlignmentAnalysis.thesisAlignment.score}/100.`;
        }
        
        doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
           .text(summaryText, doc.x + 15, summaryBoxY + 35, { width: doc.page.width - 150 });
        doc.y = summaryBoxY + 90;
      }

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
