import { NextResponse } from 'next/server';
import { calculateShipping } from '@/lib/frenet';
import { FrenetItem, FrenetQuoteRequest, FrenetShippingService } from '@/types/frenet';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { recipientCep, items, invoiceValue } = body;

        if (!recipientCep || !items || items.length === 0) {
            return NextResponse.json({ success: true, options: [] }, { status: 200 }); // Graceful degrade so frontend doesn't crash on initial load before CEP is typed
        }

        const shippingItems: FrenetItem[] = items.map((item: any) => ({
            Weight: item.weight || 1, // Default to 1kg if undefined
            Length: item.length || 20, // Default to 20cm
            Height: item.height || 10,
            Width: item.width || 15,
            Quantity: item.quantity || 1,
            SKU: item.id
        }));

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        const { data: configs } = await supabase.from('shipping_config').select('*');
        const activeConfigs = configs || [];

        const quoteRequest: FrenetQuoteRequest = {
            SellerCEP: '01001000', // Hardcoded origin for now, in a real app this comes from the franchisee profile
            RecipientCEP: recipientCep.replace(/\D/g, ''),
            ShipmentInvoiceValue: invoiceValue,
            ShippingItemArray: shippingItems,
        };

        const shippingOptions = await calculateShipping(quoteRequest);
        let finalOptions: FrenetShippingService[] = [];

        if (shippingOptions && shippingOptions.length > 0) {
            finalOptions = shippingOptions.filter((opt) => {
                const serviceCodeStr = String(opt.ServiceCode);

                // 1. Explicit ID match
                const explicitConfig = activeConfigs.find(c => c.id === serviceCodeStr);
                if (explicitConfig) {
                    return explicitConfig.active;
                }

                // 2. Fallback to name match
                const nameMatch = activeConfigs.find(c => c.name.toLowerCase() === opt.ServiceDescription.toLowerCase());
                if (nameMatch) {
                    return nameMatch.active;
                }

                return false; // Se a transportadora não foi sincronizada/encontrada no BD, ocultamos por padrão
            });
        }

        const pickupConfig = activeConfigs.find(c => c.id === 'pickup');
        if (pickupConfig && pickupConfig.active) {
            finalOptions.unshift({
                ServiceCode: 'pickup',
                ServiceDescription: pickupConfig.name || 'Retirar na Franqueadora',
                Carrier: 'Franqueadora',
                CarrierCode: 'pickup',
                ShippingPrice: pickupConfig.price.toString(),
                DeliveryTime: pickupConfig.delivery_time.toString(),
                Error: false,
                OriginalDeliveryTime: pickupConfig.delivery_time.toString(),
                OriginalShippingPrice: pickupConfig.price.toString()
            });
        }

        return NextResponse.json({ success: true, options: finalOptions });

    } catch (error) {
        console.error('Shipping calculation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
