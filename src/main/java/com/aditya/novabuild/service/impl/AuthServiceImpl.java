package com.aditya.novabuild.service.impl;

import com.aditya.novabuild.dto.auth.AuthResponse;
import com.aditya.novabuild.dto.auth.LoginRequest;
import com.aditya.novabuild.dto.auth.SignUpRequest;
import com.aditya.novabuild.exception.BadRequestException;
import com.aditya.novabuild.mapper.UserMapper;
import com.aditya.novabuild.model.User;
import com.aditya.novabuild.repository.UserRepository;
import com.aditya.novabuild.security.AuthUtil;
import com.aditya.novabuild.service.AuthService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class AuthServiceImpl implements AuthService {

    UserRepository userRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;
    AuthUtil authUtil;
    AuthenticationManager authenticationManager;

    @Override
    public AuthResponse signUp(SignUpRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.username())){
            throw new BadRequestException("Username already exists : " + signUpRequest.username());
        }
        User user = userMapper.toUser(signUpRequest);
        user.setPassword(passwordEncoder.encode(signUpRequest.password()));
        userRepository.save(user);
        return new AuthResponse(authUtil.generateAccessToken(user),userMapper.toUserProfileResponse(user));
    }

    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.username(),loginRequest.password())
        );
        User user = (User) authentication.getPrincipal();
        String token = authUtil.generateAccessToken(user);
        return new AuthResponse(authUtil.generateAccessToken(user),userMapper.toUserProfileResponse(user));
    }
}
