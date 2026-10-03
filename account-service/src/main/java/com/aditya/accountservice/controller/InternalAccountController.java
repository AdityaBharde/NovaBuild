package com.aditya.accountservice.controller;

import com.aditya.accountservice.mapper.UserMapper;
import com.aditya.accountservice.repository.UserRepository;
import com.aditya.commonlib.dto.PlanDto;
import com.aditya.commonlib.dto.UserDto;
import com.aditya.commonlib.exception.ResourceNotFoundException;
import com.stripe.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/internal/v1")
@RequiredArgsConstructor
public class InternalAccountController {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final SubscriptionService subscriptionService;

    @GetMapping("/users/{id}")
    public UserDto getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(userMapper::toUserDto)
                .orElseThrow(() -> new ResourceNotFoundException("User", id.toString()));
    }

    @GetMapping("/users/by-email")
    public Optional<UserDto> getUserByEmail(@RequestParam String email) {
        return userRepository.findByUsernameIgnoreCase(email)
                .map(userMapper::toUserDto);
    }

    @GetMapping("/billing/current-plan")
    public PlanDto getCurrentSubscribedPlan() {
        return subscriptionService.getCurrentSubscribedPlanByUser();
    }
}