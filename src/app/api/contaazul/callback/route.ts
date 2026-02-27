import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
        return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
    }

    const clientId = process.env.CONTAAZUL_CLIENT_ID;
    const clientSecret = process.env.CONTAAZUL_CLIENT_SECRET;
    const redirectUri = process.env.CONTAAZUL_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
        return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    try {
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const tokenResponse = await fetch('https://api.contaazul.com/oauth2/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                code: code
            })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('Conta Azul Token Error:', tokenData);
            return NextResponse.json({ error: 'Failed to exchange token', details: tokenData }, { status: tokenResponse.status });
        }

        const supabase = await createClient();

        // Save to integrations table
        const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

        const { error: dbError } = await supabase
            .from('integrations')
            .upsert({
                provider: 'contaazul',
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                expires_at: expiresAt,
                updated_at: new Date().toISOString()
            }, { onConflict: 'provider' });

        if (dbError) {
            console.error('Database Error:', dbError);
            return NextResponse.json({ error: 'Failed to save tokens to database' }, { status: 500 });
        }

        return new NextResponse(`
            <html>
                <body>
                    <h2>Conta Azul Integrado com Sucesso!</h2>
                    <p>O token foi gerado e salvo no banco de dados.</p>
                    <p>Você pode fechar esta aba.</p>
                </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });

    } catch (error) {
        console.error('Integration error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
