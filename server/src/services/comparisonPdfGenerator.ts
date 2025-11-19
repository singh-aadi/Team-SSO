import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface ComparisonPDFOptions {
  comparisonId: string;
  deck1Name: string;
  deck2Name: string;
  analysis: {
    deck1Analysis: any;
    deck2Analysis: any;
    comparison: any;
  };
}

// Premium Color System
const COLORS = {
  primary: '#2563eb',
  primaryDark: '#1e40af',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  dark: '#1e293b',
  mediumDark: '#475569',
  medium: '#64748b',
  light: '#94a3b8',
  lighter: '#cbd5e1',
  background: '#f8fafc',
  white: '#ffffff',
  deck1Color: '#3b82f6', // Blue for Deck 1
  deck2Color: '#14b8a6', // Teal for Deck 2
};

function getScoreColor(score: number): string {
  if (score >= 80.0) return COLORS.success;
  if (score >= 60.0) return COLORS.warning;
  return COLORS.danger;
}

function drawScoreBar(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  score: number,
  color: string
): void {
  const height = 25;
  const fillWidth = (width * score) / 100;
  
  // Background
  doc.rect(x, y, width, height)
     .fillColor(COLORS.lighter)
     .fill();
  
  // Filled portion
  doc.rect(x, y, fillWidth, height)
     .fillColor(color)
     .fill();
  
  // Score text
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(COLORS.white)
     .text(score.toFixed(0), x + 10, y + 6);
  
  // Border
  doc.rect(x, y, width, height)
     .strokeColor(COLORS.medium)
     .lineWidth(1)
     .stroke();
}

function cleanFileName(filename: string): string {
  return filename
    .replace(/\.(pdf|ppt|pptx|docx|doc)$/i, '')
    .replace(/[-_()]/g, ' ')
    .replace(/\b(pitch|deck|presentation|slide|v\d+|final|draft)\b/gi, '')
    .trim()
    .substring(0, 40);
}

export async function generateComparisonPDF(options: ComparisonPDFOptions): Promise<string> {
  const { comparisonId, deck1Name, deck2Name, analysis } = options;
  
  console.log('📊 Generating comparison PDF...');
  
  const tempDir = path.join(__dirname, '../../uploads/temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const outputPath = path.join(tempDir, `comparison_${comparisonId}.pdf`);
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: 'Pitch Deck Comparison Report',
      Author: 'Team SSO Intelligence',
      Subject: 'Side-by-Side Deck Analysis'
    }
  });
  
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);
  
  const pageWidth = doc.page.width - 100;
  const leftMargin = 50;
  const columnWidth = (pageWidth - 30) / 2; // 30px gap between columns
  
  // Clean deck names
  const company1 = cleanFileName(deck1Name) || 'Company 1';
  const company2 = cleanFileName(deck2Name) || 'Company 2';
  
  // ============================================================================
  // COVER PAGE
  // ============================================================================
  
  // Header gradient
  doc.rect(0, 0, doc.page.width, 150)
     .fillColor(COLORS.primary)
     .fill();
  
  // Title
  doc.fontSize(32)
     .font('Helvetica-Bold')
     .fillColor(COLORS.white)
     .text('PITCH DECK COMPARISON', leftMargin, 40, { width: pageWidth, align: 'center' });
  
  doc.fontSize(16)
     .font('Helvetica')
     .fillColor(COLORS.white)
     .text('AI-Powered Side-by-Side Analysis', leftMargin, 90, { width: pageWidth, align: 'center' });
  
  // Company names in colored boxes
  const boxY = 200;
  const boxHeight = 100;
  
  // Deck 1 box
  doc.rect(leftMargin, boxY, columnWidth, boxHeight)
     .fillColor(COLORS.deck1Color)
     .fill();
  
  doc.fontSize(20)
     .font('Helvetica-Bold')
     .fillColor(COLORS.white)
     .text(company1, leftMargin + 20, boxY + 30, { width: columnWidth - 40, align: 'center' });
  
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor(COLORS.white)
     .text('DECK 1', leftMargin + 20, boxY + 60, { width: columnWidth - 40, align: 'center' });
  
  // VS text
  doc.fontSize(28)
     .font('Helvetica-Bold')
     .fillColor(COLORS.dark)
     .text('VS', leftMargin + columnWidth + 5, boxY + 35, { width: 20, align: 'center' });
  
  // Deck 2 box
  doc.rect(leftMargin + columnWidth + 30, boxY, columnWidth, boxHeight)
     .fillColor(COLORS.deck2Color)
     .fill();
  
  doc.fontSize(20)
     .font('Helvetica-Bold')
     .fillColor(COLORS.white)
     .text(company2, leftMargin + columnWidth + 50, boxY + 30, { width: columnWidth - 40, align: 'center' });
  
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor(COLORS.white)
     .text('DECK 2', leftMargin + columnWidth + 50, boxY + 60, { width: columnWidth - 40, align: 'center' });
  
  // Overall scores
  const scoresY = 340;
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(COLORS.dark)
     .text('Overall SSO Scores', leftMargin, scoresY, { width: pageWidth, align: 'center' });
  
  // Deck 1 score
  const score1 = analysis.deck1Analysis?.overallScore || 0;
  doc.fontSize(48)
     .font('Helvetica-Bold')
     .fillColor(getScoreColor(score1))
     .text(score1.toFixed(0), leftMargin, scoresY + 30, { width: columnWidth, align: 'center' });
  
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor(COLORS.medium)
     .text('/ 100', leftMargin, scoresY + 85, { width: columnWidth, align: 'center' });
  
  // Deck 2 score
  const score2 = analysis.deck2Analysis?.overallScore || 0;
  doc.fontSize(48)
     .font('Helvetica-Bold')
     .fillColor(getScoreColor(score2))
     .text(score2.toFixed(0), leftMargin + columnWidth + 30, scoresY + 30, { width: columnWidth, align: 'center' });
  
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor(COLORS.medium)
     .text('/ 100', leftMargin + columnWidth + 30, scoresY + 85, { width: columnWidth, align: 'center' });
  
  // Winner badge
  const winner = analysis.comparison?.winnerOverall || 'tie';
  let winnerText = '';
  if (winner === 'deck1') {
    winnerText = `${company1} is stronger overall`;
  } else if (winner === 'deck2') {
    winnerText = `${company2} is stronger overall`;
  } else {
    winnerText = 'Both decks are equally strong';
  }
  
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(COLORS.primary)
     .text(winnerText, leftMargin, scoresY + 130, { width: pageWidth, align: 'center' });
  
  // Executive Summary
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor(COLORS.mediumDark)
     .text(analysis.comparison?.summary || 'Comparative analysis complete.', leftMargin, scoresY + 170, { 
       width: pageWidth, 
       align: 'center',
       lineGap: 4
     });
  
  // Footer
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(COLORS.medium)
     .text(`Generated by Team SSO Intelligence • ${new Date().toLocaleDateString()}`, 
       leftMargin, doc.page.height - 80, { width: pageWidth, align: 'center' });
  
  // ============================================================================
  // PAGE 2: CATEGORY COMPARISON
  // ============================================================================
  
  doc.addPage();
  
  // Page header
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor(COLORS.dark)
     .text('Category-by-Category Comparison', leftMargin, 50);
  
  // Category winners
  const categories = [
    { name: 'Team & Founders', key: 'team', icon: '👥' },
    { name: 'Market Opportunity', key: 'market', icon: '🎯' },
    { name: 'Product & Solution', key: 'product', icon: '🚀' },
    { name: 'Traction & Growth', key: 'traction', icon: '📈' },
    { name: 'Financials & Economics', key: 'financials', icon: '💰' }
  ];
  
  let categoryY = 110;
  
  categories.forEach((category) => {
    const winner = analysis.comparison.categoryWinners?.[category.key] || 'tie';
    
    // Category header
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor(COLORS.dark)
       .text(`${category.icon} ${category.name}`, leftMargin, categoryY);
    
    categoryY += 30;
    
    // Find section scores with safe string operations
    const deck1Section = analysis.deck1Analysis.sections?.find((s: any) => 
      s?.sectionName?.toLowerCase()?.includes(category.key) || 
      category.name.toLowerCase().includes(s?.sectionName?.toLowerCase()?.split(' ')?.[0] || '')
    );
    const deck2Section = analysis.deck2Analysis.sections?.find((s: any) => 
      s?.sectionName?.toLowerCase()?.includes(category.key) ||
      category.name.toLowerCase().includes(s?.sectionName?.toLowerCase()?.split(' ')?.[0] || '')
    );
    
    const deck1Score = deck1Section?.sectionScore || 0;
    const deck2Score = deck2Section?.sectionScore || 0;
    
    // Score bars
    drawScoreBar(doc, leftMargin, categoryY, columnWidth - 40, deck1Score, COLORS.deck1Color);
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(COLORS.dark)
       .text(company1, leftMargin + columnWidth - 30, categoryY + 6);
    
    categoryY += 35;
    
    drawScoreBar(doc, leftMargin, categoryY, columnWidth - 40, deck2Score, COLORS.deck2Color);
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(COLORS.dark)
       .text(company2, leftMargin + columnWidth - 30, categoryY + 6);
    
    // Winner indicator
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(winner === 'deck1' ? COLORS.deck1Color : winner === 'deck2' ? COLORS.deck2Color : COLORS.medium)
       .text(
         winner === 'deck1' ? `✓ ${company1} wins` : 
         winner === 'deck2' ? `✓ ${company2} wins` : 
         '⚖ Tie',
         leftMargin + columnWidth + 60, categoryY - 20, { width: 150 }
       );
    
    categoryY += 50;
    
    // Add page break if needed
    if (categoryY > 700) {
      doc.addPage();
      categoryY = 80;
    }
  });
  
  // ============================================================================
  // PAGE 3: STRENGTHS & WEAKNESSES
  // ============================================================================
  
  doc.addPage();
  
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor(COLORS.dark)
     .text('Strengths & Weaknesses', leftMargin, 50);
  
  let swY = 110;
  
  // Deck 1 Strengths
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(COLORS.deck1Color)
     .text(`${company1} - Strengths`, leftMargin, swY);
  
  swY += 25;
  
  const deck1Strengths = analysis.comparison?.strengths?.deck1 || [];
  deck1Strengths.forEach((strength: string, idx: number) => {
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor(COLORS.mediumDark)
       .text(`✓ ${strength}`, leftMargin + 10, swY, { width: columnWidth, lineGap: 3 });
    swY += 25;
  });
  
  swY += 15;
  
  // Deck 1 Weaknesses
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(COLORS.danger)
     .text(`${company1} - Weaknesses`, leftMargin, swY);
  
  swY += 25;
  
  const deck1Weaknesses = analysis.comparison?.weaknesses?.deck1 || [];
  deck1Weaknesses.forEach((weakness: string) => {
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor(COLORS.mediumDark)
       .text(`⚠ ${weakness}`, leftMargin + 10, swY, { width: columnWidth, lineGap: 3 });
    swY += 25;
  });
  
  // Deck 2 (right column)
  swY = 110;
  
  // Deck 2 Strengths
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(COLORS.deck2Color)
     .text(`${company2} - Strengths`, leftMargin + columnWidth + 30, swY);
  
  swY += 25;
  
  const deck2Strengths = analysis.comparison?.strengths?.deck2 || [];
  deck2Strengths.forEach((strength: string) => {
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor(COLORS.mediumDark)
       .text(`✓ ${strength}`, leftMargin + columnWidth + 40, swY, { width: columnWidth, lineGap: 3 });
    swY += 25;
  });
  
  swY += 15;
  
  // Deck 2 Weaknesses
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(COLORS.danger)
     .text(`${company2} - Weaknesses`, leftMargin + columnWidth + 30, swY);
  
  swY += 25;
  
  const deck2Weaknesses = analysis.comparison?.weaknesses?.deck2 || [];
  deck2Weaknesses.forEach((weakness: string) => {
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor(COLORS.mediumDark)
       .text(`⚠ ${weakness}`, leftMargin + columnWidth + 40, swY, { width: columnWidth, lineGap: 3 });
    swY += 25;
  });
  
  // ============================================================================
  // PAGE 4: KEY DIFFERENCES & RECOMMENDATIONS
  // ============================================================================
  
  doc.addPage();
  
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor(COLORS.dark)
     .text('Key Differences', leftMargin, 50);
  
  let kdY = 110;
  
  const keyDifferences = analysis.comparison?.keyDifferences || [];
  keyDifferences.forEach((diff: string, idx: number) => {
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor(COLORS.mediumDark)
       .text(`${idx + 1}. ${diff}`, leftMargin, kdY, { width: pageWidth, lineGap: 4 });
    kdY += 35;
  });
  
  kdY += 30;
  
  // Recommendations header
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor(COLORS.dark)
     .text('Recommendations', leftMargin, kdY);
  
  kdY += 40;
  
  // Deck 1 recommendations
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(COLORS.deck1Color)
     .text(`For ${company1}:`, leftMargin, kdY);
  
  kdY += 25;
  
  const deck1Recommendations = analysis.comparison?.recommendations?.deck1 || [];
  deck1Recommendations.forEach((rec: string) => {
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor(COLORS.mediumDark)
       .text(`→ ${rec}`, leftMargin + 10, kdY, { width: pageWidth, lineGap: 3 });
    kdY += 25;
  });
  
  kdY += 20;
  
  // Deck 2 recommendations
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(COLORS.deck2Color)
     .text(`For ${company2}:`, leftMargin, kdY);
  
  kdY += 25;
  
  const deck2Recommendations = analysis.comparison?.recommendations?.deck2 || [];
  deck2Recommendations.forEach((rec: string) => {
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor(COLORS.mediumDark)
       .text(`→ ${rec}`, leftMargin + 10, kdY, { width: pageWidth, lineGap: 3 });
    kdY += 25;
  });
  
  // Final footer
  doc.fontSize(10)
     .font('Helvetica-Oblique')
     .fillColor(COLORS.medium)
     .text(
       'This comparison report was generated using AI-powered analysis. ' +
       'It should be used as a tool to support investment decisions, not as the sole basis for decisions.',
       leftMargin, doc.page.height - 80, { width: pageWidth, align: 'center', lineGap: 3 }
     );
  
  doc.end();
  
  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      console.log(`✅ Comparison PDF generated: ${outputPath}`);
      resolve(outputPath);
    });
    stream.on('error', reject);
  });
}

export default generateComparisonPDF;
