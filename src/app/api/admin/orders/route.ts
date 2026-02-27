import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

async function isAdmin(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const adminEmail = process.env.ADMIN_EMAIL;
    return user.email === adminEmail;
}

export async function GET() {
    try {
        const supabase = await createClient();
        if (!(await isAdmin(supabase))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    product:products (*)
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
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

        // Building update object dynamically
        const updateData: any = {};
        if (body.status) updateData.status = body.status;
        if (body.asaas_invoice_url !== undefined) updateData.asaas_invoice_url = body.asaas_invoice_url; // Assuming it could be cleared or updated

        const { data, error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', body.id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ order: data });
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
