package com.aditya.account_service.service;


import com.aditya.account_service.dto.auth.AuthResponse;
import com.aditya.account_service.dto.auth.LoginRequest;
import com.aditya.account_service.dto.auth.SignupRequest;

public interface AuthService {
    AuthResponse signup(SignupRequest request);

    AuthResponse login(LoginRequest request);
}
