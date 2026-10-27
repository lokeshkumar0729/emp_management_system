package com.lokesh.ems.repository;

import com.lokesh.ems.model.Role;
import com.lokesh.ems.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findByRoleOrderByNameAsc(Role role);

    long countByRole(Role role);

    /** {@code q} must not be null; pass an empty string to match everything. */
    @Query("""
            select u from User u
            where u.role = :role
              and (lower(u.name) like lower(concat('%', :q, '%'))
                   or lower(u.email) like lower(concat('%', :q, '%'))
                   or lower(coalesce(u.department, '')) like lower(concat('%', :q, '%')))
            """)
    Page<User> search(@Param("role") Role role, @Param("q") String q, Pageable pageable);
}
