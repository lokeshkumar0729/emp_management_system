package com.lokesh.ems.repository;

import com.lokesh.ems.model.Task;
import com.lokesh.ems.model.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {

    /** Loads assignee and creator in the same query so mapping a page does not trigger N+1 selects. */
    @Override
    @EntityGraph(attributePaths = {"assignee", "createdBy"})
    Page<Task> findAll(Specification<Task> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"assignee", "createdBy"})
    Optional<Task> findWithUsersById(Long id);

    @Query("select t.status, count(t) from Task t group by t.status")
    List<Object[]> countGroupedByStatus();

    @Query("select t.status, count(t) from Task t where t.assignee.id = :assigneeId group by t.status")
    List<Object[]> countGroupedByStatusForAssignee(@Param("assigneeId") Long assigneeId);

    @Query("""
            select t.assignee.id, t.status, count(t) from Task t
            where t.assignee.id in :assigneeIds
            group by t.assignee.id, t.status
            """)
    List<Object[]> countGroupedByAssigneeAndStatus(@Param("assigneeIds") Collection<Long> assigneeIds);

    long countByDueDateBeforeAndStatusIn(LocalDate date, Collection<TaskStatus> statuses);

    long countByAssigneeIdAndDueDateBeforeAndStatusIn(Long assigneeId, LocalDate date, Collection<TaskStatus> statuses);

    @Modifying
    @Query("delete from Task t where t.assignee.id = :assigneeId")
    void deleteByAssigneeId(@Param("assigneeId") Long assigneeId);
}
