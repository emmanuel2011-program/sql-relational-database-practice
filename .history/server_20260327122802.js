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