package com.aditya.novabuild.service.impl;

import com.aditya.novabuild.dto.auth.AuthResponse;
import com.aditya.novabuild.dto.auth.LoginRequest;
import com.aditya.novabuild.dto.auth.SignUpRequest;
import com.aditya.novabuild.service.AuthService;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {
    @Override
    public AuthResponse signUp(SignUpRequest signUpRequest) {
        return null;
    }

    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        return null;
    }
}
