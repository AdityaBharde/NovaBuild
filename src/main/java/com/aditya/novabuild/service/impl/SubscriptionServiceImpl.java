package com.aditya.novabuild.service.impl;

import com.aditya.novabuild.dto.subscription.PlanResponse;
import com.aditya.novabuild.dto.subscription.SubscriptionResponse;
import com.aditya.novabuild.enums.SubscriptionStatus;
import com.aditya.novabuild.exception.ResourceNotFoundException;
import com.aditya.novabuild.model.Plan;
import com.aditya.novabuild.model.Subscription;
import com.aditya.novabuild.model.User;
import com.aditya.novabuild.repository.PlanRepository;
import com.aditya.novabuild.repository.SubscriptionRepository;
import com.aditya.novabuild.repository.UserRepository;
import com.aditya.novabuild.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SubscriptionServiceImpl implements SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final PlanRepository planRepository;

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

    @Override
    public void activateSubscription(Long userId, Long planId, String subscriptionId, String customerId) {

        boolean exists = subscriptionRepository.existsByStripeSubscriptionId(subscriptionId);
        if (exists) return;

        User user = getUser(userId);
        Plan plan = getPlan(planId);

        Subscription subscription = Subscription.builder()
                .user(user)
                .plan(plan)
                .stripeSubscriptionId(subscriptionId)
                .status(SubscriptionStatus.INCOMPLETE)
                .build();

        subscriptionRepository.save(subscription);
    }

    @Override
    public void markSubscriptionPastDue(String subId) {
        Subscription subscription = getSubscription(subId);
        subscription.setStatus(SubscriptionStatus.PAST_DUE);
        subscriptionRepository.save(subscription);
    }

    @Override
    public void renewSubscriptionPeriod(String subId, Instant periodStart, Instant periodEnd) {
        Subscription subscription = getSubscription(subId);
        subscription.setCurrentPeriodStart(periodStart);
        subscription.setCurrentPeriodEnd(periodEnd);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscriptionRepository.save(subscription);
    }


    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User" + userId.toString()));
    }

    private Plan getPlan(Long planId) {
        return planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan"+ planId.toString()));

    }

    private Subscription getSubscription(String gatewaySubscriptionId) {
        return subscriptionRepository.findByStripeSubscriptionId(gatewaySubscriptionId).orElseThrow(() ->
                new ResourceNotFoundException("Subscription" + gatewaySubscriptionId));
    }
}
