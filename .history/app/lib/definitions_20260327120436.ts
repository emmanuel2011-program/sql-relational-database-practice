export type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'investor';
};

export type Membership = {
  id: string;
  surname: string;
  first_name: string;
  email: string;
  date_of_birth: string;
  nationality: string;
};

export type Investment = {
  id: string;
  member_id: string;
  amount: number;
  monthly_interest: number;
  duration: string;
  status: 'pending' | 'approved';
};