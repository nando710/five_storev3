import { NextResponse } from 'next/server';
import { createAsaasCustomer, createAsaasPayment, getAsaasPixQrCode } from '@/lib/asaas';
import { createClient } from '@/utils/supabase/server';
import { sendPaymentConfirmationWebhook } from '@/lib/webhook';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { customer, items, paymentMethod, total, shippingFee, shippingMethod } = body;

        // 1. Create Customer in Asaas
        const asaasCustomer = await createAsaasCustomer({
            name: customer.name,
            cpfCnpj: customer.document,
            email: customer.email,
            phone: customer.phone,
        });

        if (!asaasCustomer) {
            return NextResponse.json({ error: 'Failed to create customer in Asaas' }, { status: 500 });
        }

        // 2. Create Payment in Asaas
        const paymentParams: any = {
            customer: asaasCustomer.id,
            billingType: paymentMethod, // 'PIX' or 'CREDIT_CARD'
            value: total,
            dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            description: `Pedido na Five Store`,
        };

        if (paymentMethod === 'CREDIT_CARD') {
            paymentParams.creditCard = {
                holderName: customer.cardHolderName,
                number: customer.cardNumber?.replace(/\D/g, ''),
                expiryMonth: customer.cardExpiryMonth,
                expiryYear: customer.cardExpiryYear,
                ccv: customer.cardCcv,
            };
            paymentParams.creditCardHolderInfo = {
                name: customer.name,
                email: customer.email,
                cpfCnpj: customer.document?.replace(/\D/g, ''),
                postalCode: customer.zipCode?.replace(/\D/g, ''),
                addressNumber: customer.number,
                addressComplement: customer.complement || '',
                phone: customer.phone?.replace(/\D/g, ''),
            };

            if (!paymentParams.creditCard.number || !paymentParams.creditCard.ccv) {
                return NextResponse.json({ error: 'Missing credit card information' }, { status: 400 });
            }
        }

        const asaasPayment = await createAsaasPayment(paymentParams);

        if (!asaasPayment || !asaasPayment.id) {
            return NextResponse.json({ error: 'Failed to create payment in Asaas' }, { status: 500 });
        }

        // 3. Save order to database
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let franchiseeId: string | null = null;
        if (user) {
            const { data: franchisee } = await supabase
                .from('franchisees')
                .select('id')
                .eq('user_id', user.id)
                .single();
            if (franchisee) franchiseeId = franchisee.id;
        }

        if (franchiseeId) {
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    franchisee_id: franchiseeId,
                    customer_name: customer.name,
                    customer_email: customer.email,
                    customer_document: customer.document?.replace(/\D/g, ''),
                    customer_phone: customer.phone?.replace(/\D/g, ''),
                    shipping_address: {
                        street: customer.street,
                        number: customer.number,
                        complement: customer.complement || '',
                        neighborhood: customer.neighborhood,
                        city: customer.city,
                        state: customer.state,
                        zipCode: customer.zipCode,
                        shipping_method: shippingMethod,
                    },
                    total_amount: total,
                    shipping_fee: shippingFee || 0,
                    status: paymentMethod === 'CREDIT_CARD' ? 'PAID' : 'PENDING',
                    asaas_payment_id: asaasPayment.id,
                })
                .select()
                .single();

            if (orderError) {
                console.error('Error saving order:', orderError);
            } else if (order && items && items.length > 0) {
                // Save order items
                const orderItems = items.map((item: any) => ({
                    order_id: order.id,
                    product_id: item.id,
                    quantity: item.quantity,
                    price_at_purchase: item.price,
                }));

                const { error: itemsError } = await supabase
                    .from('order_items')
                    .insert(orderItems);

                if (itemsError) {
                    console.error('Error saving order items:', itemsError);
                }
            }

            // If credit card payment is successful immediately, trigger webhook
            if (paymentMethod === 'CREDIT_CARD' && order) {
                sendPaymentConfirmationWebhook(order.id);
            }
        }

        // 4. Return response
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
