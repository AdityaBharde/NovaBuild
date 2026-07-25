package com.aditya.novabuild.security;


import com.aditya.novabuild.enums.ProjectPermission;
import com.aditya.novabuild.enums.ProjectRole;
import com.aditya.novabuild.repository.ProjectMemberRepository;
import com.aditya.novabuild.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component("security")
@RequiredArgsConstructor
public class SecurityExpressions {

    private final AuthUtil authUtil;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;


    public boolean hasPermission(Long projectId , ProjectPermission permission){
        Long userId = authUtil.getCurrentUserId();
        return projectMemberRepository.findRoleByProjectIdAndUserId(projectId, userId).
                map(projectRole -> projectRole.getPermissions().contains(permission)).orElse(false);
    }

    public boolean canViewProject(Long projectId ){
        return hasPermission(projectId, ProjectPermission.VIEW);
    }
    public boolean canEditProject(Long projectId){
        return hasPermission(projectId, ProjectPermission.EDIT);
    }
    public boolean canDeleteProject(Long projectId){
        return hasPermission(projectId, ProjectPermission.DELETE);
    }
    public boolean canManageMembers(Long projectId){
        return hasPermission(projectId, ProjectPermission.MANAGE_MEMBERS);
    }

}
