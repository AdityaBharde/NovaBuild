package com.aditya.novabuild.service.impl;

import com.aditya.novabuild.dto.subscription.PlanResponse;
import com.aditya.novabuild.model.Plan;
import com.aditya.novabuild.repository.PlanRepository;
import com.aditya.novabuild.service.PlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlanServiceImpl implements PlanService {

    private final PlanRepository planRepository;

    @Override
    public List<PlanResponse> getAllActivePlans() {
        List<Plan> plans = planRepository.findAllByActiveTrue();
        return plans.stream()
                .map(p -> new PlanResponse(
                        p.getId(),
                        p.getName(),
                        p.getMaxProjects(),
                        p.getMaxTokensPerDay(),
                        p.getUnlimitedAi(),
                        p.getStripePriceId() // expose stripe price id as price placeholder
                ))
                .collect(Collectors.toList());
    }
}