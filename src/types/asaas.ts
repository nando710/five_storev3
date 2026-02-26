// src/types/asaas.ts

export interface AsaasCustomer {
    id?: string;
    name: string;
    cpfCnpj: string;
    email: string;
    phone?: string;
    mobilePhone?: string;
    postalCode?: string;
    address?: string;
    addressNumber?: string;
    complement?: string;
    province?: string;
    city?: string;
    state?: string;
}

export interface AsaasPaymentParams {
    customer: string; // Customer ID in Asaas
    billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
    value: number;
    dueDate: string; // Format: YYYY-MM-DD
    description?: string;
    externalReference?: string; // e.g., Supabase Order ID
    creditCard?: {
        holderName: string;
        number: string;
        expiryMonth: string;
        expiryYear: string;
        ccv: string;
    };
    creditCardHolderInfo?: {
        name: string;
        email: string;
        cpfCnpj: string;
        postalCode: string;
        addressNumber: string;
        addressComplement: string;
        phone: string;
        mobilePhone: string;
    };
    split?: {
        walletId: string;
        fixedValue?: number;
        percentualValue?: number;
        totalFixedValue?: number;
    }[];
}

export interface AsaasPaymentResponse {
    id: string;
    customer: string;
    paymentLink: string;
    value: number;
    netValue: number;
    billingType: string;
    status: string;
    dueDate: string;
    invoiceUrl: string;
    bankSlipUrl?: string; // If BOLETO
    pixqrCodeUrl?: string; // We often need to fetch this in a separate call if PIX
}
