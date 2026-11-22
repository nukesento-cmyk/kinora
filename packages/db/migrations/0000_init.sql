CREATE TYPE "public"."audit_actor_type" AS ENUM('member', 'staff', 'system');--> statement-breakpoint
CREATE TYPE "public"."connection_intention" AS ENUM('dating', 'friendship', 'community', 'events', 'professional');--> statement-breakpoint
CREATE TYPE "public"."member_identity" AS ENUM('person_of_short_stature', 'interested_member', 'family_member', 'ally', 'prefer_not_to_say');--> statement-breakpoint
CREATE TYPE "public"."message_permission" AS ENUM('matches_only', 'connections', 'verified_members');--> statement-breakpoint
CREATE TYPE "public"."moderation_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."photo_visibility" AS ENUM('members', 'matches', 'private');--> statement-breakpoint
CREATE TYPE "public"."profile_visibility" AS ENUM('members', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."verification_kind" AS ENUM('identity', 'age', 'liveness');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'approved', 'declined', 'expired', 'error');--> statement-breakpoint
CREATE TABLE "discovery_preferences" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"min_age" smallint DEFAULT 18 NOT NULL,
	"max_age" smallint DEFAULT 99 NOT NULL,
	"country_codes" text[] DEFAULT '{}'::text[] NOT NULL,
	"languages" text[] DEFAULT '{}'::text[] NOT NULL,
	"intentions" "connection_intention"[] DEFAULT '{}'::connection_intention[] NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "discovery_age_range" CHECK ("discovery_preferences"."min_age" >= 18 AND "discovery_preferences"."max_age" <= 120 AND "discovery_preferences"."min_age" <= "discovery_preferences"."max_age")
);
--> statement-breakpoint
CREATE TABLE "member_self_identification" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"identity" "member_identity" NOT NULL,
	"show_on_profile" boolean DEFAULT false NOT NULL,
	"consent_given_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "privacy_settings" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"profile_visibility" "profile_visibility" DEFAULT 'members' NOT NULL,
	"show_age" boolean DEFAULT true NOT NULL,
	"show_city" boolean DEFAULT false NOT NULL,
	"nearby_discovery_enabled" boolean DEFAULT false NOT NULL,
	"allow_messages_from" "message_permission" DEFAULT 'matches_only' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"position" smallint NOT NULL,
	"visibility" "photo_visibility" DEFAULT 'members' NOT NULL,
	"moderation_status" "moderation_status" DEFAULT 'pending' NOT NULL,
	"content_type" varchar(32) NOT NULL,
	"byte_size" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_photos_storage_key_unique" UNIQUE("storage_key"),
	CONSTRAINT "profile_photos_profile_position_uq" UNIQUE("profile_id","position"),
	CONSTRAINT "profile_photos_position_range" CHECK ("profile_photos"."position" BETWEEN 0 AND 8),
	CONSTRAINT "profile_photos_content_type" CHECK ("profile_photos"."content_type" IN ('image/jpeg', 'image/png', 'image/webp')),
	CONSTRAINT "profile_photos_byte_size" CHECK ("profile_photos"."byte_size" > 0 AND "profile_photos"."byte_size" <= 10485760),
	CONSTRAINT "profile_photos_dimensions" CHECK ("profile_photos"."width" > 0 AND "profile_photos"."height" > 0)
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"display_name" varchar(50) NOT NULL,
	"date_of_birth" date NOT NULL,
	"bio" varchar(1000),
	"country_code" varchar(2) NOT NULL,
	"city" varchar(100),
	"languages" text[] DEFAULT '{}'::text[] NOT NULL,
	"interests" text[] DEFAULT '{}'::text[] NOT NULL,
	"hobbies" text[] DEFAULT '{}'::text[] NOT NULL,
	"connection_intentions" "connection_intention"[] DEFAULT '{}'::connection_intention[] NOT NULL,
	"onboarding_completed_at" timestamp with time zone,
	"deletion_requested_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "profiles_country_code_iso" CHECK (country_code ~ '^[A-Z]{2}$'),
	CONSTRAINT "profiles_display_name_not_blank" CHECK (length(trim("profiles"."display_name")) > 0),
	CONSTRAINT "profiles_dob_plausible" CHECK ("profiles"."date_of_birth" >= DATE '1900-01-01'),
	CONSTRAINT "profiles_languages_max" CHECK (cardinality("profiles"."languages") <= 10),
	CONSTRAINT "profiles_interests_max" CHECK (cardinality("profiles"."interests") <= 30),
	CONSTRAINT "profiles_hobbies_max" CHECK (cardinality("profiles"."hobbies") <= 30)
);
--> statement-breakpoint
CREATE TABLE "verification_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"provider" varchar(32) NOT NULL,
	"provider_reference" varchar(128),
	"kind" "verification_kind" NOT NULL,
	"status" "verification_status" DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	CONSTRAINT "verification_provider_reference_uq" UNIQUE("provider","provider_reference"),
	CONSTRAINT "verification_completed_has_time" CHECK (("verification_requests"."status" = 'pending') = ("verification_requests"."completed_at" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "staff_role_assignments" (
	"staff_user_id" text NOT NULL,
	"role_id" uuid NOT NULL,
	"granted_by" text NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_role_assignments_staff_user_id_role_id_pk" PRIMARY KEY("staff_user_id","role_id"),
	CONSTRAINT "staff_no_self_grant" CHECK ("staff_role_assignments"."staff_user_id" <> "staff_role_assignments"."granted_by")
);
--> statement-breakpoint
CREATE TABLE "staff_role_permissions" (
	"role_id" uuid NOT NULL,
	"permission" varchar(64) NOT NULL,
	CONSTRAINT "staff_role_permissions_role_id_permission_pk" PRIMARY KEY("role_id","permission"),
	CONSTRAINT "staff_permission_format" CHECK ("staff_role_permissions"."permission" ~ '^[a-z_]+\.[a-z_]+$')
);
--> statement-breakpoint
CREATE TABLE "staff_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(64) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_roles_key_unique" UNIQUE("key"),
	CONSTRAINT "staff_roles_key_format" CHECK ("staff_roles"."key" ~ '^[a-z][a-z0-9_]*$')
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_type" "audit_actor_type" NOT NULL,
	"actor_id" text,
	"action" varchar(64) NOT NULL,
	"target_type" varchar(64),
	"target_id" text,
	"request_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_action_format" CHECK ("audit_logs"."action" ~ '^[a-z_]+\.[a-z_]+$'),
	CONSTRAINT "audit_actor_present" CHECK (("audit_logs"."actor_type" = 'system') OR ("audit_logs"."actor_id" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "discovery_preferences" ADD CONSTRAINT "discovery_preferences_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_self_identification" ADD CONSTRAINT "member_self_identification_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privacy_settings" ADD CONSTRAINT "privacy_settings_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_photos" ADD CONSTRAINT "profile_photos_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_role_assignments" ADD CONSTRAINT "staff_role_assignments_role_id_staff_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."staff_roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_role_permissions" ADD CONSTRAINT "staff_role_permissions_role_id_staff_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."staff_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profiles_country_idx" ON "profiles" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "profiles_deletion_requested_idx" ON "profiles" USING btree ("deletion_requested_at") WHERE "profiles"."deletion_requested_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "verification_profile_idx" ON "verification_requests" USING btree ("profile_id","kind");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_type","actor_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_target_idx" ON "audit_logs" USING btree ("target_type","target_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");