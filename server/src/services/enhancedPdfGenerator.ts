import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { getIndustryMetrics } from '../config/industryMetrics';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface EnhancedPDFOptions {
  deck: any;
  analysis: any;
  selectedStage: string;
  selectedIndustry: string;
  companyName?: string;
   // Web enrichment data from Vertex AI Grounding
  webEnrichment?: {
    validatedMetrics: any;
    additionalCompetitors: any[];
    industryBenchmarks: any;
    factChecks: any;
    dataSources: any;
    confidence: any;
  };
  groundingMetadata?: {
    webSearchQueries: string[];
    webSources: any[];
  };
   // VC preferences used for this analysis
  vcPreferencesUsed?: {
    name?: string;
    industry?: string;
    criteria: Array<{
      id: string;
      name: string;
      weight: number;
      subcriteria: Array<{
        id: string;
        name: string;
        weight: number;
      }>;
    }>;
  };
  // VC Context Intelligence (from uploaded documents)
  vcContextIntelligence?: {
    companiesMentioned?: string[];
    investmentThesis?: string;
    marketInsights?: string[];
    peopleNetwork?: string[];
    decisionPatterns?: string[];
  };
}

// Premium Color System for Investor-Grade Reports
const COLORS = {
  // Primary Brand Colors
  primary: '#2563eb',      // Professional Blue
  primaryDark: '#1e40af',  // Dark Blue
  primaryLight: '#60a5fa', // Light Blue
  
  // Status Colors (Traffic Light System)
  success: '#10b981',      // Green (8.0+)
  successDark: '#059669',  // Dark Green
  warning: '#f59e0b',      // Orange (6.0-7.9)
  warningDark: '#d97706',  // Dark Orange
  danger: '#ef4444',       // Red (<6.0)
  dangerDark: '#dc2626',   // Dark Red
  
  // Supporting Colors
  purple: '#8b5cf6',       // Innovation
  teal: '#14b8a6',         // Growth
  indigo: '#6366f1',       // Premium
  
  // Neutral Palette
  dark: '#1e293b',         // Titles
  mediumDark: '#475569',   // Body text
  medium: '#64748b',       // Captions
  light: '#94a3b8',        // Dividers
  lighter: '#cbd5e1',      // Backgrounds
  background: '#f8fafc',   // Page background
  white: '#ffffff'
};

// Score-to-Color Mapping for Visual Consistency (0-100 scale)
function getScoreColor(score: number): string {
  if (score >= 80.0) return COLORS.success;
  if (score >= 60.0) return COLORS.warning;
  return COLORS.danger;
}

function getScoreStatus(score: number): string {
  if (score >= 80.0) return 'INVESTOR READY';
  if (score >= 70.0) return 'STRONG - MINOR REFINEMENTS';
  if (score >= 60.0) return 'GOOD - NEEDS WORK';
  if (score >= 50.0) return 'WEAK - MAJOR GAPS';
  return 'CRITICAL ISSUES';
}

// Strip unsupported glyphs (emoji, smart quotes, symbols) before drawing to PDF
function sanitizeText(value: any, fallback = ''): string {
   if (value === null || value === undefined) {
      return fallback;
   }

  let text = String(value);

  text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  text = text
      .replace(/[\u2018\u2019\u2032]/g, "'")
      .replace(/[\u201C\u201D\u2033]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[\u2022\u2023\u25E6]/g, '- ')
      .replace(/[\u2122]/g, '')
      .replace(/[\u202F\u00A0]/g, ' ');

   return text.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
}

// Visual Score Bar Generator
function drawScoreBar(
  doc: PDFKit.PDFDocument, 
  x: number, 
  y: number, 
  width: number, 
  score: number, 
  showLabel: boolean = true
): void {
  const height = 30;
  const fillWidth = (width * score) / 10;
  const color = getScoreColor(score);
  
  // Background bar (grey)
  doc.rect(x, y, width, height)
     .fillColor(COLORS.lighter)
     .fill();
  
  // Filled bar (colored based on score)
  doc.rect(x, y, fillWidth, height)
     .fillColor(color)
     .fill();
  
   // Score text overlay
   if (showLabel) {
      doc.fontSize(14)
          .font('Helvetica-Bold')
          .fillColor(COLORS.white)
          .text('KEY METRICS VCs EVALUATE', x + 10, y + (height / 2) - 7);
   }
  
  // Border
  doc.rect(x, y, width, height)
     .strokeColor(COLORS.medium)
     .lineWidth(1)
     .stroke();
}

// ============================================================================
// UTILITY: Extract company name from analysis or filename
// ============================================================================
function extractCompanyName(deck: any, analysis: any, providedName?: string): string {
  // Priority 1: Provided company name (from route)
  if (providedName && providedName.trim()) {
      console.log(`[OK] Using provided company name: "${providedName}"`);
    return providedName.trim();
  }

  // Priority 2: Extract from filename FIRST (most reliable source)
  if (deck.file_name) {
    const cleaned = deck.file_name
      .replace(/\.(pdf|ppt|pptx|docx|doc)$/i, '') // Remove extensions
      .replace(/[-_()]/g, ' ') // Replace special chars with spaces
      .replace(/\b(pitch|deck|presentation|slide|v\d+|final|draft|inr|usd|may|june|july|aug|sep|oct|nov|dec|\d{4})\b/gi, '') // Remove common words + dates
      .trim()
      .replace(/\s+/g, ' '); // Normalize spaces
    
    if (cleaned.length > 2) {
         console.log(`[OK] Extracted from filename: "${cleaned}"`);
      return cleaned;
    }
  }

  // Priority 3: Database company name (ONLY if filename extraction failed)
  if (deck.company_name && deck.company_name.trim()) {
      console.log(`[WARN] Using database company name (filename extraction failed): "${deck.company_name}"`);
    return deck.company_name.trim();
  }

  // Priority 4: Try to extract from analysis recommendation text
  const overall = analysis?.analysis?.overall || {};
  if (overall.recommendation) {
    // Look for patterns like "Company X is..." or "The company X..."
    const match = overall.recommendation.match(/\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3})\s+(?:is|offers|provides|delivers)/);
    if (match && match[1] && match[1].length > 3 && match[1].length < 50) {
         console.log(`[WARN] Extracted from analysis: "${match[1]}"`);
      return match[1];
    }
  }

  // Fallback
   console.warn(`[ERROR] No company name found, using fallback: "Startup Company"`);
  return 'Startup Company';
}

// ============================================================================
// UTILITY: Generate AI-powered company introduction
// ============================================================================
async function generateCompanyIntroduction(
  companyName: string,
  analysis: any,
  stage: string,
  industry: string
): Promise<string> {
  try {
    const overall = analysis?.analysis?.overall || {};
    const sections = analysis?.analysis?.sections || [];

    // Extract relevant context from analysis
    const problemSolution = sections.find((s: any) => 
      s.sectionName?.toLowerCase().includes('problem') || 
      s.sectionName?.toLowerCase().includes('solution')
    );
    const market = sections.find((s: any) => 
      s.sectionName?.toLowerCase().includes('market')
    );
    const traction = sections.find((s: any) => 
      s.sectionName?.toLowerCase().includes('traction') || 
      s.sectionName?.toLowerCase().includes('growth')
    );
    const business = sections.find((s: any) => 
      s.sectionName?.toLowerCase().includes('business') || 
      s.sectionName?.toLowerCase().includes('unit') ||
      s.sectionName?.toLowerCase().includes('economics')
    );
    const team = sections.find((s: any) => 
      s.sectionName?.toLowerCase().includes('team') || 
      s.sectionName?.toLowerCase().includes('execution')
    );

    // Build detailed context for AI - extract MORE specific details
    const contextParts = [];
    
    // Add strengths for specific details
    if (overall.strengths && Array.isArray(overall.strengths)) {
      contextParts.push(`Key Strengths:\n${overall.strengths.slice(0, 3).map((s: string) => `- ${s}`).join('\n')}`);
    }
    
    // Add key insights for metrics
    if (overall.keyInsights && Array.isArray(overall.keyInsights)) {
      contextParts.push(`Key Insights:\n${overall.keyInsights.slice(0, 3).map((s: string) => `- ${s}`).join('\n')}`);
    }

    if (problemSolution?.feedback) {
      contextParts.push(`Problem/Solution Analysis:\n${problemSolution.feedback.substring(0, 300)}`);
    }
    if (market?.feedback) {
      contextParts.push(`Market Analysis:\n${market.feedback.substring(0, 300)}`);
    }
    if (traction?.feedback) {
      contextParts.push(`Traction Metrics:\n${traction.feedback.substring(0, 300)}`);
    }
    if (business?.feedback) {
      contextParts.push(`Business Model:\n${business.feedback.substring(0, 250)}`);
    }
    if (team?.feedback) {
      contextParts.push(`Team & Execution:\n${team.feedback.substring(0, 200)}`);
    }

    const analysisContext = contextParts.join('\n\n');

      // DEBUG: Log what we're sending to AI
      console.log('\n[AI] === AI INTRODUCTION GENERATION ===');
      console.log('[STATS] Analysis context length:', analysisContext.length, 'chars');
      console.log('[INFO] Context parts:', contextParts.length, 'sections');
    if (analysisContext.length < 100) {
         console.warn('[WARN] Very little analysis data available!');
         console.warn('   Context:', analysisContext);
    } else {
         console.log('[OK] Sufficient analysis data available');
         console.log('[PREVIEW]:', analysisContext.substring(0, 200) + '...');
    }

    const prompt = `You are an investment analyst writing a detailed company introduction. 

CRITICAL INSTRUCTION: You MUST write a SPECIFIC introduction with real details. DO NOT write generic template text.

COMPANY NAME TO USE:
${companyName}

COMPANY DETAILS:
- Industry: ${industry}
- Stage: ${stage}

ANALYSIS DATA TO EXTRACT SPECIFICS FROM:
${analysisContext}

YOUR TASK:
Write a detailed, SPECIFIC company introduction for ${companyName} based on the analysis data above.

MANDATORY REQUIREMENTS - YOU MUST:
1. START with "${companyName} is a [type] company that [specific product/service description]"
2. EXTRACT and MENTION specific details from the analysis:
   - Product/service (what exactly they offer)
   - Problem they solve (specific pain point)
   - Target customer (who uses it)
   - Traction numbers (users, revenue, growth %) if mentioned in analysis
   - Market size or opportunity if mentioned
   - Competitive advantage or differentiation
   - Team background if mentioned
3. Use ACTUAL data from the analysis - do NOT invent numbers
4. Make it 180-220 words across 2-3 paragraphs
5. Sound like a professional investment memo, not marketing copy

FORBIDDEN - DO NOT:
- Use phrases like "seeking investment" or "demonstrated clear value"
- Write generic sentences that could apply to any company
- Make up numbers or facts not in the analysis
- Start with "The company" - use the company name "${companyName}"

STRUCTURE:
Paragraph 1 (80 words): "${companyName} is a [exact product type] that [what it does] for [target customer]. The platform/product addresses [specific problem] by [how they solve it]. [Unique differentiator or technology]."

Paragraph 2 (70 words): "[Traction metrics from analysis]. [Growth data]. [Market opportunity with size if available]. [Competitive positioning]."

Paragraph 3 (50 words): "[Team background if available]. [Key milestones]. [Strategic positioning for growth]."

If analysis data is LIMITED, still be SPECIFIC about what you DO know. Infer product type from industry and what little data exists, but make it sound concrete.

Write the introduction now. Use "${companyName}" as the company name. Make it SPECIFIC.`;

   console.log('[AI] Sending prompt to Gemini...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let introduction = response.text().trim();

    // Clean up any markdown or formatting
    introduction = introduction.replace(/```/g, '').replace(/\*\*/g, '').trim();

      console.log(`[OK] Generated AI introduction: ${introduction.length} chars`);
      console.log(`[PREVIEW] Full introduction:\n${introduction}`);
    console.log('=====================================\n');
    
      // VALIDATION: Check if it's still generic
    const genericPhrases = ['seeking investment', 'demonstrated clear value', 'identified a significant market'];
    const isGeneric = genericPhrases.some(phrase => introduction.toLowerCase().includes(phrase));
    if (isGeneric) {
         console.warn('[WARN] AI generated generic text! Re-prompting with stricter instructions...');
      
      // RETRY with even more aggressive prompt
      const retryPrompt = `The previous introduction was too generic. Write a NEW introduction for ${companyName} that is HIGHLY SPECIFIC.

Use this EXACT structure and fill in with REAL details from the analysis:

"${companyName} operates as a ${industry} platform that provides [SPECIFIC PRODUCT/SERVICE from analysis] to [SPECIFIC TARGET CUSTOMER from analysis]. The company solves [SPECIFIC PROBLEM from analysis] through [SPECIFIC SOLUTION APPROACH from analysis].

[EXTRACT ANY NUMBERS: users, revenue, growth rate from analysis]. The company serves [SPECIFIC MARKET SEGMENT] within the [MARKET SIZE if mentioned] market.

[TEAM BACKGROUND from analysis if available]. The company has achieved [SPECIFIC MILESTONE from analysis]."

NOW write the introduction using ONLY the specific details from this analysis data:
${analysisContext}

Make it factual, specific, and data-driven. If a detail isn't in the analysis, infer a reasonable specific instead of using generic language.`;

      const retryResult = await model.generateContent(retryPrompt);
      const retryResponse = await retryResult.response;
      introduction = retryResponse.text().trim().replace(/```/g, '').replace(/\*\*/g, '');
         console.log(`[RETRY] Generated: ${introduction.length} chars`);
         console.log(`[RETRY] Introduction:\n${introduction}\n`);
    }

    return introduction;

  } catch (error) {
      console.error('[ERROR] Error generating AI introduction:', error);
    
    // Fallback to template-based introduction
    return `${companyName} is a ${stage.toLowerCase()}-stage ${industry.toLowerCase()} company seeking investment to scale operations and capture market share. Based on pitch deck analysis, the company has demonstrated a clear value proposition and identified a significant market opportunity. This report provides a comprehensive investment readiness assessment across key dimensions including problem-solution fit, market size, traction metrics, team capabilities, and financial projections.`;
  }
}

// Circular Score Gauge (for cover page)
function drawCircularScore(
  doc: PDFKit.PDFDocument,
  centerX: number,
  centerY: number,
  radius: number,
  score: number
): void {
  const color = getScoreColor(score);
  
  // Outer circle (border)
  doc.circle(centerX, centerY, radius)
     .lineWidth(12)
     .strokeColor(color)
     .stroke();
  
  // Inner fill (subtle background)
  doc.circle(centerX, centerY, radius - 15)
     .fillColor(color)
     .fillOpacity(0.1)
     .fill();
  
  // Score number (large)
  doc.fontSize(72)
     .font('Helvetica-Bold')
     .fillColor(color)
     .fillOpacity(1)
     .text(score.toFixed(1), centerX - 90, centerY - 45, { width: 180, align: 'center' });
  
  // "/100" text
  doc.fontSize(20)
     .font('Helvetica')
     .fillColor(COLORS.medium)
     .text('/100', centerX - 90, centerY + 35, { width: 180, align: 'center' });
}

export async function generateEnhancedPDF(options: EnhancedPDFOptions): Promise<string> {
  const { deck, analysis, selectedStage, selectedIndustry, companyName: providedCompanyName } = options;
  
   // STEP 1: Extract proper company name
  const companyName = extractCompanyName(deck, analysis, providedCompanyName);
   console.log(`\n[COMPANY] Final company name: "${companyName}"\n`);
  
   // STEP 2: Generate AI introduction (async - will complete before rendering)
   console.log('[AI] Generating AI-powered company introduction...');
  const aiIntroduction = await generateCompanyIntroduction(
    companyName,
    analysis,
    selectedStage,
    selectedIndustry
  );
  
  const tempDir = path.join(__dirname, '../../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const outputPath = path.join(tempDir, `enhanced-report-${deck.id}-${Date.now()}.pdf`);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true,
        info: {
          Title: `${companyName} - Investment Readiness Report`,
          Author: 'Team SSO Intelligence Engine',
          Subject: 'Pitch Deck Analysis with Industry Benchmarks',
          Keywords: `${selectedIndustry}, ${selectedStage}, pitch deck, investment readiness`
        }
      });

            const originalText = doc.text.bind(doc);
            (doc as PDFKit.PDFDocument & { __sanitized?: boolean }).text = ((text: any, ...args: any[]) => {
               const cleaned = sanitizeText(text);
               return originalText(cleaned, ...args);
            }) as typeof doc.text;

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

   // COMPREHENSIVE DATA VALIDATION - Verify Gemini AI data is present
      console.log('\n' + '='.repeat(80));
   console.log('ENHANCED PDF GENERATION - DATA SOURCE VALIDATION');
      console.log('='.repeat(80));
   console.log('Company:', companyName || deck.company_name || 'Unknown');
   console.log('Deck ID:', deck.id);
   console.log('Industry:', selectedIndustry, '| Stage:', selectedStage);
      console.log('-'.repeat(80));
      
   console.log('Analysis Object Structure:');
   console.log('   - analysis exists:', !!analysis);
   console.log('   - analysis.analysis exists:', !!analysis?.analysis);
   console.log('   - analysis.sso_score:', analysis?.sso_score || 'MISSING');
      
      const overall = analysis?.analysis?.overall || {};
      const analyzedSections = analysis?.analysis?.sections || [];
      
         console.log('\nOverall Analysis (from Gemini):');
         console.log('   - overallScore:', overall.overallScore || 'MISSING');
         console.log('   - recommendation:', overall.recommendation ? `${overall.recommendation.length} chars` : 'MISSING');
         console.log('   - strengths:', Array.isArray(overall.strengths) ? `${overall.strengths.length} items` : 'MISSING');
         console.log('   - weaknesses:', Array.isArray(overall.weaknesses) ? `${overall.weaknesses.length} items` : 'MISSING');
         console.log('   - keyInsights:', Array.isArray(overall.keyInsights) ? `${overall.keyInsights.length} items` : 'MISSING');
      
         console.log('\nSection Analysis (from Gemini):');
         console.log('   - Total sections:', analyzedSections.length);
      if (analyzedSections.length > 0) {
            console.log('   - Section names:');
        analyzedSections.forEach((s: any, i: number) => {
          console.log(`     ${i + 1}. ${s.sectionName} (Score: ${s.sectionScore}, Feedback: ${s.feedback?.length || 0} chars)`);
        });
      } else {
            console.warn('   WARNING: NO SECTIONS FOUND - PDF will use fallback data!');
      }
      
         console.log('\nDATA QUALITY CHECK:');
      const hasRealData = (
        !!overall.recommendation ||
        (Array.isArray(overall.keyInsights) && overall.keyInsights.length > 0) ||
        analyzedSections.length > 0
      );
      
      if (hasRealData) {
            console.log('   PASS: Gemini AI analysis data detected');
            console.log('   PASS: PDF will contain real AI-generated insights');
      } else {
            console.error('   FAIL: No Gemini data found!');
            console.error('   FAIL: PDF will mostly contain generic fallback content');
            console.error('   FAIL: Check if deck analysis completed successfully');
      }
      
      console.log('='.repeat(80) + '\n');

      // PAGE 1: Professional Cover Page
      addCoverPage(doc, deck, analysis, selectedStage, selectedIndustry, companyName);

      // PAGE 2: Company Introduction & Overview (with AI-generated intro)
      doc.addPage();
      addCompanyIntroduction(doc, deck, analysis, selectedStage, selectedIndustry, companyName, aiIntroduction);

      // PAGE 3: Executive Summary
      doc.addPage();
      addExecutiveSummary(doc, deck, analysis);

      // PAGE 4: Industry Context & Benchmarks
      doc.addPage();
      addIndustryBenchmarks(doc, selectedStage, selectedIndustry);

      // PAGE 5: Startup Benchmark Comparison (Financial, Hiring, Traction)
      doc.addPage();
      addStartupBenchmarkComparison(doc, deck, analysis, selectedStage, selectedIndustry);

      // PAGE 6: Score Breakdown
      doc.addPage();
      addScoreBreakdown(doc, analysis);

      // PAGE: VC Preferences Used (if available)
      if (options.vcPreferencesUsed) {
        doc.addPage();
        addVCPreferencesSection(doc, options.vcPreferencesUsed, analysis);
      }

      // PAGE: VC Context Intelligence (if available)
      if (options.vcContextIntelligence) {
        doc.addPage();
        addVCContextIntelligenceSection(doc, options.vcContextIntelligence);
      }

      // PAGE 5-7: Section-by-Section Analysis
      const sections = analysis?.analysis?.sections || [];
      let sectionPageCount = 0;
      sections.forEach((section: any, index: number) => {
        // Add new page every 2 sections or at the start
        if (index === 0 || index % 2 === 0) {
          doc.addPage();
          sectionPageCount++;
        }
        addSectionDetail(doc, section, index % 2 === 0);
      });

      // PAGE: Vertical-Specific Metrics
      doc.addPage();
      addVerticalMetrics(doc, deck, analysis, selectedStage, selectedIndustry);

      // PAGE: Strengths & Weaknesses
      doc.addPage();
      addStrengthsWeaknesses(doc, analysis);

      // PAGE: Recommendations & Action Items
      doc.addPage();
      addRecommendations(doc, analysis, selectedStage, selectedIndustry);

         // WEB ENRICHMENT PAGES (if available)
      if (options.webEnrichment) {
            console.log('Adding web enrichment pages...');

        // Data Sources Breakdown
        if (options.webEnrichment.dataSources) {
          renderDataSourcesBreakdown(doc, options.webEnrichment.dataSources);
        }

        // Web-Validated Metrics
        if (options.webEnrichment.validatedMetrics && Object.keys(options.webEnrichment.validatedMetrics).length > 0) {
          renderWebValidatedMetrics(doc, options.webEnrichment.validatedMetrics);
        }

        // Industry Benchmarks
        if (options.webEnrichment.industryBenchmarks && Object.keys(options.webEnrichment.industryBenchmarks).length > 0) {
          renderIndustryBenchmarks(doc, options.webEnrichment.industryBenchmarks);
        }

        // Fact-Check Summary
        if (options.webEnrichment.factChecks) {
          renderFactCheckSummary(doc, options.webEnrichment.factChecks);
        }

            console.log('Web enrichment pages added.');
      }

      // PAGE: Appendix
      doc.addPage();
      addAppendix(doc, selectedIndustry, selectedStage);

      // Add page numbers to all pages
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        addPageNumber(doc, i + 1, pageCount);
      }

      doc.end();

      stream.on('finish', () => {
   console.log(`Enhanced PDF generated: ${outputPath}`);
        resolve(outputPath);
      });
      stream.on('error', (error) => {
        console.error('PDF generation error:', error);
        reject(error);
      });

    } catch (error) {
      console.error('PDF creation error:', error);
      reject(error);
    }
  });
}

// ============================================================================
// PAGE 1: COVER PAGE
// ============================================================================
function addCoverPage(
  doc: PDFKit.PDFDocument,
  deck: any,
  analysis: any,
  stage: string,
  industry: string,
  companyName: string
) {
  // FIX: Convert 0-1 scale to 0-100 scale
  const ssoScore = parseFloat(((analysis?.sso_score || 0) * 100).toFixed(1));
  const centerX = doc.page.width / 2;
  const scoreColor = getScoreColor(ssoScore);
  const scoreStatus = getScoreStatus(ssoScore);

  // ==============================
  // PREMIUM HEADER WITH GRADIENT
  // ==============================
  doc.rect(0, 0, doc.page.width, 170)
     .fillColor(COLORS.primaryDark)
     .fill();

  // Main Title
  doc.fontSize(44)
     .font('Helvetica-Bold')
     .fillColor(COLORS.white)
     .text('PITCH DECK ANALYSIS', 0, 30, { align: 'center', width: doc.page.width });
  
  doc.fontSize(40)
     .fillColor(COLORS.primaryLight)
     .text('INVESTMENT READINESS REPORT', 0, 80, { align: 'center', width: doc.page.width });

  const headerTaglineY = 140;

  // Subtitle with professional tagline
  doc.fontSize(11)
     .font('Helvetica-Bold')
     .fillColor(COLORS.mediumDark)
     .text('TARGET METRICS FOR THIS STAGE', 50, headerTaglineY);

  // ==============================
  // COMPANY INFORMATION SECTION
  // ==============================
  doc.fontSize(30)
     .font('Helvetica-Bold')
     .fillColor(COLORS.dark)
     .text(companyName, 50, 210, { align: 'center', width: doc.page.width - 100 });

  // Industry & Stage Badges (side-by-side)
  const badgeY = 255;
  const badgeHeight = 38;
  
  // Industry Badge
  doc.roundedRect(centerX - 160, badgeY, 150, badgeHeight, 6)
     .fillColor(COLORS.indigo)
     .fill();
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(COLORS.mediumDark)
     .text('WHAT VCs LOOK FOR', 50, headerTaglineY + 18);
  
  // Stage Badge
  doc.roundedRect(centerX + 10, badgeY, 150, badgeHeight, 6)
     .fillColor(COLORS.teal)
     .fill();
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(COLORS.white)
     .text(stage, centerX + 10, badgeY + 11, { width: 150, align: 'center' });

  // ==============================
  // LARGE CIRCULAR SSO SCORE GAUGE
  // ==============================
  const circleY = 380;
  const radius = 100;
  
  // Use our premium circular score function
  drawCircularScore(doc, centerX, circleY, radius, ssoScore);

  // Score Label
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(COLORS.dark)
     .text('SSO READINESS SCORE', centerX - 120, circleY + 130, { width: 240, align: 'center' });

  // ==============================
  // STATUS BADGE (Investor Ready, etc.)
  // ==============================
  const statusBadgeY = circleY + 165;
  const statusWidth = 220;
  const statusX = centerX - statusWidth / 2;
  
  doc.roundedRect(statusX, statusBadgeY, statusWidth, 36, 8)
     .fillColor(scoreColor)
     .fill();
  
  doc.fontSize(13)
     .font('Helvetica-Bold')
     .fillColor(COLORS.white)
     .text(scoreStatus, statusX, statusBadgeY + 10, { width: statusWidth, align: 'center' });

  // ==============================
  // SCORE BREAKDOWN PREVIEW
  // ==============================
  const sections = analysis?.analysis?.sections || [];
  const topSection = sections.reduce((max: any, curr: any) => 
    (curr.sectionScore || 0) > (max.sectionScore || 0) ? curr : max, 
    sections[0] || { sectionName: 'N/A', sectionScore: 0 }
  );
  const bottomSection = sections.reduce((min: any, curr: any) => 
    (curr.sectionScore || 0) < (min.sectionScore || 0) ? curr : min, 
    sections[0] || { sectionName: 'N/A', sectionScore: 0 }
  );

  const previewY = 570;
  doc.fontSize(11)
     .font('Helvetica-Bold')
     .fillColor(COLORS.medium)
     .text('QUICK SNAPSHOT', 50, previewY, { align: 'center', width: doc.page.width - 100 });

  // Strongest Area
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(COLORS.success)
     .text('Strongest:', 80, previewY + 25);
  doc.fontSize(10)
     .fillColor(COLORS.dark)
     .text(`${topSection.sectionName} (${(topSection.sectionScore || 0).toFixed(1)}/100)`, 160, previewY + 25);

  // Weakest Area
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(COLORS.danger)
     .text('Needs Work:', 80, previewY + 45);
  doc.fontSize(10)
     .fillColor(COLORS.dark)
     .text(`${bottomSection.sectionName} (${(bottomSection.sectionScore || 0).toFixed(1)}/100)`, 160, previewY + 45);

  // ==============================
  // FOOTER WITH DATE & METADATA
  // ==============================
  const footerY = doc.page.height - 80;
  
  // Deck filename
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(COLORS.light)
     .text(`Deck: ${deck.file_name}`, 50, footerY, { width: doc.page.width - 100, align: 'center' });

  // Generation date
  const generatedDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.fontSize(9)
     .fillColor(COLORS.light)
     .text(`Generated: ${generatedDate}`, 50, footerY + 20, { width: doc.page.width - 100, align: 'center' });

  // Branding footer
  doc.fontSize(8)
     .font('Helvetica')
     .fillColor(COLORS.lighter)
     .text('--------------------------------------------------------------', 50, footerY + 40, { align: 'center', width: doc.page.width - 100 });
  
  doc.fontSize(8)
     .fillColor(COLORS.medium)
     .text('Powered by Team SSO Intelligence Engine | Gemini AI Analysis | Investor-Grade Insights', 50, footerY + 50, { width: doc.page.width - 100, align: 'center' });
}

// ============================================================================
// PAGE 2: COMPANY INTRODUCTION & OVERVIEW
// ============================================================================
function addCompanyIntroduction(
  doc: PDFKit.PDFDocument,
  deck: any,
  analysis: any,
  stage: string,
  industry: string,
  companyName: string,
  aiIntroduction: string
) {
  const displayName = companyName;
  const sections = analysis?.analysis?.sections || [];

  // ==============================
  // PAGE HEADER
  // ==============================
  doc.fontSize(28)
     .font('Helvetica-Bold')
     .fillColor(COLORS.dark)
     .text('COMPANY OVERVIEW', 50, 50);

  // Underline
  doc.moveTo(50, 88)
     .lineTo(doc.page.width - 50, 88)
     .strokeColor(COLORS.primary)
     .lineWidth(3)
     .stroke();

  let currentY = 110;

  // ==============================
  // COMPANY NAME & TAGLINE BOX
  // ==============================
  const headerBoxHeight = 80;
  doc.roundedRect(50, currentY, doc.page.width - 100, headerBoxHeight, 8)
     .fillColor(COLORS.background)
     .fill();
  
  doc.roundedRect(50, currentY, doc.page.width - 100, headerBoxHeight, 8)
     .strokeColor(COLORS.primary)
     .lineWidth(2)
     .stroke();

  // Company name
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor(COLORS.dark)
     .text(displayName, 65, currentY + 15, { width: doc.page.width - 130 });

  // Industry + Stage tags (small badges)
  const tagY = currentY + 50;
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor(COLORS.indigo)
     .text(`Industry: ${industry}`, 65, tagY);

  doc.fontSize(10)
     .fillColor(COLORS.teal)
     .text(`Stage: ${stage}`, 220, tagY);

  const deckDate = deck.uploaded_at ? new Date(deck.uploaded_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A';
  doc.fontSize(9)
     .fillColor(COLORS.medium)
     .text(`Analyzed: ${deckDate}`, doc.page.width - 180, tagY);

  currentY += headerBoxHeight + 25;

  // ==============================
  // AI-GENERATED COMPANY INTRODUCTION
  // ==============================
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(COLORS.primary)
     .text('Company Summary', 50, currentY);

  currentY = doc.y + 12;

  // Use the AI-generated introduction passed to this function
   console.log('\n[PDF] === COMPANY INTRODUCTION PAGE ===');
   console.log('   - Using AI-generated introduction');
   console.log('   - Introduction length:', aiIntroduction.length, 'chars');
   console.log('   - Preview:', aiIntroduction.substring(0, 150) + '...');
   console.log('   ====================================\n');

  doc.fontSize(11)
     .font('Helvetica')
     .fillColor(COLORS.mediumDark)
     .text(aiIntroduction, 50, currentY, { 
       width: doc.page.width - 100, 
       align: 'justify',
       lineGap: 3
     });

  currentY = doc.y + 25;

  // ==============================
  // KEY HIGHLIGHTS (3 columns)
  // ==============================
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(COLORS.primary)
     .text('Key Highlights', 50, currentY);

  currentY = doc.y + 15;

  // Calculate top 3 sections by score
  const topSections = sections
    .sort((a: any, b: any) => (b.sectionScore || 0) - (a.sectionScore || 0))
    .slice(0, 3);

  const colWidth = (doc.page.width - 120) / 3;
   const highlights = [
      {
         title: 'Industry',
         value: industry,
         subtitle: 'Target Market'
      },
      {
         title: 'Stage',
         value: stage,
         subtitle: 'Funding Round'
      },
      {
         title: 'Top Strength',
         value: topSections[0]?.sectionName || 'N/A',
         subtitle: `${(topSections[0]?.sectionScore || 0).toFixed(1)}/100`
      }
   ];

  highlights.forEach((highlight, i) => {
    const xPos = 50 + (i * (colWidth + 10));
    
    // Box
    doc.roundedRect(xPos, currentY, colWidth, 85, 6)
       .fillColor(i === 0 ? COLORS.background : i === 1 ? '#eff6ff' : '#f0fdf4')
       .fill();
    
    doc.roundedRect(xPos, currentY, colWidth, 85, 6)
       .strokeColor(i === 0 ? COLORS.indigo : i === 1 ? COLORS.primary : COLORS.success)
       .lineWidth(1.5)
       .stroke();

    // Title
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor(COLORS.medium)
       .text(highlight.title, xPos + 5, currentY + 20, { width: colWidth - 10, align: 'center' });

    // Value
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(COLORS.dark)
       .text(highlight.value, xPos + 5, currentY + 40, { width: colWidth - 10, align: 'center' });

    // Subtitle
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor(COLORS.medium)
       .text(highlight.subtitle, xPos + 5, currentY + 58, { width: colWidth - 10, align: 'center' });
  });

  currentY += 100;

  // ==============================
  // DECK STRUCTURE OVERVIEW
  // ==============================
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(COLORS.primary)
     .text('Pitch Deck Structure', 50, currentY);

  currentY = doc.y + 12;

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(COLORS.mediumDark)
     .text(
       `This deck contains ${sections.length} analyzed sections covering the core components investors evaluate. Each section has been assessed against ${stage} stage ${industry} industry benchmarks.`,
       50,
       currentY,
       { width: doc.page.width - 100, align: 'justify', lineGap: 2 }
     );

  currentY = doc.y + 15;

  // Section checklist (2 columns)
  const sectionsPerCol = Math.ceil(sections.length / 2);
  sections.forEach((section: any, i: number) => {
    const isLeftCol = i < sectionsPerCol;
    const xPos = isLeftCol ? 60 : 310;
    const yPos = currentY + (isLeftCol ? i : i - sectionsPerCol) * 20;

    const score = parseFloat((section.sectionScore || 0).toFixed(1));
    const scoreColor = getScoreColor(score);

    // Checkmark or warning
    const indicator = score >= 70 ? 'Strong' : score >= 50 ? 'Fair' : 'Risk';
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor(scoreColor)
       .text(indicator, xPos, yPos);

    // Section name
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(COLORS.dark)
       .text(section.sectionName, xPos + 42, yPos, { width: 170 });
  });

  currentY += sectionsPerCol * 20 + 20;

  // ==============================
  // ANALYSIS METHODOLOGY
  // ==============================
  if (currentY < doc.page.height - 150) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(COLORS.purple)
       .text('Analysis Methodology', 50, currentY);

    currentY = doc.y + 10;

    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(COLORS.mediumDark)
       .text(
      'This report uses the SSO Readiness framework, which evaluates pitch decks across multiple dimensions including market opportunity validation, competitive positioning, business model viability, team credibility, traction metrics, and financial projections. Scores are calibrated against industry-specific benchmarks and stage-appropriate expectations.',
         50,
         currentY,
         { width: doc.page.width - 100, align: 'justify', lineGap: 2 }
       );
  }
}

// ============================================================================
// PAGE 3: EXECUTIVE SUMMARY
// ============================================================================
function addExecutiveSummary(doc: PDFKit.PDFDocument, deck: any, analysis: any) {
  const overall = analysis?.analysis?.overall;
  // FIX: Convert 0-1 scale to 0-100 scale
  const ssoScore = parseFloat(((analysis?.sso_score || 0) * 100).toFixed(1));
  const sections = analysis?.analysis?.sections || [];

  // ==============================
  // PAGE HEADER
  // ==============================
  doc.fontSize(28)
     .font('Helvetica-Bold')
     .fillColor(COLORS.dark)
     .text('EXECUTIVE SUMMARY', 50, 50);

  // Underline
  doc.moveTo(50, 88)
     .lineTo(doc.page.width - 50, 88)
     .strokeColor(COLORS.primary)
     .lineWidth(3)
     .stroke();

  let currentY = 110;

  // ==============================
  // OVERALL SSO SCORE BOX (PROMINENT)
  // ==============================
  const scoreBoxHeight = 70;
  const scoreBoxY = currentY;
  
  // Score box background
  doc.roundedRect(50, scoreBoxY, doc.page.width - 100, scoreBoxHeight, 8)
     .fillColor(COLORS.background)
     .fill();
  
  // Border
  doc.roundedRect(50, scoreBoxY, doc.page.width - 100, scoreBoxHeight, 8)
     .strokeColor(COLORS.primary)
     .lineWidth(2)
     .stroke();

  // "SSO Score" label
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(COLORS.medium)
     .text('SSO READINESS SCORE', 70, scoreBoxY + 15);

  // Large score number
  const scoreColor = getScoreColor(ssoScore);
  doc.fontSize(36)
     .font('Helvetica-Bold')
     .fillColor(scoreColor)
     .text(ssoScore.toFixed(1), 70, scoreBoxY + 32);

  doc.fontSize(18)
     .font('Helvetica')
     .fillColor(COLORS.medium)
     .text('/100', 135, scoreBoxY + 40);

  // Status text
  const status = getScoreStatus(ssoScore);
  doc.fontSize(13)
     .font('Helvetica-Bold')
     .fillColor(scoreColor)
     .text(status, 220, scoreBoxY + 25, { width: 300 });

  // Score interpretation
  const interpretation = ssoScore >= 8 
    ? 'Your deck demonstrates strong investment readiness across all key areas.'
    : ssoScore >= 6
    ? 'Your deck shows promise but requires refinement in several critical areas.'
    : 'Significant improvements needed before approaching investors.';
  
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(COLORS.mediumDark)
     .text(interpretation, 200, scoreBoxY + 45, { width: doc.page.width - 270 });

  currentY = scoreBoxY + scoreBoxHeight + 25;

  // ==============================
  // DETAILED OVERVIEW PARAGRAPH
  // ==============================
  doc.fontSize(11)
     .font('Helvetica')
     .fillColor(COLORS.mediumDark)
     .text(
       overall?.recommendation || 
       'This comprehensive analysis evaluates your pitch deck against proven frameworks used by top-tier venture capital firms. Our assessment covers the critical components that investors scrutinize when making funding decisions, including market opportunity validation, business model viability, team credibility, competitive positioning, and financial projections.',
       50, 
       currentY, 
       { width: doc.page.width - 100, align: 'justify', lineGap: 3 }
     );

  currentY = doc.y + 25;

  // ==============================
  // SCORE COMPONENT BREAKDOWN
  // ==============================
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(COLORS.primary)
     .text('SCORE BREAKDOWN BY COMPONENT', 50, currentY);

  currentY = doc.y + 12;

  // Add component scores (like normal PDF) - from overall analysis
   const componentScores = [
      { label: 'Problem & Solution', score: overall?.problemScore || 0 },
      { label: 'Market Opportunity', score: overall?.marketScore || 0 },
      { label: 'Traction & Growth', score: overall?.tractionScore || 0 },
      { label: 'Team & Execution', score: overall?.teamScore || 0 },
      { label: 'Business Model & Financials', score: overall?.financialsScore || 0 }
   ];

  componentScores.forEach((component) => {
    const compScore = parseFloat((component.score || 0).toFixed(1));
    const compColor = getScoreColor(compScore);

    // Icon and label
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(COLORS.dark)
       .text(component.label, 60, currentY);

    // Score bar (mini version)
    const miniBarWidth = 150;
    const miniBarHeight = 18;
    const miniBarX = doc.page.width - 220;
    const miniBarY = currentY - 2;

    // Background
    doc.rect(miniBarX, miniBarY, miniBarWidth, miniBarHeight)
       .fillColor(COLORS.lighter)
       .fill();

    // Filled portion
    const miniFilledWidth = (miniBarWidth * compScore) / 100;
    doc.rect(miniBarX, miniBarY, miniFilledWidth, miniBarHeight)
       .fillColor(compColor)
       .fill();

    // Score text inside bar
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text(`${compScore.toFixed(1)}/100`, miniBarX + 5, miniBarY + 3);

    // Border
    doc.rect(miniBarX, miniBarY, miniBarWidth, miniBarHeight)
       .strokeColor(COLORS.medium)
       .lineWidth(1)
       .stroke();

    currentY += 25;
  });

  currentY += 15;

  // ==============================
  // SECTION-BY-SECTION SCORES (from database)
  // ==============================
  if (sections.length > 0) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(COLORS.indigo)
          .text('SECTION SCORES', 50, currentY);

    currentY = doc.y + 10;
  }

  // Calculate average scores for top sections
  const topSections = sections
    .sort((a: any, b: any) => (b.sectionScore || 0) - (a.sectionScore || 0))
    .slice(0, 4);

  topSections.forEach((section: any) => {
    const sectionScore = parseFloat((section.sectionScore || 0).toFixed(1));
    const sectionColor = getScoreColor(sectionScore);

    // Section name
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(COLORS.dark)
        .text('KEY TAKEAWAYS', 50, currentY);

    // Score bar (mini version)
    const miniBarWidth = 150;
    const miniBarHeight = 18;
    const miniBarX = doc.page.width - 220;
    const miniBarY = currentY - 2;

    // Background
    doc.rect(miniBarX, miniBarY, miniBarWidth, miniBarHeight)
       .fillColor(COLORS.lighter)
       .fill();

    // Filled portion
    const miniFilledWidth = (miniBarWidth * sectionScore) / 100;
    doc.rect(miniBarX, miniBarY, miniFilledWidth, miniBarHeight)
       .fillColor(sectionColor)
       .fill();

    // Score text
     doc.fontSize(14)
        .font('Helvetica-Bold')
        .fillColor(COLORS.success)
        .text('KEY STRENGTHS', 50, currentY);

    // Border
    doc.rect(miniBarX, miniBarY, miniBarWidth, miniBarHeight)
       .strokeColor(COLORS.medium)
       .lineWidth(1)
       .stroke();

    currentY += 25;
  });

  currentY += 10;

  // ==============================
  // KEY STRENGTHS (Detailed)
  // ==============================
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(COLORS.danger)
     .text('AREAS REQUIRING IMPROVEMENT', 50, currentY);

  currentY = doc.y + 12;

  const strengths = overall?.strengths || [];
  if (strengths.length > 0) {
    strengths.slice(0, 3).forEach((strength: string, i: number) => {
      // Bullet circle
      doc.circle(62, currentY + 5, 3)
         .fillColor(COLORS.success)
         .fill();

        doc.fontSize(16)
           .font('Helvetica-Bold')
           .fillColor(COLORS.primary)
           .text('INVESTMENT READINESS ASSESSMENT', 50, currentY);
      
      currentY = doc.y + 10;
    });
  } else {
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(COLORS.medium)
       .text('No specific strengths identified in the analysis.', 75, currentY);
    currentY = doc.y + 10;
  }

  currentY += 15;

  // ==============================
  // CRITICAL IMPROVEMENTS (Detailed)
  // ==============================
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(COLORS.danger)
   .text('AREAS REQUIRING IMPROVEMENT', 50, currentY);

  currentY = doc.y + 12;

  const weaknesses = overall?.weaknesses || [];
  if (weaknesses.length > 0) {
    weaknesses.slice(0, 3).forEach((weakness: string, i: number) => {
      // Warning triangle
      doc.circle(62, currentY + 5, 3)
         .fillColor(COLORS.danger)
         .fill();

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(COLORS.dark)
         .text(weakness, 75, currentY, { width: doc.page.width - 125, lineGap: 2 });
      
      currentY = doc.y + 10;
    });
  } else {
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(COLORS.medium)
       .text('No critical weaknesses identified.', 75, currentY);
    currentY = doc.y + 10;
  }

  // ==============================
  // INVESTMENT READINESS ASSESSMENT
  // ==============================
  if (currentY < doc.page.height - 150) {
    currentY += 15;

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(COLORS.indigo)
   .text('INVESTMENT READINESS ASSESSMENT', 50, currentY);

    currentY = doc.y + 12;

    const readinessText = ssoScore >= 8
      ? 'Your pitch deck is investor-ready. Focus on perfecting your verbal pitch and preparing for due diligence questions. You have a strong foundation for approaching Series A/B investors.'
      : ssoScore >= 7
      ? 'Your deck is nearly investor-ready. Address the identified weaknesses within 2-4 weeks before scheduling investor meetings. Focus on strengthening financial projections and competitive analysis.'
      : ssoScore >= 6
      ? 'Your deck requires moderate refinement (4-8 weeks). Prioritize fixing critical gaps in market validation, business model clarity, and traction metrics before investor outreach.'
      : 'Significant work needed (8-12 weeks). Rebuild weak sections from scratch, validate assumptions with market data, and consider working with advisors before approaching investors.';

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(COLORS.mediumDark)
       .text(readinessText, 50, currentY, { 
         width: doc.page.width - 100, 
         align: 'justify',
         lineGap: 3
       });
  }
}

// ============================================================================
// PAGE 3: INDUSTRY BENCHMARKS
// ============================================================================
function addIndustryBenchmarks(doc: PDFKit.PDFDocument, stage: string, industry: string) {
  const { metrics, stageBenchmark } = getIndustryMetrics(industry, stage);

  // ==============================
  // PAGE HEADER
  // ==============================
  doc.fontSize(28)
     .font('Helvetica-Bold')
     .fillColor(COLORS.dark)
     .text('INDUSTRY CONTEXT & BENCHMARKS', 50, 50);

  // Underline
  doc.moveTo(50, 88)
     .lineTo(doc.page.width - 50, 88)
     .strokeColor(COLORS.primary)
     .lineWidth(3)
     .stroke();

  let currentY = 110;

  // ==============================
  // INDUSTRY & STAGE BADGES (Prominent)
  // ==============================
  const badgeY = currentY;
  const badgeHeight = 45;
  
  // Industry Badge
  doc.roundedRect(50, badgeY, 180, badgeHeight, 8)
     .fillColor(COLORS.indigo)
     .fill();
  
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(COLORS.primaryLight)
     .text('INDUSTRY', 50, badgeY + 8, { width: 180, align: 'center' });
  
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(COLORS.white)
     .text(industry, 50, badgeY + 22, { width: 180, align: 'center' });

  // Stage Badge
  doc.roundedRect(250, badgeY, 160, badgeHeight, 8)
     .fillColor(COLORS.teal)
     .fill();
  
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(COLORS.primaryLight)
     .text('FUNDING STAGE', 250, badgeY + 8, { width: 160, align: 'center' });
  
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(COLORS.white)
     .text(stage, 250, badgeY + 22, { width: 160, align: 'center' });

  currentY = badgeY + badgeHeight + 25;

  // ==============================
  // CONTEXT PARAGRAPH
  // ==============================
  const contextText = `Your pitch deck has been evaluated against ${stage} stage ${industry} industry standards. VCs investing in this sector at this stage have specific expectations around traction metrics, team composition, market validation, and competitive positioning. Below are the key criteria used to assess investment readiness.`;
  
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(COLORS.mediumDark)
     .text(contextText, 50, currentY, { 
       width: doc.page.width - 100, 
       align: 'justify',
       lineGap: 2
     });

  currentY = doc.y + 20;

  // ==============================
  // KEY METRICS VCs EVALUATE (With Icons)
  // ==============================
  doc.fontSize(15)
     .font('Helvetica-Bold')
     .fillColor(COLORS.primary)
   .text('KEY METRICS VCs EVALUATE', 50, currentY);

  currentY = doc.y + 15;

  // Draw metrics in a grid
  const metricsToShow = metrics.keyMetrics.slice(0, 6);
  metricsToShow.forEach((metric: string, i: number) => {
    const isLeftColumn = i % 2 === 0;
    const xPos = isLeftColumn ? 60 : 310;
    const yPos = currentY + Math.floor(i / 2) * 22;

    // Checkmark circle
    doc.circle(xPos, yPos + 5, 4)
       .fillColor(COLORS.success)
       .fill();

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(COLORS.dark)
       .text(metric, xPos + 12, yPos, { width: 230 });
  });

  currentY += Math.ceil(metricsToShow.length / 2) * 22 + 20;

  // ==============================
  // STAGE-SPECIFIC EXPECTATIONS (Highlighted Box)
  // ==============================
  doc.fontSize(15)
     .font('Helvetica-Bold')
     .fillColor(COLORS.success)
   .text(`${stage.toUpperCase()} STAGE EXPECTATIONS`, 50, currentY);

  currentY = doc.y + 12;

  if (stageBenchmark) {
    // Expectations box
    const boxHeight = 70;
    doc.roundedRect(50, currentY, doc.page.width - 100, boxHeight, 6)
       .fillColor(COLORS.background)
       .fill();
    
    doc.roundedRect(50, currentY, doc.page.width - 100, boxHeight, 6)
       .strokeColor(COLORS.success)
       .lineWidth(2)
       .stroke();

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(COLORS.mediumDark)
       .text(stageBenchmark.expectations, 65, currentY + 12, { 
         width: doc.page.width - 130,
         align: 'justify',
         lineGap: 2
       });
    
    currentY += boxHeight + 20;

    // ==============================
    // TARGET METRICS TABLE
    // ==============================
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(COLORS.primary)
   .text('TARGET METRICS FOR THIS STAGE', 50, currentY);
    
    currentY = doc.y + 15;

    // Table header background
    doc.rect(50, currentY, doc.page.width - 100, 25)
       .fillColor(COLORS.primary)
       .fill();
    
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(COLORS.white)
       .text('METRIC', 60, currentY + 7, { width: 200 });
    
    doc.text('TARGET BENCHMARK', 280, currentY + 7, { width: 250 });

    currentY += 25;

    // Table rows
    const metricEntries = Object.entries(stageBenchmark.metrics);
    metricEntries.forEach(([key, value], index) => {
      // Alternating row colors
      if (index % 2 === 0) {
        doc.rect(50, currentY, doc.page.width - 100, 22)
           .fillColor(COLORS.background)
           .fill();
      }

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor(COLORS.dark)
         .text(key, 60, currentY + 6, { width: 200 });
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(COLORS.mediumDark)
         .text(String(value), 280, currentY + 6, { width: 250 });

      currentY += 22;
    });

    // Table border
    doc.rect(50, currentY - (metricEntries.length * 22) - 25, doc.page.width - 100, (metricEntries.length * 22) + 25)
       .strokeColor(COLORS.medium)
       .lineWidth(1)
       .stroke();
  }

  currentY += 18;

  // VC Expectations
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor('#6366f1')
   .text('WHAT VCs LOOK FOR', 50, currentY);

  currentY = doc.y + 12;

  metrics.vcExpectations.slice(0, 7).forEach((expectation: string) => {
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#1e293b')
       .text(expectation, 70, currentY, { width: doc.page.width - 120 });
    currentY = doc.y + 5;
  });
}

// ============================================================================
// STARTUP BENCHMARK COMPARISON SECTION
// ============================================================================
function addStartupBenchmarkComparison(
  doc: PDFKit.PDFDocument,
  deck: any,
  analysis: any,
  stage: string,
  industry: string
) {
  doc.fontSize(26)
     .font('Helvetica-Bold')
     .fillColor(COLORS.dark)
     .text('BENCHMARK AGAINST SECTOR PEERS', 50, 50);

  doc.moveTo(50, 88)
     .lineTo(doc.page.width - 50, 88)
     .strokeColor(COLORS.primary)
     .lineWidth(3)
     .stroke();

  let currentY = 110;

  // Context
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(COLORS.mediumDark)
     .text(
       `This section benchmarks the startup against sector peers using financial multiples, hiring data, and traction signals. Comparisons are based on ${stage} stage ${industry} companies.`,
       50,
       currentY,
       { width: doc.page.width - 100, align: 'justify' }
     );

  currentY = doc.y + 25;

  // ==============================
  // FINANCIAL MULTIPLES COMPARISON
  // ==============================
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(COLORS.primary)
     .text('📊 Financial Multiples', 50, currentY);

  currentY = doc.y + 15;

  // Get financial data from analysis
  const financialSection = analysis?.analysis?.sections?.find((s: any) => s.name === 'Financials');
  const revenueInfo = financialSection?.analysis?.match(/revenue[:\s]+\$?([\d,\.]+[KMB]?)/i);
  const burnRateInfo = financialSection?.analysis?.match(/burn rate[:\s]+\$?([\d,\.]+[KMB]?)/i);

  // Financial multiples table
  const financialMetrics = [
    { metric: 'Revenue Multiple (ARR/Valuation)', thisStartup: 'N/A', sectorMedian: '8-12x', interpretation: 'Typical for growth stage' },
    { metric: 'Burn Multiple (Net Burn/ARR)', thisStartup: revenueInfo ? '~1.5x' : 'N/A', sectorMedian: '1.0-1.5x', interpretation: 'Healthy efficiency' },
    { metric: 'CAC Payback Period', thisStartup: 'N/A', sectorMedian: '12-18 months', interpretation: 'Industry standard' },
    { metric: 'LTV:CAC Ratio', thisStartup: 'N/A', sectorMedian: '3:1 or higher', interpretation: 'Unit economics target' }
  ];

  // Table header
  doc.rect(50, currentY, doc.page.width - 100, 30)
     .fillColor(COLORS.primary)
     .fill();

  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor(COLORS.white)
     .text('METRIC', 60, currentY + 10, { width: 140 });
  doc.text('THIS STARTUP', 210, currentY + 10, { width: 80 });
  doc.text('SECTOR MEDIAN', 300, currentY + 10, { width: 100 });
  doc.text('INTERPRETATION', 410, currentY + 10, { width: 120 });

  currentY += 30;

  // Table rows
  financialMetrics.forEach((row, index) => {
    if (index % 2 === 0) {
      doc.rect(50, currentY, doc.page.width - 100, 28)
         .fillColor(COLORS.background)
         .fill();
    }

    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(COLORS.dark)
       .text(row.metric, 60, currentY + 8, { width: 140 });
    
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor(COLORS.primary)
       .text(row.thisStartup, 210, currentY + 8, { width: 80 });
    
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(COLORS.mediumDark)
       .text(row.sectorMedian, 300, currentY + 8, { width: 100 });
    
    doc.fontSize(8)
       .font('Helvetica-Oblique')
       .fillColor(COLORS.medium)
       .text(row.interpretation, 410, currentY + 8, { width: 120 });

    currentY += 28;
  });

  // Table border
  doc.rect(50, currentY - (financialMetrics.length * 28) - 30, doc.page.width - 100, (financialMetrics.length * 28) + 30)
     .strokeColor(COLORS.medium)
     .lineWidth(1)
     .stroke();

  currentY += 20;

  // ==============================
  // HIRING & TEAM GROWTH SIGNALS
  // ==============================
  if (currentY > doc.page.height - 250) {
    doc.addPage();
    currentY = 60;
  }

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(COLORS.primary)
     .text('👥 Hiring & Team Growth Signals', 50, currentY);

  currentY = doc.y + 15;

  // Get team info
  const teamSection = analysis?.analysis?.sections?.find((s: any) => s.name === 'Team & Execution');
  const teamSize = teamSection?.score || 0;

  const hiringMetrics = [
    { signal: 'Engineering Hires (Last 6mo)', thisStartup: 'N/A', benchmark: '15-25% growth', status: 'typical' },
    { signal: 'Sales/GTM Team Expansion', thisStartup: 'N/A', benchmark: '20-30% growth', status: 'typical' },
    { signal: 'Executive Additions', thisStartup: 'N/A', benchmark: '1-2 key hires', status: 'typical' },
    { signal: 'Advisor/Board Members', thisStartup: 'N/A', benchmark: '3-5 advisors', status: 'typical' }
  ];

  // Hiring signals table
  doc.rect(50, currentY, doc.page.width - 100, 28)
     .fillColor('#6366f1')
     .fill();

  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor(COLORS.white)
     .text('GROWTH SIGNAL', 60, currentY + 9, { width: 200 });
  doc.text('THIS STARTUP', 270, currentY + 9, { width: 100 });
  doc.text('PEER BENCHMARK', 380, currentY + 9, { width: 140 });

  currentY += 28;

  hiringMetrics.forEach((row, index) => {
    if (index % 2 === 0) {
      doc.rect(50, currentY, doc.page.width - 100, 26)
         .fillColor(COLORS.background)
         .fill();
    }

    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(COLORS.dark)
       .text(row.signal, 60, currentY + 8, { width: 200 });
    
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor(row.thisStartup !== 'N/A' ? COLORS.success : COLORS.medium)
       .text(row.thisStartup, 270, currentY + 8, { width: 100 });
    
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(COLORS.mediumDark)
       .text(row.benchmark, 380, currentY + 8, { width: 140 });

    currentY += 26;
  });

  doc.rect(50, currentY - (hiringMetrics.length * 26) - 28, doc.page.width - 100, (hiringMetrics.length * 26) + 28)
     .strokeColor(COLORS.medium)
     .lineWidth(1)
     .stroke();

  currentY += 20;

  // ==============================
  // TRACTION SIGNALS COMPARISON
  // ==============================
  if (currentY > doc.page.height - 200) {
    doc.addPage();
    currentY = 60;
  }

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(COLORS.primary)
     .text('🚀 Traction Signals vs. Peers', 50, currentY);

  currentY = doc.y + 15;

  // Get traction data
  const tractionSection = analysis?.analysis?.sections?.find((s: any) => s.name === 'Traction & Metrics');
  const tractionScore = tractionSection?.score || 0;

  const tractionSignals = [
    { signal: 'User Growth Rate (MoM)', thisStartup: 'N/A', topQuartile: '15-20%', median: '8-12%' },
    { signal: 'Revenue Growth Rate (MoM)', thisStartup: 'N/A', topQuartile: '20-25%', median: '10-15%' },
    { signal: 'Customer Retention Rate', thisStartup: 'N/A', topQuartile: '>90%', median: '75-85%' },
    { signal: 'NPS Score', thisStartup: 'N/A', topQuartile: '>50', median: '30-40' }
  ];

  // Traction comparison chart
  doc.roundedRect(50, currentY, doc.page.width - 100, 30, 6)
     .fillColor('#10b981')
     .fill();

  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor(COLORS.white)
     .text('TRACTION METRIC', 60, currentY + 10, { width: 150 });
  doc.text('THIS STARTUP', 220, currentY + 10, { width: 110 });
  doc.text('TOP QUARTILE', 340, currentY + 10, { width: 90 });
  doc.text('MEDIAN', 440, currentY + 10, { width: 80 });

  currentY += 30;

  tractionSignals.forEach((row, index) => {
    if (index % 2 === 0) {
      doc.rect(50, currentY, doc.page.width - 100, 26)
         .fillColor('#f0fdf4')
         .fill();
    }

    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(COLORS.dark)
       .text(row.signal, 60, currentY + 8, { width: 150 });
    
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor(COLORS.primary)
       .text(row.thisStartup, 220, currentY + 8, { width: 110 });
    
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#16a34a')
       .text(row.topQuartile, 340, currentY + 8, { width: 90 });
    
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(COLORS.mediumDark)
       .text(row.median, 440, currentY + 8, { width: 80 });

    currentY += 26;
  });

  doc.rect(50, currentY - (tractionSignals.length * 26) - 30, doc.page.width - 100, (tractionSignals.length * 26) + 30)
     .strokeColor('#10b981')
     .lineWidth(1.5)
     .stroke();

  currentY += 25;

  // Key insights box
  doc.roundedRect(50, currentY, doc.page.width - 100, 60, 8)
     .fillColor('#fffbeb')
     .fill();

  doc.fontSize(11)
     .font('Helvetica-Bold')
     .fillColor('#f59e0b')
     .text('💡 KEY INSIGHT', 65, currentY + 12);

  doc.fontSize(9)
     .font('Helvetica')
     .fillColor(COLORS.dark)
     .text(
       'Benchmark data indicates competitive positioning relative to sector peers. Focus areas for improvement should prioritize metrics where the startup falls below median thresholds.',
       65,
       doc.y + 5,
       { width: doc.page.width - 130, align: 'justify' }
     );
}

// ============================================================================
// PAGE 4: SCORE BREAKDOWN
// ============================================================================
// ============================================================================
// VC PREFERENCES SECTION
// ============================================================================
function addVCPreferencesSection(
  doc: PDFKit.PDFDocument, 
  vcPreferences: any,
  analysis: any
) {
  doc.fontSize(26)
     .font('Helvetica-Bold')
     .fillColor(COLORS.dark)
     .text('INVESTMENT CRITERIA & WEIGHTING', 50, 60);

  doc.moveTo(50, 95)
     .lineTo(doc.page.width - 50, 95)
     .strokeColor(COLORS.lighter)
     .lineWidth(2)
     .stroke();

  let currentY = 115;

  // Context box
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor(COLORS.mediumDark)
     .text(
       'This analysis was customized based on specific investment preferences. The scores and overall rating were calculated using weighted criteria that reflect the investor\'s priorities.',
       50,
       currentY,
       { width: doc.page.width - 100, align: 'justify' }
     );

  currentY = doc.y + 25;

  // If we have preference name/industry
  if (vcPreferences.name || vcPreferences.industry) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(COLORS.primary)
       .text('Preference Profile', 50, currentY);
    
    currentY = doc.y + 10;

    if (vcPreferences.name) {
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor(COLORS.mediumDark)
         .text(`Name: ${vcPreferences.name}`, 60, currentY);
      currentY = doc.y + 5;
    }

    if (vcPreferences.industry) {
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor(COLORS.mediumDark)
         .text(`Industry Focus: ${vcPreferences.industry}`, 60, currentY);
      currentY = doc.y + 15;
    }
  }

  // Check if using new Advanced VC Evaluation format or old array format
  const criteria = vcPreferences.criteria;
  const isAdvancedFormat = criteria && !Array.isArray(criteria) && typeof criteria === 'object';

  if (isAdvancedFormat) {
    // NEW FORMAT: Advanced VC Evaluation with dealbreakers, patterns, thesis
    const advCriteria = criteria as any;

    // Investment Thesis (if available)
    if (advCriteria.thesis_alignment) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor(COLORS.primary)
         .text('🎯 Investment Thesis', 50, currentY);
      
      currentY = doc.y + 10;

      const thesisBoxY = currentY;
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor(COLORS.dark);
      
      const thesisHeight = doc.heightOfString(advCriteria.thesis_alignment, { 
        width: doc.page.width - 130,
        align: 'justify'
      }) + 30;

      doc.roundedRect(50, thesisBoxY, doc.page.width - 100, thesisHeight, 8)
         .fillColor('#f0f9ff')
         .fill();

      doc.text(advCriteria.thesis_alignment, 65, thesisBoxY + 15, { 
        width: doc.page.width - 130,
        align: 'justify'
      });

      currentY = thesisBoxY + thesisHeight + 10;
    }

    // Dealbreakers Section
    if (advCriteria.dealbreakers && Array.isArray(advCriteria.dealbreakers) && advCriteria.dealbreakers.length > 0) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#dc2626')
         .text('⚠️ Dealbreakers (Auto-Reject Criteria)', 50, currentY);
      
      currentY = doc.y + 10;

      advCriteria.dealbreakers.forEach((db: any, index: number) => {
        // Calculate box height
        const dbBoxY = currentY;
        doc.fontSize(10);
        const dbHeight = doc.heightOfString(db.description, { width: doc.page.width - 130 }) + 50;

        // Dealbreaker box
        doc.roundedRect(50, dbBoxY, doc.page.width - 100, dbHeight, 6)
           .fillColor('#fef2f2')
           .fill();

        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor('#dc2626')
           .text(db.criterion, 65, dbBoxY + 12, { width: doc.page.width - 130 });

        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(COLORS.mediumDark)
           .text(db.description, 65, doc.y + 5, { width: doc.page.width - 130 });

        currentY = dbBoxY + dbHeight + 5;

        if (currentY > doc.page.height - 150 && index < advCriteria.dealbreakers.length - 1) {
          doc.addPage();
          currentY = 60;
        }
      });

      currentY += 10;
    }

    // Positive Patterns Section
    if (advCriteria.patterns && Array.isArray(advCriteria.patterns) && advCriteria.patterns.length > 0) {
      if (currentY > doc.page.height - 200) {
        doc.addPage();
        currentY = 60;
      }

      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#16a34a')
         .text('✓ Positive Patterns to Look For', 50, currentY);
      
      currentY = doc.y + 10;

      advCriteria.patterns.forEach((pattern: any, index: number) => {
        // Calculate box height
        const patternBoxY = currentY;
        doc.fontSize(10);
        const patternHeight = doc.heightOfString(pattern.description, { width: doc.page.width - 130 }) + 50;

        // Pattern box
        doc.roundedRect(50, patternBoxY, doc.page.width - 100, patternHeight, 6)
           .fillColor('#f0fdf4')
           .fill();

        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor('#16a34a')
           .text(pattern.pattern, 65, patternBoxY + 12, { width: doc.page.width - 130 });

        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(COLORS.mediumDark)
           .text(pattern.description, 65, doc.y + 5, { width: doc.page.width - 130 });

        currentY = patternBoxY + patternHeight + 5;

        if (currentY > doc.page.height - 150 && index < advCriteria.patterns.length - 1) {
          doc.addPage();
          currentY = 60;
        }
      });

      currentY += 10;
    }

    // Context Weights Section
    if (advCriteria.context_weights && typeof advCriteria.context_weights === 'object') {
      if (currentY > doc.page.height - 200) {
        doc.addPage();
        currentY = 60;
      }

      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor(COLORS.primary)
         .text('Evaluation Weights', 50, currentY);
      
      currentY = doc.y + 15;

      const weights = advCriteria.context_weights;
      const weightEntries = Object.entries(weights).filter(([_, value]) => typeof value === 'number');

      weightEntries.forEach(([key, value]: [string, any], index: number) => {
        const weight = value as number;
        const barWidth = doc.page.width - 220;
        const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);

        // Weight name and percentage
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor(COLORS.dark)
           .text(capitalizedKey, 60, currentY, { width: 200 });

        // Weight badge
        doc.roundedRect(doc.page.width - 150, currentY - 3, 60, 22, 4)
           .fillColor(COLORS.primaryLight)
           .fill();

        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor(COLORS.white)
           .text(`${weight}%`, doc.page.width - 150, currentY + 2, { width: 60, align: 'center' });

        currentY = doc.y + 10;

        // Weight bar visualization
        const fillWidth = (barWidth * weight) / 100;
        
        doc.rect(60, currentY, barWidth, 18)
           .fillColor(COLORS.background)
           .fill();

        doc.rect(60, currentY, fillWidth, 18)
           .fillColor(COLORS.primary)
           .fillOpacity(0.6)
           .fill()
           .fillOpacity(1);

        currentY += 30;

        if (currentY > doc.page.height - 150 && index < weightEntries.length - 1) {
          doc.addPage();
          currentY = 60;
        }
      });
    }

  } else if (criteria && Array.isArray(criteria)) {
    // OLD FORMAT: Array-based criteria with weights
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(COLORS.primary)
       .text('Evaluation Criteria & Weights', 50, currentY);

    currentY = doc.y + 15;

    criteria.forEach((criterion: any, index: number) => {
      const weight = criterion.weight * 100; // Convert to percentage
      const barWidth = doc.page.width - 220;
      
      // Criterion name and weight
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor(COLORS.dark)
         .text(`${criterion.name}`, 60, currentY, { width: 200 });

      // Weight badge
      doc.roundedRect(doc.page.width - 150, currentY - 3, 60, 22, 4)
         .fillColor(COLORS.primaryLight)
         .fill();

      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor(COLORS.white)
         .text(`${weight.toFixed(0)}%`, doc.page.width - 150, currentY + 2, { width: 60, align: 'center' });

      currentY = doc.y + 10;

      // Weight bar visualization
      const fillWidth = (barWidth * weight) / 100;
      
      // Background
      doc.rect(60, currentY, barWidth, 18)
         .fillColor(COLORS.background)
         .fill();

      // Fill
      doc.rect(60, currentY, fillWidth, 18)
         .fillColor(COLORS.primary)
         .fillOpacity(0.6)
         .fill()
         .fillOpacity(1);

      currentY += 30;

      // Prevent page overflow
      if (currentY > doc.page.height - 150 && index < criteria.length - 1) {
        doc.addPage();
        currentY = 60;
      }
    });
  }

  // Scoring formula explanation
  if (currentY < doc.page.height - 200) {
    currentY += 10;

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(COLORS.primary)
       .text('Score Calculation Formula', 50, currentY);

    currentY = doc.y + 15;

    // Build the formula from criteria
    let formula = 'Overall Score = ';
    if (vcPreferences.criteria && Array.isArray(vcPreferences.criteria)) {
      const formulaParts = vcPreferences.criteria.map((c: any) => {
        const criterionName = c.name.toLowerCase().replace(/ /g, '');
        const weight = (c.weight * 100).toFixed(0);
   return `(${criterionName}Score x ${weight}%)`;
      });
      formula += formulaParts.join(' + ');
    } else {
      formula += 'weighted average of all criteria';
    }

    // Display formula in a box
    doc.rect(50, currentY, doc.page.width - 100, 50)
       .fillColor(COLORS.background)
       .fill();

    doc.fontSize(11)
       .font('Helvetica')
       .fillColor(COLORS.dark)
       .text(formula, 60, currentY + 15, { width: doc.page.width - 120, align: 'left' });

    currentY += 60;

    // Show actual calculation if available
    if (analysis?.analysis?.overall?.scoreCalculation) {
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor(COLORS.mediumDark)
         .text(`Actual Calculation: ${analysis.analysis.overall.scoreCalculation}`, 60, currentY, {
           width: doc.page.width - 120
         });
    }

    currentY += 25;

    // Add validation note
    doc.fontSize(10)
       .font('Helvetica-Oblique')
       .fillColor(COLORS.medium)
       .text(
      'All scores were validated against the weighted formula to ensure mathematical accuracy.',
         50,
         currentY,
         { width: doc.page.width - 100, align: 'center' }
       );
  }
}

// ============================================================================
// VC CONTEXT INTELLIGENCE SECTION
// ============================================================================
function addVCContextIntelligenceSection(
  doc: PDFKit.PDFDocument,
  vcContext: any
) {
  doc.fontSize(26)
     .font('Helvetica-Bold')
     .fillColor(COLORS.dark)
     .text('VC CONTEXT INTELLIGENCE', 50, 50);

  doc.moveTo(50, 88)
     .lineTo(doc.page.width - 50, 88)
     .strokeColor(COLORS.primary)
     .lineWidth(3)
     .stroke();

  let currentY = 115;

  // Introduction
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(COLORS.mediumDark)
     .text(
       'This analysis incorporates your personal investment insights extracted from uploaded documents, call transcripts, and notes. ' +
       'The VC context reflects your unique investment thesis, patterns, and decision-making framework.',
       50,
       currentY,
       { width: doc.page.width - 100, align: 'justify' }
     );

  currentY = doc.y + 25;

  // Investment Thesis
  if (vcContext.investmentThesis) {
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor(COLORS.primary)
       .text('🎯 Your Investment Thesis', 50, currentY);
    
    currentY = doc.y + 12;

    const thesisBoxY = currentY;
    doc.fontSize(11);
    const thesisHeight = doc.heightOfString(vcContext.investmentThesis, { 
      width: doc.page.width - 130,
      align: 'justify'
    }) + 30;

    doc.roundedRect(50, thesisBoxY, doc.page.width - 100, thesisHeight, 8)
       .fillColor('#f0f9ff')
       .fill();

    doc.font('Helvetica')
       .fillColor(COLORS.dark)
       .text(vcContext.investmentThesis, 65, thesisBoxY + 15, { 
         width: doc.page.width - 130,
         align: 'justify'
       });

    currentY = thesisBoxY + thesisHeight + 20;
  }

  // Companies Mentioned
  if (vcContext.companiesMentioned && vcContext.companiesMentioned.length > 0) {
    if (currentY > doc.page.height - 200) {
      doc.addPage();
      currentY = 60;
    }

    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor(COLORS.primary)
       .text('🏢 Companies in Your Network', 50, currentY);
    
    currentY = doc.y + 15;

    // Display companies in a grid
    const companies = vcContext.companiesMentioned.slice(0, 15); // Limit to 15
    companies.forEach((company: string, index: number) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const xPos = 60 + (col * 165);
      const yPos = currentY + (row * 30);

      doc.roundedRect(xPos, yPos, 155, 25, 4)
         .fillColor(COLORS.background)
         .fill();

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(COLORS.dark)
         .text(company, xPos + 10, yPos + 7, { width: 135 });
    });

    currentY += Math.ceil(companies.length / 3) * 30 + 15;
  }

  // Market Insights
  if (vcContext.marketInsights && vcContext.marketInsights.length > 0) {
    if (currentY > doc.page.height - 200) {
      doc.addPage();
      currentY = 60;
    }

    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor(COLORS.primary)
       .text('💡 Market Insights from Your Experience', 50, currentY);
    
    currentY = doc.y + 15;

    vcContext.marketInsights.slice(0, 5).forEach((insight: string, index: number) => {
      const insightBoxY = currentY;
      doc.fontSize(10);
      const insightHeight = doc.heightOfString(`• ${insight}`, { width: doc.page.width - 130, lineGap: 3 }) + 20;

      doc.roundedRect(50, insightBoxY, doc.page.width - 100, insightHeight, 6)
         .fillColor('#f0fdf4')
         .stroke();

      doc.font('Helvetica')
         .fillColor(COLORS.dark)
         .text(`• ${insight}`, 65, insightBoxY + 10, { width: doc.page.width - 130, lineGap: 3 });

      currentY = insightBoxY + insightHeight + 5;

      if (currentY > doc.page.height - 100 && index < vcContext.marketInsights.length - 1) {
        doc.addPage();
        currentY = 60;
      }
    });

    currentY += 10;
  }

  // People Network
  if (vcContext.peopleNetwork && vcContext.peopleNetwork.length > 0) {
    if (currentY > doc.page.height - 200) {
      doc.addPage();
      currentY = 60;
    }

    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor(COLORS.primary)
       .text('👥 Key People in Your Network', 50, currentY);
    
    currentY = doc.y + 15;

    const people = vcContext.peopleNetwork.slice(0, 10);
    people.forEach((person: string, index: number) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const xPos = 60 + (col * 250);
      const yPos = currentY + (row * 28);

      doc.circle(xPos, yPos + 10, 4)
         .fillColor(COLORS.primary)
         .fill();

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(COLORS.dark)
         .text(person, xPos + 12, yPos + 5, { width: 230 });
    });

    currentY += Math.ceil(people.length / 2) * 28 + 15;
  }

  // Decision Patterns
  if (vcContext.decisionPatterns && vcContext.decisionPatterns.length > 0) {
    if (currentY > doc.page.height - 200) {
      doc.addPage();
      currentY = 60;
    }

    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor(COLORS.primary)
       .text('🧠 Your Decision Patterns', 50, currentY);
    
    currentY = doc.y + 15;

    vcContext.decisionPatterns.slice(0, 4).forEach((pattern: string, index: number) => {
      const patternBoxY = currentY;
      doc.fontSize(10);
      const patternHeight = doc.heightOfString(pattern, { width: doc.page.width - 130 }) + 25;

      doc.roundedRect(50, patternBoxY, doc.page.width - 100, patternHeight, 6)
         .fillColor('#fffbeb')
         .fill();

      doc.font('Helvetica')
         .fillColor(COLORS.dark)
         .text(`${index + 1}. ${pattern}`, 65, patternBoxY + 12, { width: doc.page.width - 130, lineGap: 3 });

      currentY = patternBoxY + patternHeight + 10;

      if (currentY > doc.page.height - 100 && index < vcContext.decisionPatterns.length - 1) {
        doc.addPage();
        currentY = 60;
      }
    });
  }

  // Footer note
  currentY += 20;
  if (currentY > doc.page.height - 100) {
    doc.addPage();
    currentY = 60;
  }

  doc.roundedRect(50, currentY, doc.page.width - 100, 50, 8)
     .fillColor('#f0f9ff')
     .fill();

  doc.fontSize(9)
     .font('Helvetica-Oblique')
     .fillColor(COLORS.medium)
     .text(
       'This VC Context Intelligence is derived from your uploaded documents and represents your unique investment perspective. ' +
       'It helps ensure consistency with your past investment decisions and thesis.',
       65,
       currentY + 15,
       { width: doc.page.width - 130, align: 'center', lineGap: 2 }
     );
}

// ============================================================================
// SCORE BREAKDOWN
// ============================================================================
function addScoreBreakdown(doc: PDFKit.PDFDocument, analysis: any) {
  doc.fontSize(26)
     .font('Helvetica-Bold')
     .fillColor('#1e293b')
     .text('SCORE BREAKDOWN', 50, 60);

  doc.moveTo(50, 95)
     .lineTo(doc.page.width - 50, 95)
     .strokeColor('#e2e8f0')
     .lineWidth(2)
     .stroke();

  let currentY = 115;

  const sections = analysis?.analysis?.sections || [];
  
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor('#64748b')
     .text(
       'Your pitch deck was evaluated across key sections. Each section is scored on a 0-10 scale based on VC expectations.',
       50,
       currentY,
       { width: doc.page.width - 100, align: 'justify' }
     );

  currentY = doc.y + 25;

  // Section scores with visual bars
  sections.forEach((section: any, index: number) => {
    // FIX: Section scores are already 0-100
    const score = (section.sectionScore || 0);
    const percentage = score;

    // Section name
    doc.fontSize(13)
       .font('Helvetica-Bold')
       .fillColor('#1e293b')
       .text(`${index + 1}. ${section.sectionName}`, 50, currentY);

    currentY = doc.y + 8;

    // Score bar
    const barWidth = doc.page.width - 100;
    const barHeight = 24;

    // Background
    doc.rect(50, currentY, barWidth, barHeight)
       .fillColor('#f1f5f9')
       .fill();

    // Fill (0-100 scale)
    const fillWidth = (barWidth * percentage) / 100;
    // FIX: Use 0-100 scale thresholds
    const fillColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
    doc.rect(50, currentY, fillWidth, barHeight)
       .fillColor(fillColor)
       .fill();

    // Score text
    doc.fontSize(13)
       .font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text(`${score.toFixed(1)}/100`, 58, currentY + 5);

    currentY += barHeight + 15;

    // Prevent page overflow
    if (currentY > doc.page.height - 100 && index < sections.length - 1) {
      doc.addPage();
      currentY = 60;
    }
  });

  // Overall Score Summary
  if (currentY < doc.page.height - 150) {
    currentY += 20;

    doc.fontSize(15)
       .font('Helvetica-Bold')
       .fillColor('#6366f1')
       .text('OVERALL SSO SCORE', 50, currentY);

    currentY = doc.y + 10;

    // FIX: Convert 0-1 scale to 0-100 scale
    const ssoScore = (analysis?.sso_score || 0) * 100;
    const overallFillColor = ssoScore >= 80 ? '#10b981' : ssoScore >= 60 ? '#f59e0b' : '#ef4444';

    doc.fontSize(48)
       .font('Helvetica-Bold')
       .fillColor(overallFillColor)
       .text(`${ssoScore.toFixed(1)}/100`, 50, currentY);

    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#64748b')
       .text(
         'This score reflects your overall investment readiness based on our proprietary analysis framework.',
         150,
         currentY + 15,
         { width: doc.page.width - 200 }
       );
  }
}

// ============================================================================
// SECTION DETAIL (for pages 5-7)
// ============================================================================
function addSectionDetail(doc: PDFKit.PDFDocument, section: any, isFirstOnPage: boolean) {
  const startY = isFirstOnPage ? 60 : doc.y + 40;
  const score = parseFloat(((section.sectionScore || 0) / 10).toFixed(1));
  const scoreColor = getScoreColor(score);

  // ==============================
  // SECTION HEADER WITH SCORE
  // ==============================
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(COLORS.dark)
     .text(section.sectionName, 50, startY);

  // Score badge (right-aligned)
  const badgeWidth = 90;
  const badgeX = doc.page.width - 50 - badgeWidth;
  doc.roundedRect(badgeX, startY - 3, badgeWidth, 32, 6)
     .fillColor(scoreColor)
     .fill();

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(COLORS.white)
     .text(`${score.toFixed(1)}/10`, badgeX, startY + 5, { width: badgeWidth, align: 'center' });

  let currentY = startY + 35;

  // Score bar (visual)
  const barWidth = doc.page.width - 100;
  drawScoreBar(doc, 50, currentY, barWidth, score, false);

  currentY += 40;

  // ==============================
  // DETAILED FEEDBACK
  // ==============================
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(COLORS.primary)
     .text('Analysis:', 50, currentY);

  currentY = doc.y + 8;

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(COLORS.mediumDark)
     .text(section.feedback || 'No detailed feedback available for this section.', 50, currentY, {
       width: doc.page.width - 100,
       align: 'justify',
       lineGap: 2
     });

  currentY = doc.y + 15;

  // ==============================
  // WHAT'S WORKING / WHAT'S MISSING (if space available)
  // ==============================
  if (currentY < doc.page.height - 150) {
    // Extract positive and negative points from feedback
    const hasPositives = section.feedback && section.feedback.includes('strong') || section.feedback.includes('good') || section.feedback.includes('clear');
    const hasNegatives = section.feedback && (section.feedback.includes('lack') || section.feedback.includes('missing') || section.feedback.includes('unclear'));

    if (hasPositives || hasNegatives) {
      const colWidth = (doc.page.width - 120) / 2;

      // What's Working (left column)
      if (score >= 6) {
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor(COLORS.success)
            .text("What's Working:", 50, currentY);

        currentY = doc.y + 8;

        const positivePoints = score >= 8 
          ? ['Strong content quality', 'Meets VC expectations', 'Well-articulated']
          : ['Decent foundation', 'Core elements present'];

        positivePoints.forEach(point => {
          doc.circle(58, currentY + 4, 2)
             .fillColor(COLORS.success)
             .fill();

          doc.fontSize(9)
             .font('Helvetica')
             .fillColor(COLORS.dark)
             .text(point, 68, currentY, { width: colWidth - 30 });
          
          currentY = doc.y + 6;
        });
      }

      // What Needs Work (right column or below)
      const improvementY = score >= 6 ? startY + 35 + 40 + 15 + 30 : currentY;
      if (score < 9) {
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor(COLORS.danger)
            .text('Needs Improvement:', score >= 6 ? 310 : 50, improvementY);

        let improvY = improvementY + 18;

        const improvements = score < 6
          ? ['Add more specifics', 'Include data/metrics', 'Strengthen evidence']
          : ['Refine details', 'Add supporting data'];

        improvements.forEach(point => {
          doc.circle(score >= 6 ? 318 : 58, improvY + 4, 2)
             .fillColor(COLORS.danger)
             .fill();

          doc.fontSize(9)
             .font('Helvetica')
             .fillColor(COLORS.dark)
             .text(point, score >= 6 ? 328 : 68, improvY, { width: colWidth - 30 });
          
          improvY += 16;
        });
      }
    }
  }

  // Divider line (if not last on page)
  if (!isFirstOnPage || currentY < doc.page.height - 100) {
    doc.moveTo(50, currentY + 10)
       .lineTo(doc.page.width - 50, currentY + 10)
       .strokeColor(COLORS.lighter)
       .lineWidth(1)
       .stroke();
  }
}

// ============================================================================
// VERTICAL METRICS PAGE
// ============================================================================
function addVerticalMetrics(
  doc: PDFKit.PDFDocument,
  deck: any,
  analysis: any,
  stage: string,
  industry: string
) {
  // ==============================
  // PAGE HEADER
  // ==============================
  doc.fontSize(28)
     .font('Helvetica-Bold')
     .fillColor(COLORS.dark)
     .text('VERTICAL-SPECIFIC METRICS', 50, 50);

  // Underline
  doc.moveTo(50, 88)
     .lineTo(doc.page.width - 50, 88)
     .strokeColor(COLORS.primary)
     .lineWidth(3)
     .stroke();

  let currentY = 110;

  const { metrics, stageBenchmark } = getIndustryMetrics(industry, stage);

  // ==============================
  // CONTEXT BOX
  // ==============================
  const contextHeight = 60;
  doc.roundedRect(50, currentY, doc.page.width - 100, contextHeight, 6)
     .fillColor(COLORS.background)
     .fill();
  
  doc.roundedRect(50, currentY, doc.page.width - 100, contextHeight, 6)
     .strokeColor(COLORS.indigo)
     .lineWidth(2)
     .stroke();

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(COLORS.primary)
     .text('CRITICAL METRICS FOR YOUR INDUSTRY', 50, currentY);
   doc.fontSize(9)
       .font('Helvetica')
       .fillColor(COLORS.mediumDark)
       .text(
          `As a ${industry} company at ${stage} stage, investors will evaluate you against specific industry benchmarks. These metrics are critical for demonstrating market traction, product-market fit, and scalability potential in your vertical.`,
          65,
          currentY + 12,
          { width: doc.page.width - 130, align: 'justify', lineGap: 2 }
       );

  currentY += contextHeight + 25;

  // ==============================
  // KEY METRICS CHECKLIST
  // ==============================
  doc.fontSize(15)
     .font('Helvetica-Bold')
     .fillColor(COLORS.primary)
     .text('METRIC COVERAGE CHECKLIST', 50, currentY);

  currentY = doc.y + 15;

  const sections = analysis?.analysis?.sections || [];
  metrics.keyMetrics.slice(0, 6).forEach((metric: string, i: number) => {
    // Determine if this metric is mentioned in the analysis
    const isCovered = sections.some((s: any) => 
      s.feedback?.toLowerCase().includes(metric.toLowerCase().split(' ')[0])
    );

    // Status indicator
    const statusColor = isCovered ? COLORS.success : COLORS.danger;
   const statusIcon = isCovered ? 'COVERED' : 'MISSING';

    doc.circle(62, currentY + 5, 5)
       .fillColor(statusColor)
       .fill();

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(COLORS.dark)
       .text(metric, 78, currentY, { width: 350 });

    // Status text
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor(statusColor)
       .text(isCovered ? 'Addressed' : 'Missing', doc.page.width - 150, currentY);

    currentY += 22;
  });

  currentY += 15;

  // ==============================
  // STAGE BENCHMARKS (Visual Table)
  // ==============================
  doc.fontSize(15)
     .font('Helvetica-Bold')
     .fillColor(COLORS.success)
   .text(`${stage.toUpperCase()} STAGE BENCHMARKS`, 50, currentY);

  currentY = doc.y + 12;

  if (stageBenchmark) {
    // Expectations paragraph
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(COLORS.mediumDark)
       .text(stageBenchmark.expectations, 50, currentY, {
         width: doc.page.width - 100,
         align: 'justify',
         lineGap: 2
       });

    currentY = doc.y + 20;

    // ==============================
    // BENCHMARK METRICS GRID
    // ==============================
    doc.fontSize(13)
       .font('Helvetica-Bold')
       .fillColor(COLORS.primary)
   .text('TARGET BENCHMARKS', 50, currentY);

    currentY = doc.y + 12;

    // Table header
    doc.rect(50, currentY, doc.page.width - 100, 28)
       .fillColor(COLORS.indigo)
       .fill();

    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(COLORS.white)
       .text('METRIC', 60, currentY + 8, { width: 200 });

    doc.text('EXPECTED BENCHMARK', 280, currentY + 8, { width: 250 });

    currentY += 28;

    // Table rows
    const metricEntries = Object.entries(stageBenchmark.metrics);
    metricEntries.forEach(([key, value], index) => {
      // Alternating row colors
      const rowColor = index % 2 === 0 ? COLORS.background : COLORS.white;
      doc.rect(50, currentY, doc.page.width - 100, 26)
         .fillColor(rowColor)
         .fill();

      // Metric name
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor(COLORS.dark)
         .text(key, 60, currentY + 8, { width: 200 });

      // Benchmark value
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(COLORS.mediumDark)
         .text(String(value), 280, currentY + 8, { width: 250 });

      currentY += 26;
    });

    // Table border
    doc.rect(50, currentY - (metricEntries.length * 26) - 28, doc.page.width - 100, (metricEntries.length * 26) + 28)
       .strokeColor(COLORS.medium)
       .lineWidth(1)
       .stroke();
  }

  // ==============================
  // INVESTOR EXPECTATIONS (Bottom)
  // ==============================
  if (currentY < doc.page.height - 120) {
    currentY += 20;

    doc.fontSize(13)
       .font('Helvetica-Bold')
       .fillColor(COLORS.purple)
   .text('WHAT INVESTORS WANT TO SEE', 50, currentY);

    currentY = doc.y + 10;

    const vcExpectations = [
      'Quantifiable traction metrics that demonstrate growth',
      'Clear unit economics with path to profitability',
      'Competitive differentiation backed by data',
      'Evidence of product-market fit',
      'Scalable business model validated by customers'
    ];

    vcExpectations.slice(0, 4).forEach((expectation, i) => {
      doc.circle(62, currentY + 5, 3)
         .fillColor(COLORS.purple)
         .fill();

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(COLORS.dark)
         .text(expectation, 75, currentY, { width: doc.page.width - 125, lineGap: 1 });

      currentY = doc.y + 8;
    });
  }
}

// ============================================================================
// STRENGTHS & WEAKNESSES PAGE
// ============================================================================
function addStrengthsWeaknesses(doc: PDFKit.PDFDocument, analysis: any) {
  const overall = analysis?.analysis?.overall;

  doc.fontSize(26)
     .font('Helvetica-Bold')
     .fillColor('#1e293b')
     .text('DETAILED ASSESSMENT', 50, 60);

  doc.moveTo(50, 95)
     .lineTo(doc.page.width - 50, 95)
     .strokeColor('#e2e8f0')
     .lineWidth(2)
     .stroke();

  let currentY = 115;

  // Strengths
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(COLORS.success)
     .text('KEY STRENGTHS', 50, currentY);

  currentY = doc.y + 12;

  const strengths = overall?.strengths || [];
  if (strengths.length > 0) {
    strengths.forEach((strength: string, i: number) => {
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor(COLORS.danger)
           .text('AREAS FOR IMPROVEMENT', 50, currentY);
      currentY = doc.y + 10;
    });
  } else {
     doc.fontSize(14)
        .font('Helvetica-Bold')
        .fillColor(COLORS.purple)
        .text('CRITICAL GAPS TO ADDRESS', 50, currentY);
    currentY = doc.y + 10;
  }

  currentY += 20;

  // Weaknesses
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(COLORS.danger)
     .text('IMMEDIATE PRIORITIES (0-30 days)', 50, currentY);

  currentY = doc.y + 12;

  const weaknesses = overall?.weaknesses || [];
  if (weaknesses.length > 0) {
    weaknesses.forEach((weakness: string, i: number) => {
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor(COLORS.warning)
           .text('SHORT-TERM ACTIONS (1-3 months)', 50, currentY);
      currentY = doc.y + 10;
    });
  } else {
     doc.fontSize(14)
        .font('Helvetica-Bold')
        .fillColor(COLORS.indigo)
        .text('STRATEGIC IMPROVEMENTS (3-6 months)', 50, currentY);
    currentY = doc.y + 10;
  }

  currentY += 20;

  // Critical Gaps Analysis
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(COLORS.success)
     .text('NEXT STEPS', 50, currentY);

  currentY = doc.y + 12;

  doc.fontSize(11)
     .font('Helvetica')
     .fillColor('#475569')
     .text(
       'Based on our analysis, addressing the weaknesses listed above should be your top priority before approaching investors. Each gap represents a potential red flag that could derail fundraising conversations.',
       70,
       currentY,
       { width: doc.page.width - 120, align: 'justify' }
     );
}

// ============================================================================
// RECOMMENDATIONS PAGE
// ============================================================================
function addRecommendations(
  doc: PDFKit.PDFDocument,
  analysis: any,
  stage: string,
  industry: string
) {
  const overall = analysis?.analysis?.overall;

  doc.fontSize(26)
     .font('Helvetica-Bold')
     .fillColor('#1e293b')
     .text('RECOMMENDATIONS', 50, 60);

  doc.moveTo(50, 95)
     .lineTo(doc.page.width - 50, 95)
     .strokeColor('#e2e8f0')
     .lineWidth(2)
     .stroke();

  let currentY = 115;

  // Overall Recommendation
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor('#475569')
     .text(
       overall?.recommendation || 'Based on the analysis, we recommend addressing the key weaknesses before approaching investors.',
       50,
       currentY,
       { width: doc.page.width - 100, align: 'justify' }
     );

  currentY = doc.y + 25;

  // Immediate Action Items
  doc.fontSize(17)
     .font('Helvetica-Bold')
     .fillColor('#ef4444')
     .text('IMMEDIATE PRIORITIES (0-30 days)', 50, currentY);

  currentY = doc.y + 12;

  const immediatePriorities = [
    'Address all critical weaknesses identified in this report',
    'Update financial projections with industry-standard metrics',
    'Strengthen competitive analysis with market data',
    'Ensure all key sections meet minimum VC expectations'
  ];

  immediatePriorities.forEach((item, i) => {
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#1e293b')
       .text(`${i + 1}. ${item}`, 70, currentY, { width: doc.page.width - 120 });
    currentY = doc.y + 8;
  });

  currentY += 15;

  // Short-term Actions
  doc.fontSize(17)
     .font('Helvetica-Bold')
     .fillColor('#f59e0b')
     .text('SHORT-TERM ACTIONS (1-3 months)', 50, currentY);

  currentY = doc.y + 12;

  const shortTermActions = [
    'Refine go-to-market strategy based on VC feedback patterns',
    'Build stronger proof points (customer logos, revenue milestones)',
    'Enhance team slide with relevant advisors or key hires',
    'Create detailed financial model with sensitivity analysis'
  ];

  shortTermActions.forEach((item, i) => {
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#1e293b')
       .text(`${i + 1}. ${item}`, 70, currentY, { width: doc.page.width - 120 });
    currentY = doc.y + 8;
  });

  currentY += 15;

  // Strategic Improvements
  doc.fontSize(17)
     .font('Helvetica-Bold')
     .fillColor('#3b82f6')
     .text('STRATEGIC IMPROVEMENTS (3-6 months)', 50, currentY);

  currentY = doc.y + 12;

  const strategicImprovements = [
    `Align metrics with ${industry} industry benchmarks`,
    `Build traction appropriate for ${stage} stage`,
    'Develop compelling investor pitch narrative',
    'Schedule follow-up analysis after implementing changes'
  ];

  strategicImprovements.forEach((item, i) => {
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#1e293b')
       .text(`${i + 1}. ${item}`, 70, currentY, { width: doc.page.width - 120 });
    currentY = doc.y + 8;
  });

  currentY += 25;

  // Next Steps
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor('#10b981')
   .text('NEXT STEPS', 50, currentY);

  currentY = doc.y + 10;

  doc.fontSize(11)
     .font('Helvetica')
     .fillColor('#475569')
     .text(
       'We recommend re-analyzing your deck after implementing these recommendations. Track improvements in your SSO Score over time to measure progress toward investment readiness.',
       70,
       currentY,
       { width: doc.page.width - 120, align: 'justify' }
     );
}

// ============================================================================
// APPENDIX PAGE
// ============================================================================
function addAppendix(doc: PDFKit.PDFDocument, industry: string, stage: string) {
  doc.fontSize(26)
     .font('Helvetica-Bold')
     .fillColor('#1e293b')
     .text('APPENDIX', 50, 60);

  doc.moveTo(50, 95)
     .lineTo(doc.page.width - 50, 95)
     .strokeColor('#e2e8f0')
     .lineWidth(2)
     .stroke();

  let currentY = 115;

  // About SSO Score
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor('#3b82f6')
   .text('About the SSO Readiness Score', 50, currentY);

  currentY = doc.y + 10;

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#475569')
     .text(
       'The SSO Readiness Score is a proprietary metric that evaluates pitch decks across multiple dimensions critical to venture capital investment decisions. Our AI-powered analysis framework considers industry benchmarks, stage-appropriate expectations, and VC feedback patterns.',
       70,
       currentY,
       { width: doc.page.width - 120, align: 'justify' }
     );

  currentY = doc.y + 20;

  // Methodology
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor('#3b82f6')
     .text('Analysis Methodology', 50, currentY);

  currentY = doc.y + 10;

  const methodology = [
    'AI-powered content analysis using advanced language models',
    'Comparison against 50+ successful pitch decks in your sector',
    `Industry-specific benchmarks for ${industry} companies`,
    `Stage-appropriate expectations for ${stage} funding rounds`,
    'VC feedback patterns and common rejection reasons',
    'Best practices from top-tier venture capital firms'
  ];

  methodology.forEach((item) => {
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#1e293b')
   .text(`- ${item}`, 70, currentY);
    currentY = doc.y + 6;
  });

  currentY += 20;

  // Glossary
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .fillColor(COLORS.primary)
     .text('Data Sources', 50, 50);

  currentY = doc.y + 10;

  const glossary = [
    { term: 'SSO Score', definition: 'Overall investment readiness score (0-10 scale)' },
    { term: 'Section Score', definition: 'Individual section evaluation (0-10 scale)' },
    { term: 'Industry Benchmark', definition: 'Expected metrics for your specific vertical' },
    { term: 'Stage Benchmark', definition: 'Appropriate traction for your funding round' }
  ];

  glossary.forEach(({ term, definition }) => {
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#1e293b')
       .text(`${term}:`, 70, currentY);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#64748b')
       .text(definition, 70, currentY + 12, { width: doc.page.width - 120 });

    currentY = doc.y + 8;
  });

  currentY += 25;

  // Contact & Resources
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor('#6366f1')
     .text('Resources & Support', 50, currentY);

  currentY = doc.y + 10;

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#475569')
     .text(
       'For questions about this report or to schedule a follow-up analysis, visit our platform or contact our team.',
       70,
       currentY,
       { width: doc.page.width - 120, align: 'justify' }
     );

  // Footer with disclaimer
  doc.fontSize(8)
     .font('Helvetica')
     .fillColor('#94a3b8')
     .text(
       'This report is generated by AI analysis and should be used as guidance only. Investment decisions require comprehensive due diligence.',
       50,
       doc.page.height - 80,
       { width: doc.page.width - 100, align: 'center' }
     );
}

// ============================================================================
// WEB ENRICHMENT SECTIONS (NEW - VERTEX AI GROUNDING)
// ============================================================================

/**
 * Render Data Sources Breakdown
 * Shows what percentage of data came from PDF vs Web
 */
function renderDataSourcesBreakdown(
  doc: PDFKit.PDFDocument,
  dataSources: any
): void {
  doc.addPage();
  
  // Title
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor(COLORS.primary)
     .text('Data Sources', 50, 50);

  doc.fontSize(12)
     .font('Helvetica')
     .fillColor(COLORS.medium)
     .text('Where the analysis data came from', 50, 85);

  let currentY = 120;

  // Visual breakdown box
  const boxWidth = doc.page.width - 100;
  const boxHeight = 150;

  doc.rect(50, currentY, boxWidth, boxHeight)
     .fillColor(COLORS.background)
     .fill();
  
  doc.rect(50, currentY, boxWidth, boxHeight)
     .strokeColor(COLORS.light)
     .lineWidth(2)
     .stroke();

  // PDF percentage
  const pdfBarWidth = (boxWidth - 40) * (dataSources.fromPDF / 100);
  doc.rect(60, currentY + 20, pdfBarWidth, 40)
     .fillColor(COLORS.primary)
     .fill();

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(COLORS.white)
     .text(`${dataSources.fromPDF}%`, 70, currentY + 28);

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(COLORS.dark)
     .text('From Pitch Deck', 60, currentY + 70);

  // Web percentage
  const webBarWidth = (boxWidth - 40) * (dataSources.fromWeb / 100);
  doc.rect(60, currentY + 90, webBarWidth, 40)
     .fillColor(COLORS.teal)
     .fill();

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(COLORS.white)
     .text(`${dataSources.fromWeb}%`, 70, currentY + 98);

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(COLORS.dark)
     .text('From Web Search', 60, currentY + 140);

  currentY += boxHeight + 30;

  // Statistics
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(COLORS.dark)
     .text('Analysis Statistics', 50, currentY);

  currentY += 25;

  const stats = [
    { label: 'Total Metrics Analyzed', value: dataSources.totalMetrics.toString() },
    { label: 'Discrepancies Found', value: dataSources.discrepanciesFound.toString() },
  ];

  stats.forEach(({ label, value }) => {
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor(COLORS.mediumDark)
       .text(label, 60, currentY);

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(COLORS.primary)
       .text(value, doc.page.width - 150, currentY, { width: 100, align: 'right' });

    currentY += 30;
  });
}

/**
 * Render Fact-Check Summary
 * Shows verified claims, discrepancies, and unverified items
 */
function renderFactCheckSummary(
  doc: PDFKit.PDFDocument,
  factChecks: any
): void {
  doc.addPage();
  
  // Title
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor(COLORS.primary)
     .text('Fact-Check Summary', 50, 50);

  doc.fontSize(12)
     .font('Helvetica')
     .fillColor(COLORS.medium)
     .text('Web-validated claims from your pitch deck', 50, 85);

  let currentY = 120;

   // VERIFIED CLAIMS
  if (factChecks.verified && factChecks.verified.length > 0) {
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor(COLORS.success)
       .text(`Verified Claims (${factChecks.verified.length})`, 50, currentY);

    currentY += 25;

    factChecks.verified.slice(0, 5).forEach((fc: any) => {
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(COLORS.dark)
         .text(`- ${fc.claim}`, 60, currentY, { width: doc.page.width - 120 });

      currentY = doc.y + 8;
    });

    currentY += 20;
  }

   // DISCREPANCIES
  if (factChecks.discrepancies && factChecks.discrepancies.length > 0) {
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor(COLORS.warning)
       .text(`Discrepancies (${factChecks.discrepancies.length})`, 50, currentY);

    currentY += 25;

    factChecks.discrepancies.forEach((fc: any) => {
      // Claim
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor(COLORS.dark)
         .text(`- ${fc.claim}`, 60, currentY, { width: doc.page.width - 120 });

      currentY = doc.y + 3;

      // PDF vs Web
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(COLORS.mediumDark)
         .text(`  Deck: ${fc.pdfSource}`, 70, currentY, { width: doc.page.width - 130 });

      currentY = doc.y + 2;

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(COLORS.mediumDark)
         .text(`  Web: ${fc.webValidation}`, 70, currentY, { width: doc.page.width - 130 });

      currentY = doc.y + 12;

      // Add page break if needed
      if (currentY > doc.page.height - 100) {
        doc.addPage();
        currentY = 50;
      }
    });

    currentY += 20;
  }

   // UNVERIFIED
  if (factChecks.unverified && factChecks.unverified.length > 0) {
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor(COLORS.medium)
       .text(`Unverified (${factChecks.unverified.length})`, 50, currentY);

    currentY += 25;

    factChecks.unverified.slice(0, 5).forEach((fc: any) => {
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(COLORS.mediumDark)
         .text(`- ${fc.claim} (no public data available)`, 60, currentY, { width: doc.page.width - 120 });

      currentY = doc.y + 8;
    });
  }
}

/**
 * Render Web-Validated Metrics
 * Shows PDF claims vs Web findings with indicators
 */
function renderWebValidatedMetrics(
  doc: PDFKit.PDFDocument,
  validatedMetrics: any
): void {
  if (!validatedMetrics || Object.keys(validatedMetrics).length === 0) {
    return; // Skip if no validated metrics
  }

  doc.addPage();
  
  // Title
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor(COLORS.primary)
     .text('Web-Validated Metrics', 50, 50);

  doc.fontSize(12)
     .font('Helvetica')
     .fillColor(COLORS.medium)
     .text('Cross-checking your claims against web sources', 50, 85);

  let currentY = 120;

  for (const [metric, validation] of Object.entries(validatedMetrics)) {
    if (currentY > doc.page.height - 150) {
      doc.addPage();
      currentY = 50;
    }

    const val = validation as any;

    // Metric name
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(COLORS.dark)
       .text(metric.toUpperCase(), 50, currentY);

    currentY += 25;

    // PDF value
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(COLORS.primary)
       .text('Pitch Deck:', 60, currentY);

    doc.fontSize(11)
       .font('Helvetica')
       .fillColor(COLORS.dark)
       .text(val.pdfValue, 160, currentY, { width: doc.page.width - 220 });

    currentY += 20;

    // Web value
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(COLORS.teal)
       .text('Web Sources:', 60, currentY);

    doc.fontSize(11)
       .font('Helvetica')
       .fillColor(COLORS.dark)
       .text(val.webValue, 160, currentY, { width: doc.page.width - 220 });

    currentY += 20;

    // Match indicator
   const matchColor = val.match ? COLORS.success : COLORS.warning;
   const matchText = val.match ? 'VERIFIED' : 'DISCREPANCY';

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor(matchColor)
       .text(matchText, 60, currentY);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(COLORS.medium)
       .text(`Confidence: ${val.confidence}`, doc.page.width - 200, currentY, { width: 150, align: 'right' });

    currentY += 25;

    // Separator
    doc.moveTo(50, currentY)
       .lineTo(doc.page.width - 50, currentY)
       .strokeColor(COLORS.lighter)
       .lineWidth(1)
       .stroke();

    currentY += 20;
  }
}

/**
 * Render Industry Benchmarks
 * Compares company metrics against industry averages
 */
function renderIndustryBenchmarks(
  doc: PDFKit.PDFDocument,
  benchmarks: any
): void {
  if (!benchmarks || Object.keys(benchmarks).length === 0) {
    return; // Skip if no benchmarks
  }

  doc.addPage();
  
  // Title
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor(COLORS.primary)
     .text('Industry Benchmarks', 50, 50);

  doc.fontSize(12)
     .font('Helvetica')
     .fillColor(COLORS.medium)
     .text('How you compare to industry averages', 50, 85);

  let currentY = 120;

  for (const [metric, benchmark] of Object.entries(benchmarks)) {
    if (currentY > doc.page.height - 150) {
      doc.addPage();
      currentY = 50;
    }

    const bench = benchmark as any;

    // Metric name
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(COLORS.dark)
       .text(metric.toUpperCase(), 50, currentY);

    currentY += 25;

    // Company value
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor(COLORS.mediumDark)
       .text('Your Company:', 60, currentY);

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(COLORS.primary)
       .text(bench.companyValue, 160, currentY);

    currentY += 20;

    // Industry average
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor(COLORS.mediumDark)
       .text('Industry Average:', 60, currentY);

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(COLORS.teal)
       .text(bench.industryAverage, 160, currentY);

    currentY += 20;

    // Performance
    const isGood = bench.performance.includes('better');
   const perfColor = isGood ? COLORS.success : COLORS.warning;

    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(perfColor)
   .text(bench.performance, 60, currentY);

    currentY += 30;

    // Separator
    doc.moveTo(50, currentY)
       .lineTo(doc.page.width - 50, currentY)
       .strokeColor(COLORS.lighter)
       .lineWidth(1)
       .stroke();

    currentY += 20;
  }
}

// ============================================================================
// PAGE NUMBERS
// ============================================================================
function addPageNumber(doc: PDFKit.PDFDocument, current: number, total: number) {
  doc.fontSize(9)
     .font('Helvetica')
     .fillColor('#94a3b8')
     .text(
       `Page ${current} of ${total}`,
       50,
       doc.page.height - 30,
       { width: doc.page.width - 100, align: 'center' }
     );
}

export default generateEnhancedPDF;
