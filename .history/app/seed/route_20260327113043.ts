'use server';

import bcrypt from 'bcrypt';
import postgres from 'postgres';
import { memberships, loanApplications, users } from '../lib/cooperative-data';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

/**
 * Seed Admin Users
 */
async function seedUsers() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;

  for (const user of users as any[]) {
    try {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    } catch (err) {
      console.error("User insert failed:", err);
    }
  }
}

/**
 * Seed Memberships
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
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
 * Seed Investments
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
      receipt_url TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      contract_accepted BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
}



/**
 * NEW: Seed Loan Guarantors
 */
async function seedLoanGuarantors() {
  await sql`
    CREATE TABLE IF NOT EXISTS loan_guarantors (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      loan_application_id UUID NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
      full_name VARCHAR(255) NOT NULL,
      phone_number VARCHAR(50),
      residential_address TEXT,
      occupation VARCHAR(100),
      position_grade VARCHAR(100),
      salary VARCHAR(100),
      office_address TEXT,
      relationship VARCHAR(100),
      years_known INT,
      passport_url TEXT,
      id_card_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Optional: Add a sample guarantor for your seed data if desired
  // This logic assumes you have at least one loan in your loanApplications array
  if (loanApplications.length > 0) {
    const firstLoan = loanApplications[0] as any;
    try {
      await sql`
        INSERT INTO loan_guarantors (
          loan_application_id, full_name, phone_number, relationship, years_known
        )
        VALUES (
          ${firstLoan.id}, 'Sample Guarantor Name', '08000000000', 'Colleague', 5
        )
        ON CONFLICT (id) DO NOTHING;
      `;
    } catch (err) {
      console.error("Guarantor seed failed:", err);
    }
  }
}

/**
 * Main Execution
 */
export async function GET() {
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    // Drop tables in REVERSE order of dependency
    await sql`DROP TABLE IF EXISTS loan_guarantors CASCADE`;
    await sql`DROP TABLE IF EXISTS investments CASCADE`;
    await sql`DROP TABLE IF EXISTS loan_applications CASCADE`;
    await sql`DROP TABLE IF EXISTS memberships CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;

    // Seed tables in order of dependency
    await seedUsers();
    await seedMemberships();
    await seedInvestments();
    await seedLoanApplications();
    await seedLoanGuarantors(); // Must be seeded after loan_applications

    return Response.json({ 
        message: 'Database reset successfully. Schema updated with Guarantors and Account fields.' 
    });
  } catch (error: any) {
    console.error("Seeding failed:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}