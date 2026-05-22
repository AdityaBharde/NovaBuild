package com.aditya.novabuild.service;


import com.aditya.novabuild.dto.subscription.PlanLimitsResponse;
import com.aditya.novabuild.dto.subscription.UsageTodayResponse;
import org.springframework.stereotype.Service;


@Service
public interface UsageService {
     UsageTodayResponse getTodayUsageOfUser(Long userId);

    PlanLimitsResponse getCurrentSubscriptionLimitsOfUser(Long userId);
}
