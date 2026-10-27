package com.lokesh.ems.service;

import com.lokesh.ems.dto.*;
import com.lokesh.ems.exception.ApiException;
import com.lokesh.ems.model.Role;
import com.lokesh.ems.model.TaskStatus;
import com.lokesh.ems.model.User;
import com.lokesh.ems.repository.TaskRepository;
import com.lokesh.ems.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class EmployeeService {

    private final UserRepository users;
    private final TaskRepository tasks;
    private final PasswordEncoder encoder;

    public EmployeeService(UserRepository users, TaskRepository tasks, PasswordEncoder encoder) {
        this.users = users;
        this.tasks = tasks;
        this.encoder = encoder;
    }

    public PageResponse<EmployeeResponse> search(String query, int page, int size) {
        String q = query == null ? "" : query.trim();
        Page<User> result = users.search(Role.EMPLOYEE, q, Paging.of(page, size, Sort.by("name").ascending()));

        Map<Long, Map<TaskStatus, Long>> countsByUser = countsFor(result.getContent());
        return PageResponse.from(result, u -> EmployeeResponse.from(u,
                TaskCounts.of(countsByUser.getOrDefault(u.getId(), Map.of()))));
    }

    /** Lightweight list for dropdowns (assignee pickers, filters). */
    public List<UserDto> options() {
        return users.findByRoleOrderByNameAsc(Role.EMPLOYEE).stream().map(UserDto::from).toList();
    }

    @Transactional
    public EmployeeResponse create(EmployeeRequest request) {
        if (request.password() == null || request.password().isBlank()) {
            throw ApiException.badRequest("Password is required for new employees");
        }
        String email = normalizeEmail(request.email());
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        User saved = users.save(new User(request.name().trim(), email, encoder.encode(request.password()),
                Role.EMPLOYEE, blankToNull(request.department())));
        return EmployeeResponse.from(saved, TaskCounts.EMPTY);
    }

    @Transactional
    public EmployeeResponse update(Long id, EmployeeRequest request) {
        User user = findEmployee(id);
        String email = normalizeEmail(request.email());
        users.findByEmailIgnoreCase(email)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> {
                    throw ApiException.conflict("An account with this email already exists");
                });

        user.setName(request.name().trim());
        user.setEmail(email);
        user.setDepartment(blankToNull(request.department()));
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(encoder.encode(request.password()));
        }
        Map<Long, Map<TaskStatus, Long>> counts = countsFor(List.of(user));
        return EmployeeResponse.from(user, TaskCounts.of(counts.getOrDefault(id, Map.of())));
    }

    /** Deleting an employee also deletes the tasks assigned to them. */
    @Transactional
    public void delete(Long id) {
        User user = findEmployee(id);
        tasks.deleteByAssigneeId(id);
        users.delete(user);
    }

    private User findEmployee(Long id) {
        return users.findById(id)
                .filter(u -> u.getRole() == Role.EMPLOYEE)
                .orElseThrow(() -> ApiException.notFound("Employee not found"));
    }

    private Map<Long, Map<TaskStatus, Long>> countsFor(List<User> list) {
        Map<Long, Map<TaskStatus, Long>> result = new HashMap<>();
        if (list.isEmpty()) {
            return result;
        }
        List<Long> ids = list.stream().map(User::getId).toList();
        for (Object[] row : tasks.countGroupedByAssigneeAndStatus(ids)) {
            Long userId = ((Number) row[0]).longValue();
            TaskStatus status = (TaskStatus) row[1];
            long count = ((Number) row[2]).longValue();
            result.computeIfAbsent(userId, k -> new EnumMap<>(TaskStatus.class)).put(status, count);
        }
        return result;
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
