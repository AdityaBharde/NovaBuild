package com.aditya.accountservice.mapper;

import com.aditya.accountservice.dto.auth.SignupRequest;
import com.aditya.accountservice.dto.auth.UserProfileResponse;
import com.aditya.accountservice.entity.User;
import com.aditya.commonlib.dto.UserDto;
import com.aditya.commonlib.security.JwtUserPrincipal;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    User toEntity(SignupRequest signupRequest);

    @Mapping(source = "userId", target = "id")
    UserProfileResponse toUserProfileResponse(JwtUserPrincipal user);

    UserDto toUserDto(User user);

}