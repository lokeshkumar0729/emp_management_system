package com.lokesh.ems.dto;

import com.lokesh.ems.model.Priority;
import com.lokesh.ems.model.Task;
import com.lokesh.ems.model.TaskStatus;

import java.time.Instant;
import java.time.LocalDate;

public record TaskResponse(Long id, String title, String description, String category, Priority priority,
                           TaskStatus status, int percentComplete, LocalDate startDate, LocalDate dueDate,
                           boolean overdue, Long assigneeId, String assigneeName, String createdByName,
                           Instant createdAt) {

    public static TaskResponse from(Task t) {
        boolean overdue = t.getStatus().isOpen() && t.getDueDate().isBefore(LocalDate.now());
        return new TaskResponse(t.getId(), t.getTitle(), t.getDescription(), t.getCategory(), t.getPriority(),
                t.getStatus(), t.getPercentComplete(), t.getStartDate(), t.getDueDate(), overdue,
                t.getAssignee().getId(), t.getAssignee().getName(), t.getCreatedBy().getName(), t.getCreatedAt());
    }
}
