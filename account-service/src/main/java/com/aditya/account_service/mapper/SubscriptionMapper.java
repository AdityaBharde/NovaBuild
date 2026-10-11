package com.aditya.account_service.mapper;

import com.aditya.account_service.dto.subscription.SubscriptionResponse;
import com.aditya.account_service.entity.Plan;
import com.aditya.account_service.entity.Subscription;
import com.aditya.commonlib.dto.PlanDto;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface SubscriptionMapper {

    SubscriptionResponse toSubscriptionResponse(Subscription subscription);

    PlanDto toPlanResponse(Plan plan);
}
