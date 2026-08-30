import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

const STAFF_ROLES = ['ADMIN', 'SUPERVISOR', 'AGENT'];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      if (!STAFF_ROLES.includes(data.user.role)) {
        await api
          .post('/auth/logout', {})
          .catch(() => undefined);
        toast.error('This portal is reserved for staff accounts.');
        return;
      }

      setAuth(data.user, data.access_token);
      toast.success(`Welcome back, ${data.user.firstName}!`);
      navigate(
        data.user.role === 'AGENT' ? '/dashboard/queue' : '/dashboard',
        { replace: true },
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-4"
          >
            <span className="text-3xl text-white font-bold">Q</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900">Smart Queue</h1>
          <p className="text-gray-500 mt-2">Sign in to the staff portal</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white rounded-2xl p-8 border border-gray-200 shadow-premium"
        >
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                'Signing in...'
              ) : (
                <>
                  Sign In <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </div>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Demo: admin@pfe.com / password123
        </p>
      </motion.div>
    </div>
  );
}
