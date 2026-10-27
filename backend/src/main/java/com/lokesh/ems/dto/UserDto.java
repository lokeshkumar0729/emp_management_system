package com.lokesh.ems.dto;

import com.lokesh.ems.model.Role;
import com.lokesh.ems.model.User;

public record UserDto(Long id, String name, String email, Role role, String department) {

    public static UserDto from(User u) {
        return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getRole(), u.getDepartment());
    }
}
