package com.lokesh.ems.dto;

import com.lokesh.ems.model.User;

import java.time.Instant;

public record EmployeeResponse(Long id, String name, String email, String department, Instant createdAt,
                               TaskCounts tasks) {

    public static EmployeeResponse from(User u, TaskCounts counts) {
        return new EmployeeResponse(u.getId(), u.getName(), u.getEmail(), u.getDepartment(), u.getCreatedAt(), counts);
    }
}
