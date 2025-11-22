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
  webEnrichment?: {
    validatedMetrics?: any;
    additionalCompetitors?: any[];
    industryBenchmarks?: any;
    factChecks?: {
      verified?: any[];
      discrepancies?: any[];
    };
    dataSources?: {
      pdfSources?: string[];
      webSources?: any[];
    };
    confidence?: {
      overall?: string;
      metrics?: string;
      competitors?: string;
    };
  };
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
 * Generate a comprehensive PDF report with web enrichment data
 */
export async function generatePDFReport(data: ReportData, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 50, 
        size: 'A4',
        bufferPages: true  // Enable page buffering for better layout
      });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      const titleFont = 'Helvetica-Bold';
      const bodyFont = 'Helvetica';
      const pageBottom = doc.page.height - 70;

      // Helper: Check if we need a new page
      const checkPageBreak = (spaceNeeded: number = 100) => {
        if (doc.y + spaceNeeded > pageBottom) {
          doc.addPage();
        }
      };

      // Helper: Draw section header with underline
      const drawSectionHeader = (title: string, size: number = 14) => {
        checkPageBreak(60);
        doc.fontSize(size).font(titleFont).fillColor('#000000').text(title);
        const lineY = doc.y + 2;
        doc.moveTo(doc.x, lineY).lineTo(doc.page.width - doc.page.margins.right, lineY)
           .lineWidth(1.5).strokeColor('#3b82f6').stroke();
        doc.moveDown(0.5);
      };

      // Helper: Draw score bar
      const drawScoreBar = (label: string, score: number, width: number = 300) => {
        checkPageBreak(30);
        doc.fontSize(10).font(bodyFont).fillColor('#111827').text(`${label}: ${score}/100`);
        const bx = doc.x;
        const by = doc.y + 2;
        const bh = 8;
        const p = Math.max(0, Math.min(100, score)) / 100;
        doc.rect(bx, by, width, bh).fill('#f3f4f6');
        const barColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
        doc.fillColor(barColor);
        doc.rect(bx, by, width * p, bh).fill();
        doc.moveDown(0.8);
        doc.fillColor('#111827');
      };

      // ============================================================
      // PAGE 1: COVER & EXECUTIVE SUMMARY
      // ============================================================
      doc.fontSize(24).font(titleFont).fillColor('#1e40af')
         .text('Pitch Deck Analysis Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font(bodyFont).fillColor('#64748b')
         .text('AI-Powered Investment Intelligence', { align: 'center' });
      doc.moveDown(2);

      // Company info box
      const infoBoxTop = doc.y;
      doc.roundedRect(doc.x, infoBoxTop, doc.page.width - 100, 110, 5)
         .fillAndStroke('#f1f5f9', '#cbd5e1');
      doc.fillColor('#000000');
      doc.fontSize(12).font(titleFont).text('Company Information', doc.x + 15, infoBoxTop + 15);
      doc.fontSize(10).font(bodyFont);
      doc.text(`Company: ${data.deck.company_name}`, doc.x + 15, doc.y + 5);
      doc.text(`Deck File: ${data.deck.file_name}`);
      doc.text(`Analysis Date: ${new Date(data.deck.analyzed_at).toLocaleString()}`);
      doc.text(`Report ID: ${data.deck.id.substring(0, 8)}...`);
      doc.y = infoBoxTop + 120;
      doc.moveDown(1.5);

      // SSO Score highlight
      drawSectionHeader('SSO Readiness Score', 16);
      const scoreBoxY = doc.y;
      doc.roundedRect(doc.x, scoreBoxY, 180, 60, 5).fill('#3b82f6');
      doc.fontSize(40).font(titleFont).fillColor('#ffffff')
         .text(`${data.analysis.overallScore}`, doc.x + 70, scoreBoxY + 10, { width: 100, align: 'center' });
      doc.fontSize(12).font(bodyFont).text('out of 100', doc.x + 60, scoreBoxY + 52, { width: 120, align: 'center' });
      doc.y = scoreBoxY + 70;
      doc.fillColor('#000000');
      doc.moveDown(1);

      // Recommendation
      doc.fontSize(11).font(titleFont).text('Investment Recommendation:');
      doc.fontSize(10).font(bodyFont).fillColor('#374151')
         .text(data.analysis.recommendation, { indent: 10, paragraphGap: 5 });
      doc.moveDown(1.5);

      // Score Breakdown
      drawSectionHeader('Score Breakdown');
      drawScoreBar('Problem & Solution', data.analysis.problemScore);
      drawScoreBar('Market Opportunity', data.analysis.marketScore);
      drawScoreBar('Traction & Growth', data.analysis.tractionScore);
      drawScoreBar('Team & Execution', data.analysis.teamScore);
      drawScoreBar('Business Model & Unit Economics', data.analysis.financialsScore);

      // ============================================================
      // PAGE 2: KEY INSIGHTS & STRATEGIC ANALYSIS
      // ============================================================
      doc.addPage();
      drawSectionHeader('Key Strategic Insights', 16);
      
      if (data.analysis.keyInsights && data.analysis.keyInsights.length > 0) {
        data.analysis.keyInsights.forEach((insight, i) => {
          checkPageBreak(40);
          doc.fontSize(10).font(titleFont).fillColor('#3b82f6').text(`${i + 1}.`, { continued: true });
          doc.font(bodyFont).fillColor('#111827').text(` ${insight}`, { indent: 0, paragraphGap: 8 });
        });
      }
      doc.moveDown(1.5);

      // ============================================================
      // WEB-ENRICHED COMPETITIVE INTELLIGENCE
      // ============================================================
      if (data.webEnrichment?.additionalCompetitors && data.webEnrichment.additionalCompetitors.length > 0) {
        drawSectionHeader('Competitive Landscape Analysis (Web-Validated)', 14);
        doc.fontSize(9).font('Helvetica-Oblique').fillColor('#64748b')
           .text('Data validated via Google Search & industry databases');
        doc.font(bodyFont);
        doc.moveDown(0.5);

        data.webEnrichment.additionalCompetitors.slice(0, 10).forEach((comp: any) => {
          checkPageBreak(70);
          doc.fontSize(11).font(titleFont).fillColor('#000000').text(comp.name || 'Unknown Competitor');
          doc.fontSize(9).font(bodyFont).fillColor('#374151');
          if (comp.funding) doc.text(`  Funding: ${comp.funding}`, { indent: 10 });
          if (comp.lastRound) doc.text(`  Last Round: ${comp.lastRound}`, { indent: 10 });
          if (comp.investors && comp.investors.length > 0) {
            doc.text(`  Investors: ${comp.investors.slice(0, 3).join(', ')}`, { indent: 10 });
          }
          if (comp.competitiveThreat) {
            const threatColor = comp.competitiveThreat === 'HIGH' ? '#ef4444' : 
                                 comp.competitiveThreat === 'MEDIUM' ? '#f59e0b' : '#10b981';
            doc.fillColor(threatColor).text(`  Threat Level: ${comp.competitiveThreat}`, { indent: 10 });
            doc.fillColor('#374151');
          }
          if (comp.source) doc.fontSize(8).fillColor('#94a3b8').text(`  Source: ${comp.source}`, { indent: 10 });
          doc.moveDown(0.6);
        });
        doc.moveDown(0.5);
      }

      // ============================================================
      // VALIDATED METRICS & BENCHMARKS
      // ============================================================
      if (data.webEnrichment?.validatedMetrics || data.webEnrichment?.industryBenchmarks) {
        checkPageBreak(150);
        drawSectionHeader('Market Validation & Benchmarks', 14);
        
        if (data.webEnrichment.validatedMetrics) {
          const vm = data.webEnrichment.validatedMetrics;
          doc.fontSize(10).font(bodyFont).fillColor('#111827');
          
          if (vm.tam) {
            checkPageBreak(60);
            doc.fontSize(11).font(titleFont).text('Total Addressable Market (TAM)');
            doc.fontSize(9).font(bodyFont);
            doc.text(`  Deck Claim: ${vm.tam.pdfClaim || 'Not specified'}`, { indent: 10 });
            doc.text(`  Web Validation: ${vm.tam.webValidation || 'Not available'}`, { indent: 10 });
            if (vm.tam.discrepancy) {
              doc.fillColor('#ef4444').text(`  ⚠ Discrepancy detected: ${vm.tam.discrepancyPercentage || 'Unknown'}`, { indent: 10 });
              doc.fillColor('#111827');
            }
            if (vm.tam.sources && vm.tam.sources.length > 0) {
              doc.fontSize(8).fillColor('#64748b').text(`  Sources: ${vm.tam.sources[0]}`, { indent: 10 });
              doc.fillColor('#111827');
            }
            doc.moveDown(0.8);
          }

          if (vm.competitors) {
            checkPageBreak(100);
            doc.fontSize(11).font(titleFont).fillColor('#111827').text('Competitor Validation');
            doc.fontSize(9).font(bodyFont);
            if (vm.competitors.mentionedInDeck) {
              doc.text(`  Mentioned in Deck: ${vm.competitors.mentionedInDeck.join(', ')}`, { indent: 10 });
            }
            if (vm.competitors.foundViaWeb && vm.competitors.foundViaWeb.length > 0) {
              doc.text(`  Additional found via Web: ${vm.competitors.foundViaWeb.length} companies`, { indent: 10 });
            }
            doc.moveDown(0.8);
          }
        }

        if (data.webEnrichment.industryBenchmarks) {
          checkPageBreak(120);
          const benchmarks = data.webEnrichment.industryBenchmarks;
          doc.fontSize(11).font(titleFont).fillColor('#111827').text('Industry Benchmarks');
          doc.fontSize(9).font(bodyFont);
          
          Object.keys(benchmarks).slice(0, 5).forEach((key) => {
            const bm = benchmarks[key];
            if (bm && typeof bm === 'object') {
              checkPageBreak(50);
              doc.text(`  ${key.toUpperCase()}:`, { indent: 10 });
              if (bm.pdfClaim) doc.text(`    Deck: ${bm.pdfClaim}`, { indent: 20 });
              if (bm.industryAverage) doc.text(`    Industry Avg: ${bm.industryAverage}`, { indent: 20 });
              if (bm.performance) {
                const perfColor = bm.performance.includes('better') ? '#10b981' : '#ef4444';
                doc.fillColor(perfColor).text(`    Performance: ${bm.performance}`, { indent: 20 });
                doc.fillColor('#111827');
              }
            }
          });
          doc.moveDown(0.8);
        }
      }

      // ============================================================
      // FACT-CHECKING RESULTS
      // ============================================================
      if (data.webEnrichment?.factChecks) {
        checkPageBreak(100);
        drawSectionHeader('Fact-Checking Results', 14);
        
        if (data.webEnrichment.factChecks.verified && data.webEnrichment.factChecks.verified.length > 0) {
          doc.fontSize(11).font(titleFont).fillColor('#10b981').text('✓ Verified Claims');
          doc.fontSize(9).font(bodyFont).fillColor('#111827');
          data.webEnrichment.factChecks.verified.slice(0, 5).forEach((fc: any) => {
            checkPageBreak(40);
            doc.text(`  • ${fc.claim || fc}`, { indent: 10 });
          });
          doc.moveDown(0.8);
        }

        if (data.webEnrichment.factChecks.discrepancies && data.webEnrichment.factChecks.discrepancies.length > 0) {
          checkPageBreak(100);
          doc.fontSize(11).font(titleFont).fillColor('#ef4444').text('⚠ Discrepancies Found');
          doc.fontSize(9).font(bodyFont).fillColor('#111827');
          data.webEnrichment.factChecks.discrepancies.slice(0, 5).forEach((fc: any) => {
            checkPageBreak(60);
            doc.text(`  • Claim: ${fc.claim || fc}`, { indent: 10 });
            if (fc.pdfSource) doc.text(`    Deck: ${fc.pdfSource}`, { indent: 15 });
            if (fc.webValidation) doc.text(`    Web: ${fc.webValidation}`, { indent: 15 });
          });
          doc.moveDown(0.8);
        }
      }

      // ============================================================
      // STRENGTHS & WEAKNESSES (DETAILED)
      // ============================================================
      checkPageBreak(200);
      drawSectionHeader('Investment Strengths', 14);
      if (data.analysis.strengths && data.analysis.strengths.length > 0) {
        data.analysis.strengths.forEach((strength, i) => {
          checkPageBreak(35);
          doc.fontSize(10).font(bodyFont).fillColor('#10b981').text('✓', { continued: true, indent: 10 });
          doc.fillColor('#111827').text(` ${strength}`, { paragraphGap: 5 });
        });
      }
      doc.moveDown(1.5);

      checkPageBreak(200);
      drawSectionHeader('Risk Factors & Areas for Improvement', 14);
      if (data.analysis.weaknesses && data.analysis.weaknesses.length > 0) {
        data.analysis.weaknesses.forEach((weakness, i) => {
          checkPageBreak(35);
          doc.fontSize(10).font(bodyFont).fillColor('#ef4444').text('⚠', { continued: true, indent: 10 });
          doc.fillColor('#111827').text(` ${weakness}`, { paragraphGap: 5 });
        });
      }
      doc.moveDown(1.5);

      // ============================================================
      // DETAILED SECTION ANALYSIS
      // ============================================================
      checkPageBreak(150);
      drawSectionHeader('Detailed Section-by-Section Analysis', 16);
      
      data.sections.forEach((section, i) => {
        checkPageBreak(120);
        
        // Section header with score
        doc.fontSize(12).font(titleFont).fillColor('#1e40af')
           .text(`${i + 1}. ${section.sectionName}`, { continued: true });
        doc.fillColor('#64748b').text(` — ${section.sectionScore}/100`);
        doc.moveDown(0.3);
        
        // Score bar for this section
        const secBarY = doc.y;
        const secBarWidth = 200;
        const secPct = Math.max(0, Math.min(100, section.sectionScore)) / 100;
        doc.rect(doc.x, secBarY, secBarWidth, 6).fill('#e5e7eb');
        doc.fillColor('#3b82f6').rect(doc.x, secBarY, secBarWidth * secPct, 6).fill();
        doc.moveDown(0.5);
        
        // Feedback
        doc.fontSize(10).font(bodyFont).fillColor('#111827')
           .text(section.feedback || 'No detailed feedback available.', { indent: 10, paragraphGap: 8 });
        
        // Strengths
        if (section.strengths && section.strengths.length > 0) {
          checkPageBreak(60);
          doc.fontSize(10).font(titleFont).fillColor('#10b981').text('Strengths:', { indent: 10 });
          section.strengths.forEach(s => {
            checkPageBreak(25);
            doc.fontSize(9).font(bodyFont).fillColor('#111827').text(`• ${s}`, { indent: 20 });
          });
        }
        
        // Improvements
        if (section.improvements && section.improvements.length > 0) {
          checkPageBreak(60);
          doc.fontSize(10).font(titleFont).fillColor('#f59e0b').text('Improvements:', { indent: 10 });
          section.improvements.forEach(imp => {
            checkPageBreak(25);
            doc.fontSize(9).font(bodyFont).fillColor('#111827').text(`• ${imp}`, { indent: 20 });
          });
        }
        
        doc.moveDown(1);
        // Separator line
        doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y)
           .lineWidth(0.5).strokeColor('#cbd5e1').stroke();
        doc.moveDown(0.8);
      });

      // ============================================================
      // CHECKLIST VERIFICATION
      // ============================================================
      if (data.analysis.checklistVerification) {
        checkPageBreak(200);
        drawSectionHeader('Foundational Checklist Verification', 14);
        
        const cv = data.analysis.checklistVerification;
        doc.fontSize(10).font(bodyFont).fillColor('#111827');
        doc.text(`Overall Checklist Score: ${cv.foundationalChecklistScore}/100`);
        doc.moveDown(0.5);
        
        // Status table
        const statusItems = [
          { label: 'Unit Economics Complete', value: cv.unitEconomicsComplete },
          { label: 'Growth Metrics Complete', value: cv.growthMetricsComplete },
          { label: 'Payment Info Complete', value: cv.paymentInfoComplete }
        ];
        
        statusItems.forEach(item => {
          checkPageBreak(25);
          const statusColor = item.value ? '#10b981' : '#ef4444';
          const statusText = item.value ? '✓ Complete' : '✗ Missing';
          doc.fontSize(9).font(bodyFont).fillColor('#111827')
             .text(`${item.label}: `, { continued: true, indent: 10 });
          doc.fillColor(statusColor).text(statusText);
        });
        doc.moveDown(1);
        
        if (cv.verifiedItems && cv.verifiedItems.length > 0) {
          checkPageBreak(80);
          doc.fontSize(11).font(titleFont).fillColor('#10b981').text('✓ Verified in Deck');
          cv.verifiedItems.forEach(item => {
            checkPageBreak(20);
            doc.fontSize(9).font(bodyFont).fillColor('#111827').text(`• ${item}`, { indent: 15 });
          });
          doc.moveDown(0.8);
        }
        
        if (cv.missingItems && cv.missingItems.length > 0) {
          checkPageBreak(80);
          doc.fontSize(11).font(titleFont).fillColor('#ef4444').text('✗ Missing from Deck');
          cv.missingItems.forEach(item => {
            checkPageBreak(20);
            doc.fontSize(9).font(bodyFont).fillColor('#111827').text(`• ${item}`, { indent: 15 });
          });
          doc.moveDown(0.8);
        }
      }

      // ============================================================
      // DATA SOURCES & CONFIDENCE
      // ============================================================
      if (data.webEnrichment?.dataSources || data.webEnrichment?.confidence) {
        checkPageBreak(150);
        drawSectionHeader('Data Sources & Confidence Levels', 14);
        
        if (data.webEnrichment.confidence) {
          doc.fontSize(10).font(bodyFont).fillColor('#111827');
          doc.text(`Overall Confidence: ${data.webEnrichment.confidence.overall || 'Not specified'}`, { indent: 10 });
          if (data.webEnrichment.confidence.metrics) {
            doc.text(`Metrics Confidence: ${data.webEnrichment.confidence.metrics}`, { indent: 10 });
          }
          if (data.webEnrichment.confidence.competitors) {
            doc.text(`Competitor Data Confidence: ${data.webEnrichment.confidence.competitors}`, { indent: 10 });
          }
          doc.moveDown(0.8);
        }
        
        if (data.webEnrichment.dataSources?.webSources && data.webEnrichment.dataSources.webSources.length > 0) {
          doc.fontSize(11).font(titleFont).text('Web Sources Used:');
          data.webEnrichment.dataSources.webSources.slice(0, 8).forEach((src: any) => {
            checkPageBreak(35);
            doc.fontSize(8).font(bodyFont).fillColor('#3b82f6')
               .text(src.title || 'Web Source', { indent: 10, underline: true, link: src.url });
            doc.fillColor('#64748b').fontSize(7).text(src.url || '', { indent: 15 });
            doc.fillColor('#111827');
          });
        }
      }

      // ============================================================
      // FOOTER ON EVERY PAGE
      // ============================================================
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(7).font(bodyFont).fillColor('#94a3b8')
           .text(
             `Team SSO Intelligence Engine | Generated: ${new Date().toLocaleString()} | Page ${i + 1} of ${pageCount}`,
             50,
             doc.page.height - 40,
             { align: 'center', width: doc.page.width - 100 }
           );
      }

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}
