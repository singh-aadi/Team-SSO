/**
 * Generate prompt for VC knowledge extraction (not startup analysis)
 */
export function buildVCKnowledgeExtractionPrompt(contextText: string, documentCount: number): string {
  return `
You are an AI assistant helping a VENTURE CAPITALIST extract insights from their personal documents.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR TASK: EXTRACT & CLEAN THE VC'S KNOWLEDGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The VC has uploaded ${documentCount} personal documents containing:
✓ Call transcripts with founders
✓ Email threads about deals  
✓ Meeting notes and due diligence
✓ Personal research and market analysis
✓ Slack/internal team conversations
✓ Audio recordings (transcribed)

These are NOT pitch decks. These are the VC's OWN notes/insights to use later when analyzing pitch decks.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ DO:
- Extract companies mentioned and what the VC learned about them
- Identify the VC's investment thesis, preferences, red flags
- Capture market insights and industry trends the VC noted
- List people/founders the VC interacted with
- Extract metrics, numbers, data points mentioned
- Identify patterns in what the VC values

❌ DON'T:
- Remove email greetings ("Hi", "Best regards", "Hope you're well")
- Remove meeting scheduling noise ("Let's sync Tuesday")  
- Remove signatures and boilerplate
- Remove irrelevant small talk
- Analyze or evaluate companies (just extract what VC said)
- Make assumptions or add your own opinions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VC'S DOCUMENTS (${documentCount} files)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${contextText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY a JSON object (no markdown, no extra text):

{
  "executiveSummary": "2-3 sentences: What knowledge did the VC capture in these documents? What's the overall theme?",
  
  "companiesMentioned": [
    {
      "name": "Company name from documents",
      "industry": "Sector/vertical",
      "stage": "Seed/Series A/etc or 'Unknown'",
      "keyPoints": [
        "What VC learned about this company",
        "Metrics or traction mentioned",
        "VC's opinion or concerns"
      ],
      "metrics": ["ARR: $2M", "Growth: 15% MoM"] // Optional
    }
  ],
  
  "investmentThesis": {
    "focusAreas": ["Markets/sectors VC is targeting"],
    "dealbreakers": ["Red flags VC mentioned"],
    "greenFlags": ["Positive signals VC looks for"],
    "targetProfile": "Description of ideal investment"
  },
  
  "marketInsights": [
    {
      "topic": "AI in healthcare",
      "insight": "What the VC learned or believes about this market",
      "source": "Call transcript with Dr. Smith"
    }
  ],
  
  "peopleNetwork": [
    {
      "name": "Person's name",
      "role": "CEO/Founder/Advisor",
      "company": "Company name if mentioned",
      "context": "How they were mentioned in documents"
    }
  ],
  
  "decisionPatterns": {
    "whatVCValuesMost": ["Team quality", "Market size", "Traction"],
    "commonConcerns": ["Long sales cycles", "Regulatory risk"],
    "successPatterns": ["Repeat founders", "Strong early traction"],
    "missedOpportunities": ["Passed on X, which later succeeded"]
  },
  
  "keyInsights": [
    "Top 5-10 takeaways from these documents",
    "Specific learnings the VC can apply to future deals",
    "Patterns or themes that emerged"
  ],
  
  "opportunities": [
    {
      "insight": "Investment opportunity or market trend identified",
      "category": "Optional category",
      "impact": "High|Medium|Low"
    }
  ],
  
  "risks": [
    {
      "concern": "Risk or concern the VC noted",
      "category": "Market|Team|Execution|etc",
      "severity": "Critical|High|Medium|Low"
    }
  ],
  
  "nextSteps": [
    {
      "action": "Follow-up action VC should take",
      "priority": "Critical|High|Medium"
    }
  ],
  
  "quotes": ["Notable quotes from the documents"],
  "dataPoints": ["Key metrics and numbers mentioned"]
}

EXAMPLES:

Good executiveSummary:
"VC documented insights from 3 founder calls and 2 market research sessions. Focus on B2B SaaS in healthcare. Identified 2 promising companies (MedTech AI, PatientFlow) and noted concerns about long hospital sales cycles."

Bad executiveSummary:
"This company is building AI for healthcare..." ❌ (Don't analyze - extract!)

Good companyMention:
{
  "name": "Stripe",
  "industry": "Fintech",
  "stage": "Series A (at time of notes)",
  "keyPoints": [
    "VC had call with Patrick Collison on Nov 15",
    "Processing $2M/month, 40% MoM growth",
    "Concerns: Regulatory complexity, Braintree competition",
    "Strong technical team, developer-first approach"
  ]
}

Return ONLY the JSON object.
`;
}
