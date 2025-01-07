import { UserAccount } from '../types';

class AuthService {
  private static API_URL = '/api/auth';

  static async login(username: string, password: string): Promise<UserAccount> {
    const response = await fetch(`${this.API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  }

  static async logout(): Promise<void> {
    await fetch(`${this.API_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  }

  static async getCurrentUser(): Promise<UserAccount | null> {
    try {
      const response = await fetch(`${this.API_URL}/me`, {
        credentials: 'include',
      });
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  }
}

export { AuthService }; 
