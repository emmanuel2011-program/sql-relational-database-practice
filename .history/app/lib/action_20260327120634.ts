'use server';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// MODIFY: Update an investment status
export async function updateInvestmentStatus(id: string, status: string) {
  try {
    await sql`UPDATE investments SET status = ${status} WHERE id = ${id}`;
    revalidatePath('/dashboard');
  } catch (error) {
    return { message: 'Database Error' };
  }
}

// DELETE: Remove a member
export async function deleteMember(id: string) {
  try {
    await sql`DELETE FROM memberships WHERE id = ${id}`;
    revalidatePath('/dashboard/members');
  } catch (error) {
    console.error(error);
  }
}