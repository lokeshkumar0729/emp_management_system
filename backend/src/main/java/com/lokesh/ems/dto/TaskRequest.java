package com.lokesh.ems.dto;

import com.lokesh.ems.model.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record TaskRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 150, message = "Title must be at most 150 characters") String title,

        @Size(max = 2000, message = "Description must be at most 2000 characters") String description,

        @Size(max = 60, message = "Category must be at most 60 characters") String category,

        @NotNull(message = "Choose who this task is assigned to") Long assigneeId,

        @NotNull(message = "Priority is required") Priority priority,

        LocalDate startDate,

        @NotNull(message = "Due date is required") LocalDate dueDate) {
}
