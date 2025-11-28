import { Router, Request, Response } from 'express';
import { query } from '../db';
import { analyzeDualPDFs, analyzePitchDeckFromPDF, analyzePitchDeckWithGrounding, extractTextFromPDF } from '../services/ai-enhanced';
import { compareAnalyzedDecks } from '../services/vertex-ai';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router = Router();

// Configure multer for file uploads (pitch deck + optional checklist + optional additional docs)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    let prefix = 'deck';
    if (file.fieldname === 'checklist') {
      prefix = 'checklist';
    } else if (file.fieldname === 'additional_docs') {
      prefix = 'additional';
    }
    cb(null, prefix + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit per file
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.doc', '.ppt', '.pptx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word (.docx, .doc), and PowerPoint (.ppt, .pptx) files are allowed'));
    }
  }
});

// GET /api/decks - Get all decks
router.get('/', async (req: Request, res: Response) => {
  try {
    const { company_id, status } = req.query;
    
    let queryText = `
      SELECT d.*, c.name as company_name, c.stage, c.industry 
      FROM pitch_decks d
      LEFT JOIN companies c ON d.company_id = c.id
      WHERE 1=1
    `;
    const queryParams: any[] = [];
    let paramCount = 0;

    if (company_id) {
      paramCount++;
      queryText += ` AND d.company_id = $${paramCount}`;
      queryParams.push(company_id);
    }

    if (status) {
      paramCount++;
      queryText += ` AND d.analysis_status = $${paramCount}`;
      queryParams.push(status);
    }

    queryText += ' ORDER BY d.created_at DESC';

    const result = await query(queryText, queryParams);
    res.json({ decks: result.rows });
  } catch (error) {
    console.error('Error fetching decks:', error);
    res.status(500).json({ error: 'Failed to fetch decks' });
  }
});

// POST /api/decks/compare - Compare two pitch decks side-by-side
router.post('/compare', upload.fields([
  { name: 'deck1', maxCount: 1 },
  { name: 'deck2', maxCount: 1 }
]), async (req: Request, res: Response) => {
  try {
    console.log('📊 Received deck comparison request');
    console.log('Request body:', req.body);
    console.log('Files received:', req.files ? Object.keys(req.files) : 'none');
    
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files || !files.deck1 || !files.deck2) {
      console.error('❌ Missing files:', {
        hasFiles: !!files,
        hasDeck1: !!files?.deck1,
        hasDeck2: !!files?.deck2
      });
      return res.status(400).json({ 
        error: 'Both pitch decks are required for comparison',
        received: {
          deck1: !!files?.deck1,
          deck2: !!files?.deck2
        }
      });
    }

    const deck1File = files.deck1[0];
    const deck2File = files.deck2[0];
    const { uploaded_by } = req.body;
    
    const deck1Path = `/uploads/${deck1File.filename}`;
    const deck2Path = `/uploads/${deck2File.filename}`;

    // Validate uploaded_by is a valid UUID or set to null
    let validUserId = null;
    if (uploaded_by) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(uploaded_by)) {
        validUserId = uploaded_by;
      } else {
        console.warn(`⚠️ Invalid UUID format for uploaded_by: "${uploaded_by}", setting to null`);
      }
    }

    // Insert comparison record
    const result = await query(`
      INSERT INTO deck_comparisons 
      (uploaded_by, deck1_filename, deck1_file_path, deck2_filename, deck2_file_path, analysis_status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      validUserId,
      deck1File.originalname,
      deck1Path,
      deck2File.originalname,
      deck2Path,
      'pending'
    ]);

    const comparisonId = result.rows[0].id;

    // Trigger comparison analysis in background
    setTimeout(async () => {
      try {
        console.log(`🚀 Starting comparison analysis for ${comparisonId}...`);
        console.log(`  - Deck 1: ${deck1File.originalname}`);
        console.log(`  - Deck 2: ${deck2File.originalname}`);
        
        await query(`UPDATE deck_comparisons SET analysis_status = 'processing' WHERE id = $1`, [comparisonId]);

        // Full file paths
        const fullDeck1Path = path.join(__dirname, '../../', deck1Path);
        const fullDeck2Path = path.join(__dirname, '../../', deck2Path);

        console.log('📊 Comparing pitch decks with AI...');
        
        // Import comparison function
        const { comparePitchDecks } = await import('../services/ai-enhanced');
        const comparisonResult = await comparePitchDecks(fullDeck1Path, fullDeck2Path);

        console.log('💾 Storing comparison results...');

        await query(`
          UPDATE deck_comparisons 
          SET analysis_status = 'completed', 
              comparison_analysis = $1,
              analyzed_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [JSON.stringify(comparisonResult), comparisonId]);

        console.log(`✅ Comparison analysis complete for ${comparisonId}!`);
      } catch (error) {
        console.error(`❌ Comparison analysis failed for ${comparisonId}:`, error);
        await query(`UPDATE deck_comparisons SET analysis_status = 'failed' WHERE id = $1`, [comparisonId]);
      }
    }, 1000);

    res.status(201).json({
      id: comparisonId,
      message: 'Pitch decks uploaded successfully! Comparison analysis started.',
      files: {
        deck1: deck1File.originalname,
        deck2: deck2File.originalname
      }
    });
  } catch (error) {
    console.error('Error comparing decks:', error);
    res.status(500).json({ error: 'Failed to compare decks', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /api/decks/compare-analyzed - Compare two already-analyzed decks from database
router.post('/compare-analyzed', async (req: Request, res: Response) => {
  try {
    console.log('🆚 Received analyzed decks comparison request');
    const { deck1_id, deck2_id, user_id } = req.body;

    if (!deck1_id || !deck2_id) {
      return res.status(400).json({ error: 'Both deck IDs are required' });
    }

    console.log(`   Deck 1 ID: ${deck1_id}`);
    console.log(`   Deck 2 ID: ${deck2_id}`);

    // Fetch both deck analyses from database
    const deck1Result = await query(`
      SELECT d.*, c.name as company_name, c.stage, c.industry 
      FROM pitch_decks d
      LEFT JOIN companies c ON d.company_id = c.id
      WHERE d.id = $1 AND d.analysis_status = 'completed'
    `, [deck1_id]);

    const deck2Result = await query(`
      SELECT d.*, c.name as company_name, c.stage, c.industry 
      FROM pitch_decks d
      LEFT JOIN companies c ON d.company_id = c.id
      WHERE d.id = $1 AND d.analysis_status = 'completed'
    `, [deck2_id]);

    if (deck1Result.rows.length === 0) {
      return res.status(404).json({ error: 'Deck 1 not found or not analyzed' });
    }
    if (deck2Result.rows.length === 0) {
      return res.status(404).json({ error: 'Deck 2 not found or not analyzed' });
    }

    const deck1 = deck1Result.rows[0];
    const deck2 = deck2Result.rows[0];

    // Fetch section analyses
    const deck1SectionsResult = await query(`
      SELECT * FROM deck_analysis WHERE deck_id = $1 ORDER BY section_name
    `, [deck1_id]);

    const deck2SectionsResult = await query(`
      SELECT * FROM deck_analysis WHERE deck_id = $1 ORDER BY section_name
    `, [deck2_id]);

    console.log(`✓ Fetched deck 1: ${deck1.company_name || deck1.filename}`);
    console.log(`✓ Fetched deck 2: ${deck2.company_name || deck2.filename}`);

    // Format data for Vertex AI comparison
    const { compareAnalyzedDecks } = await import('../services/vertex-ai');
    
    const deck1Data = {
      deckId: deck1.id,
      companyName: deck1.company_name || deck1.filename,
      industry: deck1.industry || 'Unknown',
      stage: deck1.stage || 'Unknown',
      filename: deck1.filename,
      analyzedAt: deck1.analyzed_at,
      overallAnalysis: {
        ssoScore: deck1.sso_score || 0,
        problemScore: deck1.dual_pdf_analysis?.problemScore || 0,
        solutionScore: deck1.dual_pdf_analysis?.solutionScore || 0,
        marketScore: deck1.dual_pdf_analysis?.marketScore || 0,
        tractionScore: deck1.dual_pdf_analysis?.tractionScore || 0,
        teamScore: deck1.dual_pdf_analysis?.teamScore || 0,
        financialsScore: deck1.dual_pdf_analysis?.financialsScore || 0,
        overallScore: deck1.dual_pdf_analysis?.overallScore || 0,
        strengths: deck1.dual_pdf_analysis?.strengths || [],
        weaknesses: deck1.dual_pdf_analysis?.weaknesses || [],
        keyInsights: deck1.dual_pdf_analysis?.keyInsights || [],
        recommendation: deck1.dual_pdf_analysis?.recommendation || ''
      },
      sections: deck1SectionsResult.rows.map(row => ({
        sectionName: row.section_name,
        sectionScore: row.section_score * 100,
        feedback: row.feedback,
        strengths: row.strengths || [],
        improvements: row.improvements || []
      }))
    };

    const deck2Data = {
      deckId: deck2.id,
      companyName: deck2.company_name || deck2.filename,
      industry: deck2.industry || 'Unknown',
      stage: deck2.stage || 'Unknown',
      filename: deck2.filename,
      analyzedAt: deck2.analyzed_at,
      overallAnalysis: {
        ssoScore: deck2.sso_score || 0,
        problemScore: deck2.dual_pdf_analysis?.problemScore || 0,
        solutionScore: deck2.dual_pdf_analysis?.solutionScore || 0,
        marketScore: deck2.dual_pdf_analysis?.marketScore || 0,
        tractionScore: deck2.dual_pdf_analysis?.tractionScore || 0,
        teamScore: deck2.dual_pdf_analysis?.teamScore || 0,
        financialsScore: deck2.dual_pdf_analysis?.financialsScore || 0,
        overallScore: deck2.dual_pdf_analysis?.overallScore || 0,
        strengths: deck2.dual_pdf_analysis?.strengths || [],
        weaknesses: deck2.dual_pdf_analysis?.weaknesses || [],
        keyInsights: deck2.dual_pdf_analysis?.keyInsights || [],
        recommendation: deck2.dual_pdf_analysis?.recommendation || ''
      },
      sections: deck2SectionsResult.rows.map(row => ({
        sectionName: row.section_name,
        sectionScore: row.section_score * 100,
        feedback: row.feedback,
        strengths: row.strengths || [],
        improvements: row.improvements || []
      }))
    };

    // Create comparison record in database
    // Validate user_id is a valid UUID or set to null
    const isValidUUID = (str: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return str && uuidRegex.test(str);
    };
    
    const validUserId = user_id && isValidUUID(user_id) ? user_id : null;
    
    const comparisonResult = await query(`
      INSERT INTO deck_comparisons (
        deck1_id, deck2_id, user_id, comparison_type, analysis_status,
        deck1_filename, deck2_filename
      )
      VALUES ($1, $2, $3, 'analyzed', 'processing', $4, $5)
      RETURNING id
    `, [
      deck1_id, 
      deck2_id, 
      validUserId,
      deck1.filename || deck1.company_name || 'Deck 1',
      deck2.filename || deck2.company_name || 'Deck 2'
    ]);

    const comparisonId = comparisonResult.rows[0].id;

    console.log(`📊 Created comparison record: ${comparisonId}`);

    // Run comparison in background
    setTimeout(async () => {
      try {
        console.log(`🤖 Starting AI comparison for ${comparisonId}...`);
        
        const comparisonAnalysis = await compareAnalyzedDecks(deck1Data, deck2Data, true);

        console.log('💾 Storing comparison results...');

        // Transform to match expected frontend format
        const formattedResult = {
          deck1Analysis: {
            overallScore: deck1Data.overallAnalysis.overallScore,
            sections: deck1Data.sections,
            strengths: deck1Data.overallAnalysis.strengths,
            weaknesses: deck1Data.overallAnalysis.weaknesses,
            recommendation: deck1Data.overallAnalysis.recommendation,
            analysis: {
              overallScore: deck1Data.overallAnalysis.overallScore,
              problemScore: deck1Data.overallAnalysis.problemScore,
              solutionScore: deck1Data.overallAnalysis.solutionScore,
              marketScore: deck1Data.overallAnalysis.marketScore,
              tractionScore: deck1Data.overallAnalysis.tractionScore,
              teamScore: deck1Data.overallAnalysis.teamScore,
              financialsScore: deck1Data.overallAnalysis.financialsScore
            }
          },
          deck2Analysis: {
            overallScore: deck2Data.overallAnalysis.overallScore,
            sections: deck2Data.sections,
            strengths: deck2Data.overallAnalysis.strengths,
            weaknesses: deck2Data.overallAnalysis.weaknesses,
            recommendation: deck2Data.overallAnalysis.recommendation,
            analysis: {
              overallScore: deck2Data.overallAnalysis.overallScore,
              problemScore: deck2Data.overallAnalysis.problemScore,
              solutionScore: deck2Data.overallAnalysis.solutionScore,
              marketScore: deck2Data.overallAnalysis.marketScore,
              tractionScore: deck2Data.overallAnalysis.tractionScore,
              teamScore: deck2Data.overallAnalysis.teamScore,
              financialsScore: deck2Data.overallAnalysis.financialsScore
            }
          },
          comparison: {
            summary: comparisonAnalysis.executiveSummary,
            winnerOverall: comparisonAnalysis.overallWinner,
            categoryWinners: {
              team: comparisonAnalysis.categoryComparison.team.winner,
              market: comparisonAnalysis.categoryComparison.market.winner,
              product: comparisonAnalysis.categoryComparison.solution.winner,
              traction: comparisonAnalysis.categoryComparison.traction.winner,
              financials: comparisonAnalysis.categoryComparison.financials.winner
            },
            strengths: {
              deck1: comparisonAnalysis.strengthsComparison.deck1Advantages,
              deck2: comparisonAnalysis.strengthsComparison.deck2Advantages
            },
            weaknesses: {
              deck1: comparisonAnalysis.weaknessesComparison.deck1Concerns,
              deck2: comparisonAnalysis.weaknessesComparison.deck2Concerns
            },
            recommendations: {
              deck1: comparisonAnalysis.recommendations.deck1,
              deck2: comparisonAnalysis.recommendations.deck2
            },
            keyDifferences: comparisonAnalysis.keyDifferentiators
          }
        };

        await query(`
          UPDATE deck_comparisons 
          SET analysis_status = 'completed', 
              comparison_analysis = $1,
              analyzed_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [JSON.stringify(formattedResult), comparisonId]);

        console.log(`✅ Analyzed decks comparison complete for ${comparisonId}!`);
      } catch (error) {
        console.error(`❌ Analyzed decks comparison failed for ${comparisonId}:`, error);
        await query(`UPDATE deck_comparisons SET analysis_status = 'failed' WHERE id = $1`, [comparisonId]);
      }
    }, 1000);

    res.status(201).json({
      id: comparisonId,
      message: 'Comparison started for analyzed decks!',
      decks: {
        deck1: deck1.company_name || deck1.filename,
        deck2: deck2.company_name || deck2.filename
      }
    });
  } catch (error) {
    console.error('Error comparing analyzed decks:', error);
    res.status(500).json({ error: 'Failed to compare analyzed decks', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /api/decks/compare-mixed - Compare one analyzed deck with one uploaded file
router.post('/compare-mixed', upload.single('uploadedDeck'), async (req: Request, res: Response) => {
  try {
    const { analyzedDeckId, uploadedDeckPosition, user_id } = req.body;
    const uploadedFile = req.file;

    console.log('\n📊 [Mixed Comparison] Starting comparison...');
    console.log('   Analyzed Deck ID:', analyzedDeckId);
    console.log('   Uploaded Deck Position:', uploadedDeckPosition); // 'deck1' or 'deck2'
    console.log('   Uploaded File:', uploadedFile?.originalname);

    if (!analyzedDeckId || !uploadedFile || !uploadedDeckPosition) {
      return res.status(400).json({ 
        error: 'Missing required parameters: analyzedDeckId, uploadedDeck file, and uploadedDeckPosition' 
      });
    }

    if (!['deck1', 'deck2'].includes(uploadedDeckPosition)) {
      return res.status(400).json({ 
        error: 'uploadedDeckPosition must be either "deck1" or "deck2"' 
      });
    }

    // Validate analyzedDeckId is a valid UUID
    const isValidUUID = (uuid: string): boolean => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(uuid);
    };

    if (!isValidUUID(analyzedDeckId)) {
      return res.status(400).json({ error: 'Invalid deck ID format' });
    }

    // Validate user_id if provided
    const validUserId = user_id && isValidUUID(user_id) ? user_id : null;

    // Fetch the analyzed deck from database
    const analyzedDeckResult = await query(`
      SELECT d.*, c.name as company_name, c.stage, c.industry
      FROM pitch_decks d
      LEFT JOIN companies c ON d.company_id = c.id
      WHERE d.id = $1 AND d.analysis_status = 'completed'
    `, [analyzedDeckId]);

    if (analyzedDeckResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Analyzed deck not found or analysis not completed' 
      });
    }

    const analyzedDeck = analyzedDeckResult.rows[0];
    console.log('   ✓ Found analyzed deck:', analyzedDeck.filename);

    // Create comparison record
    const comparisonId = crypto.randomUUID();
    
    // Determine which deck is which based on position
    const deck1Id = uploadedDeckPosition === 'deck1' ? null : analyzedDeckId;
    const deck2Id = uploadedDeckPosition === 'deck2' ? null : analyzedDeckId;
    const deck1Filename = uploadedDeckPosition === 'deck1' ? uploadedFile.originalname : analyzedDeck.filename;
    const deck2Filename = uploadedDeckPosition === 'deck2' ? uploadedFile.originalname : analyzedDeck.filename;

    await query(`
      INSERT INTO deck_comparisons 
      (id, deck1_id, deck2_id, user_id, comparison_type, deck1_filename, deck2_filename, analysis_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      comparisonId,
      deck1Id,
      deck2Id,
      validUserId,
      'mixed',
      deck1Filename,
      deck2Filename,
      'processing'
    ]);

    console.log('   ✓ Comparison record created:', comparisonId);

    // Process the comparison in the background
    setImmediate(async () => {
      try {
        console.log('\n🔄 [Mixed Comparison] Background processing started...');

        // Step 1: Analyze the uploaded file first
        console.log('   🧠 Analyzing uploaded file with AI...');
        const uploadedFilePath = path.join(__dirname, '../../uploads', uploadedFile.filename);
        
        let uploadedAnalysis;
        try {
          uploadedAnalysis = await analyzePitchDeckFromPDF(uploadedFilePath, 'Uploaded Deck');
          console.log(`   ✓ Analysis complete for uploaded file`);
        } catch (textError) {
          console.warn('   ⚠️ Standard analysis failed, trying with visual analysis...');
          // If text extraction fails, try with visual analysis (for image-based PDFs)
          const { analyzeDualPDFs } = await import('../services/ai-enhanced');
          const dualAnalysis = await analyzeDualPDFs(uploadedFilePath, '', 'Uploaded Deck');
          uploadedAnalysis = {
            analysis: dualAnalysis.analysis,
            sections: dualAnalysis.sections
          };
          console.log(`   ✓ Visual analysis complete for uploaded file`);
        }

        // Get analyzed deck data
        const analyzedDeckData = {
          deckId: analyzedDeck.id,
          filename: analyzedDeck.filename,
          companyName: analyzedDeck.company_name || '',
          stage: analyzedDeck.stage || '',
          industry: analyzedDeck.industry || '',
          analyzedAt: analyzedDeck.analyzed_at || new Date().toISOString(),
          extractedText: analyzedDeck.dual_pdf_analysis?.extracted_text || '',
          sections: analyzedDeck.dual_pdf_analysis?.sections || [],
          overallAnalysis: analyzedDeck.dual_pdf_analysis?.overall || {
            ssoScore: 0,
            problemScore: 0,
            solutionScore: 0,
            marketScore: 0,
            tractionScore: 0,
            teamScore: 0,
            financialsScore: 0,
            overallScore: 0,
            strengths: [],
            weaknesses: [],
            keyInsights: [],
            recommendation: ''
          }
        };

        // Create analyzed deck structure for uploaded file
        const uploadedDeckData = {
          deckId: 'uploaded-' + comparisonId,
          filename: uploadedFile.originalname,
          companyName: 'Uploaded Deck',
          stage: '',
          industry: '',
          analyzedAt: new Date().toISOString(),
          sections: uploadedAnalysis.sections.map(section => ({
            sectionName: section.sectionName,
            sectionScore: section.sectionScore,
            feedback: section.feedback,
            strengths: section.strengths || [],
            improvements: section.improvements || []
          })),
          overallAnalysis: {
            ssoScore: uploadedAnalysis.analysis.overallScore / 100, // Convert to 0-1 scale
            problemScore: uploadedAnalysis.analysis.problemScore,
            solutionScore: uploadedAnalysis.analysis.solutionScore,
            marketScore: uploadedAnalysis.analysis.marketScore,
            tractionScore: uploadedAnalysis.analysis.tractionScore,
            teamScore: uploadedAnalysis.analysis.teamScore,
            financialsScore: uploadedAnalysis.analysis.financialsScore,
            overallScore: uploadedAnalysis.analysis.overallScore,
            strengths: uploadedAnalysis.analysis.strengths || [],
            weaknesses: uploadedAnalysis.analysis.weaknesses || [],
            keyInsights: uploadedAnalysis.analysis.keyInsights || [],
            recommendation: uploadedAnalysis.analysis.recommendation || ''
          }
        };

        // Prepare data for comparison based on position
        const deck1Data = uploadedDeckPosition === 'deck1' ? uploadedDeckData : analyzedDeckData;
        const deck2Data = uploadedDeckPosition === 'deck2' ? uploadedDeckData : analyzedDeckData;

        console.log('   🔄 Running final AI comparison between both decks...');
        const comparisonAnalysis = await compareAnalyzedDecks(deck1Data, deck2Data);
        console.log('   ✓ AI comparison complete');

        // Build result structure
        const comparisonResult = {
          deck1Analysis: uploadedDeckPosition === 'deck1' ? {
            summary: comparisonAnalysis.executiveSummary || 'Analysis based on uploaded document',
            strengths: comparisonAnalysis.strengthsComparison?.deck1Advantages || [],
            weaknesses: comparisonAnalysis.weaknessesComparison?.deck1Concerns || [],
            recommendation: comparisonAnalysis.recommendations?.deck1?.[0] || '',
            analysis: {
              overallScore: 0,
              problemScore: 0,
              solutionScore: 0,
              marketScore: 0,
              tractionScore: 0,
              teamScore: 0,
              financialsScore: 0
            }
          } : {
            summary: deck1Data.overallAnalysis.executiveSummary,
            strengths: deck1Data.overallAnalysis.strengths,
            weaknesses: deck1Data.overallAnalysis.weaknesses,
            recommendation: deck1Data.overallAnalysis.recommendation,
            analysis: {
              overallScore: deck1Data.overallAnalysis.overallScore,
              problemScore: deck1Data.overallAnalysis.problemScore,
              solutionScore: deck1Data.overallAnalysis.solutionScore,
              marketScore: deck1Data.overallAnalysis.marketScore,
              tractionScore: deck1Data.overallAnalysis.tractionScore,
              teamScore: deck1Data.overallAnalysis.teamScore,
              financialsScore: deck1Data.overallAnalysis.financialsScore
            }
          },
          deck2Analysis: uploadedDeckPosition === 'deck2' ? {
            summary: comparisonAnalysis.executiveSummary || 'Analysis based on uploaded document',
            strengths: comparisonAnalysis.strengthsComparison?.deck2Advantages || [],
            weaknesses: comparisonAnalysis.weaknessesComparison?.deck2Concerns || [],
            recommendation: comparisonAnalysis.recommendations?.deck2?.[0] || '',
            analysis: {
              overallScore: 0,
              problemScore: 0,
              solutionScore: 0,
              marketScore: 0,
              tractionScore: 0,
              teamScore: 0,
              financialsScore: 0
            }
          } : {
            summary: deck2Data.overallAnalysis.executiveSummary,
            strengths: deck2Data.overallAnalysis.strengths,
            weaknesses: deck2Data.overallAnalysis.weaknesses,
            recommendation: deck2Data.overallAnalysis.recommendation,
            analysis: {
              overallScore: deck2Data.overallAnalysis.overallScore,
              problemScore: deck2Data.overallAnalysis.problemScore,
              solutionScore: deck2Data.overallAnalysis.solutionScore,
              marketScore: deck2Data.overallAnalysis.marketScore,
              tractionScore: deck2Data.overallAnalysis.tractionScore,
              teamScore: deck2Data.overallAnalysis.teamScore,
              financialsScore: deck2Data.overallAnalysis.financialsScore
            }
          },
          comparison: {
            summary: comparisonAnalysis.executiveSummary,
            winnerOverall: comparisonAnalysis.overallWinner,
            categoryWinners: {
              team: comparisonAnalysis.categoryComparison.team.winner,
              market: comparisonAnalysis.categoryComparison.market.winner,
              product: comparisonAnalysis.categoryComparison.solution.winner,
              traction: comparisonAnalysis.categoryComparison.traction.winner,
              financials: comparisonAnalysis.categoryComparison.financials.winner
            },
            strengths: {
              deck1: comparisonAnalysis.strengthsComparison?.deck1Advantages || [],
              deck2: comparisonAnalysis.strengthsComparison?.deck2Advantages || []
            },
            weaknesses: {
              deck1: comparisonAnalysis.weaknessesComparison?.deck1Concerns || [],
              deck2: comparisonAnalysis.weaknessesComparison?.deck2Concerns || []
            },
            recommendations: {
              deck1: comparisonAnalysis.recommendations?.deck1 || [],
              deck2: comparisonAnalysis.recommendations?.deck2 || []
            },
            keyDifferences: comparisonAnalysis.keyDifferentiators || []
          }
        };

        // Store results
        await query(`
          UPDATE deck_comparisons 
          SET comparison_analysis = $1, analysis_status = $2, analyzed_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [JSON.stringify(comparisonResult), 'completed', comparisonId]);

        console.log('   ✅ Mixed comparison completed and stored');

        // Clean up uploaded file
        try {
          fs.unlinkSync(uploadedFilePath);
          console.log('   ✓ Cleaned up uploaded file');
        } catch (err) {
          console.error('   ⚠️ Failed to clean up file:', err);
        }
      } catch (error) {
        console.error('❌ [Mixed Comparison] Background processing failed:', error);
        await query(`
          UPDATE deck_comparisons 
          SET analysis_status = $1
          WHERE id = $2
        `, ['failed', comparisonId]);
      }
    });

    res.status(201).json({
      id: comparisonId,
      message: 'Mixed comparison started!',
      decks: {
        deck1: deck1Filename,
        deck2: deck2Filename
      }
    });
  } catch (error) {
    console.error('Error in mixed comparison:', error);
    res.status(500).json({ 
      error: 'Failed to start mixed comparison', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// POST /api/decks/upload-dual - Upload pitch deck with optional checklist and additional documents
router.post('/upload-dual', upload.fields([
  { name: 'deck', maxCount: 1 },
  { name: 'checklist', maxCount: 1 },
  { name: 'additional_docs', maxCount: 5 }
]), async (req: Request, res: Response) => {
  try {
    console.log('📥 Received file upload request');
    console.log('Request body:', req.body);
    console.log('Files received:', req.files ? Object.keys(req.files) : 'none');
    
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    // Only deck is required
    if (!files || !files.deck) {
      console.error('❌ Missing required deck file');
      return res.status(400).json({ 
        error: 'Pitch deck is required',
        received: {
          deck: !!files?.deck
        }
      });
    }

    const deckFile = files.deck[0];
    const checklistFile = files.checklist ? files.checklist[0] : null; // Optional
    const additionalDocs = files.additional_docs || []; // Optional array
    
    console.log('📁 Files summary:', {
      deck: deckFile.originalname,
      checklist: checklistFile?.originalname || 'none',
      additionalDocs: additionalDocs.length
    });
    let { company_id, uploaded_by, additional_context, industry, stage } = req.body;
    
    // Validate company_id is a valid UUID, otherwise set to null
    const isValidUUID = (uuid: string): boolean => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(uuid);
    };
    
    if (company_id && !isValidUUID(company_id)) {
      console.log(`⚠️ Invalid company_id format: "${company_id}", setting to null`);
      company_id = null;
    }
    
    console.log('📝 Upload metadata:', {
      company_id,
      industry,
      stage,
      hasContext: !!additional_context
    });
    
    // Update company industry and stage if provided from frontend
    if (company_id && (industry || stage)) {
      try {
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let paramIndex = 1;
        
        if (industry) {
          updateFields.push(`industry = $${paramIndex++}`);
          updateValues.push(industry);
        }
        if (stage) {
          updateFields.push(`stage = $${paramIndex++}`);
          updateValues.push(stage);
        }
        
        updateValues.push(company_id); // Add company_id as last parameter
        
        const updateQuery = `
          UPDATE companies 
          SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $${paramIndex}
        `;
        
        await query(updateQuery, updateValues);
        console.log(`✅ Updated company ${company_id} with industry: ${industry}, stage: ${stage}`);
      } catch (err) {
        console.error('⚠️ Failed to update company industry/stage:', err);
        // Continue with upload even if company update fails
      }
    }
    
    // Parse additional context if provided
    let parsedContext = null;
    if (additional_context) {
      try {
        parsedContext = JSON.parse(additional_context);
        console.log('📝 Additional context received:', {
          companyName: parsedContext.companyName,
          itemCount: parsedContext.itemCount,
          hasExecutiveSummary: !!parsedContext.summary?.executiveSummary
        });
      } catch (err) {
        console.error('Failed to parse additional context:', err);
      }
    }
    
    // Process additional documents if present
    let additionalDocsText = '';
    let additionalDocsPaths: Array<{ filename: string; path: string; type: string; size: number }> = [];
    
    if (additionalDocs.length > 0) {
      console.log(`📎 Processing ${additionalDocs.length} additional documents...`);
      
      for (const doc of additionalDocs) {
        try {
          const fullDocPath = path.join(__dirname, '../../uploads', doc.filename);
          const docText = await extractTextFromPDF(fullDocPath);
          
          additionalDocsText += `\n\n=== ADDITIONAL DOCUMENT: ${doc.originalname} ===\n`;
          additionalDocsText += `File Type: ${doc.mimetype}\n`;
          additionalDocsText += `Content:\n${docText}\n`;
          
          additionalDocsPaths.push({
            filename: doc.originalname,
            path: `/uploads/${doc.filename}`,
            type: doc.mimetype,
            size: doc.size
          });
          
          console.log(`  ✅ Processed: ${doc.originalname} (${(doc.size / 1024).toFixed(0)} KB)`);
        } catch (err) {
          console.error(`  ❌ Failed to process ${doc.originalname}:`, err);
          // Continue with other documents
        }
      }
      
      console.log(`✅ Successfully processed ${additionalDocsPaths.length} of ${additionalDocs.length} additional documents`);
    }
    
    const deckPath = `/uploads/${deckFile.filename}`;
    const checklistPath = checklistFile ? `/uploads/${checklistFile.filename}` : null;

    // Calculate total file size
    const totalSize = deckFile.size + 
      (checklistFile?.size || 0) + 
      additionalDocs.reduce((sum, doc) => sum + doc.size, 0);

    // Insert record with file paths and additional docs
    const result = await query(`
      INSERT INTO pitch_decks 
      (company_id, uploaded_by, filename, file_url, deck_file_path, checklist_file_path, 
       additional_doc_paths, file_size, file_type, analysis_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      company_id,
      null, // Set to NULL to avoid foreign key constraint (uploaded_by is now nullable)
      deckFile.originalname, // Primary filename
      deckPath, // Legacy field
      deckPath, // New deck-specific path
      checklistPath, // Optional checklist path
      additionalDocsPaths.length > 0 ? JSON.stringify(additionalDocsPaths) : null, // Additional docs metadata
      totalSize, // Total size of all files
      'application/pdf',
      'pending'
    ]);

    const deckId = result.rows[0].id;

    // Trigger comprehensive analysis
    setTimeout(async () => {
      try {
        console.log(`🚀 Starting analysis for deck ${deckId}...`);
        console.log(`  - Pitch Deck: ${deckFile.originalname}`);
        if (checklistFile) {
          console.log(`  - Checklist: ${checklistFile.originalname}`);
        }
        if (additionalDocs.length > 0) {
          console.log(`  - Additional Docs: ${additionalDocs.length} files`);
        }
        
        const deckResult = await query(`
          SELECT d.*, c.name as company_name 
          FROM pitch_decks d
          LEFT JOIN companies c ON d.company_id = c.id
          WHERE d.id = $1
        `, [deckId]);

        const deck = deckResult.rows[0];
        
        await query(`UPDATE pitch_decks SET analysis_status = 'processing' WHERE id = $1`, [deckId]);

        // Full file paths
        const fullDeckPath = path.join(__dirname, '../../', deck.deck_file_path);
        const fullChecklistPath = deck.checklist_file_path ? path.join(__dirname, '../../', deck.checklist_file_path) : null;

        console.log('📊 Analyzing pitch deck with Vertex AI + Grounding...');
        
        // 🌐 NEW: Use Vertex AI with Grounding for web-validated analysis
        const useGrounding = true; // Enable grounding by default
        const industry = deck.industry || 'Technology'; // Get from deck or default
        
        // 🎯 Fetch VC preferences if uploaded_by is available
        let vcPreferences: { preferencesName: string; industry: string; criteria: any[] } | undefined;
        if (uploaded_by) {
          try {
            console.log(`🎯 Fetching VC preferences for user: "${uploaded_by}"...`);
            const prefResult = await query(
              `SELECT preferences_name, industry, criteria 
               FROM vc_preferences 
               WHERE user_id = $1 
               ORDER BY updated_at DESC 
               LIMIT 1`,
              [uploaded_by]
            );
            
            console.log(`   Query returned ${prefResult.rows.length} rows`);
            
            if (prefResult.rows.length > 0) {
              // Format preferences to match VCPreferences interface (just criteria array)
              vcPreferences = {
                preferencesName: prefResult.rows[0].preferences_name,
                industry: prefResult.rows[0].industry,
                criteria: prefResult.rows[0].criteria
              };
              console.log(`✅ Loaded VC preferences: "${vcPreferences.preferencesName}"`);
              
              // Check if it's the new object format or old array format
              const criteria = vcPreferences.criteria;
              if (Array.isArray(criteria)) {
                console.log(`   Criteria count: ${criteria.length || 0}`);
                if (criteria.length > 0) {
                  console.log(`   Weights: ${criteria.map(c => `${c.name}=${c.weight}%`).join(', ')}`);
                }
              } else if (criteria && typeof criteria === 'object') {
                console.log(`   Using new VC preferences format (dealbreakers, patterns, context_weights)`);
              }
            } else {
              console.log('ℹ️ No VC preferences found for this user, using defaults');
            }
          } catch (err) {
            console.error('⚠️ Failed to fetch VC preferences:', err);
            // Continue without preferences
          }
        } else {
          console.log('ℹ️ No uploaded_by user ID - cannot load preferences');
        }
        
        let analysis: any, sections: any[], checklistItems: any[] = [], webEnrichment: any, groundingMetadata: any;
        
        if (useGrounding) {
          const result = await analyzePitchDeckWithGrounding(
            fullDeckPath,
            fullChecklistPath,
            deck.company_name || 'the company',
            industry,
            parsedContext, // Pass the VC context here
            vcPreferences, // Pass VC preferences to influence analysis
            additionalDocsText || null // Pass additional documents text
          );
          analysis = result.analysis;
          sections = result.sections;
          checklistItems = result.checklistItems;
          webEnrichment = result.webEnrichment;
          groundingMetadata = result.groundingMetadata;
          
          console.log('✅ Analysis with Grounding complete!');
          if (parsedContext) {
            console.log(`✅ Analysis included additional VC context from ${parsedContext.itemCount} documents`);
          }
          if (additionalDocs.length > 0) {
            console.log(`📎 Analysis included ${additionalDocs.length} additional supporting documents`);
          }
          if (vcPreferences) {
            console.log(`🎯 Analysis used custom VC evaluation weights from "${vcPreferences.preferencesName}"`);
          }
          console.log(`   Web sources used: ${groundingMetadata?.webSources?.length || 0}`);
          console.log(`   Fact-checks: ${webEnrichment?.factChecks?.verified?.length || 0} verified, ${webEnrichment?.factChecks?.discrepancies?.length || 0} discrepancies`);
        } else {
          // Fallback to standard analysis
          if (fullChecklistPath) {
            const result = await analyzeDualPDFs(
              fullDeckPath,
              fullChecklistPath,
              deck.company_name || 'the company',
              vcPreferences, // Pass VC preferences here too
              additionalDocsText || null // Pass additional documents text
            );
            analysis = result.analysis;
            sections = result.sections;
            checklistItems = result.checklistItems;
          } else {
            // Single deck analysis (no checklist)
            const result = await analyzePitchDeckFromPDF(
              fullDeckPath,
              deck.company_name || 'the company',
              vcPreferences,
              additionalDocsText || null // Pass additional documents text
            );
            analysis = result.analysis;
            sections = result.sections;
            checklistItems = []; // No checklist items for single deck
          }
        }

        console.log('💾 Storing analysis results...');

        // Store checklist items as JSONB
        await query(`
          UPDATE pitch_decks 
          SET checklist_items = $1
          WHERE id = $2
        `, [JSON.stringify(checklistItems), deckId]);

        // Store section analyses
        for (const section of sections) {
          await query(`
            INSERT INTO deck_analysis 
            (deck_id, section_name, section_score, feedback, strengths, improvements)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            deckId, 
            section.sectionName, 
            section.sectionScore / 100, 
            section.feedback, 
            section.strengths, 
            section.improvements
          ]);
        }

        // Store the COMPLETE overallAnalysis in dual_pdf_analysis JSONB column
        // 🌐 NEW: Also store web enrichment data if available
        if (webEnrichment) {
          await query(`
            UPDATE pitch_decks 
            SET analysis_status = 'completed', 
                sso_score = $1, 
                dual_pdf_analysis = $2,
                extracted_metrics = $3,
                web_enrichment = $4,
                vc_preferences_used = $5,
                analyzed_at = CURRENT_TIMESTAMP
            WHERE id = $6
          `, [
            analysis.overallScore / 100, 
            JSON.stringify(analysis), // Store full overallAnalysis object
            analysis.extractedMetrics ? JSON.stringify(analysis.extractedMetrics) : null, // Store extracted metrics for benchmarking
            JSON.stringify({
              validatedMetrics: webEnrichment.validatedMetrics,
              additionalCompetitors: webEnrichment.additionalCompetitors,
              industryBenchmarks: webEnrichment.industryBenchmarks,
              factChecks: webEnrichment.factChecks,
              dataSources: webEnrichment.dataSources,
              confidence: webEnrichment.confidence,
              groundingMetadata: groundingMetadata
            }),
            vcPreferences ? JSON.stringify(vcPreferences) : null,
            deckId
          ]);

          console.log(`✅ DUAL PDF Analysis with Grounding complete for deck ${deckId}!`);
          console.log(`   Overall Score: ${analysis.overallScore}/100`);
          console.log(`   Confidence: ${webEnrichment.confidence.overall}`);
          console.log(`   Web sources: ${groundingMetadata?.webSources?.length || 0}`);
          if (analysis.extractedMetrics && analysis.extractedMetrics.common) {
            const commonMetricsCount = Object.keys(analysis.extractedMetrics.common).filter(k => {
              const key = k as keyof typeof analysis.extractedMetrics.common;
              return analysis.extractedMetrics!.common[key] !== null && analysis.extractedMetrics!.common[key] !== undefined;
            }).length;
            console.log(`   📊 Extracted Metrics: ${commonMetricsCount} common metrics found`);
          }
          if (vcPreferences) {
            console.log(`   🎯 VC Preferences: "${vcPreferences.preferencesName}" (${vcPreferences.industry})`);
          }
        } else {
          await query(`
            UPDATE pitch_decks 
            SET analysis_status = 'completed', 
                sso_score = $1, 
                dual_pdf_analysis = $2,
                extracted_metrics = $3,
                vc_preferences_used = $4,
                analyzed_at = CURRENT_TIMESTAMP
            WHERE id = $5
          `, [
            analysis.overallScore / 100, 
            JSON.stringify(analysis), // Store full overallAnalysis object
            analysis.extractedMetrics ? JSON.stringify(analysis.extractedMetrics) : null, // Store extracted metrics for benchmarking
            vcPreferences ? JSON.stringify(vcPreferences) : null,
            deckId
          ]);

          console.log(`✅ DUAL PDF Analysis complete for deck ${deckId}!`);
          console.log(`   Overall Score: ${analysis.overallScore}/100`);
          if (analysis.extractedMetrics && analysis.extractedMetrics.common) {
            const commonMetricsCount = Object.keys(analysis.extractedMetrics.common).filter(k => {
              const key = k as keyof typeof analysis.extractedMetrics.common;
              return analysis.extractedMetrics!.common[key] !== null && analysis.extractedMetrics!.common[key] !== undefined;
            }).length;
            console.log(`   📊 Extracted Metrics: ${commonMetricsCount} common metrics found`);
          }
          if (vcPreferences) {
            console.log(`   🎯 VC Preferences: "${vcPreferences.preferencesName}" (${vcPreferences.industry}"`);
          }
        }        console.log(`   Checklist Items Verified: ${analysis.checklistVerification.verifiedItems.length}`);
        console.log(`   Recommendation: ${analysis.recommendation}`);
      } catch (error) {
        console.error(`❌ Dual PDF Analysis failed for deck ${deckId}:`, error);
        
        // Determine failure reason for user-friendly error message
        let errorReason = 'Analysis Failed';
        if (error instanceof Error) {
          if (error.message.includes('Insufficient text content')) {
            errorReason = 'Unreadable PDF';
          } else if (error.message.includes('rate limit') || error.message.includes('429')) {
            errorReason = 'API Rate Limit';
          } else if (error.message.includes('timeout')) {
            errorReason = 'Analysis Timeout';
          } else if (error.message.includes('parse') || error.message.includes('JSON')) {
            errorReason = 'AI Parse Error';
          }
        }
        
        await query(`
          UPDATE pitch_decks 
          SET analysis_status = 'failed',
              error_message = $2
          WHERE id = $1
        `, [deckId, errorReason]);
      }
    }, 1000);

    // Build response message
    let message = 'Pitch deck uploaded successfully! AI analysis started.';
    if (checklistFile) {
      message = 'Pitch deck and checklist uploaded successfully! Comprehensive AI analysis started.';
    }
    if (additionalDocs.length > 0) {
      message += ` ${additionalDocs.length} supporting document${additionalDocs.length > 1 ? 's' : ''} included.`;
    }
    
    res.status(201).json({
      deck: result.rows[0],
      message,
      files: {
        deck: deckFile.originalname,
        checklist: checklistFile?.originalname || null,
        additional_docs: additionalDocs.map(doc => doc.originalname)
      }
    });
  } catch (error) {
    console.error('Error uploading dual PDFs:', error);
    res.status(500).json({ error: 'Failed to upload files', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /api/decks/upload - Upload single deck (backward compatibility)
router.post('/upload', upload.single('deck'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { company_id, uploaded_by } = req.body;
    
    const fileUrl = `/uploads/${req.file.filename}`;

    const result = await query(`
      INSERT INTO pitch_decks 
      (company_id, uploaded_by, filename, file_url, deck_file_path, file_size, file_type, analysis_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      company_id,
      uploaded_by,
      req.file.originalname,
      fileUrl,
      fileUrl, // Also store in deck_file_path
      req.file.size,
      req.file.mimetype,
      'pending'
    ]);

    const deckId = result.rows[0].id;

    // Automatically trigger AI analysis in background
    // Note: In production, use a job queue (Bull, BeeQueue, etc.)
    setTimeout(async () => {
      try {
        console.log(`🚀 Starting automatic AI analysis for deck ${deckId}...`);
        
        const deckResult = await query(`
          SELECT d.*, c.name as company_name 
          FROM pitch_decks d
          LEFT JOIN companies c ON d.company_id = c.id
          WHERE d.id = $1
        `, [deckId]);

        const deck = deckResult.rows[0];
        
        await query(`UPDATE pitch_decks SET analysis_status = 'processing' WHERE id = $1`, [deckId]);

        // 🎯 Fetch VC preferences if uploaded_by is available
        let vcPreferences: { preferencesName: string; industry: string; criteria: any[] } | undefined;
        if (deck.uploaded_by) {
          try {
            console.log(`🎯 Fetching VC preferences for user ${deck.uploaded_by}...`);
            const prefResult = await query(
              `SELECT preferences_name, industry, criteria 
               FROM vc_preferences 
               WHERE user_id = $1 
               ORDER BY updated_at DESC 
               LIMIT 1`,
              [deck.uploaded_by]
            );
            
            if (prefResult.rows.length > 0) {
              vcPreferences = {
                preferencesName: prefResult.rows[0].preferences_name,
                industry: prefResult.rows[0].industry,
                criteria: prefResult.rows[0].criteria
              };
              console.log(`✅ Loaded VC preferences: "${vcPreferences.preferencesName}"`);
            }
          } catch (err) {
            console.error('⚠️ Failed to fetch VC preferences:', err);
          }
        }

        const pdfPath = path.join(__dirname, '../../', deck.file_url);
        const { analysis, sections } = await analyzePitchDeckFromPDF(pdfPath, deck.company_name, vcPreferences);

        for (const section of sections) {
          await query(`
            INSERT INTO deck_analysis 
            (deck_id, section_name, section_score, feedback, strengths, improvements)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [deckId, section.sectionName, section.sectionScore / 100, section.feedback, section.strengths, section.improvements]);
        }

        await query(`
          UPDATE pitch_decks 
          SET analysis_status = 'completed', 
              sso_score = $1, 
              vc_preferences_used = $2,
              analyzed_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [analysis.overallScore / 100, vcPreferences ? JSON.stringify(vcPreferences) : null, deckId]);

        console.log(`✅ AI Analysis complete for deck ${deckId}! Score: ${analysis.overallScore}`);
        if (vcPreferences) {
          console.log(`   🎯 VC Preferences: "${vcPreferences.preferencesName}"`);
        }
      } catch (error) {
        console.error(`❌ AI Analysis failed for deck ${deckId}:`, error);
        await query(`UPDATE pitch_decks SET analysis_status = 'failed' WHERE id = $1`, [deckId]);
      }
    }, 1000); // Start analysis after 1 second

    res.status(201).json({
      deck: result.rows[0],
      message: 'Deck uploaded successfully. AI analysis started automatically!'
    });
  } catch (error) {
    console.error('Error uploading deck:', error);
    res.status(500).json({ error: 'Failed to upload deck' });
  }
});

// GET /api/decks/recent-analyses - Get recent deck analyses (for founders)
// NOTE: This MUST come before /:id route to avoid being caught by it
router.get('/recent-analyses', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const userId = req.query.userId as string;

    let queryText = `
      SELECT 
        d.id, 
        d.filename, 
        d.analysis_status, 
        d.created_at, 
        d.analyzed_at,
        d.sso_score,
        c.name as company_name
      FROM pitch_decks d
      LEFT JOIN companies c ON d.company_id = c.id
    `;

    const params: any[] = [];
    
    if (userId) {
      queryText += ` WHERE d.uploaded_by = $1`;
      params.push(userId);
      queryText += ` ORDER BY d.created_at DESC LIMIT $2`;
      params.push(limit);
    } else {
      queryText += ` ORDER BY d.created_at DESC LIMIT $1`;
      params.push(limit);
    }

    const result = await query(queryText, params);

    res.json({ 
      analyses: result.rows,
      total: result.rows.length 
    });
  } catch (error) {
    console.error('Error fetching recent analyses:', error);
    res.status(500).json({ error: 'Failed to fetch recent analyses' });
  }
});

// GET /api/decks/comparisons/recent - Get recent comparisons
// NOTE: This MUST come before /:id route to avoid being caught by it
router.get('/comparisons/recent', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const userId = req.query.userId as string;

    let queryText = `
      SELECT id, deck1_filename, deck2_filename, analysis_status, 
             created_at, analyzed_at, user_id
      FROM deck_comparisons 
    `;

    const params: any[] = [];
    
    if (userId) {
      queryText += ` WHERE user_id = $1`;
      params.push(userId);
      queryText += ` ORDER BY created_at DESC LIMIT $2`;
      params.push(limit);
    } else {
      queryText += ` ORDER BY created_at DESC LIMIT $1`;
      params.push(limit);
    }

    const result = await query(queryText, params);

    res.json({ 
      comparisons: result.rows,
      total: result.rows.length 
    });
  } catch (error) {
    console.error('Error fetching recent comparisons:', error);
    res.status(500).json({ error: 'Failed to fetch recent comparisons' });
  }
});

// GET /api/decks/:id - Get deck details with analysis
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get deck info with company stage and industry
    const deckResult = await query(`
      SELECT d.*, c.name as company_name, c.stage, c.industry 
      FROM pitch_decks d
      LEFT JOIN companies c ON d.company_id = c.id
      WHERE d.id = $1
    `, [id]);

    if (deckResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    const deck = deckResult.rows[0];

    // Get section analysis results
    const sectionsResult = await query(`
      SELECT * FROM deck_analysis WHERE deck_id = $1 ORDER BY section_name
    `, [id]);

    // Build the response structure the frontend expects
    let analysis = null;
    
    console.log('📊 Deck analysis check:', {
      deckId: deck.id,
      analysis_status: deck.analysis_status,
      has_dual_pdf_analysis: !!deck.dual_pdf_analysis,
      dual_pdf_analysis_type: typeof deck.dual_pdf_analysis,
      sections_count: sectionsResult.rows.length,
      analyzed_at: deck.analyzed_at,
      sso_score: deck.sso_score
    });
    
    // More detailed condition check
    const hasDualPdfAnalysis = deck.dual_pdf_analysis && typeof deck.dual_pdf_analysis === 'object';
    const isCompleted = deck.analysis_status === 'completed';
    
    console.log('🔍 Analysis creation conditions:', {
      hasDualPdfAnalysis,
      isCompleted,
      willCreateAnalysis: hasDualPdfAnalysis && isCompleted
    });
    
    if (hasDualPdfAnalysis && isCompleted) {
      // Transform sections from database rows to frontend format
      const sections = sectionsResult.rows.map(row => ({
        sectionName: row.section_name,
        sectionScore: row.section_score * 100, // Convert back to 0-100 scale
        feedback: row.feedback,
        strengths: row.strengths,
        improvements: row.improvements
      }));

      analysis = {
        id: deck.id,
        deck_id: deck.id,
        sso_score: deck.sso_score,
        overall_feedback: deck.dual_pdf_analysis?.recommendation || '',
        created_at: deck.analyzed_at,
        analysis: {
          overall: deck.dual_pdf_analysis, // The complete overallAnalysis object
          sections: sections // Transformed section rows
        }
      };
      
      console.log('✓ Analysis object created with', sections.length, 'sections');
      console.log('🎯 Deck Intelligence Score:', {
        sso_score_01: deck.sso_score,
        sso_score_100: (deck.sso_score * 100).toFixed(1),
        overallScore: deck.dual_pdf_analysis?.overallScore
      });
    } else {
      console.log('❌ Not creating analysis object - missing data or status not completed', {
        has_dual_pdf_analysis: !!deck.dual_pdf_analysis,
        analysis_status: deck.analysis_status,
        expected_status: 'completed'
      });
    }

    res.json({
      deck: {
        ...deck,
        status: deck.analysis_status, // Map analysis_status to status for frontend
        analysis: analysis,
        vcPreferencesUsed: deck.vc_preferences_used || null
      }
    });
  } catch (error) {
    console.error('Error fetching deck:', error);
    res.status(500).json({ error: 'Failed to fetch deck details' });
  }
});

// POST /api/decks/:id/analyze - Trigger REAL AI analysis
router.post('/:id/analyze', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get deck info
    const deckResult = await query(`
      SELECT d.*, c.name as company_name 
      FROM pitch_decks d
      LEFT JOIN companies c ON d.company_id = c.id
      WHERE d.id = $1
    `, [id]);

    if (deckResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    const deck = deckResult.rows[0];

    // Update status to processing
    await query(`
      UPDATE pitch_decks 
      SET analysis_status = 'processing' 
      WHERE id = $1
    `, [id]);

    try {
      // Read PDF file path
      const filePath = path.join(__dirname, '../../', deck.file_url);

      // 🎯 Fetch VC preferences if uploaded_by is available
      let vcPreferences: { preferencesName: string; industry: string; criteria: any[] } | undefined;
      if (deck.uploaded_by) {
        try {
          console.log(`🎯 Fetching VC preferences for user ${deck.uploaded_by}...`);
          const prefResult = await query(
            `SELECT preferences_name, industry, criteria 
             FROM vc_preferences 
             WHERE user_id = $1 
             ORDER BY updated_at DESC 
             LIMIT 1`,
            [deck.uploaded_by]
          );
          
          if (prefResult.rows.length > 0) {
            vcPreferences = {
              preferencesName: prefResult.rows[0].preferences_name,
              industry: prefResult.rows[0].industry,
              criteria: prefResult.rows[0].criteria
            };
            console.log(`✅ Loaded VC preferences: "${vcPreferences.preferencesName}"`);
          }
        } catch (err) {
          console.error('⚠️ Failed to fetch VC preferences:', err);
        }
      }

      // Analyze with REAL AI
      console.log(`🤖 Analyzing deck for ${deck.company_name || 'company'} with Gemini AI...`);
      const { analysis, sections } = await analyzePitchDeckFromPDF(
        filePath, 
        deck.company_name || 'the company',
        vcPreferences
      );

      console.log(`✅ AI Analysis complete! Overall score: ${analysis.overallScore}`);

      // Save section analysis to database
      for (const section of sections) {
        await query(`
          INSERT INTO deck_analysis 
          (deck_id, section_name, section_score, feedback, strengths, improvements)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          id,
          section.sectionName,
          section.sectionScore / 100, // Convert to 0-1 scale
          section.feedback,
          section.strengths,
          section.improvements
        ]);
      }

      // Update deck with overall score and status
      await query(`
        UPDATE pitch_decks 
        SET analysis_status = 'completed',
            sso_score = $1,
            vc_preferences_used = $2,
            analyzed_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [analysis.overallScore / 100, vcPreferences ? JSON.stringify(vcPreferences) : null, id]); // Convert to 0-1 scale

      res.json({
        message: 'AI Analysis completed successfully!',
        sso_score: (analysis.overallScore / 100).toFixed(2),
        analysis: {
          overall: analysis,
          sections: sections
        },
        vcPreferencesUsed: vcPreferences || null
      });
    } catch (analysisError: any) {
      console.error('AI Analysis error:', analysisError);
      
      // Update status to failed
      await query(`
        UPDATE pitch_decks 
        SET analysis_status = 'failed' 
        WHERE id = $1
      `, [id]);

      return res.status(500).json({ 
        error: 'AI analysis failed', 
        details: analysisError.message 
      });
    }
  } catch (error) {
    console.error('Error in analyze endpoint:', error);
    res.status(500).json({ error: 'Failed to analyze deck' });
  }
});

// GET /api/decks/:id/report/enhanced - Download ENHANCED PDF report with industry benchmarks
router.get('/:id/report/enhanced', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stage, industry } = req.query;

    // Validate required parameters
    if (!stage || !industry) {
      return res.status(400).json({ 
        error: 'Missing required parameters: stage and industry' 
      });
    }

    // Get deck with full analysis
    const deckResult = await query(`
      SELECT d.*, c.name as company_name, c.stage, c.industry
      FROM pitch_decks d
      LEFT JOIN companies c ON d.company_id = c.id
      WHERE d.id = $1
    `, [id]);

    if (deckResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    const deck = deckResult.rows[0];

    if (!deck.dual_pdf_analysis || deck.analysis_status !== 'completed') {
      return res.status(400).json({ 
        error: 'Analysis not completed for this deck' 
      });
    }

    console.log(`\n📊 Generating enhanced PDF for deck ${id}...`);
    console.log(`   Company: ${deck.company_name || 'NOT SET'}`);
    console.log(`   Stage: ${stage}, Industry: ${industry}`);
    console.log(`   Analysis status: ${deck.analysis_status}`);
    
    // 🔍 SCORE CONSISTENCY CHECK
    console.log('\n🎯 SCORE SOURCE VERIFICATION:');
    console.log(`   deck.sso_score (DB): ${deck.sso_score} (0-1 scale)`);
    console.log(`   deck.sso_score * 100: ${(deck.sso_score * 100).toFixed(1)}/100`);
    console.log(`   deck.dual_pdf_analysis.overallScore: ${deck.dual_pdf_analysis?.overallScore}/100`);
    if (Math.abs((deck.sso_score * 100) - (deck.dual_pdf_analysis?.overallScore || 0)) > 0.1) {
      console.warn(`   ⚠️  MISMATCH DETECTED! DB score and analysis score differ!`);
    } else {
      console.log(`   ✅ Scores match - consistent across sources`);
    }

    // Get sections from database (same as normal PDF!)
    const sectionsResult = await query(`
      SELECT * FROM deck_analysis WHERE deck_id = $1 ORDER BY section_name
    `, [id]);

    const sections = sectionsResult.rows.map(row => ({
      sectionName: row.section_name,
      sectionScore: row.section_score * 100, // Convert to 0-100 scale
      feedback: row.feedback,
      strengths: row.strengths,
      improvements: row.improvements
    }));

    console.log(`   Sections found: ${sections.length}`);
    console.log(`   Overall analysis:`, !!deck.dual_pdf_analysis);

    // 🎯 Fetch VC Preferences (if not already in deck record)
    let vcPreferencesData = deck.vc_preferences_used;
    if (!vcPreferencesData && deck.user_id) {
      try {
        console.log(`🎯 Fetching VC preferences for user: "${deck.user_id}"...`);
        const prefResult = await query(
          `SELECT preferences_name, industry, criteria 
           FROM vc_preferences 
           WHERE user_id = $1 
           ORDER BY updated_at DESC 
           LIMIT 1`,
          [deck.user_id]
        );
        
        if (prefResult.rows.length > 0) {
          vcPreferencesData = {
            preferencesName: prefResult.rows[0].preferences_name,
            industry: prefResult.rows[0].industry,
            criteria: prefResult.rows[0].criteria
          };
          console.log(`   ✅ VC Preferences loaded: "${vcPreferencesData.preferencesName}"`);
        }
      } catch (prefErr) {
        console.log(`   ℹ️  Could not load VC preferences (optional)`);
      }
    }

    // 🎯 Fetch VC Context Intelligence (if available)
    let vcContextData = null;
    try {
      // First try: Check deck_intelligence_context table (exported data)
      const contextResult = await query(`
        SELECT vc_context_data
        FROM deck_intelligence_context
        WHERE deck_id = $1 AND user_id = $2
        ORDER BY updated_at DESC
        LIMIT 1
      `, ['00000000-0000-0000-0000-000000000002', deck.user_id]); // Global context deck

      if (contextResult.rows.length > 0 && contextResult.rows[0].vc_context_data) {
        const exportedData = contextResult.rows[0].vc_context_data;
        vcContextData = exportedData.summary || exportedData;
        console.log(`   ✅ VC Context Intelligence loaded from deck_intelligence_context`);
      } else {
        // Fallback: Try vc_context_summaries table
        const summaryResult = await query(`
          SELECT intelligence, summary, created_at
          FROM vc_context_summaries
          WHERE deck_id = $1 AND user_id = $2
          ORDER BY created_at DESC
          LIMIT 1
        `, ['00000000-0000-0000-0000-000000000002', deck.user_id]);

        if (summaryResult.rows.length > 0) {
          const contextRow = summaryResult.rows[0];
          vcContextData = contextRow.intelligence || contextRow.summary;
          console.log(`   ✅ VC Context Intelligence loaded from vc_context_summaries`);
        }
      }
    } catch (vcErr) {
      console.error(`   ⚠️  Error fetching VC Context:`, vcErr);
      console.log(`   ℹ️  Continuing without VC Context data (optional)`);
    }

    // Build analysis structure (SAME as normal PDF + GET /api/decks/:id)
    const analysisData = {
      sso_score: deck.sso_score,
      analysis: {
        overall: deck.dual_pdf_analysis, // Full Gemini analysis
        sections: sections                // Database sections
      }
    };

    // Generate enhanced PDF
    const generateEnhancedPDF = (await import('../services/enhancedPdfGenerator')).default;
    
    const pdfPath = await generateEnhancedPDF({
      deck: {
        id: deck.id,
        file_name: deck.filename,
        company_name: deck.company_name
      },
      analysis: analysisData,
      selectedStage: stage as string,
      selectedIndustry: industry as string,
      companyName: undefined, // Let PDF generator extract from filename or analysis
      // 🌐 NEW: Include web enrichment data if available
      webEnrichment: deck.web_enrichment || undefined,
      groundingMetadata: deck.web_enrichment?.groundingMetadata || undefined,
      // 🎯 NEW: Include VC preferences used for this analysis
      vcPreferencesUsed: vcPreferencesData || undefined,
      // 🧠 NEW: Include VC Context Intelligence
      vcContextIntelligence: vcContextData || undefined
    });

    console.log(`✓ Enhanced PDF generated: ${pdfPath}`);

    // Create a clean filename - extract from deck filename, not database
    const extractedName = deck.filename
      .replace(/\.(pdf|ppt|pptx|docx|doc)$/i, '') // Remove extensions
      .replace(/[-_()]/g, ' ') // Replace special chars with spaces
      .replace(/\b(pitch|deck|presentation|slide|v\d+|final|draft|inr|usd)\b/gi, '') // Remove common words
      .trim()
      .substring(0, 50);
    
    const companyFileName = (extractedName || deck.company_name || 'Startup')
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '_'); // Replace spaces with underscores

    console.log(`📄 Download filename: ${companyFileName}_Enhanced_Report.pdf`);

    // Send PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${companyFileName}_Enhanced_Report.pdf"`);
    
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
    
    fileStream.on('end', () => {
      // Clean up temp file after sending
      try {
        fs.unlinkSync(pdfPath);
        console.log(`✓ Temp PDF cleaned up: ${pdfPath}`);
      } catch (err) {
        console.error('Error cleaning up temp PDF:', err);
      }
    });

    fileStream.on('error', (error) => {
      console.error('Error streaming PDF:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream PDF' });
      }
    });

  } catch (error: any) {
    console.error('Error generating enhanced PDF report:', error);
    res.status(500).json({ 
      error: 'Failed to generate enhanced PDF report',
      details: error.message 
    });
  }
});

// GET /api/decks/:id/report/premium - Generate premium 25-30 page PDF report
// IMPORTANT: This must come BEFORE /:format route to avoid being caught as a format parameter
router.get('/:id/report/premium', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log(`\n📊 [Premium Report] Generating premium report for deck ${id}...`);

    // Get deck with analysis
    const deckResult = await query(`
      SELECT d.*, c.name as company_name 
      FROM pitch_decks d
      LEFT JOIN companies c ON d.company_id = c.id
      WHERE d.id = $1
    `, [id]);

    if (deckResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    const deck = deckResult.rows[0];

    if (!deck.dual_pdf_analysis || deck.analysis_status !== 'completed') {
      return res.status(400).json({ error: 'Analysis not completed for this deck. Please analyze the deck first.' });
    }

    // Extract company name
    const extractedCompanyName = deck.filename
      .replace(/\.(pdf|ppt|pptx|docx|doc)$/i, '')
      .replace(/[-_()]/g, ' ')
      .replace(/\b(pitch|deck|presentation|slide|v\d+|final|draft|inr|usd|may|june|july|aug|sep|oct|nov|dec|\d{4})\b/gi, '')
      .trim();
    
    const finalCompanyName = (extractedCompanyName && extractedCompanyName.length > 2) 
      ? extractedCompanyName 
      : (deck.company_name || 'Startup Company');

    console.log(`   Company: ${finalCompanyName}`);
    console.log(`   Extracting deck text for deep analysis...`);

    // Get the original deck text for premium analysis
    const deckPath = path.join(__dirname, '../../', deck.file_url);
    let deckText = '';
    
    try {
      if (deck.file_url.endsWith('.pdf')) {
        const { extractTextFromPDF } = await import('../services/ai-enhanced');
        deckText = await extractTextFromPDF(deckPath);
      } else {
        // For non-PDF files, use extracted text if available
        deckText = deck.extracted_text || 'Deck text not available';
      }
    } catch (extractError) {
      console.warn(`⚠️  Could not extract deck text: ${extractError}`);
      deckText = JSON.stringify(deck.dual_pdf_analysis); // Fallback to analysis data
    }

    console.log(`   Deck text extracted: ${deckText.length} characters`);
    console.log(`   📋 DEBUG: deck.uploaded_by = "${deck.uploaded_by}"`);
    console.log(`   📋 DEBUG: deck.id = "${deck.id}"`);
    
    // 🎯 ALWAYS Fetch VC Preferences from vc_preferences table (don't use deck.vc_preferences_used - it's just a name)
    let vcPreferencesData: any = null;
    if (deck.uploaded_by) {
      try {
        console.log(`🎯 Fetching VC preferences for user: "${deck.uploaded_by}"...`);
        const prefResult = await query(
          `SELECT preferences_name, industry, criteria 
           FROM vc_preferences 
           WHERE user_id = $1 
           ORDER BY updated_at DESC 
           LIMIT 1`,
          [deck.uploaded_by]
        );
        
        if (prefResult.rows.length > 0) {
          const row = prefResult.rows[0];
          // Parse criteria JSONB (contains dealbreakers, patterns, context_weights, thesis_alignment)
          const criteria = typeof row.criteria === 'string' 
            ? JSON.parse(row.criteria) 
            : row.criteria;
          
          // 🔧 IMPORTANT: Extract string values from dealbreaker/pattern objects
          const dealbreakerStrings = (criteria.dealbreakers || []).map((db: any) => 
            typeof db === 'string' ? db : db.description || db.text || ''
          ).filter((s: string) => s.length > 0);
          
          const patternStrings = (criteria.patterns || []).map((p: any) => 
            typeof p === 'string' ? p : p.pattern || p.text || p.description || ''
          ).filter((s: string) => s.length > 0);
          
          vcPreferencesData = {
            preferencesName: row.preferences_name,
            industry: row.industry,
            // Extract data from criteria object as STRING ARRAYS (orchestrator expects strings)
            dealbreakers: dealbreakerStrings,
            positivePatterns: patternStrings,
            investmentThesis: criteria.thesis_alignment?.strategic_priorities || criteria.thesis_alignment?.thesis_statement || '',
            contextWeights: criteria.context_weights || [],
            targetSectors: criteria.thesis_alignment?.target_sectors || [],
            targetStages: criteria.thesis_alignment?.target_stages || [],
            targetGeographies: criteria.thesis_alignment?.geography || criteria.thesis_alignment?.target_geographies || []
          };
          console.log(`   ✅ VC Preferences loaded: "${vcPreferencesData.preferencesName}"`);
          console.log(`      Dealbreakers: ${vcPreferencesData.dealbreakers?.length || 0}`);
          console.log(`      Positive Patterns: ${vcPreferencesData.positivePatterns?.length || 0}`);
          console.log(`      Has Thesis: ${!!vcPreferencesData.investmentThesis}`);
        } else {
          console.log(`   ℹ️  No VC preferences found for user`);
        }
      } catch (prefErr) {
        console.error(`   ⚠️  Error loading VC preferences:`, prefErr);
        console.log(`   ℹ️  Will proceed without preferences (optional)`);
      }
    } else {
      // 🔧 FALLBACK: If no uploaded_by, try to find ANY preferences in the system
      console.log(`   ⚠️  No uploaded_by field - trying to use ANY available preferences...`);
      try {
        const anyPrefResult = await query(
          `SELECT preferences_name, industry, criteria, user_id
           FROM vc_preferences 
           ORDER BY updated_at DESC 
           LIMIT 1`
        );
        
        if (anyPrefResult.rows.length > 0) {
          const row = anyPrefResult.rows[0];
          // Parse criteria JSONB
          const criteria = typeof row.criteria === 'string' 
            ? JSON.parse(row.criteria) 
            : row.criteria;
          
          // 🔧 IMPORTANT: Extract string values from dealbreaker/pattern objects
          const dealbreakerStrings = (criteria.dealbreakers || []).map((db: any) => 
            typeof db === 'string' ? db : db.description || db.text || ''
          ).filter((s: string) => s.length > 0);
          
          const patternStrings = (criteria.patterns || []).map((p: any) => 
            typeof p === 'string' ? p : p.pattern || p.text || p.description || ''
          ).filter((s: string) => s.length > 0);
          
          vcPreferencesData = {
            preferencesName: row.preferences_name,
            industry: row.industry,
            dealbreakers: dealbreakerStrings,
            positivePatterns: patternStrings,
            investmentThesis: criteria.thesis_alignment?.strategic_priorities || criteria.thesis_alignment?.thesis_statement || '',
            contextWeights: criteria.context_weights || [],
            targetSectors: criteria.thesis_alignment?.target_sectors || [],
            targetStages: criteria.thesis_alignment?.target_stages || [],
            targetGeographies: criteria.thesis_alignment?.geography || criteria.thesis_alignment?.target_geographies || []
          };
          console.log(`   ✅ Using fallback VC Preferences from user "${row.user_id}": "${vcPreferencesData.preferencesName}"`);
          console.log(`      Dealbreakers: ${vcPreferencesData.dealbreakers?.length || 0}`);
          console.log(`      Positive Patterns: ${vcPreferencesData.positivePatterns?.length || 0}`);
          console.log(`      Has Thesis: ${!!vcPreferencesData.investmentThesis}`);
        }
      } catch (fallbackErr) {
        console.log(`   ℹ️  No fallback preferences available`);
      }
    }

    // 🧠 Fetch VC Context Intelligence (if available)
    let vcContextData: any = null;
    if (deck.uploaded_by) {
      try {
        console.log(`🧠 Fetching VC Context Intelligence for user "${deck.uploaded_by}"...`);
        
        // PRIMARY: Check deck_intelligence_context table (exported data)
        // Try both: 1) This specific deck, 2) Global deck for this user
        const contextResult = await query(`
          SELECT vc_context_data, deck_id
          FROM deck_intelligence_context
          WHERE user_id = $1 
            AND (deck_id = $2 OR deck_id = $3)
          ORDER BY updated_at DESC
          LIMIT 1
        `, [deck.uploaded_by, deck.id, '00000000-0000-0000-0000-000000000002']);

        if (contextResult.rows.length > 0 && contextResult.rows[0].vc_context_data) {
          const exportedData = contextResult.rows[0].vc_context_data;
          vcContextData = exportedData.summary || exportedData;
          console.log(`   ✅ VC Context Intelligence loaded from deck_intelligence_context`);
          console.log(`      Context has ${vcContextData?.items?.length || 0} items`);
          console.log(`      Summary length: ${vcContextData?.summary?.length || 0} chars`);
        } else {
          console.log(`   ℹ️  No data in deck_intelligence_context, trying fallback...`);
          
          // FALLBACK: Try vc_context_summaries table (look for any deck by this user)
          const summaryResult = await query(`
            SELECT intelligence, summary, created_at, deck_id
            FROM vc_context_summaries
            WHERE user_id = $1
              AND (deck_id = $2 OR deck_id = $3)
            ORDER BY created_at DESC
            LIMIT 1
          `, [deck.uploaded_by, deck.id, '00000000-0000-0000-0000-000000000002']);

          if (summaryResult.rows.length > 0) {
            const contextRow = summaryResult.rows[0];
            vcContextData = contextRow.intelligence || contextRow.summary;
            console.log(`   ✅ VC Context Intelligence loaded from vc_context_summaries (fallback)`);
            console.log(`      Intelligence length: ${JSON.stringify(vcContextData).length} chars`);
          } else {
            console.log(`   ℹ️  No data in vc_context_summaries either`);
          }
        }

        if (!vcContextData) {
          console.log(`   ⚠️  No VC Context Intelligence found anywhere - will proceed without it`);
        }
      } catch (contextErr) {
        console.error(`   ⚠️  Error loading VC Context Intelligence:`, contextErr);
        console.log(`   ℹ️  Will proceed without context (optional)`);
      }
    }
    
    console.log(`   Starting AGENTIC premium AI orchestration...`);

    // Generate premium analysis using AI orchestrator WITH VC CONTEXT & PREFERENCES
    const { orchestratePremiumAnalysis } = await import('../services/vertex-ai-orchestrator');
    const premiumData = await orchestratePremiumAnalysis(deckText, finalCompanyName, vcContextData, vcPreferencesData);

    // 🔧 FIX: Use stored overallScore for consistency across all reports
    // The initial analysis already calculated the score, premium report should display the SAME score
    if (deck.dual_pdf_analysis && deck.dual_pdf_analysis.overallScore) {
      console.log(`   ⚠️  Overriding AI-generated score with stored score for consistency`);
      console.log(`      AI generated: ${premiumData.overallScore}/100`);
      console.log(`      Stored score: ${deck.dual_pdf_analysis.overallScore}/100`);
      premiumData.overallScore = deck.dual_pdf_analysis.overallScore;
    }

    console.log(`   ✅ Premium analysis complete!`);
    console.log(`   Generating PDF report...`);

    // Generate premium PDF
    const { generatePremiumPDF } = await import('../services/premium-report-generator');
    const pdfPath = path.join(__dirname, '../../uploads', `${id}_premium_report.pdf`);
    
    await generatePremiumPDF(premiumData, deck.filename, pdfPath);

    console.log(`   ✅ Premium PDF generated: ${pdfPath}`);

    // Send PDF to client
    const companyFileName = finalCompanyName
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${companyFileName}_Premium_Analysis.pdf"`);
    
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
    fileStream.on('end', () => {
      // Clean up temp file
      fs.unlinkSync(pdfPath);
    });
  } catch (error) {
    console.error('❌ [Premium Report] Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate premium report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/decks/:id/report/:format - Download report in specified format (txt, md, pdf)
router.get('/:id/report/:format', async (req: Request, res: Response) => {
  try {
    const { id, format } = req.params;
    
    if (!['txt', 'md', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Use txt, md, or pdf' });
    }

    // Get deck with full analysis + web enrichment
    const deckResult = await query(`
      SELECT d.*, c.name as company_name 
      FROM pitch_decks d
      LEFT JOIN companies c ON d.company_id = c.id
      WHERE d.id = $1
    `, [id]);

    if (deckResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    const deck = deckResult.rows[0];

    if (!deck.dual_pdf_analysis || deck.analysis_status !== 'completed') {
      return res.status(400).json({ error: 'Analysis not completed for this deck' });
    }

    // Get sections
    const sectionsResult = await query(`
      SELECT * FROM deck_analysis WHERE deck_id = $1 ORDER BY section_name
    `, [id]);

    const sections = sectionsResult.rows.map(row => ({
      sectionName: row.section_name,
      sectionScore: row.section_score * 100,
      feedback: row.feedback,
      strengths: row.strengths,
      improvements: row.improvements
    }));

    // ✅ EXTRACT COMPANY NAME FROM FILENAME (don't trust database company_name)
    const extractedCompanyName = deck.filename
      .replace(/\.(pdf|ppt|pptx|docx|doc)$/i, '') // Remove extensions
      .replace(/[-_()]/g, ' ') // Replace special chars with spaces
      .replace(/\b(pitch|deck|presentation|slide|v\d+|final|draft|inr|usd|may|june|july|aug|sep|oct|nov|dec|\d{4})\b/gi, '') // Remove common words
      .trim();
    
    // Use extracted name if valid, otherwise fallback to database then default
    const finalCompanyName = (extractedCompanyName && extractedCompanyName.length > 2) 
      ? extractedCompanyName 
      : (deck.company_name || 'Startup Company');

    console.log(`\n📊 Enhanced Report Generation - Company: ${finalCompanyName}`);
    console.log(`   Filename: "${deck.filename}"`);
    console.log(`   Database name: "${deck.company_name || 'NULL'}"`);
    console.log(`   Extracted name: "${extractedCompanyName}"`);
    console.log(`   Has web enrichment: ${!!deck.web_enrichment}`);

    const reportData = {
      deck: {
        id: deck.id,
        file_name: deck.filename,
        company_name: finalCompanyName,  // ✅ Use extracted name
        uploaded_at: deck.created_at,
        analyzed_at: deck.analyzed_at
      },
      analysis: deck.dual_pdf_analysis,
      sections: sections,
      webEnrichment: deck.web_enrichment || undefined  // ✅ Include web enrichment data
    };

    const { generateTextReport, generateMarkdownReport, generatePDFReport } = await import('../services/report-generator');

    // Create a clean filename - use the extracted company name
    const companyFileName = finalCompanyName
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '_'); // Replace spaces with underscores

    if (format === 'txt') {
      const txtReport = generateTextReport(reportData);
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${companyFileName}_Analysis_Report.txt"`);
      return res.send(txtReport);
    }

    if (format === 'md') {
      const mdReport = generateMarkdownReport(reportData);
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="${companyFileName}_Analysis_Report.md"`);
      return res.send(mdReport);
    }

    if (format === 'pdf') {
      const pdfPath = path.join(__dirname, '../../uploads', `${id}_report.pdf`);
      await generatePDFReport(reportData, pdfPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${companyFileName}_Analysis_Report.pdf"`);
      const fileStream = fs.createReadStream(pdfPath);
      fileStream.pipe(res);
      fileStream.on('end', () => {
        // Clean up temp file
        fs.unlinkSync(pdfPath);
      });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/decks/compare/:id - Get comparison status
router.get('/compare/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT id, analysis_status, comparison_analysis, deck1_filename, deck2_filename, created_at, analyzed_at
      FROM deck_comparisons 
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comparison not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching comparison status:', error);
    res.status(500).json({ error: 'Failed to fetch comparison status' });
  }
});

// GET /api/decks/compare/:id/report/premium - Generate premium comparison PDF report
// IMPORTANT: This must come BEFORE the generic /:format route to avoid route matching conflicts
router.get('/compare/:id/report/premium', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log(`\n📊 [Premium Comparison] Generating premium comparison report for ${id}...`);

    // Get comparison with analysis
    const comparisonResult = await query(`
      SELECT * FROM deck_comparisons WHERE id = $1
    `, [id]);

    if (comparisonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comparison not found' });
    }

    const comparison = comparisonResult.rows[0];

    if (!comparison.comparison_analysis || comparison.analysis_status !== 'completed') {
      return res.status(400).json({ 
        error: 'Comparison analysis not completed yet' 
      });
    }

    // Get both deck details for premium analysis
    const deck1Result = await query(`
      SELECT d.*, c.name as company_name 
      FROM pitch_decks d
      LEFT JOIN companies c ON d.company_id = c.id
      WHERE d.id = $1
    `, [comparison.deck1_id]);

    const deck2Result = await query(`
      SELECT d.*, c.name as company_name 
      FROM pitch_decks d
      LEFT JOIN companies c ON d.company_id = c.id
      WHERE d.id = $1
    `, [comparison.deck2_id]);

    if (deck1Result.rows.length === 0 || deck2Result.rows.length === 0) {
      return res.status(404).json({ error: 'One or both decks not found' });
    }

    const deck1 = deck1Result.rows[0];
    const deck2 = deck2Result.rows[0];

    // Extract company names
    const extractCompanyName = (filename: string, companyName?: string) => {
      const extracted = filename
        .replace(/\.(pdf|ppt|pptx|docx|doc)$/i, '')
        .replace(/[-_()]/g, ' ')
        .replace(/\b(pitch|deck|presentation|slide|v\d+|final|draft|inr|usd|may|june|july|aug|sep|oct|nov|dec|\d{4})\b/gi, '')
        .trim();
      
      return (extracted && extracted.length > 2) 
        ? extracted 
        : (companyName || 'Startup Company');
    };

    const deck1Name = extractCompanyName(deck1.filename, deck1.company_name);
    const deck2Name = extractCompanyName(deck2.filename, deck2.company_name);

    console.log(`   Deck 1: ${deck1Name}`);
    console.log(`   Deck 2: ${deck2Name}`);

    // Get VC Preferences (if available)
    let vcPreferencesData: any = null;
    const userId = comparison.user_id || deck1.uploaded_by || deck2.uploaded_by;
    
    if (userId) {
      try {
        console.log(`🎯 Fetching VC preferences for user: "${userId}"...`);
        const prefResult = await query(
          `SELECT preferences_name, industry, criteria 
           FROM vc_preferences 
           WHERE user_id = $1 
           ORDER BY updated_at DESC 
           LIMIT 1`,
          [userId]
        );
        
        if (prefResult.rows.length > 0) {
          const row = prefResult.rows[0];
          const criteria = typeof row.criteria === 'string' 
            ? JSON.parse(row.criteria) 
            : row.criteria;
          
          const dealbreakerStrings = (criteria.dealbreakers || []).map((db: any) => 
            typeof db === 'string' ? db : db.description || db.text || ''
          ).filter((s: string) => s.length > 0);
          
          const patternStrings = (criteria.patterns || []).map((p: any) => 
            typeof p === 'string' ? p : p.pattern || p.text || p.description || ''
          ).filter((s: string) => s.length > 0);
          
          vcPreferencesData = {
            preferencesName: row.preferences_name,
            industry: row.industry,
            dealbreakers: dealbreakerStrings,
            positivePatterns: patternStrings,
            investmentThesis: criteria.thesis_alignment?.strategic_priorities || criteria.thesis_alignment?.thesis_statement || '',
            contextWeights: criteria.context_weights || [],
            targetSectors: criteria.thesis_alignment?.target_sectors || [],
            targetStages: criteria.thesis_alignment?.target_stages || [],
            targetGeographies: criteria.thesis_alignment?.geography || criteria.thesis_alignment?.target_geographies || []
          };
          console.log(`   ✅ VC Preferences loaded: "${vcPreferencesData.preferencesName}"`);
        }
      } catch (prefErr) {
        console.log(`   ℹ️  No VC preferences found - proceeding without`);
      }
    }

    console.log(`   Parsing comparison analysis...`);
    const analysisData = comparison.comparison_analysis;

    console.log(`   Generating premium comparison PDF...`);

    // Generate premium comparison PDF
    const { generatePremiumComparisonPDF } = await import('../services/premium-comparison-pdf-generator');
    const pdfPath = path.join(__dirname, '../../uploads', `${id}_premium_comparison.pdf`);
    
    await generatePremiumComparisonPDF({
      comparisonId: comparison.id,
      deck1Name,
      deck2Name,
      deck1Data: {
        filename: deck1.filename,
        company_name: deck1.company_name,
        stage: deck1.stage,
        industry: deck1.industry,
        analysis: analysisData.deck1Analysis
      },
      deck2Data: {
        filename: deck2.filename,
        company_name: deck2.company_name,
        stage: deck2.stage,
        industry: deck2.industry,
        analysis: analysisData.deck2Analysis
      },
      comparison: analysisData.comparison,
      vcPreferences: vcPreferencesData,
      createdAt: comparison.created_at
    }, pdfPath);

    console.log(`   ✅ Premium comparison PDF generated: ${pdfPath}`);

    // Send PDF to client
    const fileName = `${deck1Name}_vs_${deck2Name}_Premium_Comparison`
      .replace(/[^a-zA-Z0-9\s-_]/g, '')
      .replace(/\s+/g, '_') + '.pdf';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
    
    fileStream.on('end', () => {
      try {
        fs.unlinkSync(pdfPath);
        console.log(`   ✓ Temp PDF cleaned up: ${pdfPath}`);
      } catch (err) {
        console.error('Error cleaning up temp PDF:', err);
      }
    });

    fileStream.on('error', (error) => {
      console.error('Error streaming PDF:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream PDF' });
      }
    });

  } catch (error: any) {
    console.error('❌ [Premium Comparison] Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate premium comparison report',
      details: error.message 
    });
  }
});

// GET /api/decks/compare/:id/report/:format - Download comparison report in specified format
router.get('/compare/:id/report/:format', async (req: Request, res: Response) => {
  try {
    const { id, format } = req.params;
    
    if (!['txt', 'md', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Use txt, md, or pdf' });
    }

    // Get comparison with analysis
    const comparisonResult = await query(`
      SELECT * FROM deck_comparisons WHERE id = $1
    `, [id]);

    if (comparisonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comparison not found' });
    }

    const comparison = comparisonResult.rows[0];

    if (!comparison.comparison_analysis || comparison.analysis_status !== 'completed') {
      return res.status(400).json({ 
        error: 'Comparison analysis not completed yet' 
      });
    }

    console.log(`\n📊 Generating ${format.toUpperCase()} comparison report for ${id}...`);

    const reportData = {
      comparisonId: comparison.id,
      deck1Name: comparison.deck1_filename,
      deck2Name: comparison.deck2_filename,
      analysis: comparison.comparison_analysis
    };

    // Generate based on format
    if (format === 'txt') {
      const { generateComparisonTextReport } = await import('../services/comparisonReportGenerators');
      const txtReport = generateComparisonTextReport(reportData);
      
      const fileName = `Deck_Comparison_${comparison.id.substring(0, 8)}.txt`;
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.send(txtReport);
    }

    if (format === 'md') {
      const { generateComparisonMarkdownReport } = await import('../services/comparisonReportGenerators');
      const mdReport = generateComparisonMarkdownReport(reportData);
      
      const fileName = `Deck_Comparison_${comparison.id.substring(0, 8)}.md`;
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.send(mdReport);
    }

    if (format === 'pdf') {
      const { default: generateComparisonPDF } = await import('../services/comparisonPdfGenerator');
      
      const pdfPath = await generateComparisonPDF(reportData);

      console.log(`✓ Comparison PDF generated: ${pdfPath}`);

      const fileName = `Deck_Comparison_${comparison.id.substring(0, 8)}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      const fileStream = fs.createReadStream(pdfPath);
      fileStream.pipe(res);
      
      fileStream.on('end', () => {
        try {
          fs.unlinkSync(pdfPath);
          console.log(`✓ Temp PDF cleaned up: ${pdfPath}`);
        } catch (err) {
          console.error('Error cleaning up temp PDF:', err);
        }
      });

      fileStream.on('error', (error) => {
        console.error('Error streaming PDF:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream PDF' });
        }
      });
    }

  } catch (error: any) {
    console.error('Error generating comparison report:', error);
    res.status(500).json({ 
      error: 'Failed to generate comparison report',
      details: error.message 
    });
  }
});

// DELETE /api/decks/bulk - Bulk delete analyzed decks
router.delete('/bulk', async (req: Request, res: Response) => {
  try {
    const { deckIds } = req.body;
    
    if (!deckIds || !Array.isArray(deckIds) || deckIds.length === 0) {
      return res.status(400).json({ error: 'deckIds array is required' });
    }

    console.log(`🗑️ Bulk deleting ${deckIds.length} decks:`, deckIds);

    // Validate all UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const id of deckIds) {
      if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: `Invalid deck ID format: ${id}` });
      }
    }

    // Get file paths for cleanup
    const filesResult = await query(
      'SELECT file_url FROM pitch_decks WHERE id = ANY($1)',
      [deckIds]
    );

    // Delete from database (cascading deletes handle related records)
    const deleteResult = await query(
      'DELETE FROM pitch_decks WHERE id = ANY($1)',
      [deckIds]
    );

    const deletedCount = deleteResult.rowCount || 0;
    console.log(`✅ Deleted ${deletedCount} deck records from database`);

    // Clean up physical files
    let filesDeleted = 0;
    for (const row of filesResult.rows) {
      if (row.file_url) {
        const filePath = path.join(__dirname, '../../', row.file_url);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            filesDeleted++;
          }
        } catch (fileError) {
          console.warn('⚠️ Could not delete file:', fileError);
        }
      }
    }

    console.log(`🗑️ Deleted ${filesDeleted} physical files`);

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} deck(s)`,
      deletedCount,
      filesDeleted
    });

  } catch (error: any) {
    console.error('Error bulk deleting decks:', error);
    res.status(500).json({ 
      error: 'Failed to delete decks',
      details: error.message 
    });
  }
});

// DELETE /api/decks/:id - Delete individual analyzed deck
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid deck ID format' });
    }

    console.log(`🗑️ Deleting deck: ${id}`);

    // Get file info before deletion for cleanup
    const fileResult = await query(
      'SELECT file_url FROM pitch_decks WHERE id = $1',
      [id]
    );

    // Delete from database (cascading deletes handle related records)
    const deleteResult = await query(
      'DELETE FROM pitch_decks WHERE id = $1',
      [id]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    console.log(`✅ Deleted deck record from database`);

    // Clean up physical file
    let fileDeleted = false;
    if (fileResult.rows[0]?.file_url) {
      const filePath = path.join(__dirname, '../../', fileResult.rows[0].file_url);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          fileDeleted = true;
          console.log(`🗑️ Deleted physical file: ${filePath}`);
        }
      } catch (fileError) {
        console.warn('⚠️ Could not delete file:', fileError);
      }
    }

    res.json({ 
      success: true, 
      message: 'Deck deleted successfully',
      fileDeleted 
    });
  } catch (error: any) {
    console.error('Error deleting deck:', error);
    res.status(500).json({ 
      error: 'Failed to delete deck',
      details: error.message 
    });
  }
});

// DELETE /api/decks/comparisons/bulk - Bulk delete deck comparisons
router.delete('/comparisons/bulk', async (req: Request, res: Response) => {
  try {
    const { comparisonIds } = req.body;
    
    if (!comparisonIds || !Array.isArray(comparisonIds) || comparisonIds.length === 0) {
      return res.status(400).json({ error: 'comparisonIds array is required' });
    }

    console.log(`🗑️ Bulk deleting ${comparisonIds.length} comparisons:`, comparisonIds);

    // Validate all UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const id of comparisonIds) {
      if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: `Invalid comparison ID format: ${id}` });
      }
    }

    // Delete from database
    const deleteResult = await query(
      'DELETE FROM deck_comparisons WHERE id = ANY($1)',
      [comparisonIds]
    );

    const deletedCount = deleteResult.rowCount || 0;
    console.log(`✅ Deleted ${deletedCount} comparison records from database`);

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} comparison(s)`,
      deletedCount
    });

  } catch (error: any) {
    console.error('Error bulk deleting comparisons:', error);
    res.status(500).json({ 
      error: 'Failed to delete comparisons',
      details: error.message 
    });
  }
});

// DELETE /api/decks/comparisons/:id - Delete individual comparison
router.delete('/comparisons/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid comparison ID format' });
    }

    console.log(`🗑️ Deleting comparison: ${id}`);

    // Delete from database
    const deleteResult = await query(
      'DELETE FROM deck_comparisons WHERE id = $1',
      [id]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ error: 'Comparison not found' });
    }

    console.log(`✅ Deleted comparison record from database`);

    res.json({ 
      success: true, 
      message: 'Comparison deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting comparison:', error);
    res.status(500).json({ 
      error: 'Failed to delete comparison',
      details: error.message 
    });
  }
});

// Deprecated: old PDF-only route (kept for backward compatibility)
router.get('/compare/:id/report', async (req: Request, res: Response) => {
  // Redirect to PDF format
  return res.redirect(`/decks/compare/${req.params.id}/report/pdf`);
});

export default router;
