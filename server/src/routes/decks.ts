import { Router, Request, Response } from 'express';
import { query } from '../db';
import { analyzeDualPDFs, analyzePitchDeckFromPDF, analyzePitchDeckWithGrounding } from '../services/ai-enhanced';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for dual file uploads (pitch deck + checklist)
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
    const prefix = file.fieldname === 'checklist' ? 'checklist' : 'deck';
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
      SELECT d.*, c.name as company_name 
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

// POST /api/decks/upload-dual - Upload BOTH pitch deck AND checklist with comprehensive AI analysis
router.post('/upload-dual', upload.fields([
  { name: 'deck', maxCount: 1 },
  { name: 'checklist', maxCount: 1 }
]), async (req: Request, res: Response) => {
  try {
    console.log('📥 Received dual PDF upload request');
    console.log('Request body:', req.body);
    console.log('Files received:', req.files ? Object.keys(req.files) : 'none');
    
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files || !files.deck || !files.checklist) {
      console.error('❌ Missing files:', {
        hasFiles: !!files,
        hasDeck: !!files?.deck,
        hasChecklist: !!files?.checklist
      });
      return res.status(400).json({ 
        error: 'Both pitch deck and checklist PDFs are required',
        received: {
          deck: !!files?.deck,
          checklist: !!files?.checklist
        }
      });
    }

    const deckFile = files.deck[0];
    const checklistFile = files.checklist[0];
    const { company_id, uploaded_by, additional_context } = req.body;
    
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
    
    const deckPath = `/uploads/${deckFile.filename}`;
    const checklistPath = `/uploads/${checklistFile.filename}`;

    // Insert record with both file paths
    const result = await query(`
      INSERT INTO pitch_decks 
      (company_id, uploaded_by, filename, file_url, deck_file_path, checklist_file_path, 
       file_size, file_type, analysis_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      company_id,
      null, // Set to NULL to avoid foreign key constraint (uploaded_by is now nullable)
      deckFile.originalname, // Primary filename
      deckPath, // Legacy field
      deckPath, // New deck-specific path
      checklistPath, // New checklist path
      deckFile.size + checklistFile.size, // Total size
      'application/pdf',
      'pending'
    ]);

    const deckId = result.rows[0].id;

    // Trigger comprehensive dual PDF analysis
    setTimeout(async () => {
      try {
        console.log(`🚀 Starting DUAL PDF analysis for deck ${deckId}...`);
        console.log(`  - Pitch Deck: ${deckFile.originalname}`);
        console.log(`  - Checklist: ${checklistFile.originalname}`);
        
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
        const fullChecklistPath = path.join(__dirname, '../../', deck.checklist_file_path);

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
              console.log(`   Criteria count: ${vcPreferences.criteria?.length || 0}`);
              if (vcPreferences.criteria?.length > 0) {
                console.log(`   Weights: ${vcPreferences.criteria.map(c => `${c.name}=${c.weight}%`).join(', ')}`);
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
        
        let analysis, sections, checklistItems, webEnrichment, groundingMetadata;
        
        if (useGrounding) {
          const result = await analyzePitchDeckWithGrounding(
            fullDeckPath,
            fullChecklistPath,
            deck.company_name || 'the company',
            industry,
            parsedContext, // Pass the VC context here
            vcPreferences // Pass VC preferences to influence analysis
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
          if (vcPreferences) {
            console.log(`🎯 Analysis used custom VC evaluation weights from "${vcPreferences.preferencesName}"`);
          }
          console.log(`   Web sources used: ${groundingMetadata?.webSources?.length || 0}`);
          console.log(`   Fact-checks: ${webEnrichment?.factChecks?.verified?.length || 0} verified, ${webEnrichment?.factChecks?.discrepancies?.length || 0} discrepancies`);
        } else {
          // Fallback to standard analysis
          const result = await analyzeDualPDFs(
            fullDeckPath,
            fullChecklistPath,
            deck.company_name || 'the company',
            vcPreferences // Pass VC preferences here too
          );
          analysis = result.analysis;
          sections = result.sections;
          checklistItems = result.checklistItems;
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
                web_enrichment = $3,
                vc_preferences_used = $4,
                analyzed_at = CURRENT_TIMESTAMP
            WHERE id = $5
          `, [
            analysis.overallScore / 100, 
            JSON.stringify(analysis), // Store full overallAnalysis object
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
          if (vcPreferences) {
            console.log(`   🎯 VC Preferences: "${vcPreferences.preferencesName}" (${vcPreferences.industry})`);
          }
        } else {
          await query(`
            UPDATE pitch_decks 
            SET analysis_status = 'completed', 
                sso_score = $1, 
                dual_pdf_analysis = $2,
                vc_preferences_used = $3,
                analyzed_at = CURRENT_TIMESTAMP
            WHERE id = $4
          `, [
            analysis.overallScore / 100, 
            JSON.stringify(analysis), // Store full overallAnalysis object
            vcPreferences ? JSON.stringify(vcPreferences) : null,
            deckId
          ]);

          console.log(`✅ DUAL PDF Analysis complete for deck ${deckId}!`);
          console.log(`   Overall Score: ${analysis.overallScore}/100`);
          if (vcPreferences) {
            console.log(`   🎯 VC Preferences: "${vcPreferences.preferencesName}" (${vcPreferences.industry})`);
          }
        }        console.log(`   Checklist Items Verified: ${analysis.checklistVerification.verifiedItems.length}`);
        console.log(`   Recommendation: ${analysis.recommendation}`);
      } catch (error) {
        console.error(`❌ Dual PDF Analysis failed for deck ${deckId}:`, error);
        await query(`UPDATE pitch_decks SET analysis_status = 'failed' WHERE id = $1`, [deckId]);
      }
    }, 1000);

    res.status(201).json({
      deck: result.rows[0],
      message: 'Pitch deck and checklist uploaded successfully! Comprehensive AI analysis started.',
      files: {
        deck: deckFile.originalname,
        checklist: checklistFile.originalname
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

// GET /api/decks/:id - Get deck details with analysis
router.get('/:id', async (req: Request, res: Response) => {
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
      sections_count: sectionsResult.rows.length
    });
    
    if (deck.dual_pdf_analysis && deck.analysis_status === 'completed') {
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
    } else {
      console.log('❌ Not creating analysis object - missing data or status not completed');
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
      vcPreferencesUsed: deck.vc_preferences_used || undefined
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

// GET /api/decks/:id/report/:format - Download report in specified format (txt, md, pdf)
router.get('/:id/report/:format', async (req: Request, res: Response) => {
  try {
    const { id, format } = req.params;
    
    if (!['txt', 'md', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Use txt, md, or pdf' });
    }

    // Get deck with full analysis
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

    console.log(`\n📊 Regular Report - Company Name Extraction:`);
    console.log(`   Filename: "${deck.filename}"`);
    console.log(`   Database name: "${deck.company_name || 'NULL'}"`);
    console.log(`   Extracted name: "${extractedCompanyName}"`);
    console.log(`   ✅ Final name: "${finalCompanyName}"\n`);

    const reportData = {
      deck: {
        id: deck.id,
        file_name: deck.filename,
        company_name: finalCompanyName,  // ✅ Use extracted name
        uploaded_at: deck.created_at,
        analyzed_at: deck.analyzed_at
      },
      analysis: deck.dual_pdf_analysis,
      sections: sections
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

export default router;
