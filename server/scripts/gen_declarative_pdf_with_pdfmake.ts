// pdfmake Tutorial (note it uses createPdf() method only available client-side in browser):
//    https://www.npmjs.com/package/@leantechniques/pdfmake
// server side pdfmake official docs: https://pdfmake.github.io/docs/0.1/getting-started/server-side/
// pdfmake docdefinition docs: https://pdfmake.github.io/docs/0.1/document-definition-object/styling/
// live playground pdfmake: http://pdfmake.org/playground.html
const fs = require('fs');
const PdfPrinter = require('pdfmake');

// Robot font is builtin, also Helvectica I think and some others; custom fonts require external ttf font files
const fonts = {
//   Roboto: {
//     normal: 'fonts/Roboto-Regular.ttf',
//     bold: 'fonts/Roboto-Medium.ttf',
//     italics: 'fonts/Roboto-Italic.ttf',
//     bolditalics: 'fonts/Roboto-MediumItalic.ttf'
//   }
    Roboto: {
        normal: 'server/fonts/roboto/Roboto-VariableFont_wdth,wght.ttf',
    }
};
const printer = new PdfPrinter(fonts);

function titlePage(enhancedPdfOptions) {
    const h1 = {
        styles: [ 'h1' ],
        text: [
            'PITCH DECK ANALYSIS',
            'INVESTMENT READINESS REPORT'
        ]
    };
    const small_text = 'Powered by Team SSO Intelligence Report';
    const header = {
        color: 'white',
        fillColor: 'darkblue',
        text: [
            h1,
            small_text
        ]
    }
    return {
        alignment: 'center',
        text: [
            header,
            { styles: [ 'h2 '], text: `Company Name: ${enhancedPdfOptions.companyName}`},
            {
                columns: [
                    { alignment: 'left', text: enhancedPdfOptions.selectedIndustry },
                    { alignment: 'right', text: enhancedPdfOptions.selectedStage }
                ]
            }
        ],
    }
}

const enhancedPdfOptions = {
    deck: {
        id: "TEST_DECK_ID",
    },
    analysis: null,
    // copied values from: "Demo Company Input PPTs/09. We360 AI/01. Investment Memorandum Template - We360 AI.pdf"
    selectedStage: "Pre-Series A",
    selectedIndustry: "Workforce Analytics | HR Tech | SaaS",
    companyName: "Company Name: We360 AI (Zenstack Private Limited)",
    webEnrichment: undefined,       // TODO: Put dict
    groundingMetadata: undefined,    // TODO: Put dict
    vcPreferencesUsed: undefined     // TODO: Put dict
};

const ssoScore = 10;

const docDefinition = {
    content: [
        titlePage(enhancedPdfOptions),

    ],

    styles: {
        h1: {
            fontSize: 32,
            bold: true,
        },
        h2: {
            fontSize: 24,
            bold: true,
        }
    }
};

const options = {
  
}

const pdfDoc = printer.createPdfKitDocument(docDefinition, options);
pdfDoc.pipe(fs.createWriteStream('document.pdf'));
pdfDoc.end();
