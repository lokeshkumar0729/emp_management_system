package com.lokesh.ems.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ProgressUpdateRequest(
        @NotNull(message = "Progress is required")
        @Min(value = 0, message = "Progress cannot be below 0")
        @Max(value = 100, message = "Progress cannot be above 100") Integer percentComplete) {
}
