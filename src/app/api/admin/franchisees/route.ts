import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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

        const { data: franchisees, error } = await supabase
            .from('franchisees')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase query error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ franchisees: franchisees || [] });
    } catch (error: any) {
        console.error('Catch error in franchisees GET:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const supabase = await createClient();
        if (!(await isAdmin(supabase))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, ...updates } = body;

        // Build update object dynamically (can contain status, price_table, etc.)
        const updateData: Record<string, any> = {};
        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.price_table !== undefined) updateData.price_table = updates.price_table;

        const { data, error } = await supabase
            .from('franchisees')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ franchisee: data });
    } catch (error) {
        console.error('Error updating franchisee:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
