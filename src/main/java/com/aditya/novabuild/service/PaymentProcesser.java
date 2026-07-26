package com.aditya.novabuild.service;

import com.aditya.novabuild.dto.subscription.CheckoutRequest;
import com.aditya.novabuild.dto.subscription.CheckoutResponse;
import com.aditya.novabuild.dto.subscription.PortalResponse;

public interface PaymentProcesser {

    CheckoutResponse createCheckoutSessionUrl(CheckoutRequest request);

    PortalResponse openCustomerPortal(Long userId);
}
