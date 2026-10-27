package com.lokesh.ems.dto;

public record OverviewResponse(TaskCounts tasks, long overdue, long employees) {
}
