CREATE TABLE `attendance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`work_date` text NOT NULL,
	`clock_in` text,
	`clock_out` text,
	`status` text DEFAULT 'Present' NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_attendance_employee_day` ON `attendance` (`employee_id`,`work_date`);--> statement-breakpoint
CREATE TABLE `departments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`lead` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_departments_name` ON `departments` (`name`);--> statement-breakpoint
CREATE TABLE `employees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_no` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`department_id` integer NOT NULL,
	`position_id` integer NOT NULL,
	`start_date` text NOT NULL,
	`status` text DEFAULT 'Active' NOT NULL,
	`employment_type` text DEFAULT 'Regular' NOT NULL,
	`monthly_salary_cents` integer NOT NULL,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_employees_number` ON `employees` (`employee_no`);--> statement-breakpoint
CREATE INDEX `idx_employees_department` ON `employees` (`department_id`);--> statement-breakpoint
CREATE TABLE `leave_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`type` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`days` integer NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Pending' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_leave_status` ON `leave_requests` (`status`);--> statement-breakpoint
CREATE TABLE `payroll_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`run_id` text NOT NULL,
	`employee_id` integer NOT NULL,
	`basic_cents` integer NOT NULL,
	`allowance_cents` integer DEFAULT 0 NOT NULL,
	`deduction_cents` integer DEFAULT 0 NOT NULL,
	`net_cents` integer NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `payroll_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_payroll_item_run_employee` ON `payroll_items` (`run_id`,`employee_id`);--> statement-breakpoint
CREATE TABLE `payroll_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`period` text NOT NULL,
	`status` text DEFAULT 'Draft' NOT NULL,
	`created_at` text NOT NULL,
	`finalized_at` text,
	`total_cents` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_payroll_period` ON `payroll_runs` (`period`);--> statement-breakpoint
CREATE TABLE `positions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`department_id` integer NOT NULL,
	`grade` text DEFAULT '' NOT NULL,
	`base_salary_cents` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_positions_department` ON `positions` (`department_id`);