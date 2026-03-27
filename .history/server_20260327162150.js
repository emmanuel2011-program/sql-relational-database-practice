import express from 'express';
import { postgres } from '@vercel/postgres'; // Ensure this matches your package.json
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database Connection
const sql = postgres(process.env.POSTGRES_URL, { ssl: 'require' });

/** * REQUIREMENT: AGGREGATES (SUM/AVG) 
 * Calculates total money for the Sforte Dashboard
 */
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await sql`
            SELECT 
                COALESCE(SUM(amount), 0) as total, 
                COALESCE(AVG(amount), 0) as average 
            FROM investments 
            WHERE status = 'approved'
        `;
        res.json(stats[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** * REQUIREMENT: DATE/TIME FILTERING 
 * Demonstrates querying within a 30-day range
 */
app.get('/api/investments/recent', async (req, res) => {
    try {
        const recent = await sql`
            SELECT * FROM investments 
            WHERE created_at >= NOW() - INTERVAL '30 days'
            ORDER BY created_at DESC
        `;
        res.json(recent);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** * REQUIREMENT: RELATIONAL JOIN 
 * Joins 'memberships' and 'investments' tables
 */
app.get('/api/member-portfolio', async (req, res) => {
    try {
        const data = await sql`
            SELECT m.first_name, m.surname, i.id, i.amount, i.status, i.created_at
            FROM memberships m
            JOIN investments i ON m.id = i.member_id
            ORDER BY i.created_at DESC
        `;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** * REQUIREMENT: CREATE (Multi-Table Transaction) 
 */
app.post('/api/investors', async (req, res) => {
    const { first_name, surname, email, amount } = req.body;
    try {
        await sql.begin(async (sql) => {
            const [member] = await sql`
                INSERT INTO memberships (first_name, surname, email)
                VALUES (${first_name}, ${surname}, ${email})
                ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
                RETURNING id
            `;
            await sql`
                INSERT INTO investments (member_id, amount, status)
                VALUES (${member.id}, ${amount}, 'pending')
            `;
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** * REQUIREMENT: THIRD TABLE (Loans) 
 */
app.get('/api/loans', async (req, res) => {
    try {
        const loans = await sql`SELECT * FROM loans ORDER BY id DESC`;
        res.json(loans);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/loans', async (req, res) => {
    try {
        const { borrower_name, principal, interest_rate } = req.body;
        await sql`
            INSERT INTO loans (borrower_name, principal, interest_rate)
            VALUES (${borrower_name}, ${principal}, ${interest_rate})
        `;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** * REQUIREMENT: UPDATE & DELETE 
 */
app.put('/api/investments/approve/:id', async (req, res) => {
    try {
        await sql`UPDATE investments SET status = 'approved' WHERE id = ${req.params.id}`;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/investments/:id', async (req, res) => {
    try {
        await sql`DELETE FROM investments WHERE id = ${req.params.id}`;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/loans/:id', async (req, res) => {
    try {
        await sql`DELETE FROM loans WHERE id = ${req.params.id}`;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Sforte Server running on port ${PORT}`));