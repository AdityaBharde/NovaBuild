package com.aditya.novabuild.controller;


import com.aditya.novabuild.dto.subscription.*;
import com.aditya.novabuild.service.PaymentProcessor;
import com.aditya.novabuild.service.PlanService;
import com.aditya.novabuild.service.SubscriptionService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class SubscriptionController {
    private final PlanService planService;
    private final SubscriptionService subscriptionService;
    private final PaymentProcessor paymentProcesser;

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    @GetMapping("/api/plans")
    public ResponseEntity<List<PlanResponse>> getAllPlans() {
        return ResponseEntity.ok(planService.getAllActivePlans());
    }

    @GetMapping("/api/me/subscription")
    public ResponseEntity<SubscriptionResponse> getMySubscription() {
        return ResponseEntity.ok(subscriptionService.getCurrentSubscription());
    }

    @PostMapping("/api/payments/checkout")
    public ResponseEntity<CheckoutResponse> createCheckoutResponse(
            @Valid @RequestBody CheckoutRequest request
    ) {
        return ResponseEntity.ok(paymentProcesser.createCheckoutSessionUrl(request));
    }

    @PostMapping("/api/payments/portal")
    public ResponseEntity<PortalResponse> openCustomerPortal() {
        return ResponseEntity.ok(paymentProcesser.openCustomerPortal());
    }

    @PostMapping("/webhooks/payment")
    public ResponseEntity<String> handlePaymentWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
            EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
            StripeObject stripeObject = null;
            if (deserializer.getObject().isPresent()){
                stripeObject = deserializer.getObject().get();
            }else{
                try {
                    stripeObject =deserializer.deserializeUnsafe();
                    if (stripeObject == null){
                        log.warn("Failed to deserialize webhook object for event" + event.getType());
                        return ResponseEntity.ok().build();
                    }
                } catch (Exception e) {
                    log.error("Unsafe deserialization error for event {} :{}" , event.getType(), e.getMessage());
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Deserialization error");
                }
            }

            Map<String, String> metadata = new HashMap<>();
            if (stripeObject instanceof Session session) {
                metadata = session.getMetadata();
            }
            paymentProcesser.handleWebhookEvent(event.getType() , stripeObject , metadata);
            return ResponseEntity.ok().build();

        } catch (SignatureVerificationException e) {
            log.error("Invalid signature: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
        }
    }
}
