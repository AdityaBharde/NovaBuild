package com.aditya.novabuild.service.impl;

import com.aditya.novabuild.dto.subscription.CheckoutRequest;
import com.aditya.novabuild.dto.subscription.CheckoutResponse;
import com.aditya.novabuild.dto.subscription.PortalResponse;
import com.aditya.novabuild.exception.ResourceNotFoundException;
import com.aditya.novabuild.model.Plan;
import com.aditya.novabuild.model.User;
import com.aditya.novabuild.repository.PlanRepository;
import com.aditya.novabuild.repository.SubscriptionRepository;
import com.aditya.novabuild.repository.UserRepository;
import com.aditya.novabuild.security.AuthUtil;
import com.aditya.novabuild.service.PaymentProcesser;
import com.aditya.novabuild.service.SubscriptionService;
import com.stripe.exception.StripeException;
import com.stripe.model.Invoice;
import com.stripe.model.StripeObject;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;


@Service
@RequiredArgsConstructor
@Log4j2
public class StripePaymentProcessor implements PaymentProcesser {

    private final PlanRepository planRepository;
    private final UserRepository userRepository;
    private final AuthUtil authUtil;
    private final SubscriptionService subscriptionService;
    private final SubscriptionRepository subscriptionRepository;

    @Value("${client.url}")
    private String frontendUrl;

    @Override
    public CheckoutResponse createCheckoutSessionUrl(CheckoutRequest request) {
        Plan plan = planRepository.findById(request.planId())
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"+request.planId()));
        Long userId = authUtil.getCurrentUserId();
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"+userId));

        SessionCreateParams.LineItem lineItem = SessionCreateParams.LineItem.builder()
                .setPrice(plan.getStripePriceId())
                .setQuantity(1L)
                .build();
        var params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .setSuccessUrl(frontendUrl + "success.html?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(frontendUrl + "cancel.html")
                .addLineItem(lineItem)
                .putMetadata("user_id",userId.toString())
                .putMetadata("plan_id",plan.getId().toString());

        try {
            String stripeCustomerIdrId = user.getStripeCustomerId();

            if (stripeCustomerIdrId == null ||  stripeCustomerIdrId.isEmpty()) {
                params.setCustomerEmail(user.getUsername());
            }else {
                params.setCustomerEmail(stripeCustomerIdrId);
            }

            Session session = Session.create(params.build());
            return new CheckoutResponse(session.getUrl());
        } catch (Exception e) {
            log.error("Stripe checkout session creation failed", e);
            throw new RuntimeException("Failed to create Stripe checkout session", e);
        }
    }

    @Override
    public PortalResponse openCustomerPortal(Long userId) {
       com.aditya.novabuild.model.Subscription subscription = subscriptionRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("No subscription found for user"));
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"+userId));
        if (user.getStripeCustomerId() == null) {
            throw new IllegalArgumentException("Customer not created in Stripe for user");
        }

        SessionCreateParams params = SessionCreateParams.builder()
                .setCustomer(user.getStripeCustomerId())
                .setReturnUrl(frontendUrl + "billing")
                .build();

        try {
                    Session portalSession = Session.create(params);
            return new PortalResponse(portalSession.getUrl());
        } catch (Exception e) {
            throw new RuntimeException("Failed to open Stripe billing portal", e);
        }
    }

    @Override
    public void handleWebhookEvent(String type, StripeObject stripeObject, Map<String, String> metadata) {
        log.debug("Handling stripe event: {}", type);

        switch (type) {
            case "checkout.session.completed" -> handleCheckoutSessionCompleted((Session) stripeObject, metadata);
            case "customer.subscription.updated" -> handleCustomerSubscriptionUpdated((Subscription) stripeObject);
            case "customer.subscription.deleted" -> handleCustomerSubscriptionDeleted((Subscription) stripeObject);
            case "invoice.paid" -> handleInvoicePaid((Invoice) stripeObject);
            case "invoice.payment_failed" -> handleInvoicePaymentFailed((Invoice) stripeObject);
            default -> log.debug("Ignoring the event: {}", type);
        }
    }

    private void handleInvoicePaymentFailed(Invoice invoice) {
        String subId = extractSubscriptionId(invoice);
        if(subId == null) return;

        subscriptionService.markSubscriptionPastDue(subId);
    }

    private void handleInvoicePaid(Invoice invoice) {
        String subId = extractSubscriptionId(invoice);
        if(subId == null) return;

        try {
            Subscription subscription = Subscription.retrieve(subId); //sdk calling the Stripe server
            var item = subscription.getItems().getData().get(0);

            Instant periodStart = toInstant(item.getCurrentPeriodStart());
            Instant periodEnd = toInstant(item.getCurrentPeriodEnd());

            subscriptionService.renewSubscriptionPeriod(
                    subId,
                    periodStart,
                    periodEnd
            );

        } catch (StripeException e) {
            throw new RuntimeException(e);
        }

    }

    private void handleCustomerSubscriptionDeleted(Subscription stripeObject) {
        
    }

    private void handleCustomerSubscriptionUpdated(Subscription stripeObject) {
        
    }

    private void handleCheckoutSessionCompleted(Session session, Map<String, String> metadata) {
        if(session == null) {
            log.error("session object was null");
            return;
        }
        Long userId = Long.parseLong(metadata.get("user_id"));
        Long planId = Long.parseLong(metadata.get("plan_id"));

        String subscriptionId = session.getSubscription();
        String customerId = session.getCustomer();

        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        if(user.getStripeCustomerId() == null) {
            user.setStripeCustomerId(customerId);
            userRepository.save(user);
        }

        subscriptionService.activateSubscription(userId, planId, subscriptionId, customerId);
    }


    private String extractSubscriptionId(Invoice invoice) {
        var parent = invoice.getParent();
        if (parent == null) return null;

        var subDetails = parent.getSubscriptionDetails();
        if (subDetails == null) return null;

        return subDetails.getSubscription();
    }

    private Instant toInstant(Long epoch) {
        return epoch != null ? Instant.ofEpochSecond(epoch) : null;
    }

}

