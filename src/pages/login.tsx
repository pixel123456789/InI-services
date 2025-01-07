import { useState } from 'preact/hooks';
import { route } from 'preact-router';
import { useGlobalState } from '@ekwoka/preact-global-state';
import { AuthService } from '../services/auth';
import type { UserAccount } from '../types';

export function Login() {
  const [, setUser] = useGlobalState<UserAccount | null>('user', null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    try {
      const user = await AuthService.login(username, password);
      setUser(user);
      route('/');
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-6 bg-surface rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Login</h1>
        
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        
        <div className="mb-4">
          <label className="block mb-2">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-primary text-white p-2 rounded hover:bg-primary-dark"
        >
          Login
        </button>
      </form>
    </div>
  );
} 
