'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Store, Mail, Lock } from 'lucide-react';

export default function AuthPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const supabase = createClient();

    const [form, setForm] = useState({
        email: '',
        password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
        });

        if (error) {
            setError(error.message === 'Invalid login credentials'
                ? 'Email ou senha incorretos.'
                : error.message);
            setLoading(false);
            return;
        }

        router.push('/admin');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 text-primary mb-2">
                        <Store size={32} />
                        <span className="text-3xl font-bold font-urbanist">Five Store</span>
                    </div>
                    <p className="text-muted-foreground text-sm">Painel Administrativo da Franqueadora</p>
                </div>

                {/* Card */}
                <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
                    <h2 className="text-xl font-urbanist font-bold text-center mb-6">Acesso Restrito</h2>

                    {error && (
                        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm p-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium flex items-center gap-2"><Mail size={14} /> Email</label>
                            <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="admin@fivestore.com.br" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium flex items-center gap-2"><Lock size={14} /> Senha</label>
                            <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={6} className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Sua senha" />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold text-sm hover:bg-primary/90 transition-all shadow-sm disabled:opacity-70 mt-2"
                        >
                            {loading ? 'Entrando...' : 'Entrar no Painel'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    Acesso exclusivo para a administração da Franqueadora Five Store.
                </p>
            </div>
        </div>
    );
}
