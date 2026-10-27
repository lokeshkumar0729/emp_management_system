package com.lokesh.ems.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Password is required when creating an employee and optional when updating one. */
public record EmployeeRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must be at most 100 characters") String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email address")
        @Size(max = 150, message = "Email must be at most 150 characters") String email,

        @Size(min = 8, max = 72, message = "Password must be 8 to 72 characters") String password,

        @Size(max = 100, message = "Department must be at most 100 characters") String department) {
}
