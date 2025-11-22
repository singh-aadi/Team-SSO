import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query } from '../db';
import { extractTextFromFile, isSupportedFileType } from '../services/fileExtractor';
import { synthesizeVCContext, getLatestSummary } from '../services/contextSynthesizer';
import { processAudioFile } from '../services/speechToText';

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

    // Parse metadata first so it can be used in audio processing
    let parsedMetadata: any = {};
    try {
      parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    } catch (e) {
      parsedMetadata = {};
    }

    console.log(`📄 Processing file: ${req.file.originalname}`);
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    // Check if file is audio/video - use Speech-to-Text API
    const audioFormats = ['.mp3', '.wav', '.m4a', '.mp4', '.flac', '.ogg'];
    const isAudioFile = audioFormats.includes(ext);
    
    // Extract text content
    let content = '';
    let extractionMetadata: any = {};
    
    try {
      if (isAudioFile) {
        console.log('🎙️ Detected audio file - using Speech-to-Text API');
        
        // Process audio with full pipeline (transcribe + summarize + format)
        const audioResult = await processAudioFile(req.file.path, {
          companyName: parsedMetadata?.companyName,
          meetingType: type,
        });
        
        // Store formatted transcript with speaker labels and timestamps
        content = `=== AUDIO TRANSCRIPT ===\n\n`;
        content += `Duration: ${Math.floor(audioResult.transcription.duration / 60)}m ${Math.floor(audioResult.transcription.duration % 60)}s\n`;
        content += `Confidence: ${(audioResult.transcription.confidence * 100).toFixed(1)}%\n`;
        content += `Language: ${audioResult.transcription.language}\n\n`;
        
        // Add AI-generated summary
        if (audioResult.summary) {
          content += `=== EXECUTIVE SUMMARY ===\n${audioResult.summary.summary}\n\n`;
          
          if (audioResult.summary.keyPoints.length > 0) {
            content += `=== KEY POINTS ===\n`;
            audioResult.summary.keyPoints.forEach((point, i) => {
              content += `${i + 1}. ${point}\n`;
            });
            content += '\n';
          }
          
          if (audioResult.summary.concerns.length > 0) {
            content += `=== CONCERNS & RED FLAGS ===\n`;
            audioResult.summary.concerns.forEach((concern, i) => {
              content += `${i + 1}. ${concern}\n`;
            });
            content += '\n';
          }
          
          if (audioResult.summary.positiveSignals.length > 0) {
            content += `=== POSITIVE SIGNALS ===\n`;
            audioResult.summary.positiveSignals.forEach((signal, i) => {
              content += `${i + 1}. ${signal}\n`;
            });
            content += '\n';
          }
          
          if (audioResult.summary.actionItems.length > 0) {
            content += `=== ACTION ITEMS ===\n`;
            audioResult.summary.actionItems.forEach((item, i) => {
              content += `${i + 1}. ${item}\n`;
            });
            content += '\n';
          }
        }
        
        // Add key moments timeline
        if (audioResult.transcription.keyMoments && audioResult.transcription.keyMoments.length > 0) {
          content += `=== KEY MOMENTS ===\n`;
          audioResult.transcription.keyMoments.forEach((moment) => {
            const mins = Math.floor(moment.timestamp / 60);
            const secs = Math.floor(moment.timestamp % 60);
            const timestamp = `${mins}:${secs.toString().padStart(2, '0')}`;
            content += `[${timestamp}] [${moment.importance.toUpperCase()}] ${moment.text}\n`;
          });
          content += '\n';
        }
        
        // Add full formatted transcript
        content += `=== FULL TRANSCRIPT ===\n${audioResult.formatted}\n`;
        
        // Store transcription metadata for future use
        extractionMetadata = {
          type: 'audio_transcription',
          duration: audioResult.transcription.duration,
          confidence: audioResult.transcription.confidence,
          language: audioResult.transcription.language,
          speakerCount: audioResult.transcription.speakers?.length || 0,
          keyMoments: audioResult.transcription.keyMoments?.length || 0,
          processingMethod: 'google-speech-to-text-api',
        };
        
        console.log(`✅ Transcribed ${content.length} characters from audio (${Math.floor(audioResult.transcription.duration / 60)}m ${Math.floor(audioResult.transcription.duration % 60)}s)`);
      } else {
        // Use existing text extraction for documents
        content = await extractTextFromFile(req.file.path, ext);
        extractionMetadata = {
          type: 'document_extraction',
          processingMethod: 'file-extractor',
        };
        console.log(`✅ Extracted ${content.length} characters of text from document`);
      }
    } catch (extractError: any) {
      console.error('❌ Content extraction failed:', extractError);
      // Still save the file even if extraction fails
      content = `[Content extraction failed: ${extractError.message}]`;
      extractionMetadata = {
        type: 'extraction_failed',
        error: extractError.message,
      };
    }
    
    // Merge extraction metadata with user metadata
    const finalMetadata = {
      ...parsedMetadata,
      ...extractionMetadata,
    };
    
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
        finalMetadata
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
