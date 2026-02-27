import { createClient } from '@/utils/supabase/server';

export async function getContaAzulToken() {
    const supabase = await createClient();

    const { data: authData, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('provider', 'contaazul')
        .single();

    if (error || !authData) {
        console.error('Conta Azul Token Error: No integration found in database.');
        return null;
    }

    const { access_token, refresh_token, expires_at } = authData;

    // Check if token is expired or expires in less than 5 minutes
    if (new Date(expires_at).getTime() < Date.now() + 5 * 60 * 1000) {
        console.log('Conta Azul token is expired. Refreshing...');

        const clientId = process.env.CONTAAZUL_CLIENT_ID;
        const clientSecret = process.env.CONTAAZUL_CLIENT_SECRET;
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        try {
            const tokenResponse = await fetch('https://api.contaazul.com/oauth2/token', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    grant_type: 'refresh_token',
                    refresh_token: refresh_token,
                })
            });

            if (!tokenResponse.ok) {
                const err = await tokenResponse.json();
                console.error('Failed to refresh Conta Azul token:', err);
                return null;
            }

            const tokenData = await tokenResponse.json();

            const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

            await supabase
                .from('integrations')
                .update({
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token,
                    expires_at: newExpiresAt,
                    updated_at: new Date().toISOString()
                })
                .eq('provider', 'contaazul');

            return tokenData.access_token;

        } catch (refreshError) {
            console.error('Exception during Conta Azul token refresh:', refreshError);
            return null;
        }
    }

    return access_token;
}

export async function createContaAzulSale(orderId: string, orderData: any) {
    const token = await getContaAzulToken();

    if (!token) {
        console.error('Cannot create Conta Azul sale without a valid access token.');
        return;
    }

    // Prepare payload. 
    // Usually Conta Azul requires customer information (which must be created or searched first).
    // For simplicity, we create a basic payload structure.

    const salePayload = {
        emission: new Date().toISOString(),
        status: "COMMITTED", // Assuming it's paid
        customer: {
            name: orderData.customer_name,
            document: orderData.customer_document || "00000000000",
            type: orderData.customer_document?.length > 11 ? "LEGAL" : "NATURAL"
        },
        services: [],
        products: orderData.items?.map((item: any) => ({
            description: "Produto Loja",
            quantity: item.quantity,
            value: item.price
        })) || [],
        discount: {
            measure_unit: "VALUE",
            rate: 0
        },
        shipping_cost: orderData.shipping_fee || 0,
        notes: `Criado automaticamente pelo Checkout - Pedido ${orderId}`
    };

    try {
        const response = await fetch('https://api.contaazul.com/v1/sales', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(salePayload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to create sale in Conta Azul:', errorData);
            return null;
        }

        const saleData = await response.json();
        console.log(`Successfully created Conta Azul Sale: ${saleData.id}`);
        return saleData;
    } catch (error) {
        console.error('Error dispatching sale to Conta Azul:', error);
        return null;
    }
}
