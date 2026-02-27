import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const API_SECRET = process.env.EXTERNAL_API_SECRET;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Missing Supabase Environment Variables');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Authenticate the request
        const authHeader = req.headers.get('Authorization');
        if (!API_SECRET || authHeader !== `Bearer ${API_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        // 2. Validate required fields
        if (!body.name || body.price === undefined) {
            return NextResponse.json({ error: 'Missing required fields: name, price' }, { status: 400 });
        }

        // 3. We need a franchisee_id. Since external systems might not know it, 
        // we'll fetch the first available admin franchisee to assign the product to.
        const { data: adminFranchisee, error: fError } = await supabase
            .from('franchisees')
            .select('id')
            .limit(1)
            .single();

        if (fError || !adminFranchisee) {
            return NextResponse.json({ error: 'System error: No franchisee configured.' }, { status: 500 });
        }

        // 4. Insert the product
        const { data, error } = await supabase
            .from('products')
            .insert({
                franchisee_id: adminFranchisee.id,
                name: body.name,
                custom_id: body.custom_id || null,
                description: body.description || '',
                price: Number(body.price),
                price_2: body.price_2 ? Number(body.price_2) : 0,
                stock: body.stock !== undefined ? Number(body.stock) : 0,
                image_url: body.image_url || '',
                category_id: body.category_id || null,
                weight: body.weight !== undefined ? Number(body.weight) : 1,
                length: body.length !== undefined ? Number(body.length) : 20,
                width: body.width !== undefined ? Number(body.width) : 20,
                height: body.height !== undefined ? Number(body.height) : 20,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, product: data }, { status: 201 });
    } catch (error: any) {
        console.error('External API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
