/**
 * 🎙️ Speech-to-Text Service
 * 
 * Uses Google Cloud Speech-to-Text API to transcribe audio files
 * uploaded as VC Context (meeting recordings, founder calls, etc.)
 * 
 * Supported formats: MP3, WAV, M4A, MP4, FLAC, OGG
 * Max file size: 100MB
 * 
 * Features:
 * - Automatic language detection
 * - Speaker diarization (who said what)
 * - Punctuation and formatting
 * - Timestamps for key moments
 */

import { SpeechClient, protos } from '@google-cloud/speech';
import fs from 'fs';
import path from 'path';
import { getActiveGeminiModel } from '../utils/gemini-model';

const client = new SpeechClient({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'projectsso-473108',
  keyFilename: path.join(__dirname, '../../service-account-key.json'),
});

interface TranscriptionResult {
  transcript: string;
  confidence: number;
  speakers?: Array<{
    speaker: number;
    text: string;
    startTime: number;
    endTime: number;
  }>;
  keyMoments?: Array<{
    timestamp: number;
    text: string;
    importance: 'high' | 'medium' | 'low';
  }>;
  summary?: string;
  language: string;
  duration: number;
}

/**
 * Detects audio encoding from file extension
 */
function getAudioEncoding(filePath: string): any {
  const ext = path.extname(filePath).toLowerCase();
  const AudioEncoding = protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding;
  const encodingMap: { [key: string]: any } = {
    '.mp3': AudioEncoding.MP3,
    '.wav': AudioEncoding.LINEAR16,
    '.flac': AudioEncoding.FLAC,
    '.ogg': AudioEncoding.OGG_OPUS,
    '.m4a': AudioEncoding.MP3, // M4A often works as MP3
    '.mp4': AudioEncoding.MP3,
  };
  return encodingMap[ext] || AudioEncoding.LINEAR16;
}

/**
 * 🎯 Main transcription function
 * Transcribes audio file to text with speaker diarization
 */
export async function transcribeAudio(filePath: string, options: {
  enableSpeakerDiarization?: boolean;
  languageCode?: string;
  sampleRateHertz?: number;
} = {}): Promise<TranscriptionResult> {
  console.log(`🎙️ Starting transcription for: ${path.basename(filePath)}`);

  try {
    // Read audio file
    const audioBytes = fs.readFileSync(filePath);
    const audioContent = audioBytes.toString('base64');

    // Detect encoding from file extension
    const encoding = getAudioEncoding(filePath);

    // Configuration
    const config: any = {
      encoding,
      sampleRateHertz: options.sampleRateHertz || 16000,
      languageCode: options.languageCode || 'en-US',
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
      model: 'default',
      useEnhanced: true,
      metadata: {
        interactionType: 'DISCUSSION',
        industryNaicsCodeOfAudio: 541510, // Computer Systems Design (VC/Startup context)
        microphoneDistance: 'NEARFIELD',
        recordingDeviceType: 'SMARTPHONE',
      },
    };

    // Enable speaker diarization if requested
    if (options.enableSpeakerDiarization !== false) {
      config.diarizationConfig = {
        enableSpeakerDiarization: true,
        minSpeakerCount: 2,
        maxSpeakerCount: 6, // Support up to 6 speakers (e.g., IC meetings)
      };
    }

    const audio = { content: audioContent };
    const request = { config, audio };

    // Perform transcription
    console.log('🔄 Sending audio to Google Speech-to-Text API...');
    const [response] = await client.recognize(request);

    if (!response.results || response.results.length === 0) {
      throw new Error('No transcription results returned');
    }

    // Extract transcript
    const transcription = response.results
      .map((result: any) => result.alternatives?.[0]?.transcript || '')
      .join('\n');

    // Calculate average confidence
    const confidences = response.results
      .map((result: any) => result.alternatives?.[0]?.confidence || 0)
      .filter((c: number) => c > 0);
    const avgConfidence = confidences.length > 0
      ? confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length
      : 0;

    // Extract speaker diarization if available
    const speakers: Array<{
      speaker: number;
      text: string;
      startTime: number;
      endTime: number;
    }> = [];

    if (config.diarizationConfig?.enableSpeakerDiarization) {
      const words = response.results
        .flatMap((result: any) => result.alternatives?.[0]?.words || []);

      let currentSpeaker = -1;
      let currentText = '';
      let currentStart = 0;
      let currentEnd = 0;

      words.forEach((word: any) => {
        const speakerTag = word.speakerTag || 0;
        const startTime = word.startTime?.seconds || 0;
        const endTime = word.endTime?.seconds || 0;

        if (speakerTag !== currentSpeaker) {
          // Save previous speaker segment
          if (currentSpeaker !== -1 && currentText.trim()) {
            speakers.push({
              speaker: currentSpeaker,
              text: currentText.trim(),
              startTime: currentStart,
              endTime: currentEnd,
            });
          }

          // Start new segment
          currentSpeaker = speakerTag;
          currentText = word.word;
          currentStart = startTime;
          currentEnd = endTime;
        } else {
          currentText += ' ' + word.word;
          currentEnd = endTime;
        }
      });

      // Save last segment
      if (currentSpeaker !== -1 && currentText.trim()) {
        speakers.push({
          speaker: currentSpeaker,
          text: currentText.trim(),
          startTime: currentStart,
          endTime: currentEnd,
        });
      }
    }

    // Estimate duration from last word's end time
    const lastWord = response.results
      .flatMap((result: any) => result.alternatives?.[0]?.words || [])
      .pop();
    const duration = lastWord?.endTime?.seconds || 0;

    console.log(`✅ Transcription complete: ${transcription.length} chars, ${speakers.length} speaker segments`);

    return {
      transcript: transcription,
      confidence: avgConfidence,
      speakers: speakers.length > 0 ? speakers : undefined,
      language: config.languageCode,
      duration,
    };
  } catch (error: any) {
    console.error('❌ Transcription failed:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

/**
 * 🧠 AI-Powered Transcript Summarization
 * Uses Vertex AI to extract key points from transcripts
 */
export async function summarizeTranscript(
  transcript: string,
  context: {
    companyName?: string;
    meetingType?: string; // 'founder_call' | 'ic_discussion' | 'due_diligence'
  } = {}
): Promise<{
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  concerns: string[];
  positiveSignals: string[];
}> {
  const { VertexAI } = await import('@google-cloud/vertexai');

  const vertexAI = new VertexAI({
    project: process.env.GOOGLE_CLOUD_PROJECT || 'projectsso-473108',
    location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
  });

  const model = vertexAI.getGenerativeModel({
    model: getActiveGeminiModel(),
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 2048,
    },
  });

  const prompt = `You are analyzing a VC meeting transcript.

${context.companyName ? `Company: ${context.companyName}` : ''}
${context.meetingType ? `Meeting Type: ${context.meetingType}` : ''}

Transcript:
${transcript.substring(0, 10000)} // Limit to first 10k chars for context

Extract:
1. A 100-word executive summary
2. Key points discussed (5-7 bullets)
3. Action items mentioned
4. Concerns or red flags raised
5. Positive signals or strengths highlighted

Return JSON:
{
  "summary": "...",
  "keyPoints": ["...", "..."],
  "actionItems": ["...", "..."],
  "concerns": ["...", "..."],
  "positiveSignals": ["...", "..."]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }

    // Fallback
    return {
      summary: transcript.substring(0, 500) + '...',
      keyPoints: [],
      actionItems: [],
      concerns: [],
      positiveSignals: [],
    };
  } catch (error) {
    console.error('❌ Transcript summarization failed:', error);
    return {
      summary: transcript.substring(0, 500) + '...',
      keyPoints: [],
      actionItems: [],
      concerns: [],
      positiveSignals: [],
    };
  }
}

/**
 * 🎯 Identify Key Moments
 * Extracts timestamps of important discussion points
 */
export function identifyKeyMoments(
  speakers: Array<{
    speaker: number;
    text: string;
    startTime: number;
    endTime: number;
  }>
): Array<{
  timestamp: number;
  text: string;
  importance: 'high' | 'medium' | 'low';
}> {
  const keyMoments: Array<{
    timestamp: number;
    text: string;
    importance: 'high' | 'medium' | 'low';
  }> = [];

  // Keywords that indicate important moments
  const highImportanceKeywords = [
    'funding', 'investment', 'revenue', 'growth rate', 'valuation',
    'concern', 'risk', 'issue', 'problem', 'worried',
    'excited', 'impressed', 'strong team', 'competitive advantage',
  ];

  const mediumImportanceKeywords = [
    'customer', 'market', 'product', 'competition', 'strategy',
    'timeline', 'milestone', 'metric', 'question',
  ];

  speakers.forEach((segment) => {
    const lowerText = segment.text.toLowerCase();

    // Check for high importance keywords
    const hasHighKeyword = highImportanceKeywords.some((keyword) =>
      lowerText.includes(keyword)
    );

    // Check for medium importance keywords
    const hasMediumKeyword = mediumImportanceKeywords.some((keyword) =>
      lowerText.includes(keyword)
    );

    if (hasHighKeyword || hasMediumKeyword) {
      keyMoments.push({
        timestamp: segment.startTime,
        text: segment.text.substring(0, 150) + '...', // First 150 chars
        importance: hasHighKeyword ? 'high' : 'medium',
      });
    }
  });

  return keyMoments;
}

/**
 * 📊 Format transcript with timestamps and speakers
 * Creates a readable, formatted version of the transcript
 */
export function formatTranscript(
  speakers: Array<{
    speaker: number;
    text: string;
    startTime: number;
    endTime: number;
  }>
): string {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return speakers
    .map((segment) => {
      const timestamp = formatTime(segment.startTime);
      return `[${timestamp}] Speaker ${segment.speaker}: ${segment.text}`;
    })
    .join('\n\n');
}

/**
 * 🚀 Full Pipeline: Transcribe + Summarize + Format
 * One-stop function for complete audio processing
 */
export async function processAudioFile(
  filePath: string,
  context: {
    companyName?: string;
    meetingType?: string;
  } = {}
): Promise<{
  transcription: TranscriptionResult;
  formatted: string;
  summary: Awaited<ReturnType<typeof summarizeTranscript>>;
}> {
  console.log(`🎬 Starting full audio processing pipeline for: ${path.basename(filePath)}`);

  // Step 1: Transcribe
  const transcription = await transcribeAudio(filePath, {
    enableSpeakerDiarization: true,
  });

  // Step 2: Format
  const formatted = transcription.speakers
    ? formatTranscript(transcription.speakers)
    : transcription.transcript;

  // Step 3: Summarize
  const summary = await summarizeTranscript(transcription.transcript, context);

  // Step 4: Identify key moments
  if (transcription.speakers) {
    transcription.keyMoments = identifyKeyMoments(transcription.speakers);
  }

  console.log('✅ Full audio processing complete');

  return {
    transcription,
    formatted,
    summary,
  };
}
