package com.aditya.novabuild.service.impl;

import com.aditya.novabuild.dto.subscription.CheckoutRequest;
import com.aditya.novabuild.dto.subscription.CheckoutResponse;
import com.aditya.novabuild.dto.subscription.PortalResponse;
import com.aditya.novabuild.service.PaymentProcesser;
import org.springframework.stereotype.Service;

@Service
public class StripePaymentProcessor implements PaymentProcesser {

    @Override
    public CheckoutResponse createCheckoutSessionUrl(CheckoutRequest request) {
        return null;
    }

    @Override
    public PortalResponse openCustomerPortal(Long userId) {
        return null;
    }
}
