package com.aditya.account_service.mapper;

import com.aditya.account_service.dto.auth.SignupRequest;
import com.aditya.account_service.dto.auth.UserProfileResponse;
import com.aditya.account_service.entity.User;
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
