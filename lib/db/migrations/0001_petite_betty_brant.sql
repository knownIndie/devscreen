CREATE TABLE "userinterview" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "userinterview_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"username" varchar(20) NOT NULL,
	"course" varchar(20) NOT NULL,
	"semester" integer NOT NULL,
	"bio" text NOT NULL,
	CONSTRAINT "userinterview_username_unique" UNIQUE("username")
);
--> statement-breakpoint
DROP TABLE "users" CASCADE;