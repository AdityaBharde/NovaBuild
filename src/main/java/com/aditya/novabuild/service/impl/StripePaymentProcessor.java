package com.aditya.novabuild.service.impl;

import com.aditya.novabuild.dto.subscription.CheckoutRequest;
import com.aditya.novabuild.dto.subscription.CheckoutResponse;
import com.aditya.novabuild.dto.subscription.PortalResponse;
import com.aditya.novabuild.enums.SubscriptionStatus;
import com.aditya.novabuild.model.Plan;
import com.aditya.novabuild.model.Subscription;
import com.aditya.novabuild.model.User;
import com.aditya.novabuild.repository.PlanRepository;
import com.aditya.novabuild.repository.SubscriptionRepository;
import com.aditya.novabuild.repository.UserRepository;
import com.aditya.novabuild.service.PaymentProcesser;
import com.stripe.model.Customer;
import com.stripe.model.checkout.Session;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import com.stripe.param.billingportal.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StripePaymentProcessor implements PaymentProcesser {

    private final PlanRepository planRepository;
    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public CheckoutResponse createCheckoutSessionUrl(CheckoutRequest request) {
        Plan plan = planRepository.findById(request.planId())
                .orElseThrow(() -> new IllegalArgumentException("Plan not found"));

        // using the same hardcoded user id the controllers currently use
        Long userId = 1L;
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));

        Optional<Subscription> maybeSub = subscriptionRepository.findByUserId(userId);
        String stripeCustomerId = null;
        if (maybeSub.isPresent() && maybeSub.get().getStripeCustomerId() != null) {
            stripeCustomerId = maybeSub.get().getStripeCustomerId();
        } else {
            CustomerCreateParams customerParams = CustomerCreateParams.builder()
                    .setEmail(user.getUsername())
                    .build();
            try {
                Customer customer = Customer.create(customerParams);
                stripeCustomerId = customer.getId();
            } catch (Exception e) {
                throw new RuntimeException("Failed to create Stripe customer", e);
            }
        }

        // create a Checkout Session
        SessionCreateParams.LineItem lineItem = SessionCreateParams.LineItem.builder()
                .setPrice(plan.getStripePriceId())
                .setQuantity(1L)
                .build();

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .setSuccessUrl(frontendUrl + "/billing/success?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(frontendUrl + "/billing/cancel")
                .setCustomer(stripeCustomerId)
                .addLineItem(lineItem)
                .build();

        try {
            Session session = Session.create(params);

            // persist or update subscription record as INCOMPLETE until webhook finalizes
            Subscription subscription = maybeSub.orElseGet(Subscription::new);
            subscription.setUser(user);
            subscription.setPlan(plan);
            subscription.setStripeCustomerId(stripeCustomerId);
            subscription.setStatus(SubscriptionStatus.INCOMPLETE);
            subscriptionRepository.save(subscription);

            return new CheckoutResponse(session.getUrl());
        } catch (Exception e) {
            throw new RuntimeException("Failed to create Stripe checkout session", e);
        }
    }

    @Override
    public PortalResponse openCustomerPortal(Long userId) {
        Subscription subscription = subscriptionRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("No subscription found for user"));

        if (subscription.getStripeCustomerId() == null) {
            throw new IllegalArgumentException("Customer not created in Stripe for user");
        }

        com.stripe.param.billingportal.SessionCreateParams params = com.stripe.param.billingportal.SessionCreateParams.builder()
                .setCustomer(subscription.getStripeCustomerId())
                .setReturnUrl(frontendUrl + "/billing")
                .build();

        try {
                    com.stripe.model.billingportal.Session portalSession = com.stripe.model.billingportal.Session.create(params);
            return new PortalResponse(portalSession.getUrl());
        } catch (Exception e) {
            throw new RuntimeException("Failed to open Stripe billing portal", e);
        }
    }
}

