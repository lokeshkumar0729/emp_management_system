package com.lokesh.ems.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lokesh.ems.model.Role;
import com.lokesh.ems.model.User;
import com.lokesh.ems.repository.TaskRepository;
import com.lokesh.ems.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiIntegrationTest {

    private static final String PASSWORD = "Password@123";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired UserRepository users;
    @Autowired TaskRepository tasks;
    @Autowired PasswordEncoder encoder;

    private User employee;
    private User otherEmployee;

    @BeforeEach
    void setUp() {
        tasks.deleteAll();
        users.deleteAll();
        users.save(new User("Admin", "admin@test.com", encoder.encode(PASSWORD), Role.ADMIN, null));
        employee = users.save(new User("Emp One", "emp1@test.com", encoder.encode(PASSWORD), Role.EMPLOYEE, "QA"));
        otherEmployee = users.save(new User("Emp Two", "emp2@test.com", encoder.encode(PASSWORD), Role.EMPLOYEE, "QA"));
    }

    // ---- authentication ------------------------------------------------------------------------------------

    @Test
    void loginSucceedsWithCorrectCredentials() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "admin@test.com", "password", PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.role", is("ADMIN")))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
    }

    @Test
    void loginFailsWithWrongPasswordAndUnknownEmailWithTheSameMessage() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "admin@test.com", "password", "wrong"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", is("Invalid email or password")));

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "nobody@test.com", "password", PASSWORD))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    void protectedEndpointsRejectMissingOrBadTokens() throws Exception {
        mvc.perform(get("/api/tasks")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/tasks").header("Authorization", "Bearer not.a.token"))
                .andExpect(status().isUnauthorized());
    }

    // ---- authorization -------------------------------------------------------------------------------------

    @Test
    void employeeCannotCreateTasksOrManageEmployees() throws Exception {
        String token = loginAs("emp1@test.com");

        mvc.perform(post("/api/tasks").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(json(taskBody(otherEmployee.getId()))))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/employees").header("Authorization", bearer(token)))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCannotChangeATasksStatus() throws Exception {
        String admin = loginAs("admin@test.com");
        long taskId = createTask(admin, employee.getId());

        mvc.perform(patch("/api/tasks/" + taskId + "/status").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("status", "IN_PROGRESS"))))
                .andExpect(status().isForbidden());
    }

    // ---- task lifecycle ------------------------------------------------------------------------------------

    @Test
    void taskMovesThroughTheFullLifecycle() throws Exception {
        String admin = loginAs("admin@test.com");
        String emp = loginAs("emp1@test.com");
        long taskId = createTask(admin, employee.getId());

        mvc.perform(get("/api/tasks/mine").header("Authorization", bearer(emp)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].status", is("PENDING")));

        setStatus(emp, taskId, "IN_PROGRESS").andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("IN_PROGRESS")));

        mvc.perform(patch("/api/tasks/" + taskId + "/progress").header("Authorization", bearer(emp))
                        .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("percentComplete", 60))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.percentComplete", is(60)));

        setStatus(emp, taskId, "COMPLETED").andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("COMPLETED")))
                .andExpect(jsonPath("$.percentComplete", is(100)));

        mvc.perform(get("/api/stats/me").header("Authorization", bearer(emp)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tasks.completed", is(1)))
                .andExpect(jsonPath("$.tasks.total", is(1)));
    }

    @Test
    void invalidTransitionsAreRejectedWithConflict() throws Exception {
        String admin = loginAs("admin@test.com");
        String emp = loginAs("emp1@test.com");
        long taskId = createTask(admin, employee.getId());

        setStatus(emp, taskId, "COMPLETED").andExpect(status().isConflict());

        setStatus(emp, taskId, "DECLINED").andExpect(status().isOk());
        setStatus(emp, taskId, "IN_PROGRESS").andExpect(status().isConflict());
    }

    @Test
    void progressCanOnlyBeUpdatedWhileInProgress() throws Exception {
        String admin = loginAs("admin@test.com");
        String emp = loginAs("emp1@test.com");
        long taskId = createTask(admin, employee.getId());

        mvc.perform(patch("/api/tasks/" + taskId + "/progress").header("Authorization", bearer(emp))
                        .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("percentComplete", 30))))
                .andExpect(status().isConflict());
    }

    @Test
    void employeeCannotTouchSomeoneElsesTask() throws Exception {
        String admin = loginAs("admin@test.com");
        String intruder = loginAs("emp2@test.com");
        long taskId = createTask(admin, employee.getId());

        setStatus(intruder, taskId, "IN_PROGRESS").andExpect(status().isForbidden());
    }

    // ---- validation and filtering --------------------------------------------------------------------------

    @Test
    void invalidTaskPayloadReturnsFieldErrors() throws Exception {
        String admin = loginAs("admin@test.com");

        mvc.perform(post("/api/tasks").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.title").exists())
                .andExpect(jsonPath("$.fieldErrors.assigneeId").exists())
                .andExpect(jsonPath("$.fieldErrors.dueDate").exists());
    }

    @Test
    void dueDateMustNotBeBeforeStartDateOrInThePast() throws Exception {
        String admin = loginAs("admin@test.com");
        LocalDate today = LocalDate.now();

        Map<String, Object> past = taskBody(employee.getId());
        past.put("dueDate", today.minusDays(1).toString());
        mvc.perform(post("/api/tasks").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(past)))
                .andExpect(status().isBadRequest());

        Map<String, Object> reversed = taskBody(employee.getId());
        reversed.put("startDate", today.plusDays(5).toString());
        reversed.put("dueDate", today.plusDays(2).toString());
        mvc.perform(post("/api/tasks").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(reversed)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void tasksCanBeFilteredByStatusAndSearchedAndPaginated() throws Exception {
        String admin = loginAs("admin@test.com");
        String emp = loginAs("emp1@test.com");
        for (int i = 1; i <= 5; i++) {
            Map<String, Object> body = taskBody(employee.getId());
            body.put("title", i == 3 ? "Quarterly audit" : "Routine task " + i);
            mvc.perform(post("/api/tasks").header("Authorization", bearer(admin))
                            .contentType(MediaType.APPLICATION_JSON).content(json(body)))
                    .andExpect(status().isCreated());
        }
        long first = firstTaskId(admin);
        setStatus(emp, first, "IN_PROGRESS").andExpect(status().isOk());

        mvc.perform(get("/api/tasks").header("Authorization", bearer(admin)).param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.totalElements", is(5)))
                .andExpect(jsonPath("$.totalPages", is(3)));

        mvc.perform(get("/api/tasks").header("Authorization", bearer(admin)).param("status", "IN_PROGRESS"))
                .andExpect(jsonPath("$.totalElements", is(1)));

        mvc.perform(get("/api/tasks").header("Authorization", bearer(admin)).param("q", "audit"))
                .andExpect(jsonPath("$.totalElements", is(1)))
                .andExpect(jsonPath("$.content[0].title", is("Quarterly audit")));
    }

    // ---- employee management -------------------------------------------------------------------------------

    @Test
    void adminCanCreateUpdateAndDeleteEmployeesAndDuplicateEmailsAreRejected() throws Exception {
        String admin = loginAs("admin@test.com");

        MvcResult created = mvc.perform(post("/api/employees").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("name", "New Hire", "email", "New.Hire@test.com",
                                "password", "Welcome@123", "department", "HR"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email", is("new.hire@test.com")))
                .andReturn();
        long id = mapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

        mvc.perform(post("/api/employees").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("name", "Copy", "email", "new.hire@test.com", "password", "Welcome@123"))))
                .andExpect(status().isConflict());

        mvc.perform(put("/api/employees/" + id).header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("name", "New Hire Renamed", "email", "new.hire@test.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("New Hire Renamed")));

        // the new employee can sign in with the password set at creation
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "new.hire@test.com", "password", "Welcome@123"))))
                .andExpect(status().isOk());

        mvc.perform(delete("/api/employees/" + id).header("Authorization", bearer(admin)))
                .andExpect(status().isNoContent());
        mvc.perform(delete("/api/employees/" + id).header("Authorization", bearer(admin)))
                .andExpect(status().isNotFound());
    }

    @Test
    void shortPasswordIsRejectedWhenCreatingAnEmployee() throws Exception {
        String admin = loginAs("admin@test.com");

        mvc.perform(post("/api/employees").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("name", "X", "email", "x@test.com", "password", "short"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.password").exists());
    }

    // ---- helpers -------------------------------------------------------------------------------------------

    private String loginAs(String email) throws Exception {
        MvcResult result = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        return mapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    private long createTask(String adminToken, Long assigneeId) throws Exception {
        MvcResult result = mvc.perform(post("/api/tasks").header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON).content(json(taskBody(assigneeId))))
                .andExpect(status().isCreated())
                .andReturn();
        return mapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private long firstTaskId(String adminToken) throws Exception {
        MvcResult result = mvc.perform(get("/api/tasks").header("Authorization", bearer(adminToken)).param("size", "50"))
                .andReturn();
        JsonNode content = mapper.readTree(result.getResponse().getContentAsString()).get("content");
        return content.get(0).get("id").asLong();
    }

    private org.springframework.test.web.servlet.ResultActions setStatus(String token, long taskId, String status)
            throws Exception {
        return mvc.perform(patch("/api/tasks/" + taskId + "/status").header("Authorization", bearer(token))
                .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("status", status))));
    }

    private Map<String, Object> taskBody(Long assigneeId) {
        Map<String, Object> body = new java.util.HashMap<>();
        body.put("title", "Write release notes");
        body.put("description", "Summarise the changes for v1.0");
        body.put("category", "Docs");
        body.put("assigneeId", assigneeId);
        body.put("priority", "HIGH");
        body.put("dueDate", LocalDate.now().plusDays(7).toString());
        return body;
    }

    private String json(Object value) throws Exception {
        return mapper.writeValueAsString(value);
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }
}
