import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, Loader2, Shield } from 'lucide-react';
import api from '@/services/api';

export const Register = () => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'developer', department: '',
    adminEmail: '', adminPassword: ''
  });
  const [step, setStep] = useState(1);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleVerifyAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setVerifying(true);
    try {
      const res = await api.verifyAdmin(form.adminEmail, form.adminPassword);
      if (res.isValid) {
        setStep(2);
      } else {
        throw new Error('Invalid administrator credentials.');
      }
    } catch (err) {
      setError(err.message || 'Admin verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">ProjectPulse AI</span>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              {step === 1 ? 'Admin Authorization' : 'Create Account'}
            </h2>
            <p className="text-gray-400 mt-2">
              {step === 1 ? 'Unlock registration with admin credentials' : 'Join your team on ProjectPulse'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleVerifyAdmin} className="space-y-4">
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={16} className="text-indigo-400" />
                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Gatekeeper</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                  Administrative approval is required to create new enterprise accounts. Please have an administrator authorize this session.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Admin Email</label>
                <input
                  type="email" id="admin-email" value={form.adminEmail}
                  onChange={e => updateField('adminEmail', e.target.value)} required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                  placeholder="admin@projectpulse.io"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Admin Password</label>
                <input
                  type="password" id="admin-password" value={form.adminPassword}
                  onChange={e => updateField('adminPassword', e.target.value)} required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit" disabled={verifying}
                className="w-full py-4 bg-white text-indigo-950 font-black rounded-xl shadow-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-widest text-xs mt-4"
              >
                {verifying ? <Loader2 size={18} className="animate-spin" /> : <>Authorize & Continue <ArrowRight size={18} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                <input
                  type="text" id="register-name" value={form.name}
                  onChange={e => updateField('name', e.target.value)} required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                <input
                  type="email" id="register-email" value={form.email}
                  onChange={e => updateField('email', e.target.value)} required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                <input
                  type="password" id="register-password" value={form.password}
                  onChange={e => updateField('password', e.target.value)} required minLength={6}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Role</label>
                  <select
                    id="register-role" value={form.role}
                    onChange={e => updateField('role', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold appearance-none"
                  >
                    <option value="developer">Developer</option>
                    <option value="team_leader">Team Leader</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR Admin</option>
                    <option value="stakeholder">Stakeholder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Department</label>
                  <input
                    type="text" id="register-department" value={form.department}
                    onChange={e => updateField('department', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                    placeholder="Engineering"
                  />
                </div>
              </div>

              <button
                type="submit" id="register-submit" disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-widest text-xs mt-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <>Complete Registration <ArrowRight size={18} /></>}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-[10px] font-black text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-widest"
              >
                Back to Authorization
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-gray-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
