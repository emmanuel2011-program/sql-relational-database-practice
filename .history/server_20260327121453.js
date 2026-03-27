const express = require('express');
const postgres = require('postgres');
const bcrypt = require('bcrypt');
const app = express();

const sql = postgres(process.env.POSTGRES_URL, { ssl: 'require' });

app.use(express.json()); // Allows the server to read JSON from your forms

// --- REQUIREMENT: RETRIEVE & JOIN ---
app.get('/api/member-portfolio', async (req, res) => {
  const { email } = req.query;
  const data = await sql`
    SELECT m.first_name, m.surname, i.amount 
    FROM memberships m 
    JOIN investments i ON m.id = i.member_id 
    WHERE m.email = ${email}`;
  res.json(data);
});

// --- REQUIREMENT: AGGREGATE ---
app.get('/api/stats', async (req, res) => {
  const stats = await sql`SELECT SUM(amount) as total, AVG(amount) as average FROM investments`;
  res.json(stats[0]);
});

// --- REQUIREMENT: MODIFY (UPDATE) ---
app.put('/api/investments/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  await sql`UPDATE investments SET status = ${status} WHERE id = ${id}`;
  res.send({ message: "Updated!" });
});

// --- REQUIREMENT: DELETE ---
app.delete('/api/members/:id', async (req, res) => {
  await sql`DELETE FROM memberships WHERE id = ${req.params.id}`;
  res.send({ message: "Deleted!" });
});

app.listen(3000, () => console.log('Server running on port 3000'));