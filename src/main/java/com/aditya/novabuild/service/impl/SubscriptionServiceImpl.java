package com.aditya.novabuild.service.impl;

import com.aditya.novabuild.dto.subscription.PlanResponse;
import com.aditya.novabuild.dto.subscription.SubscriptionResponse;
import com.aditya.novabuild.model.Subscription;
import com.aditya.novabuild.repository.SubscriptionRepository;
import com.aditya.novabuild.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SubscriptionServiceImpl implements SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;

    @Override
    public SubscriptionResponse getCurrentSubscription(Long userId) {
        Optional<Subscription> maybe = subscriptionRepository.findByUserId(userId);
        if (maybe.isEmpty()) {
            return new SubscriptionResponse(null, "NONE", null, 0L);
        }
        Subscription s = maybe.get();
        PlanResponse plan = new PlanResponse(
                s.getPlan().getId(),
                s.getPlan().getName(),
                s.getPlan().getMaxProjects(),
                s.getPlan().getMaxTokensPerDay(),
                s.getPlan().getUnlimitedAi(),
                s.getPlan().getStripePriceId()
        );
        Instant periodEnd = s.getCurrentPeriodEnd();
        String status = s.getStatus() != null ? s.getStatus().name() : "UNKNOWN";
        return new SubscriptionResponse(plan, status, periodEnd, 0L);
    }
}
