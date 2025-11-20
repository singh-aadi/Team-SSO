const fs = require('fs');
const PdfPrinter = require('pdfmake');
const htmlToPdfMake = require('html-to-pdfmake');
const { JSDOM } = require("jsdom");   // htmltopdfmake requires dom parse, so this lib is required in server side
//const htmlDocx = require('html-docx-js');

const fonts = {
    Roboto: {
        normal: 'server/fonts/roboto/Roboto-VariableFont_wdth,wght.ttf',
        bold: 'server/fonts/roboto/Roboto-VariableFont_wdth,wght.ttf'
    }
};
const printer = new PdfPrinter(fonts);

const enhancedPdfOptions = {
    deck: { id: "We360.ai (INR) Deck May 2025" },
    selectedStage: "Pre-Series A",
    selectedIndustry: "Workforce Analytics | HR Tech | SaaS",
    companyName: "We360 AI (Zenstack Private Limited)"
};
const ssoScore = 88.0;

function buildHtml(opts, score) {
    return `
<html>
<head>
<style>
body { font-family: Roboto, sans-serif; line-height: 1.5; }
h1 { font-size: 32px; font-weight: bold; text-align: center; }
h2 { font-size: 22px; font-weight: bold; text-align: center; }
.section-header { font-size: 20px; font-weight: bold; margin-top: 20px; }
.sub-header { font-size: 14px; font-weight: bold; margin-top: 15px; }
.score-number { font-size: 48px; font-weight: bold; text-align: center; }
.score-label { font-size: 14px; font-weight: bold; text-align: center; }
.page-break { page-break-after: always; }
.blue-header {
    background: blue; color: white; padding: 20px; text-align: center;
}
ul { margin-left: 40px; }
</style>
</head>
<body>

<div class="page-break">
    <div class="blue-header">
        <h1>PITCH DECK ANALYSIS<br>INVESTMENT READINESS REPORT</h1>
        <div>Powered by Team SSO Intelligence</div>
    </div>

    <h2>${opts.companyName}</h2>

    <div style="display:flex; justify-content:space-between;">
        <div>${opts.selectedIndustry}</div>
        <div>${opts.selectedStage}</div>
    </div>

    <div class="score-number">${score}/100</div>
    <div class="score-label">SSO READINESS SCORE™</div>

    <div class="section-header" style="text-align:center;margin-top:40px;">
        INVESTOR READY<br>QUICK SNAPSHOT
    </div>

    <ul>
        <li>Strongest: Market Opportunity (${score}/100)</li>
        <li>Needs Work: Team & Execution (75.0/100)</li>
    </ul>

    <div>Deck: ${opts.deck.id}.pdf</div>
    <div style="margin-top:20px;">Generated: ${new Date().toLocaleString()}</div>
</div>

<div class="page-break">
    <div class="section-header">COMPANY OVERVIEW</div>
    <p>We360.ai<br>SaaS B2B • Pre-Seed</p>

    <p><b>About the Company</b><br><br>
    We360.ai is a pre-seed-stage saas b2b company seeking investment...</p>

    <div class="sub-header">Key Highlights</div>
    <ul>
        <li>Industry: SaaS B2B</li>
        <li>Stage: Pre-Seed</li>
        <li>Top Strength: Market Opportunity (${score}/100)</li>
    </ul>
</div>

<div class="page-break">
    <div class="section-header">EXECUTIVE SUMMARY</div>

    <div class="score-number">${score}/100</div>

    <p>Your deck demonstrates strong investment readiness...</p>

    <div class="sub-header">Score Breakdown</div>
    <ul>
        <li>Problem & Solution 85.0/100</li>
        <li>Market Opportunity 88.0/100</li>
        <li>Traction & Growth 82.0/100</li>
        <li>Team & Execution 75.0/100</li>
        <li>Business Model & Financials 80.0/100</li>
    </ul>
</div>

<div class="page-break">
    <div class="section-header">INDUSTRY CONTEXT & BENCHMARKS</div>
    <p>Your pitch deck has been evaluated against Pre-Seed stage SaaS B2B standards...</p>

    <div class="sub-header">Key Metrics VCs Evaluate</div>
    <ul>
        <li>MRR / ARR</li>
        <li>NRR</li>
        <li>CAC</li>
        <li>LTV</li>
        <li>Gross Margin (%)</li>
    </ul>
</div>

<div class="page-break">
    <div class="section-header">SCORE BREAKDOWN</div>
    <ul>
        <li>Market Opportunity 88.0/100</li>
        <li>Business Model & Unit Economics 85.0/100</li>
        <li>Traction & Growth 82.0/100</li>
        <li>Financials & Use of Funds 80.0/100</li>
        <li>Problem & Solution 80.0/100</li>
        <li>Team & Execution 75.0/100</li>
    </ul>

    <div class="score-number">${score}/100</div>
</div>

<div class="page-break">
    <div class="section-header">APPENDIX</div>
    <p>About the SSO Readiness Score™<br><br>Methodology, definitions, and support resources.</p>
</div>

</body>
</html>
`;
}

const html = buildHtml(enhancedPdfOptions, ssoScore);
const dom = new JSDOM(`<!DOCTYPE html><body>${html}</body>`);   
const pdfContent = htmlToPdfMake(html, { window: dom.window });

const docDefinition = {
    content: pdfContent,
    defaultStyle: { font: 'Roboto' }
};

const pdfDoc = printer.createPdfKitDocument(docDefinition);
pdfDoc.pipe(fs.createWriteStream("html_document.pdf"));
pdfDoc.end();
