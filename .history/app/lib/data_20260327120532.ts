import postgres from 'postgres';
import { Investment, Membership } from './definitions';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// 1. JOIN: Get Member info + their Investments
export async function fetchMemberDetails(email: string) {
  try {
    const data = await sql`
      SELECT m.first_name, m.surname, i.amount, i.monthly_interest, i.status
      FROM memberships m
      JOIN investments i ON m.id = i.member_id
      WHERE LOWER(m.email) = LOWER(${email})
    `;
    return data;
  } catch (error) {
    throw new Error('Failed to fetch join data.');
  }
}

// 2. AGGREGATE: Calculate Totals
export async function getCooperativeStats() {
  try {
    const data = await sql`
      SELECT 
        SUM(amount) as total_capital,
        AVG(monthly_interest) as avg_interest
      FROM investments
    `;
    return data[0];
  } catch (error) {
    return { total_capital: 0, avg_interest: 0 };
  }
}

// 3. DATE FILTER: Find memberships by date range
export async function fetchNewMembers(startDate: string, endDate: string) {
  try {
    return await sql`
      SELECT * FROM memberships 
      WHERE created_at BETWEEN ${startDate} AND ${endDate}
    `;
  } catch (error) {
    console.error(error);
  }
}