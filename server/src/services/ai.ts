// AI-powered pitch deck analysis service using Google Gemini
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface AnalysisResult {
  problemScore: number;
  solutionScore: number;
  marketScore: number;
  tractionScore: number;
  teamScore: number;
  financialsScore: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  keyInsights: string[];
  recommendation: string;
}

interface SectionAnalysis {
  sectionName: string;
  sectionScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export async function analyzePitchDeck(deckText: string, companyName: string = 'the company'): Promise<{
  analysis: AnalysisResult;
  sections: SectionAnalysis[];
}> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are an expert VC analyst evaluating startup pitch decks. Analyze the following pitch deck for ${companyName} and provide detailed, actionable feedback.

PITCH DECK CONTENT:
${deckText}

Provide your analysis in the following JSON format (be strict about the format):

{
  "overallAnalysis": {
    "problemScore": <number 0-100>,
    "solutionScore": <number 0-100>,
    "marketScore": <number 0-100>,
    "tractionScore": <number 0-100>,
    "teamScore": <number 0-100>,
    "financialsScore": <number 0-100>,
    "overallScore": <number 0-100>,
    "strengths": [<3 key strengths as strings>],
    "weaknesses": [<3 areas to improve as strings>],
    "keyInsights": [<3 critical insights as strings>],
    "recommendation": "<One paragraph investment recommendation>"
  },
  "sectionAnalysis": [
    {
      "sectionName": "Problem",
      "sectionScore": <number 0-100>,
      "feedback": "<2-3 sentences about this section>",
      "strengths": [<2 specific strengths>],
      "improvements": [<2 specific improvements>]
    },
    {
      "sectionName": "Solution",
      "sectionScore": <number 0-100>,
      "feedback": "<2-3 sentences about this section>",
      "strengths": [<2 specific strengths>],
      "improvements": [<2 specific improvements>]
    },
    {
      "sectionName": "Market",
      "sectionScore": <number 0-100>,
      "feedback": "<2-3 sentences about this section>",
      "strengths": [<2 specific strengths>],
      "improvements": [<2 specific improvements>]
    },
    {
      "sectionName": "Traction",
      "sectionScore": <number 0-100>,
      "feedback": "<2-3 sentences about this section>",
      "strengths": [<2 specific strengths>],
      "improvements": [<2 specific improvements>]
    },
    {
      "sectionName": "Team",
      "sectionScore": <number 0-100>,
      "feedback": "<2-3 sentences about this section>",
      "strengths": [<2 specific strengths>],
      "improvements": [<2 specific improvements>]
    },
    {
      "sectionName": "Financials",
      "sectionScore": <number 0-100>,
      "feedback": "<2-3 sentences about this section>",
      "strengths": [<2 specific strengths>],
      "improvements": [<2 specific improvements>]
    }
  ]
}

SCORING CRITERIA:
- Problem (0-100): Clarity, urgency, market pain point validation
- Solution (0-100): Innovation, differentiation, feasibility, product-market fit
- Market (0-100): TAM/SAM/SOM analysis, growth potential, competitive landscape
- Traction (0-100): Revenue, users, growth rate, key metrics, customer validation
- Team (0-100): Relevant experience, domain expertise, execution capability
- Financials (0-100): Revenue model clarity, unit economics, projections realism, path to profitability

Be critical but constructive. Focus on actionable insights.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const aiResponse = JSON.parse(jsonMatch[0]);

    return {
      analysis: {
        problemScore: aiResponse.overallAnalysis.problemScore,
        solutionScore: aiResponse.overallAnalysis.solutionScore,
        marketScore: aiResponse.overallAnalysis.marketScore,
        tractionScore: aiResponse.overallAnalysis.tractionScore,
        teamScore: aiResponse.overallAnalysis.teamScore,
        financialsScore: aiResponse.overallAnalysis.financialsScore,
        overallScore: aiResponse.overallAnalysis.overallScore,
        strengths: aiResponse.overallAnalysis.strengths,
        weaknesses: aiResponse.overallAnalysis.weaknesses,
        keyInsights: aiResponse.overallAnalysis.keyInsights,
        recommendation: aiResponse.overallAnalysis.recommendation,
      },
      sections: aiResponse.sectionAnalysis,
    };
  } catch (error) {
    console.error('Gemini AI analysis error:', error);
    throw new Error('Failed to analyze pitch deck with AI');
  }
}

export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

export async function analyzePitchDeckFromPDF(pdfBuffer: Buffer, companyName: string): Promise<{
  analysis: AnalysisResult;
  sections: SectionAnalysis[];
  extractedText: string;
}> {
  // Extract text from PDF
  const extractedText = await extractTextFromPDF(pdfBuffer);

  if (!extractedText || extractedText.trim().length < 100) {
    throw new Error('PDF appears to be empty or contains insufficient text for analysis');
  }

  // Analyze with Gemini
  const { analysis, sections } = await analyzePitchDeck(extractedText, companyName);

  return {
    analysis,
    sections,
    extractedText,
  };
}
