package com.aditya.accountservice.service;


import com.aditya.accountservice.dto.auth.AuthResponse;
import com.aditya.accountservice.dto.auth.LoginRequest;
import com.aditya.accountservice.dto.auth.SignupRequest;

public interface AuthService {
    AuthResponse signup(SignupRequest request);

    AuthResponse login(LoginRequest request);
}