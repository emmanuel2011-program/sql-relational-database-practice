'use server';

import bcrypt from 'bcrypt';
import postgres from 'postgres';
// Assuming you add 'investments' to your data file
import { memberships, users } from '../lib/cooperative-data'; 

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

/**
 * Seed Admin & Investor Login Users
 */
async function seedUsers() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role VARCHAR(50) DEFAULT 'investor' -- Added to fix login issues
    );
  `;

  for (const user of users as any[]) {
    try {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await sql`
        INSERT INTO users (id, name, email, password, role)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword}, ${user.role || 'user'})
        ON CONFLICT (id) DO NOTHING;
      `;
    } catch (err) {
      console.error("User insert failed:", err);
    }
  }
}

/**
 * Seed Memberships (The Core Profiles)
 */
async function seedMemberships() {
  await sql`
    CREATE TABLE IF NOT EXISTS memberships (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      title VARCHAR(50),
      surname VARCHAR(255) NOT NULL,
      first_name VARCHAR(255) NOT NULL,
      middle_name VARCHAR(255),
      date_of_birth DATE NOT NULL, 
      gender VARCHAR(50) NOT NULL,
      nationality VARCHAR(100) NOT NULL,
      residential_address TEXT NOT NULL,
      tin VARCHAR(50),
      email VARCHAR(255) NOT NULL UNIQUE,
      mobile_phone VARCHAR(20) NOT NULL,
      passport_url TEXT,
      id_card_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  for (const member of memberships as any[]) {
    try {
      await sql`
        INSERT INTO memberships (
          id, title, surname, first_name, middle_name, date_of_birth, gender,
          nationality, residential_address, tin, email, mobile_phone
        )
        VALUES (
          ${member.id}, ${member.title}, ${member.surname}, ${member.firstName}, ${member.middleName || null},
          ${member.dateOfBirth}, ${member.gender}, ${member.nationality}, ${member.residentialAddress},
          ${member.tin || null}, ${member.email}, ${member.mobilePhone}
        )
        ON CONFLICT (id) DO NOTHING;
      `;
    } catch (err) {
      console.error("Membership insert failed:", member.email, err);
    }
  }
}

/**
 * Seed Investments (Linked to Memberships)
 */
async function seedInvestments() {
  await sql`
    CREATE TABLE IF NOT EXISTS investments (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      member_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
      member_email VARCHAR(255) NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      monthly_interest DECIMAL(12, 2) NOT NULL,
      duration VARCHAR(50) NOT NULL,
      bank_name VARCHAR(255) NOT NULL,
      account_number VARCHAR(20) NOT NULL,
      account_name VARCHAR(255),
      account_class VARCHAR(50) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  // Note: Add a loop here similar to seedMemberships if you have initial investment data
}

export async function GET() {
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    // Drop tables in REVERSE order of dependency to avoid foreign key errors
    await sql`DROP TABLE IF EXISTS investments CASCADE`;
    await sql`DROP TABLE IF EXISTS memberships CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;

    // Seed tables in order of dependency
    await seedUsers();
    await seedMemberships();
    await seedInvestments();
  
    return Response.json({ 
        message: 'Database reset successfully. Schema updated and dependencies linked.' 
    });
  } catch (error: any) {
    console.error("Seeding failed:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}