package com.aditya.novabuild.repository;

import com.aditya.novabuild.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query("SELECT p FROM Project p WHERE p.deletedAt!=null AND p.owner.id = :userId ORDER BY p.updatedAt DESC ")
    List<Project> findAllAccessibleByUser(@Param("userId") Long ownerId);
}
