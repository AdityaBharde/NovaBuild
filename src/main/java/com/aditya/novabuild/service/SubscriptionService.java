package com.aditya.novabuild.service;

import com.aditya.novabuild.dto.subscription.SubscriptionResponse;

import java.time.Instant;


public interface SubscriptionService {
    SubscriptionResponse getCurrentSubscription(Long userId);

    void activateSubscription(Long userId, Long planId, String subscriptionId, String customerId);

    void markSubscriptionPastDue(String subId);

    void renewSubscriptionPeriod(String subId, Instant periodStart, Instant periodEnd);
}
