package com.lokesh.ems.controller;

import com.lokesh.ems.dto.*;
import com.lokesh.ems.model.Priority;
import com.lokesh.ems.model.TaskStatus;
import com.lokesh.ems.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService tasks;

    public TaskController(TaskService tasks) {
        this.tasks = tasks;
    }

    // ---- admin ---------------------------------------------------------------------------------------------

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<TaskResponse> list(@RequestParam(required = false) Long assigneeId,
                                           @RequestParam(required = false) TaskStatus status,
                                           @RequestParam(required = false) Priority priority,
                                           @RequestParam(defaultValue = "") String q,
                                           @RequestParam(defaultValue = "false") boolean overdue,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "10") int size) {
        return tasks.search(assigneeId, status, priority, q, overdue, page, size);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse create(@Valid @RequestBody TaskRequest request, Authentication auth) {
        return tasks.create(request, auth.getName());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public TaskResponse update(@PathVariable Long id, @Valid @RequestBody TaskRequest request) {
        return tasks.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        tasks.delete(id);
    }

    // ---- employee ------------------------------------------------------------------------------------------

    @GetMapping("/mine")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public PageResponse<TaskResponse> mine(@RequestParam(required = false) TaskStatus status,
                                           @RequestParam(defaultValue = "") String q,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "6") int size,
                                           Authentication auth) {
        return tasks.searchMine(auth.getName(), status, q, page, size);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public TaskResponse changeStatus(@PathVariable Long id, @Valid @RequestBody StatusUpdateRequest request,
                                     Authentication auth) {
        return tasks.changeStatus(id, request.status(), auth.getName());
    }

    @PatchMapping("/{id}/progress")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public TaskResponse updateProgress(@PathVariable Long id, @Valid @RequestBody ProgressUpdateRequest request,
                                       Authentication auth) {
        return tasks.updateProgress(id, request.percentComplete(), auth.getName());
    }
}
