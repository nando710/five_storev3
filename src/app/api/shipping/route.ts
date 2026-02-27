import { NextResponse } from 'next/server';
import { calculateShipping } from '@/lib/frenet';
import { FrenetItem, FrenetQuoteRequest } from '@/types/frenet';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { recipientCep, items, invoiceValue } = body;

        if (!recipientCep || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const shippingItems: FrenetItem[] = items.map((item: any) => ({
            Weight: item.weight || 1, // Default to 1kg if undefined
            Length: item.length || 20, // Default to 20cm
            Height: item.height || 10,
            Width: item.width || 15,
            Quantity: item.quantity || 1,
            SKU: item.id
        }));

        const quoteRequest: FrenetQuoteRequest = {
            SellerCEP: '01001000', // Hardcoded origin for now, in a real app this comes from the franchisee profile
            RecipientCEP: recipientCep.replace(/\D/g, ''),
            ShipmentInvoiceValue: invoiceValue,
            ShippingItemArray: shippingItems,
        };

        const shippingOptions = await calculateShipping(quoteRequest);

        if (!shippingOptions) {
            return NextResponse.json({ error: 'Failed to calculate shipping' }, { status: 500 });
        }

        return NextResponse.json({ success: true, options: shippingOptions });

    } catch (error) {
        console.error('Shipping calculation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
