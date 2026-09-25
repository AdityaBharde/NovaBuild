package com.aditya.novabuild.mapper;

import com.aditya.novabuild.dto.PlanDto;
import com.aditya.novabuild.dto.subscription.SubscriptionResponse;
import com.aditya.novabuild.model.Plan;
import com.aditya.novabuild.model.Subscription;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface SubscriptionMapper {

    SubscriptionResponse toSubscriptionResponse(Subscription subscription);

    PlanDto toPlanResponse(Plan plan);
}