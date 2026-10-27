package com.lokesh.ems.service;

import com.lokesh.ems.dto.PageResponse;
import com.lokesh.ems.dto.TaskRequest;
import com.lokesh.ems.dto.TaskResponse;
import com.lokesh.ems.exception.ApiException;
import com.lokesh.ems.model.*;
import com.lokesh.ems.repository.TaskRepository;
import com.lokesh.ems.repository.TaskSpecifications;
import com.lokesh.ems.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@Transactional(readOnly = true)
public class TaskService {

    private static final Sort DEFAULT_SORT = Sort.by(Sort.Order.asc("dueDate"), Sort.Order.desc("id"));

    private final TaskRepository tasks;
    private final UserRepository users;

    public TaskService(TaskRepository tasks, UserRepository users) {
        this.tasks = tasks;
        this.users = users;
    }

    // ---- queries -------------------------------------------------------------------------------------------

    public PageResponse<TaskResponse> search(Long assigneeId, TaskStatus status, Priority priority, String query,
                                             boolean overdueOnly, int page, int size) {
        Page<Task> result = tasks.findAll(
                TaskSpecifications.filter(assigneeId, status, priority, query, overdueOnly),
                Paging.of(page, size, DEFAULT_SORT));
        return PageResponse.from(result, TaskResponse::from);
    }

    public PageResponse<TaskResponse> searchMine(String email, TaskStatus status, String query, int page, int size) {
        User me = requireUser(email);
        return search(me.getId(), status, null, query, false, page, size);
    }

    // ---- admin commands ------------------------------------------------------------------------------------

    @Transactional
    public TaskResponse create(TaskRequest request, String adminEmail) {
        validateDates(request);
        if (request.dueDate().isBefore(LocalDate.now())) {
            throw ApiException.badRequest("Due date cannot be in the past");
        }
        Task task = new Task();
        task.setCreatedBy(requireUser(adminEmail));
        task.setAssignee(requireEmployee(request.assigneeId()));
        apply(task, request);
        return TaskResponse.from(tasks.save(task));
    }

    @Transactional
    public TaskResponse update(Long id, TaskRequest request) {
        Task task = requireTask(id);
        if (!task.getStatus().isOpen()) {
            throw ApiException.conflict("Closed tasks cannot be edited");
        }
        validateDates(request);
        if (!task.getAssignee().getId().equals(request.assigneeId())) {
            if (task.getStatus() != TaskStatus.PENDING) {
                throw ApiException.conflict("A task that is already in progress cannot be reassigned");
            }
            task.setAssignee(requireEmployee(request.assigneeId()));
        }
        apply(task, request);
        return TaskResponse.from(task);
    }

    @Transactional
    public void delete(Long id) {
        if (!tasks.existsById(id)) {
            throw ApiException.notFound("Task not found");
        }
        tasks.deleteById(id);
    }

    // ---- employee commands ---------------------------------------------------------------------------------

    @Transactional
    public TaskResponse changeStatus(Long id, TaskStatus next, String email) {
        Task task = requireOwnedTask(id, email);
        if (!task.getStatus().canTransitionTo(next)) {
            throw ApiException.conflict("A task that is " + label(task.getStatus()) + " cannot be marked as " + label(next));
        }
        task.setStatus(next);
        if (next == TaskStatus.COMPLETED) {
            task.setPercentComplete(100);
        }
        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse updateProgress(Long id, int percent, String email) {
        Task task = requireOwnedTask(id, email);
        if (task.getStatus() != TaskStatus.IN_PROGRESS) {
            throw ApiException.conflict("Progress can only be updated while a task is in progress");
        }
        task.setPercentComplete(percent);
        return TaskResponse.from(task);
    }

    // ---- helpers -------------------------------------------------------------------------------------------

    private void apply(Task task, TaskRequest request) {
        task.setTitle(request.title().trim());
        task.setDescription(blankToNull(request.description()));
        task.setCategory(blankToNull(request.category()));
        task.setPriority(request.priority());
        task.setStartDate(request.startDate());
        task.setDueDate(request.dueDate());
    }

    private void validateDates(TaskRequest request) {
        if (request.startDate() != null && request.dueDate().isBefore(request.startDate())) {
            throw ApiException.badRequest("Due date cannot be before the start date");
        }
    }

    private Task requireTask(Long id) {
        return tasks.findWithUsersById(id).orElseThrow(() -> ApiException.notFound("Task not found"));
    }

    private Task requireOwnedTask(Long id, String email) {
        Task task = requireTask(id);
        if (!task.getAssignee().getEmail().equalsIgnoreCase(email)) {
            throw ApiException.forbidden("Only the assigned employee can update this task");
        }
        return task;
    }

    private User requireUser(String email) {
        return users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> ApiException.unauthorized("Account no longer exists"));
    }

    private User requireEmployee(Long id) {
        return users.findById(id)
                .filter(u -> u.getRole() == Role.EMPLOYEE)
                .orElseThrow(() -> ApiException.badRequest("Assignee must be an existing employee"));
    }

    private static String label(TaskStatus status) {
        return status.name().toLowerCase().replace('_', ' ');
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
