package com.aditya.novabuild.service;

import com.aditya.novabuild.dto.auth.AuthResponse;
import com.aditya.novabuild.dto.auth.LoginRequest;
import com.aditya.novabuild.dto.auth.SignUpRequest;


public interface AuthService {
    AuthResponse signUp(SignUpRequest signUpRequest);

    AuthResponse login(LoginRequest loginRequest);

}

