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
    res.send(`🚀 Server is LIVE on 3001. Database Time: ${result[0].now}`);
  } catch (err) {
    res.status(500).send(`❌ DB Connection Error: ${err.message}`);
  }
});

// 2. DASHBOARD ROUTE (Requirement: AGGREGATES)
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await sql`SELECT SUM(amount) as total, AVG(amount) as average FROM investments`;
    // If table is empty, return 0 instead of null
    res.json({
        total: stats[0].total || 0,
        average: stats[0].average || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REQUIREMENT: CREATE (INSERT) Data across two tables
app.post('/api/investors', async (req, res) => {
    try {
        const { first_name, surname, email, amount } = req.body;

        // 1. Insert into Memberships (Returns the new ID)
        const member = await sql`
            INSERT INTO memberships (first_name, surname, email) 
            VALUES (${first_name}, ${surname}, ${email}) 
            RETURNING id
        `;

        // 2. Use that ID to create the Investment (The Relation)
        await sql`
            INSERT INTO investments (member_id, amount) 
            VALUES (${member[0].id}, ${amount})
        `;

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. INVESTORS ROUTE (Requirement: RELATIONAL JOIN)
// This links the 'memberships' table and 'investments' table
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

// 4. LOANS ROUTE
app.get('/api/loans', async (req, res) => {
  try {
    const data = await sql`SELECT * FROM loans ORDER BY created_at DESC`;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. UPDATE ROUTE (Requirement: MODIFY DATA)
app.put('/api/investments/approve/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql`UPDATE investments SET status = 'approved' WHERE id = ${id}`;
    res.json({ message: "Investment successfully approved!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REQUIREMENT: DELETE Data
app.delete('/api/investments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // The software builds a DELETE command for a specific Relational ID
    await sql`DELETE FROM investments WHERE id = ${id}`;
    res.json({ message: "Record permanently removed from Sforte Database" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Sforte Software started on Port ${PORT}`);
});

// TEMPORARY: Visit http://localhost:3001/seed to setup your database
app.get('/seed', async (req, res) => {
  try {
    // 1. Create Tables
    await sql`
      CREATE TABLE IF NOT EXISTS memberships (
        id SERIAL PRIMARY KEY,
        first_name TEXT NOT NULL,
        surname TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS investments (
        id SERIAL PRIMARY KEY,
        member_id INTEGER REFERENCES memberships(id) ON DELETE CASCADE,
        amount DECIMAL(15,2) NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // 2. Add Seed Data
    const member = await sql`
      INSERT INTO memberships (first_name, surname, email) 
      VALUES ('Emmanuel', 'Okoye', 'emma@sforte.com')
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;

    if (member.length > 0) {
      await sql`
        INSERT INTO investments (member_id, amount, status) 
        VALUES (${member[0].id}, 750000.00, 'approved')
      `;
    }

    res.send("✅ Database Seeded Successfully! Go check your Dashboard.");
  } catch (err) {
    res.status(500).send(`❌ Seeding Failed: ${err.message}`);
  }
});
// 🔍 DEBUG ROUTE: Visit http://localhost:3001/view-db to see your tables
app.get('/view-db', async (req, res) => {
  try {
    // This SQL query asks the database "What tables do you have?"
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

    // This fetches the actual data
    const members = await sql`SELECT * FROM memberships`;
    const investments = await sql`SELECT * FROM investments`;

    res.send(`
      <body style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
        <h1>Sforte Database Inspector</h1>
        <hr>
        <h3>1. Existing Tables:</h3>
        <ul>${tables.map(t => `<li>${t.table_name}</li>`).join('')}</ul>
        
        <h3>2. Members (${members.length}):</h3>
        <pre>${JSON.stringify(members, null, 2)}</pre>
        
        <h3>3. Investments (${investments.length}):</h3>
        <pre>${JSON.stringify(investments, null, 2)}</pre>
        
        <br>
        <a href="/">Back to Dashboard</a>
      </body>
    `);
  } catch (err) {
    res.status(500).send("❌ Error reading database: " + err.message);
  }
});
// REQUIREMENT: Date/Time Filtering
app.get('/api/investments/recent', async (req, res) => {
  try {
    // This query filters for records where 'created_at' is within the last 30 days
    const recentData = await sql`
      SELECT * FROM investments 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      ORDER BY created_at DESC
    `;
    res.json(recentData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});