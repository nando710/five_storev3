import { FrenetQuoteRequest, FrenetQuoteResponse, FrenetShippingService } from '../types/frenet';

const FRENET_TOKEN = process.env.FRENET_TOKEN;
const FRENET_API_URL = 'http://api.frenet.com.br/shipping/quote';

const headers = {
    'Content-Type': 'application/json',
    token: FRENET_TOKEN || '',
};

export async function calculateShipping(quoteData: FrenetQuoteRequest): Promise<FrenetShippingService[] | null> {
    try {
        const response = await fetch(FRENET_API_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify(quoteData),
        });

        if (!response.ok) {
            console.error('Frenet calculate shipping error:', await response.text());
            return null;
        }

        const data: FrenetQuoteResponse = await response.json();

        // Filter out services that returned an error
        return data.ShippingSevicesArray.filter(service => !service.Error);
    } catch (error) {
        console.error('Error calculating shipping via Frenet:', error);
        return null;
    }
}
