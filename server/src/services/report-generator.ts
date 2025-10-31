import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface ReportData {
  deck: {
    id: string;
    file_name: string;
    company_name: string;
    uploaded_at: string;
    analyzed_at: string;
  };
  analysis: {
    overallScore: number;
    problemScore: number;
    solutionScore: number;
    marketScore: number;
    tractionScore: number;
    teamScore: number;
    financialsScore: number;
    strengths: string[];
    weaknesses: string[];
    keyInsights: string[];
    recommendation: string;
    checklistVerification?: {
      unitEconomicsComplete: boolean;
      growthMetricsComplete: boolean;
      paymentInfoComplete: boolean;
      foundationalChecklistScore: number;
      missingItems: string[];
      verifiedItems: string[];
    };
    visualInsights?: string[];
  };
  sections: Array<{
    sectionName: string;
    sectionScore: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  }>;
}

/**
 * Generate a comprehensive TXT report
 */
export function generateTextReport(data: ReportData): string {
  const { deck, analysis, sections } = data;
  
  let report = '';
  report += '═══════════════════════════════════════════════════════════════\n';
  report += '          TEAM SSO - PITCH DECK ANALYSIS REPORT\n';
  report += '═══════════════════════════════════════════════════════════════\n\n';
  
  // Header Info
  report += `Company: ${deck.company_name}\n`;
  report += `Deck: ${deck.file_name}\n`;
  report += `Analysis Date: ${new Date(deck.analyzed_at).toLocaleString()}\n`;
  report += `Report ID: ${deck.id}\n\n`;
  
  // Executive Summary
  report += '───────────────────────────────────────────────────────────────\n';
  report += '                    EXECUTIVE SUMMARY\n';
  report += '───────────────────────────────────────────────────────────────\n\n';
  report += `SSO READINESS SCORE: ${analysis.overallScore}/100\n`;
  report += `RECOMMENDATION: ${analysis.recommendation}\n\n`;
  
  // Score Breakdown
  report += '📊 SCORE BREAKDOWN:\n\n';
  report += `  • Problem & Solution:        ${analysis.problemScore}/100\n`;
  report += `  • Market Opportunity:        ${analysis.marketScore}/100\n`;
  report += `  • Traction & Growth:         ${analysis.tractionScore}/100\n`;
  report += `  • Team & Execution:          ${analysis.teamScore}/100\n`;
  report += `  • Business Model & Unit Econ: ${analysis.financialsScore}/100\n\n`;
  
  // Key Insights
  report += '💡 KEY INSIGHTS:\n\n';
  analysis.keyInsights.forEach((insight, i) => {
    report += `  ${i + 1}. ${insight}\n`;
  });
  report += '\n';
  
  // Strengths
  report += '✅ STRENGTHS:\n\n';
  analysis.strengths.forEach((strength, i) => {
    report += `  ${i + 1}. ${strength}\n`;
  });
  report += '\n';
  
  // Weaknesses
  report += '⚠️  AREAS FOR IMPROVEMENT:\n\n';
  analysis.weaknesses.forEach((weakness, i) => {
    report += `  ${i + 1}. ${weakness}\n`;
  });
  report += '\n';
  
  // Checklist Verification (if available)
  if (analysis.checklistVerification) {
    report += '───────────────────────────────────────────────────────────────\n';
    report += '              CHECKLIST VERIFICATION RESULTS\n';
    report += '───────────────────────────────────────────────────────────────\n\n';
    report += `Foundational Checklist Score: ${analysis.checklistVerification.foundationalChecklistScore}/100\n\n`;
    report += `Unit Economics Complete: ${analysis.checklistVerification.unitEconomicsComplete ? '✓' : '✗'}\n`;
    report += `Growth Metrics Complete: ${analysis.checklistVerification.growthMetricsComplete ? '✓' : '✗'}\n`;
    report += `Payment Info Complete: ${analysis.checklistVerification.paymentInfoComplete ? '✓' : '✗'}\n\n`;
    
    if (analysis.checklistVerification.verifiedItems.length > 0) {
      report += '✓ VERIFIED IN DECK:\n\n';
      analysis.checklistVerification.verifiedItems.forEach((item, i) => {
        report += `  ${i + 1}. ${item}\n`;
      });
      report += '\n';
    }
    
    if (analysis.checklistVerification.missingItems.length > 0) {
      report += '✗ MISSING FROM DECK:\n\n';
      analysis.checklistVerification.missingItems.forEach((item, i) => {
        report += `  ${i + 1}. ${item}\n`;
      });
      report += '\n';
    }
  }
  
  // Visual Insights (if available)
  if (analysis.visualInsights && analysis.visualInsights.length > 0) {
    report += '───────────────────────────────────────────────────────────────\n';
    report += '         VISUAL DATA ANALYSIS (Charts & Graphs)\n';
    report += '───────────────────────────────────────────────────────────────\n\n';
    analysis.visualInsights.forEach((insight, i) => {
      report += `  ${i + 1}. ${insight}\n`;
    });
    report += '\n';
  }
  
  // Detailed Section Analysis
  report += '───────────────────────────────────────────────────────────────\n';
  report += '              DETAILED SECTION ANALYSIS\n';
  report += '───────────────────────────────────────────────────────────────\n\n';
  
  sections.forEach((section, i) => {
    report += `${i + 1}. ${section.sectionName.toUpperCase()}\n`;
    report += `   Score: ${section.sectionScore}/100\n\n`;
    report += `   ${section.feedback}\n\n`;
    
    if (section.strengths && section.strengths.length > 0) {
      report += '   Strengths:\n';
      section.strengths.forEach(s => report += `   ✓ ${s}\n`);
      report += '\n';
    }
    
    if (section.improvements && section.improvements.length > 0) {
      report += '   Improvements:\n';
      section.improvements.forEach(imp => report += `   → ${imp}\n`);
      report += '\n';
    }
    
    report += '───────────────────────────────────────────────────────────────\n\n';
  });
  
  // Footer
  report += '\n═══════════════════════════════════════════════════════════════\n';
  report += '     Generated by Team SSO Intelligence Engine\n';
  report += `     Report Generated: ${new Date().toLocaleString()}\n`;
  report += '═══════════════════════════════════════════════════════════════\n';
  
  return report;
}

/**
 * Generate a Markdown report (for easy conversion to other formats)
 */
export function generateMarkdownReport(data: ReportData): string {
  const { deck, analysis, sections } = data;
  
  let md = '';
  md += '# Team SSO - Pitch Deck Analysis Report\n\n';
  md += '---\n\n';
  
  // Header
  md += `**Company:** ${deck.company_name}  \n`;
  md += `**Deck:** ${deck.file_name}  \n`;
  md += `**Analysis Date:** ${new Date(deck.analyzed_at).toLocaleString()}  \n`;
  md += `**Report ID:** ${deck.id}  \n\n`;
  
  // Executive Summary
  md += '## Executive Summary\n\n';
  md += `### SSO Readiness Score: **${analysis.overallScore}/100**\n\n`;
  md += `**Recommendation:** ${analysis.recommendation}\n\n`;
  
  // Score Breakdown
  md += '### Score Breakdown\n\n';
  md += '| Category | Score |\n';
  md += '|----------|-------|\n';
  md += `| Problem & Solution | ${analysis.problemScore}/100 |\n`;
  md += `| Market Opportunity | ${analysis.marketScore}/100 |\n`;
  md += `| Traction & Growth | ${analysis.tractionScore}/100 |\n`;
  md += `| Team & Execution | ${analysis.teamScore}/100 |\n`;
  md += `| Business Model & Unit Economics | ${analysis.financialsScore}/100 |\n\n`;
  
  // Key Insights
  md += '## 💡 Key Insights\n\n';
  analysis.keyInsights.forEach(insight => {
    md += `- ${insight}\n`;
  });
  md += '\n';
  
  // Strengths
  md += '## ✅ Strengths\n\n';
  analysis.strengths.forEach(strength => {
    md += `- ${strength}\n`;
  });
  md += '\n';
  
  // Weaknesses
  md += '## ⚠️ Areas for Improvement\n\n';
  analysis.weaknesses.forEach(weakness => {
    md += `- ${weakness}\n`;
  });
  md += '\n';
  
  // Checklist Verification
  if (analysis.checklistVerification) {
    md += '## Checklist Verification Results\n\n';
    md += `**Foundational Checklist Score:** ${analysis.checklistVerification.foundationalChecklistScore}/100\n\n`;
    md += '| Requirement | Status |\n';
    md += '|-------------|--------|\n';
    md += `| Unit Economics Complete | ${analysis.checklistVerification.unitEconomicsComplete ? '✓' : '✗'} |\n`;
    md += `| Growth Metrics Complete | ${analysis.checklistVerification.growthMetricsComplete ? '✓' : '✗'} |\n`;
    md += `| Payment Info Complete | ${analysis.checklistVerification.paymentInfoComplete ? '✓' : '✗'} |\n\n`;
    
    if (analysis.checklistVerification.verifiedItems.length > 0) {
      md += '### ✓ Verified in Deck\n\n';
      analysis.checklistVerification.verifiedItems.forEach(item => {
        md += `- ${item}\n`;
      });
      md += '\n';
    }
    
    if (analysis.checklistVerification.missingItems.length > 0) {
      md += '### ✗ Missing from Deck\n\n';
      analysis.checklistVerification.missingItems.forEach(item => {
        md += `- ${item}\n`;
      });
      md += '\n';
    }
  }
  
  // Visual Insights
  if (analysis.visualInsights && analysis.visualInsights.length > 0) {
    md += '## Visual Data Analysis\n\n';
    analysis.visualInsights.forEach(insight => {
      md += `- ${insight}\n`;
    });
    md += '\n';
  }
  
  // Detailed Sections
  md += '## Detailed Section Analysis\n\n';
  sections.forEach((section, i) => {
    md += `### ${i + 1}. ${section.sectionName}\n\n`;
    md += `**Score:** ${section.sectionScore}/100\n\n`;
    md += `${section.feedback}\n\n`;
    
    if (section.strengths && section.strengths.length > 0) {
      md += '**Strengths:**\n';
      section.strengths.forEach(s => md += `- ${s}\n`);
      md += '\n';
    }
    
    if (section.improvements && section.improvements.length > 0) {
      md += '**Improvements:**\n';
      section.improvements.forEach(imp => md += `- ${imp}\n`);
      md += '\n';
    }
  });
  
  // Footer
  md += '---\n\n';
  md += `*Generated by Team SSO Intelligence Engine on ${new Date().toLocaleString()}*\n`;
  
  return md;
}

/**
 * Generate a PDF report (professional format)
 */
export async function generatePDFReport(data: ReportData, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(outputPath);
      
      doc.pipe(stream);
      
      // Header
      doc.fontSize(24).font('Helvetica-Bold')
         .text('PITCH DECK ANALYSIS REPORT', { align: 'center' });
      doc.fontSize(12).font('Helvetica')
         .text('Team SSO Intelligence Engine', { align: 'center' });
      doc.moveDown(2);
      
      // Company Info
      doc.fontSize(14).font('Helvetica-Bold').text('Company Information');
      doc.fontSize(10).font('Helvetica')
         .text(`Company: ${data.deck.company_name}`)
         .text(`Deck: ${data.deck.file_name}`)
         .text(`Analysis Date: ${new Date(data.deck.analyzed_at).toLocaleString()}`)
         .text(`Report ID: ${data.deck.id}`);
      doc.moveDown(1.5);
      
      // Executive Summary Box
      doc.rect(doc.x - 10, doc.y, doc.page.width - 100, 80)
         .fillAndStroke('#f0f9ff', '#3b82f6');
      doc.fillColor('#000000');
      doc.fontSize(16).font('Helvetica-Bold')
         .text('Executive Summary', doc.x, doc.y + 10);
      doc.fontSize(20).font('Helvetica-Bold')
         .text(`SSO Score: ${data.analysis.overallScore}/100`, doc.x, doc.y + 10);
      doc.fontSize(10).font('Helvetica')
         .text(`Recommendation: ${data.analysis.recommendation}`, doc.x, doc.y + 5);
      doc.moveDown(3);
      
      // Score Breakdown
      doc.fontSize(14).font('Helvetica-Bold').text('Score Breakdown');
      doc.fontSize(10).font('Helvetica');
      const scores = [
        ['Problem & Solution', data.analysis.problemScore],
        ['Market Opportunity', data.analysis.marketScore],
        ['Traction & Growth', data.analysis.tractionScore],
        ['Team & Execution', data.analysis.teamScore],
        ['Business Model & Unit Economics', data.analysis.financialsScore]
      ];
      scores.forEach(([label, score]) => {
        doc.text(`${label}: ${score}/100`);
      });
      doc.moveDown(1.5);
      
      // Key Insights
      doc.fontSize(14).font('Helvetica-Bold').text('Key Insights');
      doc.fontSize(10).font('Helvetica');
      data.analysis.keyInsights.forEach((insight, i) => {
        doc.text(`${i + 1}. ${insight}`, { indent: 10 });
      });
      doc.moveDown(1.5);
      
      // Add new page for detailed sections
      doc.addPage();
      
      // Strengths & Weaknesses
      doc.fontSize(14).font('Helvetica-Bold').text('Strengths');
      doc.fontSize(10).font('Helvetica');
      data.analysis.strengths.forEach((s, i) => {
        doc.text(`✓ ${s}`, { indent: 10 });
      });
      doc.moveDown(1.5);
      
      doc.fontSize(14).font('Helvetica-Bold').text('Areas for Improvement');
      doc.fontSize(10).font('Helvetica');
      data.analysis.weaknesses.forEach((w, i) => {
        doc.text(`→ ${w}`, { indent: 10 });
      });
      doc.moveDown(2);
      
      // Detailed Sections
      doc.addPage();
      doc.fontSize(16).font('Helvetica-Bold').text('Detailed Section Analysis');
      doc.moveDown(1);
      
      data.sections.forEach((section, i) => {
        if (i > 0 && i % 2 === 0) doc.addPage();
        
        doc.fontSize(12).font('Helvetica-Bold')
           .text(`${i + 1}. ${section.sectionName} (${section.sectionScore}/100)`);
        doc.fontSize(10).font('Helvetica')
           .text(section.feedback, { indent: 10 });
        
        if (section.strengths && section.strengths.length > 0) {
          doc.fontSize(10).font('Helvetica-Bold').text('Strengths:', { indent: 10 });
          doc.font('Helvetica');
          section.strengths.forEach(s => {
            doc.text(`• ${s}`, { indent: 20 });
          });
        }
        
        if (section.improvements && section.improvements.length > 0) {
          doc.fontSize(10).font('Helvetica-Bold').text('Improvements:', { indent: 10 });
          doc.font('Helvetica');
          section.improvements.forEach(imp => {
            doc.text(`• ${imp}`, { indent: 20 });
          });
        }
        
        doc.moveDown(1.5);
      });
      
      // Footer
      doc.fontSize(8).font('Helvetica')
         .text(`Generated: ${new Date().toLocaleString()}`, 50, doc.page.height - 50, {
           align: 'center'
         });
      
      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}
