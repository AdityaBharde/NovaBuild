package com.aditya.novabuild.repository;

import com.aditya.novabuild.enums.SubscriptionStatus;
import com.aditya.novabuild.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findByUserId(Long userId);

    boolean existsByStripeSubscriptionId(String subscriptionId);

    Optional<Subscription> findByStripeSubscriptionId(String gatewaySubscriptionId);

    Optional<Subscription> findByUserIdAndStatusIn(Long userId, Set<SubscriptionStatus> active);
}
