package com.lokesh.ems.model;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static com.lokesh.ems.model.TaskStatus.*;
import static org.assertj.core.api.Assertions.assertThat;

class TaskStatusTest {

    @Test
    void pendingTaskCanBeAcceptedOrDeclined() {
        assertThat(PENDING.canTransitionTo(IN_PROGRESS)).isTrue();
        assertThat(PENDING.canTransitionTo(DECLINED)).isTrue();
    }

    @Test
    void pendingTaskCannotSkipStraightToAnOutcome() {
        assertThat(PENDING.canTransitionTo(COMPLETED)).isFalse();
        assertThat(PENDING.canTransitionTo(FAILED)).isFalse();
    }

    @Test
    void inProgressTaskCanOnlyFinishOneOfTwoWays() {
        assertThat(IN_PROGRESS.canTransitionTo(COMPLETED)).isTrue();
        assertThat(IN_PROGRESS.canTransitionTo(FAILED)).isTrue();
        assertThat(IN_PROGRESS.canTransitionTo(PENDING)).isFalse();
        assertThat(IN_PROGRESS.canTransitionTo(DECLINED)).isFalse();
    }

    @ParameterizedTest
    @EnumSource(value = TaskStatus.class, names = {"COMPLETED", "FAILED", "DECLINED"})
    void finalStatesCannotMoveAnywhere(TaskStatus finalState) {
        for (TaskStatus next : TaskStatus.values()) {
            assertThat(finalState.canTransitionTo(next)).as(finalState + " -> " + next).isFalse();
        }
    }

    @Test
    void onlyPendingAndInProgressAreOpen() {
        assertThat(PENDING.isOpen()).isTrue();
        assertThat(IN_PROGRESS.isOpen()).isTrue();
        assertThat(COMPLETED.isOpen()).isFalse();
        assertThat(FAILED.isOpen()).isFalse();
        assertThat(DECLINED.isOpen()).isFalse();
    }
}
