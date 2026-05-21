package com.aditya.novabuild.model;

import com.aditya.novabuild.enums.PreviewStatus;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Preview {
    Long id;
    Project project;

    String namespace;
    String podName;
    String previewUrl;

    PreviewStatus status;

    Instant createdAt;
    Instant terminatedAt;
    Instant startedAt;


}
