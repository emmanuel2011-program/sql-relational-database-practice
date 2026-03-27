require('dotenv').config();
const express = require('express');
const postgres = require('postgres');
const app = express();

const PORT = 3001; // <--- Changed to 3001

const sql = postgres(process.env.POSTGRES_URL, { ssl: 'require' });

app.use(express.json());
app.use(express.static('public'));

// Test Route: Visit http://localhost:3001/test to see if SQL is working
app.get('/test', async (req, res) => {
  try {
    const result = await sql`SELECT NOW()`;
    res.send(`🚀 Server is LIVE on 3001. Database Time: ${result[0].now}`);
  } catch (err) {
    res.status(500).send(`❌ DB Connection Error: ${err.message}`);
  }
});

// Your existing API routes...
app.get('/api/stats', async (req, res) => {
  const stats = await sql`SELECT SUM(amount) as total, AVG(amount) as average FROM investments`;
  res.json(stats[0]);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Sforte Software started!`);
  console.log(`🔗 Main Site: http://localhost:${PORT}`);
  console.log(`🔗 SQL Test: http://localhost:${PORT}/test`);
});


// REQUIREMENT: Get Loan Data
app.get('/api/loans', async (req, res) => {
  try {
    // This builds the SQL to fetch from your loans table
    const data = await sql`SELECT * FROM loans ORDER BY created_at DESC`;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REQUIREMENT: MODIFY (UPDATE) Data
app.put('/api/investments/approve/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // The software builds this SQL command based on the ID you clicked
    await sql`UPDATE investments SET status = 'approved' WHERE id = ${id}`;
    res.json({ message: "Investment successfully approved!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
const sql = postgres(process.env.POSTGRES_URL, {
  ssl: 'require', // Render requires this
  connect_timeout: 30,
  idle_timeout: 20,
  max: 1
});