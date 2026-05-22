package com.aditya.novabuild.model;

import com.aditya.novabuild.enums.SubscriptionStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;


@Entity
@Getter
@Setter
public class Subscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    @ManyToOne
    User user;
    @ManyToOne
    Plan plan;

    SubscriptionStatus status;

    String stripeSubscriptionId;
    String stripeCustomerId;

    Instant currentPeriodStart;
    Instant currentPeriodEnd;
    Boolean cancelAtPeriodEnd =false;

    Instant canceledAt;
    Instant updatedAt;
}
