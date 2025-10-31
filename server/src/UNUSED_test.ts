import { query } from '/home/sohangchopra/Programming/hackathons/Team-SSO/server/src/db/index.ts';

const example_id = 1;
const deckResult = await query(`
    SELECT d.*, c.name as company_name, c.stage, c.industry
    FROM pitch_decks d
    LEFT JOIN companies c ON d.company_id = c.id
    WHERE d.id = $1
`, [example_id]);
console.log(deckResult);