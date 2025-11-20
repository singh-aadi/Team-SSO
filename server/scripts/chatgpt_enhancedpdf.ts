const fs = require('fs');
const PdfPrinter = require('pdfmake');

const fonts = {
    Roboto: {
        normal: 'server/fonts/roboto/Roboto-VariableFont_wdth,wght.ttf',
        bold: 'server/fonts/roboto/Roboto-VariableFont_wdth,wght.ttf',
    }
};
const printer = new PdfPrinter(fonts);

function titlePage(opts, score) {
    const header = {
        table: {
            widths: ['*'],
            body: [
            [{
                fillColor: 'blue',
                color: 'white',
                border: [false, false, false, false],
                alignment: 'center',
                stack: [
                { text: 'PITCH DECK ANALYSIS', style: 'h1' },
                { text: 'INVESTMENT READINESS REPORT', style: 'h1' },
                { text: 'Powered by Team SSO Intelligence Report', margin: [0, 10, 0, 0] }
                ]
            }]
            ]
        },
        layout: 'noBorders'
    };

    return {
        stack: [
            // Blue Header
            header,

            // Company Name
            { text: opts.companyName, style: 'h2', alignment: 'center', margin: [0, 0, 0, 10] },

            // Industry + Stage
            {
                columns: [
                    { text: opts.selectedIndustry, alignment: 'left' },
                    { text: opts.selectedStage, alignment: 'right' }
                ],
                margin: [0, 0, 0, 30]
            },

            // Score block
            {
                alignment: 'center',
                stack: [
                    { text: `${score}/100`, style: 'scoreNumber' },
                    { text: 'SSO READINESS SCORE™', style: 'scoreLabel' }
                ],
                margin: [0, 0, 0, 20]
            },

            // Quick Snapshot
            { text: 'INVESTOR READY\nQUICK SNAPSHOT', style: 'sectionHeader', alignment: 'center', margin: [0, 20, 0, 20] },

            {
                ul: [
                    `Strongest: Market Opportunity (${score}/100)`,
                    `Needs Work: Team & Execution (75.0/100)`
                ],
                margin: [40, 0, 0, 10]
            },

            // Deck file (simple)
            { text: `Deck: ${opts.deck.id}.pdf`, margin: [0, 10, 0, 0] },

            // Timestamp
            { text: `Generated: ${new Date().toLocaleString()}`, margin: [0, 20, 0, 0] }
        ],
        pageBreak: 'after'
    };
}

function section(title, body) {
    return {
        stack: [
            { text: title, style: 'sectionHeader', margin: [0, 0, 0, 10] },
            body
        ],
        pageBreak: 'after'
    };
}

const enhancedPdfOptions = {
    deck: { id: "We360.ai (INR) Deck May 2025" },
    selectedStage: "Pre-Series A",
    selectedIndustry: "Workforce Analytics | HR Tech | SaaS",
    companyName: "We360 AI (Zenstack Private Limited)"
};

const ssoScore = 88.0;

const docDefinition = {
    content: [
        // ---------- PAGE 1 ----------
        titlePage(enhancedPdfOptions, ssoScore),
        // { text: '', pageBreak: 'after' },

        // ---------- PAGE 2: COMPANY OVERVIEW ----------
        section('COMPANY OVERVIEW', {
            stack: [
                { text: "We360.ai\nSaaS B2B • Pre-Seed", margin: [0, 0, 0, 10] },
                {
                    text:
`About the Company

We360.ai is a pre-seed-stage saas b2b company seeking investment to scale operations and capture market share. Based on pitch deck analysis, the company has demonstrated a clear value proposition and identified a significant market opportunity.

This report provides a comprehensive investment readiness assessment across key dimensions including problem-solution fit, market size, traction metrics, team capabilities, and financial projections.`
                },
                { text: 'Key Highlights', style: 'subHeader', margin: [0, 15, 0, 5] },
                {
                    ul: [
                        "Industry: SaaS B2B",
                        "Stage: Pre-Seed",
                        "Top Strength: Market Opportunity (88.0/100)"
                    ]
                }
            ]
        }),

        // ---------- PAGE 3: EXECUTIVE SUMMARY ----------
        section('EXECUTIVE SUMMARY', {
            stack: [
                { text: `SSO READINESS SCORE\n${ssoScore}/100`, alignment: 'center', margin: [0, 0, 0, 15] },
                {
                    text:
`Your deck demonstrates strong investment readiness across all key areas.

Further diligence on the financials and competitive landscape is required before making an investment decision.`
                },
                { text: 'Score Breakdown', style: 'subHeader', margin: [0, 15, 0, 8] },
                {
                    ul: [
                        "Problem & Solution 85.0/100",
                        "Market Opportunity 88.0/100",
                        "Traction & Growth 82.0/100",
                        "Team & Execution 75.0/100",
                        "Business Model & Financials 80.0/100"
                    ]
                }
            ]
        }),

        // ---------- PAGE 4: INDUSTRY CONTEXT ----------
        section('INDUSTRY CONTEXT & BENCHMARKS', {
            stack: [
                {
                    text:
`Your pitch deck has been evaluated against Pre-Seed stage SaaS B2B industry standards. VCs investing in this sector expect traction metrics, market validation, and competitive clarity.`
                },
                { text: 'Key Metrics VCs Evaluate', style: 'subHeader', margin: [0, 10, 0, 5] },
                {
                    ul: [
                        "MRR / ARR",
                        "NRR",
                        "CAC",
                        "LTV",
                        "Gross Margin (%)"
                    ]
                }
            ]
        }),

        // ---------- PAGE 5: SCORE BREAKDOWN ----------
        section('SCORE BREAKDOWN', {
            stack: [
                {
                    ul: [
                        "Market Opportunity 88.0/100",
                        "Business Model & Unit Economics 85.0/100",
                        "Traction & Growth 82.0/100",
                        "Financials & Use of Funds 80.0/100",
                        "Problem & Solution 80.0/100",
                        "Team & Execution 75.0/100"
                    ]
                },
                { text: `OVERALL SSO SCORE\n${ssoScore}/100`, alignment: 'center', margin: [0, 20, 0, 0] }
            ]
        }),

        // ---------- PAGE 6: INVESTMENT CRITERIA ----------
        section('INVESTMENT CRITERIA & WEIGHTING', {
            stack: [
                { text: 'Industry Focus: All', margin: [0, 0, 0, 10] },
                { text: 'Evaluation Criteria & Weights', style: 'subHeader', margin: [0, 10, 0, 5] },
                {
                    ul: [
                        "Team: 0%",
                        "Market Opportunity: 100%",
                        "Product & Technology: 0%",
                        "Traction & Metrics: 0%"
                    ]
                },
                { text: `Overall Score = 88.0`, margin: [0, 10, 0, 0] }
            ]
        }),

        // ---------- PAGE 7–15 (CONDENSED AS SECTIONS) ----------
        section('Market Opportunity', { text: 'Summary and evaluation of market factors.' }),
        section('Business Model & Unit Economics', { text: 'Subscription model, pricing, CAC, LTV.' }),
        section('Traction & Growth', { text: 'User and revenue growth assessment.' }),
        section('Financials & Use of Funds', { text: 'Financial model and allocation review.' }),
        section('Problem & Solution', { text: 'Pain point and product articulation.' }),
        section('Team & Execution', { text: 'Founding team capability assessment.' }),
        section('Vertical-Specific Metrics', { text: 'MRR, ARR, CAC, NRR, Gross Margin expectations.' }),
        section('Detailed Assessment', { text: 'Strengths, weaknesses, and gaps.' }),
        section('Recommendations', { text: 'Immediate priorities, 1–3 month actions, long-term actions.' }),

        // ---------- FINAL PAGE ----------
        {
            text: 'APPENDIX\n\nAbout the SSO Readiness Score™\n\nMethodology, definitions, and support resources.',
            style: 'sectionHeader'
        }
    ],

    styles: {
        h1: { fontSize: 32, bold: true },
        h2: { fontSize: 22, bold: true },
        sectionHeader: { fontSize: 20, bold: true },
        subHeader: { fontSize: 14, bold: true },
        scoreNumber: { fontSize: 48, bold: true },
        scoreLabel: { fontSize: 14, bold: true }
    }
};

const pdfDoc = printer.createPdfKitDocument(docDefinition);
//const pdfDoc = printer.createPdfKitDocument({ content: [ ...titlePage(enhancedPdfOptions, ssoScore) ] });
// pdfDoc.pipe(fs.createWriteStream('titlePage.pdf'));
pdfDoc.pipe(fs.createWriteStream('document.pdf'));
pdfDoc.end();
