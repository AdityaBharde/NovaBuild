package com.aditya.novabuild.service.impl;

import com.aditya.novabuild.dto.subscription.SubscriptionResponse;
import com.aditya.novabuild.enums.SubscriptionStatus;
import com.aditya.novabuild.exception.ResourceNotFoundException;
import com.aditya.novabuild.mapper.SubscriptionMapper;
import com.aditya.novabuild.model.Plan;
import com.aditya.novabuild.model.Subscription;
import com.aditya.novabuild.model.User;
import com.aditya.novabuild.repository.PlanRepository;
import com.aditya.novabuild.repository.SubscriptionRepository;
import com.aditya.novabuild.repository.UserRepository;
import com.aditya.novabuild.security.AuthUtil;
import com.aditya.novabuild.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionServiceImpl implements SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final PlanRepository planRepository;
    private final AuthUtil  authUtil;
    private final SubscriptionMapper subscriptionMapper;


    @Override
    public SubscriptionResponse getCurrentSubscription() {
        Long userId = authUtil.getCurrentUserId();

        var currentSubscription = subscriptionRepository.findByUserIdAndStatusIn(userId, Set.of(
                SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE,
                SubscriptionStatus.TRIALING
        )).orElse(
                new Subscription()
        );

        return subscriptionMapper.toSubscriptionResponse(currentSubscription);
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
    public void updateSubscription(String gatewaySubscriptionId, SubscriptionStatus status, Instant periodStart, Instant periodEnd, Boolean cancelAtPeriodEnd, Long planId) {
        Subscription subscription = getSubscription(gatewaySubscriptionId);

        boolean hasSubscriptionUpdated = false;

        if(status != null && status != subscription.getStatus()) {
            subscription.setStatus(status);
            hasSubscriptionUpdated = true;
        }

        if(periodStart != null && !periodStart.equals(subscription.getCurrentPeriodStart())) {
            subscription.setCurrentPeriodStart(periodStart);
            hasSubscriptionUpdated = true;
        }

        if(periodEnd != null && !periodEnd.equals(subscription.getCurrentPeriodEnd())) {
            subscription.setCurrentPeriodEnd(periodEnd);
            hasSubscriptionUpdated = true;
        }

        if(cancelAtPeriodEnd != null && cancelAtPeriodEnd != subscription.getCancelAtPeriodEnd()) {
            subscription.setCancelAtPeriodEnd(cancelAtPeriodEnd);
            hasSubscriptionUpdated = true;
        }

        if(planId != null && !planId.equals(subscription.getPlan().getId())) {
            Plan newPlan = getPlan(planId);
            subscription.setPlan(newPlan);
            hasSubscriptionUpdated = true;
        }

        if(hasSubscriptionUpdated) {
            log.debug("Subscription has been updated: {}", gatewaySubscriptionId);
            subscriptionRepository.save(subscription);
        }
    }

    @Override
    public void cancelSubscription(String gatewaySubscriptionId) {
        Subscription subscription = getSubscription(gatewaySubscriptionId);
        subscription.setStatus(SubscriptionStatus.CANCELED);
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
