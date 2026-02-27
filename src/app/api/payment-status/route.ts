import { NextResponse } from 'next/server';
import { getAsaasPaymentStatus } from '@/lib/asaas';
import { createClient } from '@/utils/supabase/server';
import { sendPaymentConfirmationWebhook } from '@/lib/webhook';

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

            // 1. Check if there's a PENDING order with this payment ID
            const { data: checkData, error: checkError } = await supabase
                .from('orders')
                .select('id')
                .eq('asaas_payment_id', paymentId)
                .eq('status', 'PENDING');

            if (checkError) {
                console.error('Error fetching order status in DB:', checkError);
            } else if (checkData && checkData.length > 0) {
                const orderId = checkData[0].id;

                // 2. Update status and fire webhook
                const { error: updateError } = await supabase
                    .from('orders')
                    .update({ status: 'PAID' })
                    .eq('id', orderId);

                if (updateError) {
                    console.error('Error updating order status in DB:', updateError);
                } else {
                    // Trigger Webhook on successful payment state change (only first time)
                    sendPaymentConfirmationWebhook(orderId);
                }
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
