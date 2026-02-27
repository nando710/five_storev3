import { NextResponse } from 'next/server';

export async function GET() {
    const clientId = process.env.CONTAAZUL_CLIENT_ID;
    const redirectUri = process.env.CONTAAZUL_REDIRECT_URI;

    if (!clientId || !redirectUri) {
        return new NextResponse("Missing Conta Azul Environment Variables", { status: 500 });
    }

    const state = Math.random().toString(36).substring(7); // Simple state protection

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        state: state,
        scope: 'sales openid profile' // Include sales for ERP integration
    });

    const url = `https://auth.contaazul.com/login?${params.toString()}`;

    return NextResponse.redirect(url);
}
