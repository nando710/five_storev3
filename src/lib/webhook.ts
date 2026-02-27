import { createClient } from '@/utils/supabase/server';
import { createContaAzulSale } from './contaazul';

export async function sendPaymentConfirmationWebhook(orderId: string, providedWebhookUrl?: string) {
    const webhookUrl = providedWebhookUrl || process.env.PAYMENT_WEBHOOK_URL;

    if (!webhookUrl) {
        console.warn('PAYMENT_WEBHOOK_URL is not defined. Skipping webhook dispatch.');
        return;
    }

    try {
        const supabase = await createClient();

        // 1. Fetch Order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
                id,
                customer_name,
                customer_document,
                shipping_fee
            `)
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            console.error('Webhook error: Order not found', orderError);
            return;
        }

        // 2. Fetch Order Items + Products + Categories
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select(`
                quantity,
                price_at_purchase,
                product_id
            `)
            .eq('order_id', orderId);

        if (itemsError || !items) {
            console.error('Webhook error: Order items not found', itemsError);
            return;
        }

        // We need to fetch the products and categories separately because Supabase relations might be tricky if not defined explicitly.
        // But let's try a direct query on products since we have product_id.
        const productIds = items.map((i: any) => i.product_id);
        const { data: products } = await supabase
            .from('products')
            .select(`
                id,
                custom_id,
                category_id
            `)
            .in('id', productIds);

        const categoryIds = products ? products.map((p: any) => p.category_id).filter((id: any) => id != null) : [];
        let categoriesData: any[] = [];

        if (categoryIds.length > 0) {
            const { data: cats } = await supabase
                .from('categories')
                .select('id, custom_id, tax_percentage')
                .in('id', categoryIds);
            if (cats) categoriesData = cats;
        }

        // 3. Shape Payload
        const payloadItems = items.map((item: any) => {
            const product = products?.find((p: any) => p.id === item.product_id);
            const category = categoriesData.find((c: any) => c.id === product?.category_id);
            const price = item.price_at_purchase;
            const quantity = item.quantity;

            // Calculate taxes for this item (valor * quantity * tax_percentage / 100)
            const taxPercentage = category?.tax_percentage || 0;
            const totalItemValue = price * quantity;
            const taxValue = totalItemValue * (taxPercentage / 100);

            return {
                product_custom_id: product?.custom_id || null,
                category_custom_id: category?.custom_id || null,
                price: price,
                quantity: quantity,
                tax_value: taxValue
            };
        });

        const payload = {
            order_id: order.id,
            customer_name: order.customer_name,
            customer_document: order.customer_document,
            shipping_fee: order.shipping_fee,
            items: payloadItems
        };

        // 4. Dispatch Webhook Asynchronously
        console.log(`[WEBHOOK] Sending payment confirmation for order ${order.id} to ${webhookUrl}...`);

        fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        }).then(response => {
            if (!response.ok) {
                console.error(`[WEBHOOK] Failed with status: ${response.status}`);
            } else {
                console.log(`[WEBHOOK] Sent successfully for order ${order.id}`);
            }
        }).catch(err => {
            console.error('[WEBHOOK] Error dispatching request:', err);
        });

        // 5. Dispatch Conta Azul ERP Integration
        try {
            console.log(`[CONTA AZUL] Disparando Venda Automática para o pedido ${order.id}...`);
            await createContaAzulSale(order.id, payload);
        } catch (caError) {
            console.error('[CONTA AZUL] Error dispatching sale:', caError);
        }

    } catch (e) {
        console.error('Error processing webhook data:', e);
    }
}
