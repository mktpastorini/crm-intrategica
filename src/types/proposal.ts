
export interface Proposal {
  id: string;
  title: string;
  content: string;
  total_value: number;
  lead_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductService {
  id: string;
  name: string;
  type: 'product' | 'service';
  price: number;
  description?: string;
  created_at: string;
  updated_at: string;
}
