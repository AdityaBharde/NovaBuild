package com.aditya.novabuild.repository;

import com.aditya.novabuild.model.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> getUserByUsername(String email);

    boolean existsByUsername(@NotBlank @Email String username);

    Optional<User> findByUsername(String username);
}
