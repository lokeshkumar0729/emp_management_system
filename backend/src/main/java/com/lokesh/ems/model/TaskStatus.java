package com.lokesh.ems.model;

import java.util.EnumSet;
import java.util.Set;

/**
 * Task lifecycle:
 * PENDING -> IN_PROGRESS | DECLINED
 * IN_PROGRESS -> COMPLETED | FAILED
 * COMPLETED, FAILED and DECLINED are final.
 */
public enum TaskStatus {
    PENDING,
    IN_PROGRESS,
    COMPLETED,
    FAILED,
    DECLINED;

    public static final Set<TaskStatus> OPEN = EnumSet.of(PENDING, IN_PROGRESS);

    public boolean canTransitionTo(TaskStatus next) {
        return switch (this) {
            case PENDING -> next == IN_PROGRESS || next == DECLINED;
            case IN_PROGRESS -> next == COMPLETED || next == FAILED;
            case COMPLETED, FAILED, DECLINED -> false;
        };
    }

    public boolean isOpen() {
        return OPEN.contains(this);
    }
}
