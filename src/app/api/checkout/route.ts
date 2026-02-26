import { NextResponse } from 'next/server';
import { createAsaasCustomer, createAsaasPayment, getAsaasPixQrCode } from '@/lib/asaas';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { customer, items, paymentMethod, total } = body;

        // 1. Create Customer
        const asaasCustomer = await createAsaasCustomer({
            name: customer.name,
            cpfCnpj: customer.document,
            email: customer.email,
            phone: customer.phone,
        });

        if (!asaasCustomer) {
            return NextResponse.json({ error: 'Failed to create customer in Asaas' }, { status: 500 });
        }

        // 2. Create Payment
        const paymentParams = {
            customer: asaasCustomer.id,
            billingType: paymentMethod, // 'PIX' or 'CREDIT_CARD'
            value: total,
            dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Due tomorrow
            description: `Pedido na Five Store`,
        };

        const asaasPayment = await createAsaasPayment(paymentParams);

        if (!asaasPayment || !asaasPayment.id) {
            return NextResponse.json({ error: 'Failed to create payment in Asaas' }, { status: 500 });
        }

        // 3. If PIX, fetch QR Code
        if (paymentMethod === 'PIX') {
            const pixData = await getAsaasPixQrCode(asaasPayment.id);
            return NextResponse.json({
                success: true,
                paymentId: asaasPayment.id,
                pixQrCode: pixData,
            });
        }

        return NextResponse.json({
            success: true,
            paymentId: asaasPayment.id,
        });

    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
