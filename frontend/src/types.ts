export interface User {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface DirectoryItem {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface StatusItem extends DirectoryItem {
  is_closed: boolean;
}

export interface Employee {
  id: string;
  full_name: string;
  organization_id: string;
  organization: DirectoryItem;
  created_at: string;
  updated_at: string;
}

export interface DocumentRecord {
  id: string;
  date: string;
  organization_id: string;
  employee_id: string;
  device_type_id: string;
  model: string;
  serial_number: string;
  condition_id: string;
  status_id: string;
  organization: DirectoryItem;
  employee: Employee;
  device_type: DirectoryItem;
  condition: DirectoryItem;
  status: StatusItem;
  created_at: string;
  updated_at: string;
}

export interface DocumentPage {
  items: DocumentRecord[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  csrf_token: string;
}

