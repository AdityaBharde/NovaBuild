package com.aditya.account_service.service.impl;

import com.aditya.account_service.dto.auth.AuthResponse;
import com.aditya.account_service.dto.auth.LoginRequest;
import com.aditya.account_service.dto.auth.SignupRequest;
import com.aditya.account_service.entity.User;
import com.aditya.account_service.mapper.UserMapper;
import com.aditya.account_service.repository.UserRepository;
import com.aditya.account_service.service.AuthService;
import com.aditya.commonlib.exception.BadRequestException;
import com.aditya.commonlib.security.AuthUtil;
import com.aditya.commonlib.security.JwtUserPrincipal;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class AuthServiceImpl implements AuthService {

    UserRepository userRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;
    AuthUtil authUtil;
    AuthenticationManager authenticationManager;

    @Override
    public AuthResponse signup(SignupRequest request) {
        userRepository.findByUsername(request.username()).ifPresent(user -> {
            throw new BadRequestException("User already exists with username: "+request.username());
        });

        User user = userMapper.toEntity(request);
        user.setPassword(passwordEncoder.encode(request.password()));
        user = userRepository.save(user);

        JwtUserPrincipal jwtUserPrincipal = new JwtUserPrincipal(user.getId(), user.getName(),
                user.getUsername(), null,  new ArrayList<>());

        String token = authUtil.generateAccessToken(jwtUserPrincipal);
        return new AuthResponse(token, userMapper.toUserProfileResponse(jwtUserPrincipal));
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        log.info("LOGIN: Reached AuthService for {}", request.username());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.username(),
                        request.password()
                )
        );

        log.info("LOGIN: Authentication successful");

        JwtUserPrincipal user = (JwtUserPrincipal) authentication.getPrincipal();
        String token = authUtil.generateAccessToken(user);

        return new AuthResponse(token, userMapper.toUserProfileResponse(user));
    }
}
