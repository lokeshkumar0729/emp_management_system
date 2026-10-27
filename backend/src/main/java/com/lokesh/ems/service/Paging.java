package com.lokesh.ems.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

final class Paging {

    static final int MAX_PAGE_SIZE = 50;

    private Paging() {
    }

    static PageRequest of(int page, int size, Sort sort) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
        return PageRequest.of(safePage, safeSize, sort);
    }
}
