import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { calculateShipping } from '@/lib/frenet';
import { FrenetQuoteRequest } from '@/types/frenet';

export async function GET() {
    try {
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

        const { data: user, error: authError } = await supabase.auth.getUser();
        if (authError || !user?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('shipping_config')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ success: true, configs: data });
    } catch (error) {
        console.error('Error fetching shipping config:', error);
        return NextResponse.json({ error: 'Failed to fetch shipping info.' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
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

        const { data: user, error: authError } = await supabase.auth.getUser();
        if (authError || !user?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, active, price, deliveryTime } = body;

        const { data, error } = await supabase
            .from('shipping_config')
            .update({ active, price, delivery_time: deliveryTime })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, config: data });
    } catch (error) {
        console.error('Error updating shipping config:', error);
        return NextResponse.json({ error: 'Failed to update shipping config.' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
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

        const { data: user, error: authError } = await supabase.auth.getUser();
        if (authError || !user?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch current options from DB to preserve "active" status and pickup
        const { data: existingConfigs } = await supabase.from('shipping_config').select('*');
        const existingMap = new Map((existingConfigs || []).map(c => [c.id, c]));

        // 1.5 Parse optional request body
        let targetCep = '04538133'; // Default SP
        try {
            const body = await req.json();
            if (body.cep) {
                targetCep = body.cep.replace(/\D/g, '');
            }
        } catch (e) {
            // No body provided or empty body, fallback keeps
        }

        // 2. Perform a generic quote to discover Frenet active carriers
        const quoteRequest: FrenetQuoteRequest = {
            SellerCEP: '01001000', // Origin
            RecipientCEP: targetCep, // The input CEP or default
            ShipmentInvoiceValue: 50,
            ShippingItemArray: [{
                Weight: 1,
                Length: 20,
                Height: 15,
                Width: 15,
                Quantity: 1,
                SKU: 'sync_test_item'
            }],
        };

        const frenetOptions = await calculateShipping(quoteRequest);
        if (!frenetOptions) {
            return NextResponse.json({ error: 'Failed to contact Frenet for synchronization.' }, { status: 500 });
        }

        const upsertData: any[] = [];
        const seenIds = new Set<string>();

        // 3. Keep the custom pickup option intact if it exists
        const pickup = existingMap.get('pickup');
        if (pickup) {
            upsertData.push({
                id: pickup.id,
                name: pickup.name,
                active: pickup.active,
                price: pickup.price,
                delivery_time: pickup.delivery_time
            });
            seenIds.add('pickup');
        } else {
            upsertData.push({
                id: 'pickup',
                name: 'Retirar na Franqueadora (Grátis)',
                active: true,
                price: 0,
                delivery_time: 1
            });
            seenIds.add('pickup');
        }

        // 4. Transform Frenet options into DB records
        frenetOptions.forEach(opt => {
            const existing = existingMap.get(opt.ServiceCode);
            upsertData.push({
                id: opt.ServiceCode,
                name: opt.ServiceDescription,
                active: existing ? existing.active : true, // Preserve previous setting, default new ones to true
                price: 0, // Configurable prices are only meant for 'pickup'
                delivery_time: 0
            });
            seenIds.add(opt.ServiceCode);
        });

        // Upsert everything
        if (upsertData.length > 0) {
            const { error: upsertError } = await supabase
                .from('shipping_config')
                .upsert(upsertData, { onConflict: 'id' });

            if (upsertError) throw upsertError;
        }

        // Deactivate anything no longer returned by Frenet
        const toDeactivate = (existingConfigs || [])
            .filter(c => !seenIds.has(c.id))
            .map(c => ({
                id: c.id,
                name: c.name,
                active: false,
                price: c.price,
                delivery_time: c.delivery_time
            }));

        if (toDeactivate.length > 0) {
            await supabase.from('shipping_config').upsert(toDeactivate, { onConflict: 'id' });
        }

        // Return latest
        const { data: latestConfig } = await supabase.from('shipping_config').select('*').order('id');

        return NextResponse.json({ success: true, configs: latestConfig });

    } catch (error) {
        console.error('Error syncing Frenet configs:', error);
        return NextResponse.json({ error: 'Failed to sync with Frenet.' }, { status: 500 });
    }
}
