package com.aditya.novabuild.service;

import com.aditya.novabuild.dto.subscription.SubscriptionResponse;


public interface SubscriptionService {
    SubscriptionResponse getCurrentSubscription(Long userId);
}
