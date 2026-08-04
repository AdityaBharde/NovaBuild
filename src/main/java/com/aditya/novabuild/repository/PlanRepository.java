package com.aditya.novabuild.repository;

import aj.org.objectweb.asm.commons.Remapper;
import com.aditya.novabuild.model.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlanRepository extends JpaRepository<Plan, Long> {
    List<Plan> findAllByActiveTrue();

    Optional<Plan> findByStripePriceId(String id);
}
