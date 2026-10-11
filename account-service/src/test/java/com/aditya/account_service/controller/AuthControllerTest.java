package com.aditya.account_service.controller;

import com.aditya.account_service.dto.auth.UserProfileResponse;
import com.aditya.account_service.dto.auth.AuthResponse;
import com.aditya.account_service.dto.auth.LoginRequest;
import com.aditya.account_service.dto.auth.SignupRequest;
import com.aditya.account_service.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false) // Disabling filters to bypass security for unit testing controller logic
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testSignup() throws Exception {
        SignupRequest request = new SignupRequest("Test User", "test@example.com", "password123");

        UserProfileResponse profile = new UserProfileResponse(1L, "test@example.com", "Test User");
        AuthResponse response = new AuthResponse("mock-jwt-token", profile);

        Mockito.when(authService.signup(any(SignupRequest.class))).thenReturn(response);

        mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-jwt-token"));
    }

    @Test
    void testLogin() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "password123");

        UserProfileResponse profile = new UserProfileResponse(1L, "test@example.com", "Test User");
        AuthResponse response = new AuthResponse("mock-jwt-token", profile);

        Mockito.when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-jwt-token"));
    }
}
