package com.aditya.novabuild.model;


import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UsageLog {
    Long id;
    Project project;
    User user;

    String action;

    Integer tokensUsed;
    Integer durationMs;

    String metaData;

    Instant createdAt;
}
