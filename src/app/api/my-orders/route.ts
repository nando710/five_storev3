import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get franchisee record for this user
        const { data: franchisee } = await supabase
            .from('franchisees')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!franchisee) {
            return NextResponse.json({ orders: [] });
        }

        // Fetch orders for this franchisee
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    product:products (*)
                )
            `)
            .eq('franchisee_id', franchisee.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching franchisee orders:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ orders: orders || [] });
    } catch (error: any) {
        console.error('Error in my-orders:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
