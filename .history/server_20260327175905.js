require('dotenv').config();
const express = require('express');
const postgres = require('postgres');
const app = express();

const PORT = 3001;

// Render-friendly SQL connection
const sql = postgres(process.env.POSTGRES_URL, { 
    ssl: 'require',
    connect_timeout: 30 
});

app.use(express.json());
app.use(express.static('public'));

// 1. TEST ROUTE
app.get('/test', async (req, res) => {
  try {
    const result = await sql`SELECT NOW()`;
    res.send(`🚀 Server is LIVE. Database Time: ${result[0].now}`);
  } catch (err) {
    res.status(500).send(`❌ DB Connection Error: ${err.message}`);
  }
});

// 2. DASHBOARD ROUTE : AGGREGATES CALCULATIONS FOR THE AVERAGE AMOUNT AND TOTAL INVESTED AMOUNT (Requirement: SQL AGGREGATE FUNCTIONS)
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await sql`SELECT SUM(amount) as total, AVG(amount) as average FROM investments WHERE status = 'approved'`;
    res.json({
        total: stats[0].total || 0,
        average: stats[0].average || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. INVESTORS: CODE TOCREATE AND INSERT ACROSS TWO TABLES (Requirement: SQL JOIN & INSERT)
app.post('/api/investors', async (req, res) => {
    try {
        const { first_name, surname, email, amount } = req.body;
        const member = await sql`
            INSERT INTO memberships (first_name, surname, email) 
            VALUES (${first_name}, ${surname}, ${email}) 
            RETURNING id
        `;
        await sql`
            INSERT INTO investments (member_id, amount) 
            VALUES (${member[0].id}, ${amount})
        `;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. INVESTORS: RELATIONAL JOIN for Both Tables (Requirement: SQL JOIN)
app.get('/api/member-portfolio', async (req, res) => {
  try {
    const data = await sql`
      SELECT m.first_name, m.surname, i.amount, i.status, i.id 
      FROM memberships m 
      JOIN investments i ON m.id = i.member_id 
      ORDER BY i.created_at DESC
    `;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. LOANS: To GET ALL THE LOANS BY DESCENDING ORDER OF CREATION (Requirement: SQL SELECT with ORDER BY) 
app.get('/api/loans', async (req, res) => {
  try {
    const data = await sql`SELECT * FROM loans ORDER BY created_at DESC`;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** *  LOANS POST ROUTE (my button missing piece)
 */
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

// 6. UPDATE & DELETE ROUTES FOR INVESTMENTS (Requirement: SQL UPDATE & DELETE)
app.put('/api/investments/approve/:id', async (req, res) => {
  try {
    await sql`UPDATE investments SET status = 'approved' WHERE id = ${req.params.id}`;
    res.json({ message: "Approved!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/investments/:id', async (req, res) => {
  try {
    await sql`DELETE FROM investments WHERE id = ${req.params.id}`;
    res.json({ message: "Deleted!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 7. DATE FILTERING For the dashboard 
app.get('/api/investments/recent', async (req, res) => {
  try {
    const recentData = await sql`
      SELECT * FROM investments 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      ORDER BY created_at DESC
    `;
    res.json(recentData);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 8. DATABASE SETUP (Seeding)
app.get('/seed', async (req, res) => {
  try {
    await sql`CREATE TABLE IF NOT EXISTS memberships (id SERIAL PRIMARY KEY, first_name TEXT, surname TEXT, email TEXT UNIQUE)`;
    await sql`CREATE TABLE IF NOT EXISTS investments (id SERIAL PRIMARY KEY, member_id INTEGER REFERENCES memberships(id), amount DECIMAL, status TEXT DEFAULT 'pending', created_at TIMESTAMP DEFAULT NOW())`;
    
    // Ensure the LOANS table exists for your button to work!
    await sql`CREATE TABLE IF NOT EXISTS loans (id SERIAL PRIMARY KEY, borrower_name TEXT, principal DECIMAL, interest_rate DECIMAL, created_at TIMESTAMP DEFAULT NOW())`;

    res.send("✅ Tables created! Try issuing a loan now.");
  } catch (err) { res.status(500).send(`❌ Error: ${err.message}`); }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Sforte Software started on Port ${PORT}`);
});