package com.aditya.intelligentservice.client;

import com.aditya.commonlib.dto.PlanDto;
import com.aditya.commonlib.dto.UserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Optional;

@FeignClient(name = "account-service", path = "/account", url="${ACCOUNT_SERVICE_URI:}")
public interface AccountClient {

    @GetMapping("/internal/v1/users/by-email")
    Optional<UserDto> getUserByEmail(@RequestParam("email") String email);

    @GetMapping("/internal/v1/billing/current-plan")
    PlanDto getCurrentSubscribedPlanByUser();
}