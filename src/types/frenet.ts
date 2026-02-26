// src/types/frenet.ts

export interface FrenetItem {
    Weight: number; // in Kg (e.g., 0.5)
    Length: number; // in cm
    Height: number; // in cm
    Width: number; // in cm
    Diameter?: number;
    SKU?: string;
    Category?: string;
    isFragile?: boolean;
}

export interface FrenetQuoteRequest {
    SellerCEP: string;
    RecipientCEP: string;
    ShipmentInvoiceValue: number;
    ShippingItemArray: FrenetItem[];
    RecipientCountry?: string; // Default: 'BR'
}

export interface FrenetShippingService {
    ServiceCode: string;
    ServiceDescription: string;
    Carrier: string;
    CarrierCode: string;
    ShippingPrice: string; // The API returns it as string (e.g. "15.00")
    DeliveryTime: string; // Days
    Error: boolean;
    OriginalDeliveryTime: string;
    OriginalShippingPrice: string;
    Msg?: string;
}

export interface FrenetQuoteResponse {
    ShippingSevicesArray: FrenetShippingService[];
}
