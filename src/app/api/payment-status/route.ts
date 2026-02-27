import { NextResponse } from 'next/server';
import { getAsaasPaymentStatus } from '@/lib/asaas';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('id');

    if (!paymentId) {
        return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
    }

    const result = await getAsaasPaymentStatus(paymentId);

    if (!result) {
        return NextResponse.json({ error: 'Failed to fetch payment status' }, { status: 500 });
    }

    // Asaas statuses: PENDING, RECEIVED, CONFIRMED, OVERDUE, REFUNDED, etc.
    const isPaid = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(result.status);

    // If paid, update the order status in Supabase
    if (isPaid) {
        try {
            const supabase = await createClient();
            const { error } = await supabase
                .from('orders')
                .update({ status: 'PAID' })
                .eq('asaas_payment_id', paymentId)
                .eq('status', 'PENDING'); // Only update if currently PENDING to avoid overwriting SHIPPED/DELIVERED

            if (error) {
                console.error('Error updating order status in DB:', error);
            }
        } catch (e) {
            console.error('Failed to initialize supabase client for status update:', e);
        }
    }

    return NextResponse.json({
        status: result.status,
        isPaid,
    });
}
