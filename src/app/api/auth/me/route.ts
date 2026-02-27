import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ authenticated: false, role: 'guest' });
        }

        // Check if admin
        const adminEmail = process.env.ADMIN_EMAIL;
        if (user.email === adminEmail) {
            return NextResponse.json({
                authenticated: true,
                role: 'admin',
                email: user.email,
            });
        }

        // Check franchisee profile
        const { data: franchisee } = await supabase
            .from('franchisees')
            .select('id, name, document, phone, "zipCode", street, number, complement, neighborhood, city, state, status, price_table')
            .eq('user_id', user.id)
            .single();

        if (!franchisee) {
            return NextResponse.json({
                authenticated: true,
                role: 'user',
                status: 'no_profile',
                email: user.email,
            });
        }

        return NextResponse.json({
            authenticated: true,
            role: 'franchisee',
            status: franchisee.status || 'pending',
            name: franchisee.name,
            document: franchisee.document,
            phone: franchisee.phone,
            zipCode: franchisee.zipCode,
            street: franchisee.street,
            number: franchisee.number,
            complement: franchisee.complement,
            neighborhood: franchisee.neighborhood,
            city: franchisee.city,
            state: franchisee.state,
            email: user.email,
            price_table: franchisee.price_table || 1,
        });
    } catch (error) {
        console.error('Error in /api/auth/me:', error);
        return NextResponse.json({ authenticated: false, role: 'guest' });
    }
}
