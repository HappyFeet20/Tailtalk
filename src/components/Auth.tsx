
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Lock, Loader2, LogOut, User } from 'lucide-react';

interface AuthProps {
    onAuthSuccess?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
    if (!supabase) {
        return (
            <div className="text-center p-4">
                <p className="text-xs text-luxe-deep/40 italic">Cloud sync unavailable — running in local mode.</p>
            </div>
        );
    }

    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage('Check your email for the confirmation link!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onAuthSuccess?.();
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-sm mx-auto p-6 space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-serif italic font-bold text-luxe-deep mb-2">
                    {mode === 'login' ? 'Welcome Back' : 'Join the Pack'}
                </h2>
                <p className="text-sm text-luxe-deep/60">
                    {mode === 'login' ? 'Sync your data across devices' : 'Create an account to start syncing'}
                </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                    <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-luxe-deep/40" size={18} />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-12 pr-4 py-3 bg-luxe-base border border-luxe-border rounded-xl text-luxe-deep placeholder:text-luxe-deep/30 focus:border-luxe-gold focus:ring-1 focus:ring-luxe-gold outline-none transition-all"
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-luxe-deep/40" size={18} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full pl-12 pr-4 py-3 bg-luxe-base border border-luxe-border rounded-xl text-luxe-deep placeholder:text-luxe-deep/30 focus:border-luxe-gold focus:ring-1 focus:ring-luxe-gold outline-none transition-all"
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs text-center">
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-luxe-gold text-luxe-base font-bold rounded-xl hover:bg-luxe-gold/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : (mode === 'login' ? 'Sign In' : 'Sign Up')}
                </button>
            </form>

            <div className="text-center">
                <button
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-xs text-luxe-deep/60 hover:text-luxe-gold transition-colors"
                >
                    {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </button>
            </div>
        </div>
    );
};
