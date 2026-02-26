import { AsaasCustomer, AsaasPaymentParams, AsaasPaymentResponse } from '../types/asaas';

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

const getHeaders = () => ({
    'Content-Type': 'application/json',
    access_token: process.env.ASAAS_API_KEY || '',
});

export async function createAsaasCustomer(customerData: AsaasCustomer): Promise<{ id: string } | null> {
    try {
        const response = await fetch(`${ASAAS_API_URL}/customers`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                name: customerData.name,
                cpfCnpj: customerData.cpfCnpj.replace(/\D/g, ''),
                email: customerData.email,
                phone: customerData.phone?.replace(/\D/g, ''),
                mobilePhone: customerData.mobilePhone?.replace(/\D/g, ''),
            }),
        });

        if (!response.ok) {
            console.error('Asaas create customer error:', await response.text());
            return null;
        }

        const data = await response.json();
        return { id: data.id };
    } catch (error) {
        console.error('Error creating Asaas customer:', error);
        return null;
    }
}

export async function createAsaasPayment(paymentData: AsaasPaymentParams): Promise<AsaasPaymentResponse | null> {
    try {
        const response = await fetch(`${ASAAS_API_URL}/payments`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(paymentData),
        });

        if (!response.ok) {
            console.error('Asaas create payment error:', await response.text());
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating Asaas payment:', error);
        return null;
    }
}

export async function getAsaasPixQrCode(paymentId: string): Promise<{ encodedImage: string, payload: string } | null> {
    try {
        const response = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            console.error('Asaas get PIX QR code error:', await response.text());
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching Asaas PIX QR code:', error);
        return null;
    }
}
