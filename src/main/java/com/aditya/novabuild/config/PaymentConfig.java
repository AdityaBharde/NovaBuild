package com.aditya.novabuild.config;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PaymentConfig {

    @Value("${stripe.secret}")
    private String apiKey;


}
