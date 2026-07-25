package com.aditya.novabuild.service;

import com.aditya.novabuild.dto.subscription.CheckoutRequest;
import com.aditya.novabuild.dto.subscription.CheckoutResponse;
import com.aditya.novabuild.dto.subscription.PortalResponse;
import com.aditya.novabuild.dto.subscription.SubscriptionResponse;
import org.springframework.stereotype.Service;


public interface SubscriptionService {

    CheckoutResponse createCheckoutSessionUrl(CheckoutRequest request);

    PortalResponse openCustomerPortal(Long userId);

    SubscriptionResponse getCurrentSubscription(Long userId);
}
