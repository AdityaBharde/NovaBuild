package com.aditya.account_service.controller;

import com.aditya.account_service.dto.auth.UserProfileResponse;
import com.aditya.account_service.entity.User;
import com.aditya.account_service.repository.UserRepository;
import com.aditya.commonlib.exception.ResourceNotFoundException;
import com.aditya.commonlib.security.AuthUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/users", "/api/v1/users"})
@RequiredArgsConstructor
public class UserController {

    private final AuthUtil authUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser() {
        Long userId = authUtil.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));
        return ResponseEntity.ok(new UserProfileResponse(user.getId(), user.getUsername(), user.getName()));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserProfileResponse> updateCurrentUser(@RequestBody Map<String, String> updates) {
        Long userId = authUtil.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

        if (updates.containsKey("name") && updates.get("name") != null && !updates.get("name").isBlank()) {
            user.setName(updates.get("name").trim());
        }

        if (updates.containsKey("password") && updates.get("password") != null && !updates.get("password").isBlank()) {
            user.setPassword(passwordEncoder.encode(updates.get("password")));
        }

        User saved = userRepository.save(user);
        return ResponseEntity.ok(new UserProfileResponse(saved.getId(), saved.getUsername(), saved.getName()));
    }
}
