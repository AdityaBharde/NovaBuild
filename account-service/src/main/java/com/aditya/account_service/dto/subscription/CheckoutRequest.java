package com.aditya.account_service.dto.subscription;

public record CheckoutRequest(
        Long planId,
        String returnUrl
) {
    public CheckoutRequest(Long planId) {
        this(planId, null);
    }
}
