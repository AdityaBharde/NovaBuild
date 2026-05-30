package com.aditya.novabuild.service.impl;

import com.aditya.novabuild.dto.project.FileContentResponse;
import com.aditya.novabuild.dto.project.FileNode;
import com.aditya.novabuild.dto.subscription.PlanResponse;
import com.aditya.novabuild.service.FileService;
import com.aditya.novabuild.service.PlanService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlanServiceImpl implements PlanService {

    @Override
    public List<PlanResponse> getAllActivePlans() {
        return List.of();
    }
}