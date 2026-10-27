package com.lokesh.ems.service;

import com.lokesh.ems.dto.MyStatsResponse;
import com.lokesh.ems.dto.OverviewResponse;
import com.lokesh.ems.dto.TaskCounts;
import com.lokesh.ems.exception.ApiException;
import com.lokesh.ems.model.Role;
import com.lokesh.ems.model.TaskStatus;
import com.lokesh.ems.model.User;
import com.lokesh.ems.repository.TaskRepository;
import com.lokesh.ems.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@Transactional(readOnly = true)
public class StatsService {

    private final TaskRepository tasks;
    private final UserRepository users;

    public StatsService(TaskRepository tasks, UserRepository users) {
        this.tasks = tasks;
        this.users = users;
    }

    public OverviewResponse overview() {
        return new OverviewResponse(
                TaskCounts.fromRows(tasks.countGroupedByStatus()),
                tasks.countByDueDateBeforeAndStatusIn(LocalDate.now(), TaskStatus.OPEN),
                users.countByRole(Role.EMPLOYEE));
    }

    public MyStatsResponse forUser(String email) {
        User me = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> ApiException.unauthorized("Account no longer exists"));
        return new MyStatsResponse(
                TaskCounts.fromRows(tasks.countGroupedByStatusForAssignee(me.getId())),
                tasks.countByAssigneeIdAndDueDateBeforeAndStatusIn(me.getId(), LocalDate.now(), TaskStatus.OPEN));
    }
}
