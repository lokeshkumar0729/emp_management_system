package com.lokesh.ems.dto;

import com.lokesh.ems.model.TaskStatus;

import java.util.List;
import java.util.Map;

public record TaskCounts(long total, long pending, long inProgress, long completed, long failed, long declined) {

    public static final TaskCounts EMPTY = new TaskCounts(0, 0, 0, 0, 0, 0);

    public static TaskCounts of(Map<TaskStatus, Long> byStatus) {
        long pending = byStatus.getOrDefault(TaskStatus.PENDING, 0L);
        long inProgress = byStatus.getOrDefault(TaskStatus.IN_PROGRESS, 0L);
        long completed = byStatus.getOrDefault(TaskStatus.COMPLETED, 0L);
        long failed = byStatus.getOrDefault(TaskStatus.FAILED, 0L);
        long declined = byStatus.getOrDefault(TaskStatus.DECLINED, 0L);
        return new TaskCounts(pending + inProgress + completed + failed + declined,
                pending, inProgress, completed, failed, declined);
    }

    /** Rows shaped like {@code [TaskStatus, Long]}, as returned by the grouped count queries. */
    public static TaskCounts fromRows(List<Object[]> rows) {
        Map<TaskStatus, Long> map = new java.util.EnumMap<>(TaskStatus.class);
        for (Object[] row : rows) {
            map.put((TaskStatus) row[0], ((Number) row[1]).longValue());
        }
        return of(map);
    }
}
