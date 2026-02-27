'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCartStore } from '@/store/cart';
import { CreditCard, QrCode, Lock, CheckCircle2, Loader2, Copy } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const checkoutSchema = z.object({
    name: z.string().min(3, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    document: z.string().min(11, 'CPF/CNPJ inválido'),
    phone: z.string().min(10, 'Telefone inválido'),
    zipCode: z.string().min(8, 'CEP inválido'),
    street: z.string().min(3, 'Rua é obrigatória'),
    number: z.string().min(1, 'Número é obrigatório'),
    complement: z.string().optional(),
    neighborhood: z.string().min(2, 'Bairro é obrigatório'),
    city: z.string().min(2, 'Cidade é obrigatória'),
    state: z.string().length(2, 'Estado (UF) inválido'),
    paymentMethod: z.enum(['CREDIT_CARD', 'PIX']),
    // Credit card specific fields (optional based on method, handled logically)
    cardNumber: z.string().optional(),
    cardHolderName: z.string().optional(),
    cardExpiryMonth: z.string().optional(),
    cardExpiryYear: z.string().optional(),
    cardCcv: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
    const { items, getCartTotal, clearCart } = useCartStore();
    const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'PIX'>('CREDIT_CARD');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [orderComplete, setOrderComplete] = useState(false);
    const [pixData, setPixData] = useState<{ encodedImage: string, payload: string } | null>(null);
    const [paymentId, setPaymentId] = useState<string | null>(null);
    const [pixConfirmed, setPixConfirmed] = useState(false);
    const [copied, setCopied] = useState(false);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<CheckoutFormValues>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            paymentMethod: 'PIX',
            document: '',
            name: '',
            email: '',
            phone: '',
            zipCode: '',
            street: '',
            number: '',
            neighborhood: '',
            city: '',
            state: ''
        }
    });

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    if (data.authenticated && data.role === 'franchisee') {
                        reset({
                            paymentMethod: 'PIX',
                            name: data.name || '',
                            email: data.email || '',
                            document: data.document || '',
                            phone: data.phone || '',
                            // Leave address fields empty or fetch if you had address saved
                            zipCode: '',
                            street: '',
                            number: '',
                            neighborhood: '',
                            city: '',
                            state: ''
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch user profile for auto-fill:', error);
            } finally {
                setIsLoadingProfile(false);
            }
        };

        fetchUserProfile();
    }, [reset]);

    // Poll for PIX payment confirmation
    useEffect(() => {
        if (!paymentId || pixConfirmed) return;

        pollingRef.current = setInterval(async () => {
            try {
                const res = await fetch(`/api/payment-status?id=${paymentId}`);
                const data = await res.json();
                if (data.isPaid) {
                    setPixConfirmed(true);
                    if (pollingRef.current) clearInterval(pollingRef.current);
                }
            } catch (err) {
                console.error('Error polling payment status:', err);
            }
        }, 5000); // Check every 5 seconds

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [paymentId, pixConfirmed]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    const onSubmit = async (data: CheckoutFormValues) => {
        setIsProcessing(true);
        try {
            const total = getCartTotal() + 25.50 - (data.paymentMethod === 'PIX' ? getCartTotal() * 0.05 : 0);

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: data,
                    items,
                    paymentMethod: data.paymentMethod,
                    total,
                }),
            });

            const result = await response.json();

            if (result.success) {
                // Clear the cart immediately so the user can't double-submit
                clearCart();

                if (data.paymentMethod === 'PIX' && result.pixQrCode) {
                    setPixData(result.pixQrCode);
                    setPaymentId(result.paymentId);
                } else {
                    setOrderComplete(true);
                }
            } else {
                alert('Erro ao processar pagamento: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao conectar com o servidor.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (items.length === 0 && !orderComplete && !pixData) {
        return <div className="p-12 text-center text-xl">Carrinho vazio!</div>;
    }

    if (pixData && pixConfirmed) {
        return (
            <div className="container max-w-2xl px-4 py-24 mx-auto text-center">
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in duration-500">
                            <CheckCircle2 size={60} className="text-green-600" />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-green-200 animate-ping opacity-20" />
                    </div>
                </div>
                <h1 className="text-4xl font-urbanist font-bold mb-4 text-green-700">Pagamento Confirmado!</h1>
                <p className="text-lg text-muted-foreground mb-8">
                    Recebemos seu pagamento PIX com sucesso. Seu pedido está sendo processado!
                </p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                    Voltar para a Loja
                </button>
            </div>
        );
    }

    if (pixData) {
        return (
            <div className="container max-w-2xl px-4 py-16 mx-auto text-center">
                <h1 className="text-4xl font-urbanist font-bold mb-2">Pagamento via PIX</h1>
                <p className="text-muted-foreground mb-8">Escaneie o QR Code abaixo no aplicativo do seu banco.</p>

                <div className="flex justify-center mb-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`data:image/png;base64,${pixData.encodedImage}`} alt="QR Code PIX" className="w-64 h-64 border-2 border-primary/20 rounded-2xl shadow-lg" />
                </div>

                <div className="bg-muted p-4 rounded-xl mb-6 overflow-hidden border border-border">
                    <p className="text-xs break-all text-muted-foreground select-all font-mono">{pixData.payload}</p>
                </div>

                <button
                    onClick={() => {
                        navigator.clipboard.writeText(pixData.payload);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 3000);
                    }}
                    className="bg-secondary text-secondary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-secondary/80 transition-colors mb-4 w-full flex items-center justify-center gap-2"
                >
                    <Copy size={16} />
                    {copied ? 'Copiado! ✓' : 'Copiar Código PIX (Copia e Cola)'}
                </button>

                {/* Polling indicator */}
                <div className="mt-8 flex items-center justify-center gap-3 text-sm text-muted-foreground bg-muted/50 border border-border rounded-xl py-4 px-6">
                    <Loader2 size={18} className="animate-spin text-primary" />
                    <span>Aguardando confirmação do pagamento...</span>
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                    A confirmação aparecerá automaticamente assim que o pagamento for detectado.
                </p>
            </div>
        );
    }

    if (orderComplete) {
        return (
            <div className="container max-w-2xl px-4 py-24 mx-auto text-center">
                <div className="flex justify-center mb-6 text-primary">
                    <CheckCircle2 size={80} />
                </div>
                <h1 className="text-4xl font-urbanist font-bold mb-4">Pedido Confirmado!</h1>
                <p className="text-lg text-muted-foreground mb-8">
                    Recebemos seu pedido com sucesso. Em breve você receberá um email com as atualizações de status e rastreio.
                </p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="bg-primary text-primary-foreground px-8 py-3 rounded-md font-semibold hover:bg-primary/90 transition-colors"
                >
                    Voltar para Home
                </button>
            </div>
        );
    }

    if (isLoadingProfile) {
        return (
            <div className="container px-4 py-32 mx-auto flex flex-col items-center justify-center gap-4">
                <Loader2 size={48} className="animate-spin text-primary" />
                <p className="text-muted-foreground">Carregando seus dados...</p>
            </div>
        );
    }

    return (
        <div className="container px-4 md:px-8 mx-auto xl:max-w-7xl py-12">
            <h1 className="text-3xl font-bold font-urbanist mb-8">Checkout Seguro</h1>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-7 space-y-8">

                    {/* Dados Pessoais */}
                    <div className="bg-card p-6 md:p-8 rounded-xl border border-border/50 shadow-sm space-y-6">
                        <h2 className="font-urbanist font-bold text-xl flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs shrink-0">1</span>
                            Dados Pessoais
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Nome Completo</label>
                                <input {...register('name')} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
                                {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Email</label>
                                <input type="email" {...register('email')} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
                                {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">CPF/CNPJ</label>
                                <input {...register('document')} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
                                {errors.document && <span className="text-xs text-destructive">{errors.document.message}</span>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Telefone (Whatsapp)</label>
                                <input {...register('phone')} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
                                {errors.phone && <span className="text-xs text-destructive">{errors.phone.message}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Endereço */}
                    <div className="bg-card p-6 md:p-8 rounded-xl border border-border/50 shadow-sm space-y-6">
                        <h2 className="font-urbanist font-bold text-xl flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs shrink-0">2</span>
                            Endereço de Entrega
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1 md:col-span-1">
                                <label className="text-sm font-medium">CEP</label>
                                <input {...register('zipCode')} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
                                {errors.zipCode && <span className="text-xs text-destructive">{errors.zipCode.message}</span>}
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-sm font-medium">Rua/Logradouro</label>
                                <input {...register('street')} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
                                {errors.street && <span className="text-xs text-destructive">{errors.street.message}</span>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Número</label>
                                <input {...register('number')} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
                                {errors.number && <span className="text-xs text-destructive">{errors.number.message}</span>}
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-sm font-medium">Complemento</label>
                                <input {...register('complement')} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" placeholder="Apto, Bloco (Opcional)" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Bairro</label>
                                <input {...register('neighborhood')} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Cidade</label>
                                <input {...register('city')} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Estado (UF)</label>
                                <input {...register('state')} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm uppercase" maxLength={2} />
                            </div>
                        </div>
                    </div>

                    {/* Pagamento */}
                    <div className="bg-card p-6 md:p-8 rounded-xl border border-border/50 shadow-sm space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-urbanist font-bold text-xl flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs shrink-0">3</span>
                                Pagamento
                            </h2>
                            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                <Lock size={12} /> Ambeiente Seguro
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <label className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'CREDIT_CARD' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50'}`}>
                                <input type="radio" value="CREDIT_CARD" {...register('paymentMethod')} className="sr-only" onChange={() => setPaymentMethod('CREDIT_CARD')} checked={paymentMethod === 'CREDIT_CARD'} />
                                <CreditCard className={`mb-2 ${paymentMethod === 'CREDIT_CARD' ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span className="font-semibold text-sm">Cartão de Crédito</span>
                            </label>

                            <label className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'PIX' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50'}`}>
                                <input type="radio" value="PIX" {...register('paymentMethod')} className="sr-only" onChange={() => setPaymentMethod('PIX')} checked={paymentMethod === 'PIX'} />
                                <QrCode className={`mb-2 ${paymentMethod === 'PIX' ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span className="font-semibold text-sm">PIX (5% OFF)</span>
                            </label>
                        </div>

                        {paymentMethod === 'CREDIT_CARD' && (
                            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Número do Cartão</label>
                                    <input {...register('cardNumber')} placeholder="0000 0000 0000 0000" className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Nome Impresso no Cartão</label>
                                    <input {...register('cardHolderName')} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm uppercase" />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Mês (MM)</label>
                                        <input {...register('cardExpiryMonth')} placeholder="12" maxLength={2} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Ano (AAAA)</label>
                                        <input {...register('cardExpiryYear')} placeholder="2028" maxLength={4} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">CVV</label>
                                        <input {...register('cardCcv')} placeholder="123" maxLength={4} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'PIX' && (
                            <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm text-center animate-in fade-in duration-300 border border-border">
                                O QR Code para pagamento via PIX será gerado na próxima etapa. A aprovação é imediata!
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isProcessing}
                            className="w-full mt-8 bg-primary text-primary-foreground py-4 rounded-md font-bold text-lg hover:bg-primary/90 transition-all shadow-sm hover:shadow-md disabled:opacity-70 flex justify-center items-center"
                        >
                            {isProcessing ? 'Processando...' : 'Confirmar Pagamento'}
                        </button>
                        <p className="text-xs text-center text-muted-foreground mt-4 italic">
                            Operação processada de forma segura por ASAAS Gestão Financeira.
                        </p>
                    </div>
                </form>

                {/* Resumo Lateral */}
                <div className="lg:col-span-5 h-fit sticky top-24">
                    <div className="bg-muted p-6 md:p-8 rounded-xl border border-border shadow-inner">
                        <h3 className="font-urbanist font-bold text-xl mb-6 border-b border-border/50 pb-4">Resumo do Pedido</h3>
                        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4 text-sm">
                                    <div className="relative w-16 h-16 bg-card rounded-md border border-border overflow-hidden shrink-0">
                                        {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full" />}
                                        <span className="absolute -top-2 -right-2 bg-foreground text-background text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{item.quantity}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium line-clamp-2">{item.name}</p>
                                        <span className="text-muted-foreground">{formatPrice(item.price)} un.</span>
                                    </div>
                                    <div className="font-semibold text-right">
                                        {formatPrice(item.price * item.quantity)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-border mt-6 pt-6 space-y-3">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span>{formatPrice(getCartTotal())}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Frete Expresso</span>
                                <span>{formatPrice(25.50)}</span>
                            </div>
                            {paymentMethod === 'PIX' && (
                                <div className="flex justify-between text-green-600 font-medium">
                                    <span>Desconto PIX (5%)</span>
                                    <span>- {formatPrice(getCartTotal() * 0.05)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-xl font-bold pt-4 border-t border-border">
                                <span>Total a Pagar</span>
                                <span className="text-primary">
                                    {formatPrice(getCartTotal() + 25.50 - (paymentMethod === 'PIX' ? getCartTotal() * 0.05 : 0))}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
