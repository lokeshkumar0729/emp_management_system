package com.lokesh.ems.repository;

import com.lokesh.ems.model.Priority;
import com.lokesh.ems.model.Task;
import com.lokesh.ems.model.TaskStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public final class TaskSpecifications {

    private TaskSpecifications() {
    }

    /** Every argument is optional; null or blank means "do not filter on this". */
    public static Specification<Task> filter(Long assigneeId, TaskStatus status, Priority priority,
                                             String query, boolean overdueOnly) {
        return (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (assigneeId != null) {
                predicates.add(cb.equal(root.get("assignee").get("id"), assigneeId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }
            if (query != null && !query.isBlank()) {
                String like = "%" + query.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(cb.coalesce(root.<String>get("description"), "")), like),
                        cb.like(cb.lower(cb.coalesce(root.<String>get("category"), "")), like)
                ));
            }
            if (overdueOnly) {
                predicates.add(cb.lessThan(root.<LocalDate>get("dueDate"), LocalDate.now()));
                predicates.add(root.get("status").in(TaskStatus.OPEN));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
