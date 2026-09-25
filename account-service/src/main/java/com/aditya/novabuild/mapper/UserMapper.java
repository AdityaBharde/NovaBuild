package com.aditya.novabuild.mapper;


import com.aditya.novabuild.dto.auth.SignUpRequest;
import com.aditya.novabuild.dto.auth.UserProfileResponse;
import com.aditya.novabuild.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "password", ignore = true)
    User toUser(SignUpRequest signUpRequest);

    UserProfileResponse toUserProfileResponse(User user);

}
