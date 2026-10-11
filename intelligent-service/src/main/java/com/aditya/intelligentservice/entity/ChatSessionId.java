package com.aditya.intelligentservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatSessionId implements Serializable {

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "user_id")
    private Long userId;
}
