export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
}

export const users: User[] = [
  {
    id: 1,
    email: 'admin@admin.com',
    password: 'admin',
    name: 'Admin',
    role: 'admin'
  },
  {
    id: 2,
    email: 'user@user.com',
    password: 'user123',
    name: 'Default User',
    role: 'user'
  }
]; 