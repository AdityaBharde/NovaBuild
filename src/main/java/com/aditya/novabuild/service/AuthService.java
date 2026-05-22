package com.aditya.novabuild.service;

import com.aditya.novabuild.dto.auth.*;

public interface AuthService {
    AuthResponse signUp(SignUpRequest signUpRequest);

    AuthResponse login(LoginRequest loginRequest);

    UserProfileResponse getProfile();
}

