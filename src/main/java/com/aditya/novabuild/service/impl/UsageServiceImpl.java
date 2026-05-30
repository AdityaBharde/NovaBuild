package com.aditya.novabuild.service.impl;

import com.aditya.novabuild.dto.subscription.PlanLimitsResponse;
import com.aditya.novabuild.dto.subscription.UsageTodayResponse;
import com.aditya.novabuild.service.UsageService;
import org.springframework.stereotype.Service;


@Service
public class UsageServiceImpl implements UsageService {
    @Override
    public UsageTodayResponse getTodayUsageOfUser(Long userId) {
        return null;
    }

    @Override
    public PlanLimitsResponse getCurrentSubscriptionLimitsOfUser(Long userId) {
        return null;
    }
}
