import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createContaAzulProduct, updateContaAzulProduct } from '@/lib/contaazul';

async function isAdmin(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    return user.email === process.env.ADMIN_EMAIL;
}

export async function GET() {
    try {
        const supabase = await createClient();
        if (!(await isAdmin(supabase))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ products });
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        if (!(await isAdmin(supabase))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        // 1. Try to create in Conta Azul First
        let contaAzulId = body.custom_id || null;
        try {
            console.log("Syncing new product to Conta Azul...");
            const caProduct = await createContaAzulProduct(body);
            if (caProduct && caProduct.id) {
                contaAzulId = String(caProduct.id);
                console.log(`Product synced. Conta Azul ID: ${contaAzulId}`);
            }
        } catch (caErr) {
            console.error("Non-fatal error syncing to Conta Azul:", caErr);
        }

        // 2. Create in Local DB
        const { data, error } = await supabase
            .from('products')
            .insert({
                name: body.name,
                custom_id: contaAzulId,
                description: body.description || '',
                price: body.price,
                price_2: body.price_2 || 0,
                stock: body.stock || 0,
                image_url: body.image_url || '',
                active_t1: body.active_t1 !== undefined ? body.active_t1 : true,
                active_t2: body.active_t2 !== undefined ? body.active_t2 : true,
                category_id: body.category_id || null,
                weight: body.weight || 1,
                length: body.length || 20,
                width: body.width || 20,
                height: body.height || 20,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ product: data });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const supabase = await createClient();
        if (!(await isAdmin(supabase))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        // 1. Sync Update to Conta Azul
        if (body.custom_id) {
            try {
                console.log(`Updating product ${body.custom_id} in Conta Azul...`);
                await updateContaAzulProduct(body.custom_id, body);
            } catch (caErr) {
                console.error("Non-fatal error updating in Conta Azul:", caErr);
            }
        }

        // 2. Update Local DB
        const { data, error } = await supabase
            .from('products')
            .update({
                name: body.name,
                custom_id: body.custom_id || null,
                description: body.description || '',
                price: body.price,
                price_2: body.price_2 || 0,
                stock: body.stock,
                image_url: body.image_url || '',
                active_t1: body.active_t1 !== undefined ? body.active_t1 : true,
                active_t2: body.active_t2 !== undefined ? body.active_t2 : true,
                category_id: body.category_id || null,
                weight: body.weight || 1,
                length: body.length || 20,
                width: body.width || 20,
                height: body.height || 20,
            })
            .eq('id', body.id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ product: data });
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const supabase = await createClient();
        if (!(await isAdmin(supabase))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('id');

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
