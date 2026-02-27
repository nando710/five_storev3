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

        // 1. Fetch all essential orders data
        const { data: allOrders } = await supabase
            .from('orders')
            .select('id, total_amount, status, shipping_fee, customer_name, customer_email, shipping_address, created_at');

        // High-level Stats
        const totalOrders = allOrders?.length || 0;
        const validOrders = allOrders?.filter((o: any) => o.status !== 'CANCELLED') || [];
        const paidOrdersList = allOrders?.filter(o => o.status !== 'PENDING' && o.status !== 'CANCELLED') || [];

        const totalSales = validOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount), 0) || 0;
        const paidOrders = paidOrdersList.length;
        const cancelledOrders = allOrders?.filter((o: any) => o.status === 'CANCELLED').length || 0;

        const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
        const averageTicket = validOrders.length > 0 ? totalSales / validOrders.length : 0;

        const sumShipping = validOrders.reduce((sum: number, o: any) => sum + Number(o.shipping_fee || 0), 0) || 0;
        const averageShippingCost = validOrders.length > 0 ? sumShipping / validOrders.length : 0;

        // Sales by State & Top Customers
        const stateRevenues: Record<string, number> = {};
        const customerRevenues: Record<string, { name: string; total: number; count: number }> = {};

        validOrders.forEach((o: any) => {
            const state = o.shipping_address?.state || 'Outros';
            stateRevenues[state] = (stateRevenues[state] || 0) + Number(o.total_amount);

            const email = o.customer_email || 'Desconhecido';
            if (!customerRevenues[email]) {
                customerRevenues[email] = { name: o.customer_name || email, total: 0, count: 0 };
            }
            customerRevenues[email].total += Number(o.total_amount);
            customerRevenues[email].count += 1;
        });

        const salesByState = Object.entries(stateRevenues)
            .map(([state, revenue]) => ({ name: state, value: revenue }))
            .sort((a, b) => b.value - a.value);

        const topCustomers = Object.entries(customerRevenues)
            .map(([email, data]) => ({ email, name: data.name, revenue: data.total, orderCount: data.count }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // Product count & low stock
        const { count: productCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });

        const { data: lowStock } = await supabase
            .from('products')
            .select('id, name, stock, image_url')
            .gt('stock', 0)
            .order('stock', { ascending: true })
            .limit(5);

        const { data: outOfStock } = await supabase
            .from('products')
            .select('id, name, stock, image_url')
            .eq('stock', 0)
            .limit(10);

        // Fetch Order Items and Categories for Product/Category stats
        const { data: allCategories } = await supabase.from('categories').select('id, name');
        const categoryMap = new Map((allCategories || []).map((c: any) => [c.id, c.name]));

        const { data: allOrderItems } = await supabase
            .from('order_items')
            .select(`
                order_id,
                quantity,
                price_at_purchase,
                product:products ( id, name, category_id )
            `);

        const validOrderIds = new Set(validOrders.map((o: any) => o.id));
        const categoryRevenues: Record<string, number> = {};
        const productStats: Record<string, { name: string; volume: number; revenue: number }> = {};

        allOrderItems?.forEach((item: any) => {
            if (validOrderIds.has(item.order_id)) {
                const itemRevenue = Number(item.quantity) * Number(item.price_at_purchase);

                // Category aggregation
                const catId = item.product?.category_id;
                const catName = catId ? (categoryMap.get(catId) || 'Sem Categoria') : 'Sem Categoria';
                categoryRevenues[catName] = (categoryRevenues[catName] || 0) + itemRevenue;

                // Product aggregation
                const prodId = item.product?.id || 'unknown';
                if (!productStats[prodId]) {
                    productStats[prodId] = { name: item.product?.name || 'Produto Removido', volume: 0, revenue: 0 };
                }
                productStats[prodId].volume += Number(item.quantity);
                productStats[prodId].revenue += itemRevenue;
            }
        });

        const salesByCategory = Object.entries(categoryRevenues)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const topProducts = Object.entries(productStats)
            .map(([id, data]) => ({ id, name: data.name, volume: data.volume, revenue: data.revenue }))
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 10);

        // Daily revenue (last 14 days)
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const recentOrders = allOrders?.filter((o: any) => new Date(o.created_at) >= fourteenDaysAgo) || [];

        // Aggregate daily revenue and conversion metrics
        const dailyStats: Record<string, { revenue: number; totalOrders: number; paidOrders: number }> = {};
        const statusDistributionRaw: Record<string, number> = {};

        recentOrders.forEach((order: any) => {
            const date = new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

            if (!dailyStats[date]) {
                dailyStats[date] = { revenue: 0, totalOrders: 0, paidOrders: 0 };
            }

            dailyStats[date].totalOrders += 1;

            if (order.status !== 'PENDING') {
                dailyStats[date].revenue += Number(order.total_amount);
                dailyStats[date].paidOrders += 1;
            }

            const status = order.status || 'PENDING';
            statusDistributionRaw[status] = (statusDistributionRaw[status] || 0) + 1;
        });

        const statusColors: Record<string, string> = {
            'PENDING': '#eab308',
            'PAID': '#3b82f6',
            'SHIPPED': '#8b5cf6',
            'DELIVERED': '#10b981',
            'CANCELLED': '#ef4444'
        };

        const statusDistribution = Object.entries(statusDistributionRaw).map(([name, value]) => ({
            name,
            value,
            fill: statusColors[name] || '#94a3b8'
        }));

        const recentSales = Object.entries(dailyStats).map(([date, stats]) => ({
            date,
            revenue: stats.revenue,
            conversionRate: stats.totalOrders > 0 ? Math.round((stats.paidOrders / stats.totalOrders) * 100) : 0
        })).sort((a, b) => { // Basic string sort on DD/MM works okay enough sequentially over 14 days without spanning year boundaries
            const [dA, mA] = a.date.split('/');
            const [dB, mB] = b.date.split('/');
            if (mA !== mB) return Number(mA) - Number(mB);
            return Number(dA) - Number(dB);
        });

        // Simple moving average forecast (next 7 days based on avg of last 14)
        let sumRecentRevenue = 0;
        recentSales.forEach(s => sumRecentRevenue += s.revenue);
        const avgDailyRevenue = recentSales.length > 0 ? sumRecentRevenue / recentSales.length : 0;

        const salesForecast = [];
        let currentDate = new Date();
        for (let i = 1; i <= 7; i++) {
            currentDate.setDate(currentDate.getDate() + 1);
            salesForecast.push({
                date: currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                revenue: avgDailyRevenue
            });
        }

        // Top franchisees (revenue per franchisee)
        const { data: franchiseeOrders } = await supabase
            .from('orders')
            .select('franchisee_id, total_amount')
            .neq('status', 'CANCELLED');

        const franchiseeRevenues: Record<string, number> = {};
        franchiseeOrders?.forEach((order: any) => {
            if (order.franchisee_id) {
                franchiseeRevenues[order.franchisee_id] = (franchiseeRevenues[order.franchisee_id] || 0) + Number(order.total_amount);
            }
        });

        // Get franchisee details
        const franchiseeIds = Object.keys(franchiseeRevenues);
        let topFranchisees: any[] = [];

        if (franchiseeIds.length > 0) {
            const { data: franchiseesData } = await supabase
                .from('franchisees')
                .select('id, name')
                .in('id', franchiseeIds);

            topFranchisees = (franchiseesData || []).map((f: any) => ({
                id: f.id,
                name: f.name,
                totalRevenue: franchiseeRevenues[f.id]
            })).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue).slice(0, 5);
        }

        return NextResponse.json({
            stats: {
                totalSales,
                totalOrders,
                paidOrders,
                productCount: productCount || 0,
                averageTicket,
                averageShippingCost,
                cancellationRate,
                salesByState,
                salesByCategory,
                topProducts,
                topCustomers,
                recentSales,
                salesForecast,
                topFranchisees,
                lowStock: lowStock || [],
                outOfStock: outOfStock || [],
                statusDistribution
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
