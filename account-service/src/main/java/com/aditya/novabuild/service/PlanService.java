package com.aditya.novabuild.service;

import com.aditya.novabuild.dto.subscription.PlanResponse;

import java.util.List;


public interface PlanService {
    List<PlanResponse> getAllActivePlans();
}
