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

        // Total sales
        const { data: salesData } = await supabase
            .from('orders')
            .select('total_amount, status');

        const totalSales = salesData?.reduce((sum: number, o: any) => sum + Number(o.total_amount), 0) || 0;
        const totalOrders = salesData?.length || 0;
        const paidOrders = salesData?.filter((o: any) => o.status !== 'PENDING' && o.status !== 'CANCELLED').length || 0;

        // Product count
        const { count: productCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });

        return NextResponse.json({
            stats: {
                totalSales,
                totalOrders,
                paidOrders,
                productCount: productCount || 0,
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
