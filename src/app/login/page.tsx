'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Store, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const supabase = createClient();

    const [form, setForm] = useState({ email: '', password: '' });

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
            setError('Email ou senha incorretos.');
            setLoading(false);
            return;
        }

        // Check franchisee status
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setError('Erro ao verificar usuário.');
            setLoading(false);
            return;
        }

        // Check if admin
        const res = await fetch('/api/auth/me');
        const me = await res.json();

        if (me.role === 'admin') {
            router.push('/admin');
        } else if (me.status === 'approved') {
            router.push('/');
        } else if (me.status === 'pending') {
            setError('Seu cadastro ainda está aguardando aprovação da Franqueadora.');
            await supabase.auth.signOut();
        } else if (me.status === 'rejected') {
            setError('Seu cadastro foi recusado. Entre em contato com a Franqueadora.');
            await supabase.auth.signOut();
        } else {
            router.push('/');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 text-primary mb-2">
                        <Store size={32} />
                        <span className="text-3xl font-bold font-urbanist">Five Store</span>
                    </div>
                    <p className="text-muted-foreground text-sm">Acesso para Franqueados</p>
                </div>

                <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm p-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium flex items-center gap-2"><Mail size={14} /> Email</label>
                            <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="email@empresa.com" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium flex items-center gap-2"><Lock size={14} /> Senha</label>
                            <input name="password" type="password" value={form.password} onChange={handleChange} required className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Sua senha" />
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold text-sm hover:bg-primary/90 transition-all shadow-sm disabled:opacity-70 mt-2">
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>

                    <p className="text-center text-xs text-muted-foreground mt-6">
                        Ainda não tem conta? <a href="/cadastro" className="text-primary font-medium hover:underline">Cadastre-se como Franqueado</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
