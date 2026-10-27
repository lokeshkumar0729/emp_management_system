package com.lokesh.ems.controller;

import com.lokesh.ems.dto.MyStatsResponse;
import com.lokesh.ems.dto.OverviewResponse;
import com.lokesh.ems.service.StatsService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final StatsService stats;

    public StatsController(StatsService stats) {
        this.stats = stats;
    }

    @GetMapping("/overview")
    @PreAuthorize("hasRole('ADMIN')")
    public OverviewResponse overview() {
        return stats.overview();
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public MyStatsResponse mine(Authentication auth) {
        return stats.forUser(auth.getName());
    }
}
