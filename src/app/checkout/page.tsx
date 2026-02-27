'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCartStore } from '@/store/cart';
import { CreditCard, QrCode, Lock, CheckCircle2, Loader2, Copy, Truck } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { FrenetShippingService } from '@/types/frenet';
import { createClient } from '@/utils/supabase/client';

interface Category {
    id: string;
    tax_percentage: number;
    tax_name: string | null;
}

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
    const [shippingOptions, setShippingOptions] = useState<FrenetShippingService[]>([]);
    const [selectedShipping, setSelectedShipping] = useState<FrenetShippingService | null>(null);
    const [isLoadingShipping, setIsLoadingShipping] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<CheckoutFormValues>({
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
        const fetchUserProfileAndCategories = async () => {
            const supabase = createClient();

            // Fetch categories for tax calculation
            const { data: cats } = await supabase.from('categories').select('id, tax_percentage, tax_name');
            if (cats) setCategories(cats);

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
                            zipCode: data.zipCode || '',
                            street: data.street || '',
                            number: data.number || '',
                            complement: data.complement || '',
                            neighborhood: data.neighborhood || '',
                            city: data.city || '',
                            state: data.state || ''
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch user profile or categories:', error);
            } finally {
                setIsLoadingProfile(false);
            }
        };

        fetchUserProfileAndCategories();
    }, [reset]);

    const zipCode = watch('zipCode');

    // Automatically fetch shipping rates when zipcode is valid
    useEffect(() => {
        const fetchShipping = async () => {
            if (!zipCode || zipCode.replace(/\D/g, '').length !== 8) {
                setShippingOptions([]);
                setSelectedShipping(null);
                return;
            }

            setIsLoadingShipping(true);
            try {
                const invoiceValue = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

                const res = await fetch('/api/shipping', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipientCep: zipCode,
                        items,
                        invoiceValue
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.options) {
                        setShippingOptions(data.options);
                        if (data.options.length > 0) {
                            setSelectedShipping(data.options[0]);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch shipping:', error);
            } finally {
                setIsLoadingShipping(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchShipping();
        }, 800);

        return () => clearTimeout(timeoutId);
    }, [zipCode, items]);

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

    const calculateTaxes = () => {
        if (!categories.length) return [];

        const taxesByName: Record<string, number> = {};

        items.forEach(item => {
            if (!item.categoryId) return;
            const cat = categories.find(c => c.id === item.categoryId);
            if (!cat || !cat.tax_percentage) return;

            const itemTotal = item.price * item.quantity;
            const taxAmount = itemTotal * (cat.tax_percentage / 100);
            const rawTaxName = cat.tax_name?.trim();
            const taxName = rawTaxName ? rawTaxName : 'Taxas de Categoria';

            taxesByName[taxName] = (taxesByName[taxName] || 0) + taxAmount;
        });

        return Object.entries(taxesByName).map(([name, amount]) => ({ name, amount }));
    };

    const appliedTaxes = calculateTaxes();
    const totalTaxAmount = appliedTaxes.reduce((sum, tax) => sum + tax.amount, 0);

    const onSubmit = async (data: CheckoutFormValues) => {
        if (!selectedShipping) {
            alert('Por favor, selecione uma opção de entrega.');
            return;
        }

        setIsProcessing(true);
        try {
            const shippingFee = parseFloat(selectedShipping.ShippingPrice);
            const subtotal = getCartTotal();
            const total = subtotal + totalTaxAmount + shippingFee - (data.paymentMethod === 'PIX' ? subtotal * 0.05 : 0);

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: data,
                    items,
                    paymentMethod: data.paymentMethod,
                    total,
                    shippingFee,
                    shippingMethod: selectedShipping.ServiceDescription
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
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center animate-in zoom-in duration-500 shadow-xl shadow-purple-500/10">
                            <CheckCircle2 size={64} className="text-primary" />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-20" />
                    </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-urbanist font-black mb-4 text-primary">Pagamento Confirmado!</h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-lg mx-auto leading-relaxed">
                    Recebemos seu pagamento PIX com sucesso. Seu pedido já está sendo processado pela nossa equipe! 🎉
                </p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="bg-primary text-primary-foreground px-10 py-4 rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-primary/30 hover:bg-primary/90 transition-all duration-300 hover:scale-105 active:scale-95"
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
                    <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8 transition-all hover:shadow-[0_8px_30px_rgb(168,85,247,0.06)]">
                        <h2 className="font-urbanist font-black text-2xl flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground shadow-md text-sm shrink-0">1</span>
                            Dados Pessoais
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8 transition-all hover:shadow-[0_8px_30px_rgb(168,85,247,0.06)]">
                        <h2 className="font-urbanist font-black text-2xl flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground shadow-md text-sm shrink-0">2</span>
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

                    {/* Opções de Entrega */}
                    <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8 transition-all hover:shadow-[0_8px_30px_rgb(168,85,247,0.06)] mt-6">
                        <h2 className="font-urbanist font-black text-2xl flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground shadow-md text-sm shrink-0">3</span>
                            Opções de Entrega
                        </h2>

                        {isLoadingShipping ? (
                            <div className="flex items-center justify-center p-8 bg-muted/20 rounded-xl border border-dashed border-border">
                                <Loader2 className="animate-spin text-primary h-6 w-6" />
                                <span className="ml-3 text-muted-foreground font-medium">Calculando prazos e preços...</span>
                            </div>
                        ) : shippingOptions.length > 0 ? (
                            <div className="space-y-3">
                                {shippingOptions.map((option) => {
                                    const isSelected = selectedShipping?.ServiceCode === option.ServiceCode;
                                    return (
                                        <label key={option.ServiceCode} className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="radio"
                                                        name="shippingOption"
                                                        className="peer sr-only"
                                                        checked={isSelected}
                                                        onChange={() => setSelectedShipping(option)}
                                                    />
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                                                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-background" />}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="font-bold text-foreground flex items-center gap-2">
                                                        <Truck size={14} className="text-muted-foreground" />
                                                        {option.ServiceDescription}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground block mt-0.5">
                                                        Receba em até <strong className="text-foreground">{option.DeliveryTime} dias úteis</strong>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-lg text-primary">{formatPrice(parseFloat(option.ShippingPrice))}</span>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-6 bg-muted/30 rounded-xl text-center text-muted-foreground border border-dashed border-border flex flex-col items-center justify-center gap-2">
                                <Truck size={32} className="text-muted-foreground/40 mb-2" />
                                <p className="font-medium text-foreground/80">Nenhuma opção de entrega selecionada</p>
                                <p className="text-sm">Preencha um CEP válido acima para visualizar os prazos e valores.</p>
                            </div>
                        )}
                    </div>

                    {/* Pagamento */}
                    <div className="bg-card p-6 md:p-8 rounded-xl border border-border/50 shadow-sm space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-urbanist font-bold text-xl flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs shrink-0">4</span>
                                Pagamento
                            </h2>
                            <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full border border-purple-100">
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
                            {appliedTaxes.map((tax, idx) => (
                                <div key={idx} className="flex justify-between items-center text-muted-foreground">
                                    <span>{tax.name}</span>
                                    <span>{formatPrice(tax.amount)}</span>
                                </div>
                            ))}

                            {shippingOptions.length > 0 && selectedShipping && (
                                <div className="flex justify-between items-center text-muted-foreground">
                                    <span className="flex flex-col">
                                        <span>Frete</span>
                                        {selectedShipping && <span className="text-xs">{selectedShipping.ServiceDescription}</span>}
                                    </span>
                                    <span>{formatPrice(parseFloat(selectedShipping.ShippingPrice))}</span>
                                </div>
                            )}

                            {paymentMethod === 'PIX' && (
                                <div className="flex justify-between items-center text-purple-600 font-medium">
                                    <span>Desconto PIX (5%)</span>
                                    <span>-{formatPrice(getCartTotal() * 0.05)}</span>
                                </div>
                            )}

                            <div className="pt-4 border-t border-border flex justify-between items-center font-bold text-xl">
                                <span>Total</span>
                                <span>
                                    {formatPrice(
                                        getCartTotal() +
                                        totalTaxAmount +
                                        (selectedShipping ? parseFloat(selectedShipping.ShippingPrice) : 0) -
                                        (paymentMethod === 'PIX' ? getCartTotal() * 0.05 : 0)
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
