import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile, error } = await supabase
            .from('franchisees')
            .select('id, name, document, phone, email, "zipCode", street, number, complement, neighborhood, city, state')
            .eq('user_id', user.id)
            .single();

        if (error) throw error;

        return NextResponse.json({ profile });
    } catch (error: any) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: error.message || 'Error fetching profile' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, document, phone, zipCode, street, number: addressNumber, complement, neighborhood, city, state } = body;

        // Basic validation
        if (!name || !document) {
            return NextResponse.json({ error: 'Nome e CPF/CNPJ são obrigatórios.' }, { status: 400 });
        }

        // Check if the document belongs to another user
        const { data: existingDoc } = await supabase
            .from('franchisees')
            .select('id')
            .eq('document', document)
            .neq('user_id', user.id)
            .single();

        if (existingDoc) {
            return NextResponse.json({ error: 'Este CPF/CNPJ já está em uso por outro usuário.' }, { status: 400 });
        }

        const { data: updatedProfile, error } = await supabase
            .from('franchisees')
            .update({
                name,
                document,
                phone,
                "zipCode": zipCode,
                street,
                number: addressNumber,
                complement,
                neighborhood,
                city,
                state
            })
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, profile: updatedProfile });
    } catch (error: any) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: error.message || 'Error updating profile' }, { status: 500 });
    }
}
