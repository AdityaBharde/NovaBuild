package com.aditya.account_service.controller;

import com.aditya.account_service.entity.User;
import com.aditya.account_service.mapper.UserMapper;
import com.aditya.account_service.repository.UserRepository;
import com.aditya.account_service.service.SubscriptionService;
import com.aditya.commonlib.dto.PlanDto;
import com.aditya.commonlib.dto.UserDto;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
class InternalAccountControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private UserMapper userMapper;

    @MockBean
    private SubscriptionService subscriptionService;

    @Test
    void testGetUserById() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setUsername("test@example.com");

        UserDto userDto = new UserDto(1L, "test@example.com", "Test User");

        Mockito.when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        Mockito.when(userMapper.toUserDto(user)).thenReturn(userDto);

        mockMvc.perform(get("/internal/v1/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("test@example.com"));
    }

    @Test
    void testGetUserByEmail() throws Exception {
        User user = new User();
        user.setId(2L);
        user.setUsername("hello@example.com");

        UserDto userDto = new UserDto(2L, "hello@example.com", "Hello User");

        Mockito.when(userRepository.findByUsernameIgnoreCase("hello@example.com")).thenReturn(Optional.of(user));
        Mockito.when(userMapper.toUserDto(user)).thenReturn(userDto);

        mockMvc.perform(get("/internal/v1/users/by-email").param("email", "hello@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.username").value("hello@example.com"));
    }

    @Test
    void testGetCurrentSubscribedPlan() throws Exception {
        PlanDto planDto = new PlanDto(1L, "Premium", 10, 1000, false, "10.00");

        Mockito.when(subscriptionService.getCurrentSubscribedPlanByUser()).thenReturn(planDto);

        mockMvc.perform(get("/internal/v1/billing/current-plan"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Premium"))
                .andExpect(jsonPath("$.maxProjects").value(10));
    }
}
