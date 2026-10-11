package com.aditya.account_service.controller;

import com.aditya.account_service.dto.subscription.CheckoutRequest;
import com.aditya.account_service.dto.subscription.CheckoutResponse;
import com.aditya.account_service.dto.subscription.PortalResponse;
import com.aditya.account_service.dto.subscription.SubscriptionResponse;
import com.aditya.account_service.dto.subscription.*;
import com.aditya.account_service.service.PaymentProcessor;
import com.aditya.account_service.service.SubscriptionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
class BillingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SubscriptionService subscriptionService;

    @MockBean
    private PaymentProcessor paymentProcessor;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testGetMySubscription() throws Exception {
        com.aditya.commonlib.dto.PlanDto plan = new com.aditya.commonlib.dto.PlanDto(1L, "Pro", 10, 1000, false, "10.00");
        SubscriptionResponse response = new SubscriptionResponse(plan, "ACTIVE", java.time.Instant.now(), 0L);
        
        Mockito.when(subscriptionService.getCurrentSubscription()).thenReturn(response);

        mockMvc.perform(get("/api/me/subscription"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plan.name").value("Pro"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void testCreateCheckoutResponse() throws Exception {
        CheckoutRequest request = new CheckoutRequest(1L);
        
        CheckoutResponse response = new CheckoutResponse("http://checkout.stripe.com/session_123");

        Mockito.when(paymentProcessor.createCheckoutSessionUrl(any(CheckoutRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/payments/checkout")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checkoutUrl").value("http://checkout.stripe.com/session_123"));
    }

    @Test
    void testOpenCustomerPortal() throws Exception {
        PortalResponse response = new PortalResponse("http://billing.stripe.com/session_456");

        Mockito.when(paymentProcessor.openCustomerPortal()).thenReturn(response);

        mockMvc.perform(post("/api/payments/portal"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.portalUrl").value("http://billing.stripe.com/session_456"));
    }
}
