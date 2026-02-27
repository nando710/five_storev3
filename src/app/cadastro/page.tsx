'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Store, Mail, Lock, User, FileText, Phone, MapPin, CheckCircle2 } from 'lucide-react';

export default function CadastroPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        document: '',
        phone: '',
        zipCode: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Create auth user with metadata — the Postgres trigger will create the franchisee profile
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: {
                data: {
                    name: form.name,
                    document: form.document.replace(/\D/g, ''),
                    phone: form.phone.replace(/\D/g, ''),
                    zipCode: form.zipCode.replace(/\D/g, ''),
                    street: form.street,
                    number: form.number,
                    complement: form.complement,
                    neighborhood: form.neighborhood,
                    city: form.city,
                    state: form.state,
                },
            },
        });

        if (authError || !authData.user) {
            setError(authError?.message || 'Erro ao criar conta.');
            setLoading(false);
            return;
        }

        setSuccess(true);
        setLoading(false);
    };

    if (success) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4">
                <div className="max-w-md text-center">
                    <div className="flex justify-center mb-6 text-primary">
                        <CheckCircle2 size={64} />
                    </div>
                    <h1 className="text-3xl font-bold font-urbanist mb-3">Cadastro Enviado!</h1>
                    <p className="text-muted-foreground mb-6">
                        Seu cadastro foi recebido com sucesso e está <strong>aguardando aprovação</strong> da Franqueadora.
                        Você receberá um aviso quando sua conta for liberada.
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                    >
                        Voltar para a Loja
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 text-primary mb-2">
                        <Store size={28} />
                        <span className="text-2xl font-bold font-urbanist">Five Store</span>
                    </div>
                    <h1 className="text-2xl font-bold font-urbanist">Cadastro de Franqueado</h1>
                    <p className="text-muted-foreground text-sm mt-1">Preencha seus dados para solicitar acesso à loja.</p>
                </div>

                <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm p-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium flex items-center gap-2"><User size={14} /> Nome Completo / Razão Social</label>
                            <input name="name" value={form.name} onChange={handleChange} required className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Nome da empresa ou responsável" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium flex items-center gap-2"><FileText size={14} /> CPF/CNPJ</label>
                                <input name="document" value={form.document} onChange={handleChange} required className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="000.000.000-00" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium flex items-center gap-2"><Phone size={14} /> Telefone</label>
                                <input name="phone" value={form.phone} onChange={handleChange} required className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="(00) 00000-0000" />
                            </div>
                        </div>

                        <div className="border-t border-border pt-4 mt-2 mb-2">
                            <h3 className="text-sm font-bold font-urbanist flex items-center gap-2 mb-3 text-muted-foreground"><MapPin size={16} /> Endereço</h3>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1 col-span-1">
                                <label className="text-sm font-medium">CEP</label>
                                <input name="zipCode" value={form.zipCode} onChange={handleChange} required className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="00000-000" />
                            </div>
                            <div className="space-y-1 col-span-2">
                                <label className="text-sm font-medium">Rua</label>
                                <input name="street" value={form.street} onChange={handleChange} required className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Nome da rua" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-4">
                            <div className="space-y-1 col-span-1">
                                <label className="text-sm font-medium">Número</label>
                                <input name="number" value={form.number} onChange={handleChange} required className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="123" />
                            </div>
                            <div className="space-y-1 col-span-2">
                                <label className="text-sm font-medium">Complemento</label>
                                <input name="complement" value={form.complement} onChange={handleChange} className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Apto, Bloco..." />
                            </div>
                        </div>

                        <div className="space-y-1 mt-4">
                            <label className="text-sm font-medium">Bairro</label>
                            <input name="neighborhood" value={form.neighborhood} onChange={handleChange} required className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Bairro" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium flex items-center gap-2"><MapPin size={14} /> Cidade</label>
                                <input name="city" value={form.city} onChange={handleChange} className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="São Paulo" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium flex items-center gap-2">UF</label>
                                <input name="state" value={form.state} onChange={handleChange} maxLength={2} className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase" placeholder="SP" />
                            </div>
                        </div>

                        <div className="border-t border-border pt-4 space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium flex items-center gap-2"><Mail size={14} /> Email de Acesso</label>
                                <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="email@empresa.com" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium flex items-center gap-2"><Lock size={14} /> Criar Senha</label>
                                <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={6} className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Mínimo 6 caracteres" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold text-sm hover:bg-primary/90 transition-all shadow-sm disabled:opacity-70 mt-2"
                        >
                            {loading ? 'Enviando...' : 'Solicitar Cadastro'}
                        </button>
                    </form>

                    <p className="text-center text-xs text-muted-foreground mt-6">
                        Já tem uma conta? <a href="/login" className="text-primary font-medium hover:underline">Faça login</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
