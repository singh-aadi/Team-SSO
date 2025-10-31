import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query } from '../db';
import { extractTextFromFile, isSupportedFileType } from '../services/fileExtractor';
import { synthesizeVCContext, getLatestSummary } from '../services/contextSynthesizer';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/vc-context');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `context-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB limit (increased for audio/video files)
  },
  fileFilter: (req, file, cb) => {
    if (isSupportedFileType(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Supported: .txt, .pdf, .docx, .doc, .ppt, .pptx, .mp3, .wav, .m4a, .mp4'));
    }
  }
});

// POST /api/vc-context/upload - Upload a context file
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    console.log('📥 Received context upload request');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { deckId, type = 'meeting-notes', metadata = '{}' } = req.body;
    
    if (!deckId) {
      // Clean up uploaded file if deckId is missing
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'deckId is required' });
    }

    console.log(`📄 Processing file: ${req.file.originalname}`);
    const ext = path.extname(req.file.originalname);
    
    // Extract text content
    let content = '';
    try {
      content = await extractTextFromFile(req.file.path, ext);
      console.log(`✅ Extracted ${content.length} characters of text`);
    } catch (extractError: any) {
      console.error('❌ Text extraction failed:', extractError);
      // Still save the file even if extraction fails
      content = `[Text extraction failed: ${extractError.message}]`;
    }
    
    // Parse metadata
    let parsedMetadata = {};
    try {
      parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    } catch (e) {
      parsedMetadata = {};
    }
    
    // Save to database
    const result = await query(
      `INSERT INTO vc_context_items 
       (deck_id, file_path, file_name, file_type, content_text, metadata, upload_date)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        deckId,
        req.file.path,
        req.file.originalname,
        type,
        content,
        parsedMetadata
      ]
    );
    
    console.log('💾 Context item saved to database');
    
    res.json({ 
      success: true, 
      item: result.rows[0]
    });
  } catch (error: any) {
    console.error('❌ Upload error:', error);
    
    // Clean up file if database save fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to upload context',
      details: error.message 
    });
  }
});

// GET /api/vc-context/:deckId - Get all context items for a deck
router.get('/:deckId', async (req: Request, res: Response) => {
  try {
    const { deckId } = req.params;
    
    const result = await query(
      `SELECT 
        id, deck_id, file_name, file_type, 
        upload_date, metadata, created_at,
        LENGTH(content_text) as content_length
       FROM vc_context_items 
       WHERE deck_id = $1 
       ORDER BY created_at DESC`,
      [deckId]
    );
    
    res.json({ 
      success: true,
      items: result.rows 
    });
  } catch (error: any) {
    console.error('❌ Fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch context items',
      details: error.message 
    });
  }
});

// GET /api/vc-context/item/:contextId - Get a specific context item with full content
router.get('/item/:contextId', async (req: Request, res: Response) => {
  try {
    const { contextId } = req.params;
    
    const result = await query(
      'SELECT * FROM vc_context_items WHERE id = $1',
      [contextId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Context item not found' });
    }
    
    res.json({ 
      success: true,
      item: result.rows[0] 
    });
  } catch (error: any) {
    console.error('❌ Fetch item error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch context item',
      details: error.message 
    });
  }
});

// POST /api/vc-context/synthesize/:deckId - Generate AI summary
router.post('/synthesize/:deckId', async (req: Request, res: Response) => {
  try {
    const { deckId } = req.params;
    
    console.log(`🤖 Starting synthesis for deck: ${deckId}`);
    const result = await synthesizeVCContext(deckId);
    
    res.json(result);
  } catch (error: any) {
    console.error('❌ Synthesis error:', error);
    res.status(500).json({ 
      error: 'Failed to synthesize context',
      details: error.message 
    });
  }
});

// GET /api/vc-context/summary/:deckId - Get latest summary for a deck
router.get('/summary/:deckId', async (req: Request, res: Response) => {
  try {
    const { deckId } = req.params;
    
    const summary = await getLatestSummary(deckId);
    
    if (!summary) {
      return res.status(404).json({ 
        error: 'No summary found. Generate one first.' 
      });
    }
    
    res.json({ 
      success: true,
      summary 
    });
  } catch (error: any) {
    console.error('❌ Get summary error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch summary',
      details: error.message 
    });
  }
});

// DELETE /api/vc-context/:contextId - Delete a context item
router.delete('/:contextId', async (req: Request, res: Response) => {
  try {
    const { contextId } = req.params;
    
    // Get file path before deleting
    const itemResult = await query(
      'SELECT file_path FROM vc_context_items WHERE id = $1',
      [contextId]
    );
    
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Context item not found' });
    }
    
    // Delete file from filesystem
    const filePath = itemResult.rows[0].file_path;
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted file: ${filePath}`);
    }
    
    // Delete from database
    await query('DELETE FROM vc_context_items WHERE id = $1', [contextId]);
    
    console.log(`✅ Deleted context item: ${contextId}`);
    res.json({ success: true });
  } catch (error: any) {
    console.error('❌ Delete error:', error);
    res.status(500).json({ 
      error: 'Failed to delete context',
      details: error.message 
    });
  }
});

export default router;
