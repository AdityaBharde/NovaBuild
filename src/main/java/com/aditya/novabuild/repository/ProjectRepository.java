package com.aditya.novabuild.repository;

import com.aditya.novabuild.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query("SELECT p FROM Project p WHERE p.deletedAt IS null AND p.owner.id = :userId ORDER BY p.updatedAt DESC ")
    List<Project> findAllAccessibleByUser(@Param("userId") Long ownerId);

    @Query("SELECT p FROM Project p left join FETCH p.owner where p.id = :projectId and p.deletedAt IS  null and p.owner.id= :userId")
    Optional<Project> findAllAccessibleByProjectId(@Param("projectId") Long projectId, @Param("userId") Long userId);
}
