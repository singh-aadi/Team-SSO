import { Router, Request, Response } from 'express';
import { query } from '../db';
import { analyzeDualPDFs, analyzePitchDeckFromPDF } from '../services/ai-enhanced';
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
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit per file
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.doc'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents (.docx, .doc) are allowed'));
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
    const { company_id, uploaded_by } = req.body;
    
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

        console.log('📊 Analyzing pitch deck visuals, checklist requirements...');
        const { analysis, sections, checklistItems } = await analyzeDualPDFs(
          fullDeckPath,
          fullChecklistPath,
          deck.company_name || 'the company'
        );

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
        await query(`
          UPDATE pitch_decks 
          SET analysis_status = 'completed', 
              sso_score = $1, 
              dual_pdf_analysis = $2,
              analyzed_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [
          analysis.overallScore / 100, 
          JSON.stringify(analysis), // Store full overallAnalysis object
          deckId
        ]);

        console.log(`✅ DUAL PDF Analysis complete for deck ${deckId}!`);
        console.log(`   Overall Score: ${analysis.overallScore}/100`);
        console.log(`   Checklist Items Verified: ${analysis.checklistVerification.verifiedItems.length}`);
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

        const pdfPath = path.join(__dirname, '../../', deck.file_url);
        const { analysis, sections } = await analyzePitchDeckFromPDF(pdfPath, deck.company_name);

        for (const section of sections) {
          await query(`
            INSERT INTO deck_analysis 
            (deck_id, section_name, section_score, feedback, strengths, improvements)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [deckId, section.sectionName, section.sectionScore / 100, section.feedback, section.strengths, section.improvements]);
        }

        await query(`
          UPDATE pitch_decks 
          SET analysis_status = 'completed', sso_score = $1, analyzed_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [analysis.overallScore / 100, deckId]);

        console.log(`✅ AI Analysis complete for deck ${deckId}! Score: ${analysis.overallScore}`);
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
        analysis: analysis
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

      // Analyze with REAL AI
      console.log(`🤖 Analyzing deck for ${deck.company_name || 'company'} with Gemini AI...`);
      const { analysis, sections } = await analyzePitchDeckFromPDF(
        filePath, 
        deck.company_name || 'the company'
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
            analyzed_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [analysis.overallScore / 100, id]); // Convert to 0-1 scale

      res.json({
        message: 'AI Analysis completed successfully!',
        sso_score: (analysis.overallScore / 100).toFixed(2),
        analysis: {
          overall: analysis,
          sections: sections
        }
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

    const reportData = {
      deck: {
        id: deck.id,
        file_name: deck.filename,
        company_name: deck.company_name,
        uploaded_at: deck.created_at,
        analyzed_at: deck.analyzed_at
      },
      analysis: deck.dual_pdf_analysis,
      sections: sections
    };

    const { generateTextReport, generateMarkdownReport, generatePDFReport } = await import('../services/report-generator');

    if (format === 'txt') {
      const txtReport = generateTextReport(reportData);
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${deck.company_name}_analysis_report.txt"`);
      return res.send(txtReport);
    }

    if (format === 'md') {
      const mdReport = generateMarkdownReport(reportData);
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="${deck.company_name}_analysis_report.md"`);
      return res.send(mdReport);
    }

    if (format === 'pdf') {
      const pdfPath = path.join(__dirname, '../../uploads', `${id}_report.pdf`);
      await generatePDFReport(reportData, pdfPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${deck.company_name}_analysis_report.pdf"`);
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
