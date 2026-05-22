package com.aditya.novabuild.service;

import com.aditya.novabuild.dto.auth.UserProfileResponse;
import org.springframework.stereotype.Service;

@Service
public interface UserService {
    UserProfileResponse getProfile();
}
