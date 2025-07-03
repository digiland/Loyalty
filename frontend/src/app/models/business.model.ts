export interface Business {
  id: number;
  name: string;
  email: string;
  contact_person?: string;
  loyalty_rate: number;
  created_at: string;
}

export interface BusinessCreate {
  name: string;
  email: string;
  contact_person?: string;
  password: string;
  loyalty_rate?: number;
}
