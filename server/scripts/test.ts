import { unescape } from 'querystring';
import { config } from 'dotenv';
config({path: "/home/sohangchopra/Programming/hackathons/Team-SSO/server/.env" });    // export up all environment variables from server/.env
// env vars dont seem to be actually setup, so manually export:
process.env.GOOGLE_CLIENT_ID="645633326713-q4qnp46l37brvp0oe73h4ru55vhg70a1.apps.googleusercontent.com";
process.env.GOOGLE_CLIENT_SECRET="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";
// in production Database (PostgreSQL on Google Cloud SQL):
// process.env.DATABASE_URL="postgresql://postgres:adi123@localhost:5432/teamsso"
// in localhost ident / peer - based login, as password based not working!
process.env.DATABASE_URL="postgresql:///teamsso?user=postgres";

process.env.INSTANCE_CONNECTION_NAME="projectsso.us-central1:teamsso";

process.env.DB_PASSWORD="160Im4xAykflQasNpgPv";

process.env.GEMINI_API_KEY="AIzaSyAnWSc9H2ug4CIFKq9I-btv97hHBXAViSA";
process.env.GCS_BUCKET_NAME="projectsso-pitch-decks";
process.env.JWT_SECRET="y5K8w2XdP9mQ3vR7nL6tU1hF4jG0zB2c";
import { query } from '../src/db';
import { generateEnhancedPDF } from '../src/services/enhancedPdfGenerator'

async function main() {
    // abandoned database (forget about it, run directly!) - lots of issues with setting up Postgres database on localhost. 
    // Wish Aditya just used something simple like sqlite !
    const example_id = 1;
    // const deckResult = await query(`
    //     SELECT d.*, c.name as company_name, c.stage, c.industry
    //     FROM pitch_decks d
    //     LEFT JOIN companies c ON d.company_id = c.id
    //     WHERE d.id = $1
    // `, [example_id]);
    // console.log(deckResult);
    const result_str = await generateEnhancedPDF({
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
    });
    console.log(result_str);
}

async function my_pdf_declarative_gen() {
    const fs = require('fs');
    const PdfPrinter = require('pdfmake');

    // Define fonts (pdfmake requires at least one font)
    const fonts = {
        // got font error (.ttf font file is missing!)
        // Roboto: {
        //     normal: 'node_modules/pdfmake/examples/fonts/Roboto-Regular.ttf',
        //     bold: 'node_modules/pdfmake/examples/fonts/Roboto-Medium.ttf',
        //     italics: 'node_modules/pdfmake/examples/fonts/Roboto-Italic.ttf',
        //     bolditalics: 'node_modules/pdfmake/examples/fonts/Roboto-MediumItalic.ttf'
        // }

        // Use built-in Helvetica — no need to provide actual .ttf files
        Helvetica: {
            normal: 'Helvetica',
            bold: 'Helvetica-Bold',
            italics: 'Helvetica-Oblique',
            bolditalics: 'Helvetica-BoldOblique'
        }
    };
    const printer = new PdfPrinter(fonts);

    // Helper to vertically spread lines evenly on a page
    function spacedPage(lines) {
    return {
        stack: lines.map((text, i) => ({
        text,
        margin: [0, i * 200, 0, 0] // adjust spacing (Y offset)
        })),
        absolutePosition: {x: 100, y: 100}
    };
    }

    const docDefinition = {
        pageSize: 'A4',
        defaultStyle: { font: 'Helvetica' },    // if not specified, by default it uses Roboto font I think but that requires its font .ttf file to be installed
        content: [
            // --- PAGE 1 ---
            spacedPage([
            'line 1 on 1 level',
            'line 2 on 2 level',
            'line 3 on 3 level'
            ]),
            { text: '', pageBreak: 'after' },

            // --- PAGE 2 ---
            spacedPage([
            'page 2 test line 1 on 1 level',
            'page 2 test line 2 on 2 level',
            'page 2 line 3 on 3 level'
            ])
        ]
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    pdfDoc.pipe(fs.createWriteStream('/home/sohangchopra/Programming/hackathons/Team-SSO/server/temp/PDFKIT_DECLARATIVE_OUTPUT.pdf'));
    pdfDoc.end();

}

//main()
my_pdf_declarative_gen()
