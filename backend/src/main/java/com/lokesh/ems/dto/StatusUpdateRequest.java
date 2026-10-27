package com.lokesh.ems.dto;

import com.lokesh.ems.model.TaskStatus;
import jakarta.validation.constraints.NotNull;

public record StatusUpdateRequest(@NotNull(message = "Status is required") TaskStatus status) {
}
