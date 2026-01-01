/**
 * 📄 PREMIUM COMPARISON PDF REPORT GENERATOR
 * 
 * Generates comprehensive side-by-side comparison reports for pitch decks
 * Based on premium-report-generator.ts but focused on comparative analysis
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';

const COLORS = {
  primary: '#1e40af',      // Deep blue
  secondary: '#3b82f6',    // Bright blue
  deck1: '#10b981',        // Green (Deck 1)
  deck2: '#f59e0b',        // Orange (Deck 2)
  success: '#10b981',      
  warning: '#f59e0b',      
  danger: '#ef4444',       
  text: '#111827',         
  textLight: '#6b7280',    
  border: '#cbd5e1',       
  background: '#f8fafc',   
};

interface PremiumComparisonData {
  comparisonId: string;
  deck1Name: string;
  deck2Name: string;
  deck1Data: any;
  deck2Data: any;
  comparison: any;
  vcPreferences?: any;
  createdAt: string;
}

export async function generatePremiumComparisonPDF(
  data: PremiumComparisonData,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 60,
        size: 'A4',
        bufferPages: true,
        info: {
          Title: `${data.deck1Name} vs ${data.deck2Name} - Premium Comparison`,
          Author: 'Team SSO Intelligence Engine',
          Subject: 'Pitch Deck Comparative Analysis',
        },
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      const pageBottom = doc.page.height - 80;
      const pageWidth = doc.page.width - 120;

      // ============================================================
      // HELPER FUNCTIONS
      // ============================================================

      const checkPageBreak = (spaceNeeded: number = 120) => {
        if (doc.y + spaceNeeded > pageBottom) {
          doc.addPage();
        }
      };

      const drawSectionHeader = (title: string) => {
        checkPageBreak(80);
        const y = doc.y;
        
        doc.rect(doc.x - 10, y - 5, pageWidth, 35)
           .fillAndStroke(COLORS.background, COLORS.border);
        
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

      const drawScoreBar = (label: string, score: number, color: string, maxWidth: number = 220) => {
        checkPageBreak(35);
        if (label) {
          doc.fontSize(9).font('Helvetica').fillColor(COLORS.text).text(label, { width: maxWidth });
        }
        const barY = doc.y + 2;
        const barWidth = maxWidth;
        const filledWidth = (score / 100) * barWidth;
        
        // Background bar
        doc.rect(doc.x, barY, barWidth, 8).fillAndStroke('#e5e7eb', '#d1d5db');
        
        // Filled bar
        doc.rect(doc.x, barY, filledWidth, 8).fillAndStroke(color, color);
        
        // Score text
        doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.text)
           .text(`${score.toFixed(1)}`, doc.x + barWidth + 10, barY - 2);
        
        doc.moveDown(0.8);
      };

      const drawBulletList = (items: string[], bulletColor: string = COLORS.text) => {
        if (!items || items.length === 0) return;
        
        items.forEach((item, index) => {
          checkPageBreak(30);
          const bulletX = doc.x;
          const textX = bulletX + 15;
          const itemY = doc.y;
          
          // Bullet point
          doc.circle(bulletX + 3, itemY + 5, 2).fill(bulletColor);
          
          // Text
          doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
             .text(item, textX, itemY, { width: pageWidth - 30 });
          
          doc.moveDown(0.3);
        });
      };

      // ============================================================
      // COVER PAGE
      // ============================================================
      
      doc.fontSize(28).font('Helvetica-Bold').fillColor(COLORS.primary)
         .text('PREMIUM COMPARISON REPORT', { align: 'center' });
      
      doc.moveDown(1);
      doc.fontSize(20).font('Helvetica').fillColor(COLORS.text)
         .text('Comparative Pitch Deck Analysis', { align: 'center' });
      
      doc.moveDown(3);
      
      // Deck names with color coding
      doc.fontSize(18).font('Helvetica-Bold').fillColor(COLORS.deck1)
         .text(data.deck1Name, { align: 'center' });
      
      doc.moveDown(0.5);
      doc.fontSize(16).font('Helvetica').fillColor(COLORS.textLight)
         .text('vs', { align: 'center' });
      
      doc.moveDown(0.5);
      doc.fontSize(18).font('Helvetica-Bold').fillColor(COLORS.deck2)
         .text(data.deck2Name, { align: 'center' });
      
      doc.moveDown(4);
      
      // Report metadata
      const reportDate = new Date(data.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      doc.fontSize(10).font('Helvetica').fillColor(COLORS.textLight)
         .text(`Generated: ${reportDate}`, { align: 'center' })
         .text(`Report ID: ${data.comparisonId.substring(0, 8)}`, { align: 'center' })
         .text('Team SSO Intelligence Engine', { align: 'center' });
      
      // ============================================================
      // EXECUTIVE SUMMARY
      // ============================================================
      
      doc.addPage();
      drawSectionHeader('EXECUTIVE SUMMARY');
      
      if (data.comparison?.summary) {
        doc.fontSize(11).font('Helvetica').fillColor(COLORS.text)
           .text(data.comparison.summary, { align: 'justify', lineGap: 4 });
        doc.moveDown(1);
      }
      
      // Winner announcement
      if (data.comparison?.winnerOverall) {
        checkPageBreak(100);
        const winnerName = data.comparison.winnerOverall === 'deck1' ? data.deck1Name : 
                          data.comparison.winnerOverall === 'deck2' ? data.deck2Name : 'Tie';
        const winnerColor = data.comparison.winnerOverall === 'deck1' ? COLORS.deck1 : 
                           data.comparison.winnerOverall === 'deck2' ? COLORS.deck2 : COLORS.secondary;
        
        doc.rect(doc.x - 10, doc.y - 5, pageWidth, 50)
           .fillAndStroke('#f0fdf4', COLORS.success);
        
        doc.fontSize(14).font('Helvetica-Bold').fillColor(winnerColor)
           .text('RECOMMENDED INVESTMENT', doc.x, doc.y + 5);
        doc.fontSize(16).font('Helvetica-Bold')
           .text(winnerName, doc.x, doc.y + 5);
        
        doc.moveDown(2);
      }
      
      // ============================================================
      // OVERALL SCORES COMPARISON
      // ============================================================
      
      drawSectionHeader('OVERALL SCORES');
      
      const deck1Score = data.deck1Data?.analysis?.analysis?.overallScore || 0;
      const deck2Score = data.deck2Data?.analysis?.analysis?.overallScore || 0;
      
      // Side-by-side scores
      const col1X = doc.x;
      const col2X = doc.x + (pageWidth / 2) + 20;
      const scoresY = doc.y;
      
      // Deck 1 Score
      doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.deck1)
         .text(data.deck1Name, col1X, scoresY);
      doc.fontSize(32).font('Helvetica-Bold')
         .text(deck1Score.toFixed(1), col1X, scoresY + 25);
      doc.fontSize(10).font('Helvetica').fillColor(COLORS.textLight)
         .text('Overall Score', col1X, scoresY + 65);
      
      // Deck 2 Score
      doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.deck2)
         .text(data.deck2Name, col2X, scoresY);
      doc.fontSize(32).font('Helvetica-Bold')
         .text(deck2Score.toFixed(1), col2X, scoresY + 25);
      doc.fontSize(10).font('Helvetica').fillColor(COLORS.textLight)
         .text('Overall Score', col2X, scoresY + 65);
      
      doc.y = scoresY + 100;
      
      // ============================================================
      // CATEGORY BREAKDOWN
      // ============================================================
      
      drawSectionHeader('CATEGORY COMPARISON');
      
      const categories = [
        { name: 'Problem Definition', deck1: data.deck1Data?.analysis?.analysis?.problemScore || 0, deck2: data.deck2Data?.analysis?.analysis?.problemScore || 0 },
        { name: 'Solution Approach', deck1: data.deck1Data?.analysis?.analysis?.solutionScore || 0, deck2: data.deck2Data?.analysis?.analysis?.solutionScore || 0 },
        { name: 'Market Opportunity', deck1: data.deck1Data?.analysis?.analysis?.marketScore || 0, deck2: data.deck2Data?.analysis?.analysis?.marketScore || 0 },
        { name: 'Traction & Metrics', deck1: data.deck1Data?.analysis?.analysis?.tractionScore || 0, deck2: data.deck2Data?.analysis?.analysis?.tractionScore || 0 },
        { name: 'Team Strength', deck1: data.deck1Data?.analysis?.analysis?.teamScore || 0, deck2: data.deck2Data?.analysis?.analysis?.teamScore || 0 },
        { name: 'Financial Projections', deck1: data.deck1Data?.analysis?.analysis?.financialsScore || 0, deck2: data.deck2Data?.analysis?.analysis?.financialsScore || 0 },
      ];
      
      categories.forEach(cat => {
        checkPageBreak(45);
        
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
           .text(cat.name);
        doc.moveDown(0.3);
        
        const catY = doc.y;
        
        // Deck 1 bar
        drawScoreBar('', cat.deck1, COLORS.deck1, 220);
        
        // Deck 2 bar
        doc.y = catY;
        doc.x = col2X;
        drawScoreBar('', cat.deck2, COLORS.deck2, 220);
        
        doc.x = col1X;
        doc.moveDown(0.5);
      });
      
      // ============================================================
      // COMPARATIVE STRENGTHS
      // ============================================================
      
      doc.addPage();
      drawSectionHeader('COMPARATIVE STRENGTHS');
      
      if (data.comparison?.strengths?.deck1 && data.comparison.strengths.deck1.length > 0) {
        drawSubheader(`${data.deck1Name} - Key Advantages`);
        drawBulletList(data.comparison.strengths.deck1, COLORS.deck1);
        doc.moveDown(1);
      }
      
      if (data.comparison?.strengths?.deck2 && data.comparison.strengths.deck2.length > 0) {
        drawSubheader(`${data.deck2Name} - Key Advantages`);
        drawBulletList(data.comparison.strengths.deck2, COLORS.deck2);
        doc.moveDown(1);
      }
      
      // ============================================================
      // COMPARATIVE WEAKNESSES
      // ============================================================
      
      drawSectionHeader('AREAS FOR IMPROVEMENT');
      
      if (data.comparison?.weaknesses?.deck1 && data.comparison.weaknesses.deck1.length > 0) {
        drawSubheader(`${data.deck1Name} - Key Concerns`);
        drawBulletList(data.comparison.weaknesses.deck1, COLORS.warning);
        doc.moveDown(1);
      }
      
      if (data.comparison?.weaknesses?.deck2 && data.comparison.weaknesses.deck2.length > 0) {
        drawSubheader(`${data.deck2Name} - Key Concerns`);
        drawBulletList(data.comparison.weaknesses.deck2, COLORS.warning);
        doc.moveDown(1);
      }
      
      // ============================================================
      // KEY DIFFERENTIATORS
      // ============================================================
      
      if (data.comparison?.keyDifferences && data.comparison.keyDifferences.length > 0) {
        doc.addPage();
        drawSectionHeader('KEY DIFFERENTIATORS');
        
        data.comparison.keyDifferences.forEach((diff: string, index: number) => {
          checkPageBreak(60);
          
          doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.primary)
             .text(`${index + 1}. `);
          
          doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
             .text(diff, { continued: false, width: pageWidth - 20 });
          
          doc.moveDown(0.8);
        });
      }
      
      // ============================================================
      // RECOMMENDATIONS
      // ============================================================
      
      doc.addPage();
      drawSectionHeader('ACTIONABLE RECOMMENDATIONS');
      
      if (data.comparison?.recommendations?.deck1 && data.comparison.recommendations.deck1.length > 0) {
        drawSubheader(`For ${data.deck1Name}`);
        drawBulletList(data.comparison.recommendations.deck1, COLORS.deck1);
        doc.moveDown(1);
      }
      
      if (data.comparison?.recommendations?.deck2 && data.comparison.recommendations.deck2.length > 0) {
        drawSubheader(`For ${data.deck2Name}`);
        drawBulletList(data.comparison.recommendations.deck2, COLORS.deck2);
        doc.moveDown(1);
      }
      
      // ============================================================
      // VC PREFERENCES (if available)
      // ============================================================
      
      if (data.vcPreferences) {
        doc.addPage();
        drawSectionHeader('INVESTMENT CRITERIA ALIGNMENT');
        
        doc.fontSize(10).font('Helvetica').fillColor(COLORS.textLight)
           .text(`Evaluated against: ${data.vcPreferences.preferencesName || 'Custom Criteria'}`);
        doc.moveDown(1);
        
        if (data.vcPreferences.investmentThesis) {
          drawSubheader('Investment Thesis');
          doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
             .text(data.vcPreferences.investmentThesis, { align: 'justify', lineGap: 3 });
          doc.moveDown(1);
        }
        
        if (data.vcPreferences.dealbreakers && data.vcPreferences.dealbreakers.length > 0) {
          drawSubheader('Dealbreakers to Watch');
          drawBulletList(data.vcPreferences.dealbreakers.slice(0, 5), COLORS.danger);
        }
      }
      
      // ============================================================
      // FOOTER ON EACH PAGE
      // ============================================================
      
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        
        doc.fontSize(8).font('Helvetica').fillColor(COLORS.textLight)
           .text(
             `Page ${i + 1} of ${pages.count} | Team SSO Intelligence Engine | Confidential`,
             60,
             doc.page.height - 50,
             { align: 'center', width: doc.page.width - 120 }
           );
      }
      
      // ============================================================
      // FINALIZE
      // ============================================================
      
      doc.end();
      
      stream.on('finish', () => {
        console.log('✅ Premium comparison PDF generated successfully');
        resolve();
      });
      
      stream.on('error', reject);
      
    } catch (error) {
      console.error('❌ Error generating premium comparison PDF:', error);
      reject(error);
    }
  });
}
