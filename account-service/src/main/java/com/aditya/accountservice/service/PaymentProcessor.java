package com.aditya.accountservice.service;

import com.aditya.accountservice.dto.subscription.CheckoutRequest;
import com.aditya.accountservice.dto.subscription.CheckoutResponse;
import com.aditya.accountservice.dto.subscription.PortalResponse;
import com.stripe.model.StripeObject;

import java.util.Map;

public interface PaymentProcessor {

    CheckoutResponse createCheckoutSessionUrl(CheckoutRequest request);

    PortalResponse openCustomerPortal();

    void handleWebhookEvent(String type, StripeObject stripeObject, Map<String, String> metadata);
}