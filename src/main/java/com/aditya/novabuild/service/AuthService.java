package com.aditya.novabuild.service;

import com.aditya.novabuild.dto.auth.*;
import org.springframework.stereotype.Service;


public interface AuthService {
    AuthResponse signUp(SignUpRequest signUpRequest);

    AuthResponse login(LoginRequest loginRequest);

}

