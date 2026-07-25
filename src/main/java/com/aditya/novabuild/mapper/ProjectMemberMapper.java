package com.aditya.novabuild.mapper;


import com.aditya.novabuild.dto.member.MemberResponse;
import com.aditya.novabuild.model.ProjectMember;
import com.aditya.novabuild.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProjectMemberMapper {
    @Mapping(target = "userId", source = "id")
    @Mapping(target = "projectRole", constant = "OWNER")
    MemberResponse toMemberResponseFromOwner(User owner);

    @Mapping(target = "projectRole", source = "role")
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "username", source = "user.username")
    @Mapping(target = "name", source = "user.name")
    MemberResponse toMemberResponseFromMember(ProjectMember member);
}
