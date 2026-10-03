package com.aditya.accountservice.mapper;

import com.aditya.accountservice.dto.subscription.SubscriptionResponse;
import com.aditya.accountservice.entity.Plan;
import com.aditya.accountservice.entity.Subscription;
import com.aditya.commonlib.dto.PlanDto;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface SubscriptionMapper {

    SubscriptionResponse toSubscriptionResponse(Subscription subscription);

    PlanDto toPlanResponse(Plan plan);
}