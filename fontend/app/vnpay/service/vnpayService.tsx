const API_URL = 'http://localhost:8080/api/vnpay';

export interface PaymentRequest {
    amount: number;
    orderType: string;
    orderInfo?: string;
    language?: string;
    returnUrl: string;
}

export interface PaymentResponse {
    status: string;
    message: string;
    url: string;
}

export const createPayment = async (data: PaymentRequest): Promise<PaymentResponse> => {
    const response = await fetch(`${API_URL}/create-payment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json() as PaymentResponse;
};