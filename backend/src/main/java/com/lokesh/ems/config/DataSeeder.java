package com.lokesh.ems.config;

import com.lokesh.ems.model.*;
import com.lokesh.ems.repository.TaskRepository;
import com.lokesh.ems.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Inserts demo accounts and tasks the first time the app starts against an empty database.
 * Turn it off in real deployments with SEED_DATA=false.
 */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    static final String ADMIN_PASSWORD = "Admin@123";
    static final String EMPLOYEE_PASSWORD = "Employee@123";

    private static final String[][] EMPLOYEES = {
            {"Rohit Sharma", "Frontend"}, {"Ananya Verma", "Backend"}, {"Karthik Reddy", "Design"},
            {"Sneha Patel", "QA"}, {"Arjun Mehta", "Backend"}, {"Priya Nair", "Frontend"},
            {"Rahul Singh", "DevOps"}, {"Neha Kapoor", "Design"}, {"Vikas Gupta", "QA"}, {"Aditi Rao", "HR"}
    };

    private static final String[][] TASKS = {
            {"Create login screen", "Design and build the login form with validation", "Frontend", "HIGH"},
            {"Fix navbar alignment", "Resolve the alignment issue on narrow screens", "Frontend", "MEDIUM"},
            {"Write unit tests", "Cover the service layer with unit tests", "Testing", "LOW"},
            {"Integrate employee API", "Connect the dashboard to the REST endpoints", "Backend", "HIGH"},
            {"Improve error handling", "Return consistent error bodies from the API", "Backend", "MEDIUM"},
            {"Database cleanup", "Archive records that are no longer used", "Database", "LOW"},
            {"Dashboard wireframes", "Sketch the admin overview screen", "Design", "MEDIUM"},
            {"Onboarding plan", "Prepare the onboarding checklist for new joiners", "HR", "LOW"}
    };

    private final UserRepository users;
    private final TaskRepository tasks;
    private final PasswordEncoder encoder;

    public DataSeeder(UserRepository users, TaskRepository tasks, PasswordEncoder encoder) {
        this.users = users;
        this.tasks = tasks;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (users.count() > 0) {
            return;
        }

        User admin = users.save(new User("Lokesh Kumar", "admin@example.com",
                encoder.encode(ADMIN_PASSWORD), Role.ADMIN, "Management"));

        List<User> employees = new ArrayList<>();
        for (int i = 0; i < EMPLOYEES.length; i++) {
            employees.add(users.save(new User(EMPLOYEES[i][0], "emp" + (i + 1) + "@example.com",
                    encoder.encode(EMPLOYEE_PASSWORD), Role.EMPLOYEE, EMPLOYEES[i][1])));
        }

        LocalDate today = LocalDate.now();
        TaskStatus[] statuses = {TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED,
                TaskStatus.IN_PROGRESS, TaskStatus.FAILED, TaskStatus.DECLINED};

        int n = 0;
        for (User employee : employees) {
            for (int j = 0; j < 3; j++) {
                String[] t = TASKS[(n + j) % TASKS.length];
                TaskStatus status = statuses[(n + j) % statuses.length];

                Task task = new Task();
                task.setTitle(t[0]);
                task.setDescription(t[1]);
                task.setCategory(t[2]);
                task.setPriority(Priority.valueOf(t[3]));
                task.setStatus(status);
                task.setPercentComplete(switch (status) {
                    case COMPLETED -> 100;
                    case IN_PROGRESS -> 20 + ((n + j) * 17) % 60;
                    case FAILED -> 40;
                    default -> 0;
                });
                task.setStartDate(today.minusDays(7 - j));
                // some open tasks are intentionally overdue so the "overdue" views have data
                task.setDueDate(status.isOpen() && (n + j) % 4 == 0 ? today.minusDays(2) : today.plusDays(3 + 4L * j + n % 5));
                task.setAssignee(employee);
                task.setCreatedBy(admin);
                tasks.save(task);
            }
            n++;
        }
        log.info("Seeded demo data: 1 admin ({}), {} employees, {} tasks", "admin@example.com", employees.size(), n * 3);
    }
}
