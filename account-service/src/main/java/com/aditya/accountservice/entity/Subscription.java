package com.aditya.accountservice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscriptions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String userId;

    @ManyToOne
    @JoinColumn(name = "plan_id")
    private Plan plan;

    private String status; // ACTIVE, CANCELED, PAST_DUE

    private int tokensUsedThisMonth;
    private LocalDateTime currentPeriodEnd;
}
