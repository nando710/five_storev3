'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Save, User, FileText, Phone, Mail } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';

const profileSchema = z.object({
    name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
    email: z.string().email(),
    document: z.string().min(11, 'CPF/CNPJ inválido'),
    phone: z.string().optional(),
    zipCode: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/profile');
                if (res.ok) {
                    const data = await res.json();
                    if (data.profile) {
                        reset({
                            name: data.profile.name || '',
                            document: data.profile.document || '',
                            phone: data.profile.phone || '',
                            email: data.profile.email || '',
                            zipCode: data.profile.zipCode || '',
                            street: data.profile.street || '',
                            number: data.profile.number || '',
                            complement: data.profile.complement || '',
                            neighborhood: data.profile.neighborhood || '',
                            city: data.profile.city || '',
                            state: data.profile.state || '',
                        });
                    }
                } else {
                    setErrorMessage('Não foi possível carregar os dados do perfil.');
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                setErrorMessage('Erro ao conectar com o servidor.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [reset]);

    const onSubmit = async (data: ProfileFormValues) => {
        setIsSaving(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.name,
                    document: data.document,
                    phone: data.phone,
                    zipCode: data.zipCode,
                    street: data.street,
                    number: data.number,
                    complement: data.complement,
                    neighborhood: data.neighborhood,
                    city: data.city,
                    state: data.state,
                }),
            });

            const result = await res.json();

            if (res.ok && result.success) {
                setSuccessMessage('Perfil atualizado com sucesso!');
                reset({
                    name: result.profile.name || '',
                    document: result.profile.document || '',
                    phone: result.profile.phone || '',
                    email: result.profile.email || '',
                    zipCode: result.profile.zipCode || '',
                    street: result.profile.street || '',
                    number: result.profile.number || '',
                    complement: result.profile.complement || '',
                    neighborhood: result.profile.neighborhood || '',
                    city: result.profile.city || '',
                    state: result.profile.state || '',
                });

                // Clear success message after 3 seconds
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setErrorMessage(result.error || 'Erro ao atualizar o perfil.');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setErrorMessage('Erro ao conectar com o servidor.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-muted/20 flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/20 flex flex-col">
            <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
                <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                    <div className="px-6 py-8 border-b border-border bg-muted/30">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <User size={32} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold font-urbanist">Meu Perfil</h1>
                                <p className="text-muted-foreground">Gerencie suas informações cadastrais</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {successMessage && (
                            <div className="mb-6 p-4 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-purple-500" />
                                <span className="text-sm font-medium">Informações salvas com sucesso</span>
                            </div>
                        )}

                        {errorMessage && (
                            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                {errorMessage}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <User size={16} className="text-muted-foreground" />
                                    Nome Completo / Razão Social
                                </label>
                                <input
                                    {...register('name')}
                                    className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                    placeholder="Seu nome"
                                />
                                {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <FileText size={16} className="text-muted-foreground" />
                                        CPF ou CNPJ
                                    </label>
                                    <input
                                        {...register('document')}
                                        className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        placeholder="000.000.000-00"
                                    />
                                    {errors.document && <p className="text-destructive text-sm mt-1">{errors.document.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Phone size={16} className="text-muted-foreground" />
                                        Telefone / WhatsApp
                                    </label>
                                    <input
                                        {...register('phone')}
                                        className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        placeholder="(00) 00000-0000"
                                    />
                                    {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>}
                                </div>
                            </div>

                            <hr className="border-border my-6" />
                            <h2 className="text-lg font-bold font-urbanist mb-4 flex items-center gap-2">
                                Endereço Padrão
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">CEP</label>
                                    <input
                                        {...register('zipCode')}
                                        className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        placeholder="00000-000"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium">Rua / Logradouro</label>
                                    <input
                                        {...register('street')}
                                        className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        placeholder="Av. Principal"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Número</label>
                                    <input
                                        {...register('number')}
                                        className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        placeholder="123"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium">Complemento</label>
                                    <input
                                        {...register('complement')}
                                        className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        placeholder="Sala 1, Bloco B (Opcional)"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Bairro</label>
                                    <input
                                        {...register('neighborhood')}
                                        className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        placeholder="Centro"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Cidade</label>
                                    <input
                                        {...register('city')}
                                        className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        placeholder="São Paulo"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">UF</label>
                                    <input
                                        {...register('state')}
                                        maxLength={2}
                                        className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none uppercase"
                                        placeholder="SP"
                                    />
                                </div>
                            </div>

                            <hr className="border-border my-6" />

                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Mail size={16} className="text-muted-foreground" />
                                    Email (Acesso)
                                </label>
                                <input
                                    {...register('email')}
                                    disabled
                                    className="w-full p-3 rounded-lg border border-border bg-muted/50 text-muted-foreground cursor-not-allowed"
                                    title="O email de acesso não pode ser alterado por aqui"
                                />
                            </div>

                            <div className="pt-4 border-t border-border flex justify-end">
                                <button
                                    type="submit"
                                    disabled={!isDirty || isSaving}
                                    className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        <Save size={20} />
                                    )}
                                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
