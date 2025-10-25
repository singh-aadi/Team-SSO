import fs from 'fs';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';
import path from 'path';
import { VertexAI } from '@google-cloud/vertexai';
// @ts-ignore - pptx2json doesn't have TypeScript definitions
import pptx2json from 'pptx2json';

const PROJECT_ID = 'projectsso-473108';
const LOCATION = 'us-central1';
const MODEL = 'gemini-2.0-flash-exp';

/**
 * Extract text content from various file formats
 * Supports: .txt, .pdf, .docx, .doc, .ppt, .pptx, .mp3, .wav, .m4a, .mp4
 * @param filePath - Absolute path to the file
 * @param ext - File extension (e.g., '.txt', '.pdf', '.docx', '.mp3')
 * @returns Extracted text content
 */
export async function extractTextFromFile(filePath: string, ext: string): Promise<string> {
  try {
    const normalizedExt = ext.toLowerCase();
    
    console.log(`📄 Extracting text from: ${path.basename(filePath)} (${normalizedExt})`);

    switch (normalizedExt) {
      case '.txt':
        // Simple text file - just read directly
        console.log('   Type: Plain text');
        return fs.readFileSync(filePath, 'utf-8');
      
      case '.docx':
      case '.doc':
        // Word documents - use mammoth
        console.log('   Type: Word document');
        const docResult = await mammoth.extractRawText({ path: filePath });
        return docResult.value;
      
      case '.pdf':
        // PDF files - use pdf-parse
        console.log('   Type: PDF document');
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdf(dataBuffer);
        return pdfData.text;
      
      case '.ppt':
      case '.pptx':
        // PowerPoint files - use pptx2json
        console.log('   Type: PowerPoint presentation');
        return await extractTextFromPowerPoint(filePath);
      
      case '.mp3':
      case '.wav':
      case '.m4a':
      case '.mp4':
        // Audio/Video files - use Gemini's native audio understanding
        console.log('   Type: Audio/Video file - transcribing with Gemini');
        return await transcribeWithGemini(filePath);
      
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (error: any) {
    console.error(`❌ Error extracting text from ${filePath}:`, error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

/**
 * Validate if a file type is supported
 * @param filename - Name of the file
 * @returns True if supported, false otherwise
 */
export function isSupportedFileType(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return [
    '.txt', '.pdf', '.docx', '.doc',      // Documents
    '.ppt', '.pptx',                      // PowerPoint
    '.mp3', '.wav', '.m4a', '.mp4'        // Audio/Video
  ].includes(ext);
}

/**
 * Get human-readable file type
 * @param filename - Name of the file
 * @returns File type description
 */
export function getFileType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  
  switch (ext) {
    case '.txt':
      return 'Text Document';
    case '.pdf':
      return 'PDF Document';
    case '.docx':
    case '.doc':
      return 'Word Document';
    case '.ppt':
      return 'PowerPoint (PPT)';
    case '.pptx':
      return 'PowerPoint (PPTX)';
    case '.mp3':
      return 'Audio File (MP3)';
    case '.wav':
      return 'Audio File (WAV)';
    case '.m4a':
      return 'Audio File (M4A)';
    case '.mp4':
      return 'Video File (MP4)';
    default:
      return 'Unknown';
  }
}

/**
 * Extract text from PowerPoint (.ppt, .pptx)
 */
async function extractTextFromPowerPoint(pptPath: string): Promise<string> {
  try {
    console.log(`   📊 Parsing PowerPoint slides...`);
    
    // Parse PowerPoint to JSON
    const slides = await pptx2json(pptPath);
    
    let extractedText = '';
    
    // Extract text from each slide
    if (Array.isArray(slides)) {
      slides.forEach((slide: any, index: number) => {
        extractedText += `\n\n--- SLIDE ${index + 1} ---\n`;
        
        // Extract text from shapes
        if (slide.shapes && Array.isArray(slide.shapes)) {
          slide.shapes.forEach((shape: any) => {
            if (shape.text) {
              extractedText += shape.text + '\n';
            }
          });
        }
        
        // Extract text from content
        if (slide.content) {
          extractedText += slide.content + '\n';
        }
      });
    }
    
    if (!extractedText.trim()) {
      throw new Error('No text content found in PowerPoint file');
    }
    
    console.log(`   ✅ Extracted ${extractedText.length} characters from ${slides.length} slides`);
    return extractedText;
  } catch (error: any) {
    console.error(`   ❌ PowerPoint extraction failed:`, error);
    throw new Error(`Failed to extract text from PowerPoint: ${error.message}`);
  }
}

/**
 * Transcribe audio/video using Gemini's native audio understanding
 * Supports: mp3, wav, m4a, mp4 (up to 8.4 hours)
 */
async function transcribeWithGemini(filePath: string): Promise<string> {
  const vertexAI = new VertexAI({
    project: PROJECT_ID,
    location: LOCATION,
  });

  const model = vertexAI.getGenerativeModel({ model: MODEL });

  try {
    // Read file and convert to base64
    const fileBuffer = fs.readFileSync(filePath);
    const base64Audio = fileBuffer.toString('base64');
    const ext = path.extname(filePath).toLowerCase();

    // Determine MIME type
    const mimeTypes: Record<string, string> = {
      '.mp3': 'audio/mp3',
      '.wav': 'audio/wav',
      '.m4a': 'audio/m4a',
      '.mp4': 'audio/mp4',
    };

    const mimeType = mimeTypes[ext] || 'audio/mp3';

    console.log(`   🎤 Sending ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB ${ext} to Gemini for transcription...`);

    // Use Gemini's multimodal audio understanding
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Audio,
              },
            },
            {
              text: `Please provide a detailed transcription of this audio/video. Include:
1. Full verbatim transcript with speaker identification if multiple speakers
2. Key discussion points and topics covered
3. Important dates, numbers, or metrics mentioned
4. Action items or decisions made
5. Overall summary and context

Format the output clearly with sections.`,
            },
          ],
        },
      ],
    });

    const transcription = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!transcription) {
      throw new Error('No transcription returned from Gemini');
    }

    console.log(`   ✅ Transcription complete: ${transcription.substring(0, 100)}...`);
    return transcription;

  } catch (error: any) {
    console.error(`   ❌ Gemini transcription failed:`, error);
    throw new Error(`Audio transcription failed: ${error.message}`);
  }
}
