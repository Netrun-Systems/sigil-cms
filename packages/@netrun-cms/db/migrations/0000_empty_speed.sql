CREATE TABLE "cms_artist_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"artist_name" varchar(255) NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"photo_url" text,
	"genres" jsonb DEFAULT '[]'::jsonb,
	"social_links" jsonb DEFAULT '{}'::jsonb,
	"booking_email" varchar(255),
	"management_email" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cms_artist_profiles_site_id_unique" UNIQUE("site_id")
);
--> statement-breakpoint
CREATE TABLE "cms_block_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid,
	"name" varchar(100) NOT NULL,
	"block_type" varchar(50) NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"is_global" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_contact_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"email" varchar(320) NOT NULL,
	"subject" varchar(500),
	"message" text NOT NULL,
	"type" varchar(20) DEFAULT 'general' NOT NULL,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cms_contact_submissions_status_check" CHECK ("cms_contact_submissions"."status" IN ('new', 'responded', 'booked', 'declined', 'archived')),
	CONSTRAINT "cms_contact_submissions_type_check" CHECK ("cms_contact_submissions"."type" IN ('general', 'booking', 'press', 'collaboration'))
);
--> statement-breakpoint
CREATE TABLE "cms_content_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"block_type" varchar(50) NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"venue" varchar(255) NOT NULL,
	"city" varchar(255) NOT NULL,
	"event_date" timestamp NOT NULL,
	"event_type" varchar(20) DEFAULT 'show' NOT NULL,
	"ticket_url" text,
	"description" text,
	"image_url" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cms_events_type_check" CHECK ("cms_events"."event_type" IN ('show', 'festival', 'livestream'))
);
--> statement-breakpoint
CREATE TABLE "cms_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"filename" varchar(255) NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"alt_text" varchar(255),
	"caption" text,
	"folder" varchar(255) DEFAULT '/' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cms_media_file_size_check" CHECK ("cms_media"."file_size" > 0)
);
--> statement-breakpoint
CREATE TABLE "cms_page_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"content_snapshot" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"settings_snapshot" jsonb DEFAULT '{}'::jsonb,
	"changed_by" varchar(255),
	"change_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"parent_id" uuid,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"full_path" text,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"publish_at" timestamp,
	"unpublish_at" timestamp,
	"language" varchar(5) DEFAULT 'en' NOT NULL,
	"meta_title" varchar(60),
	"meta_description" text,
	"og_image_url" text,
	"template" varchar(50) DEFAULT 'default' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cms_pages_site_slug_language_unique" UNIQUE("site_id","slug","language"),
	CONSTRAINT "cms_pages_status_check" CHECK ("cms_pages"."status" IN ('draft', 'published', 'scheduled', 'archived')),
	CONSTRAINT "cms_pages_template_check" CHECK ("cms_pages"."template" IN ('default', 'landing', 'blog', 'product', 'contact', 'artist')),
	CONSTRAINT "cms_pages_slug_format_check" CHECK ("cms_pages"."slug" ~* '^[a-z0-9-]+$'),
	CONSTRAINT "cms_pages_meta_title_length_check" CHECK ("cms_pages"."meta_title" IS NULL OR LENGTH("cms_pages"."meta_title") <= 60),
	CONSTRAINT "cms_pages_meta_description_length_check" CHECK ("cms_pages"."meta_description" IS NULL OR LENGTH("cms_pages"."meta_description") <= 160)
);
--> statement-breakpoint
CREATE TABLE "cms_releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"type" varchar(20) DEFAULT 'single' NOT NULL,
	"release_date" date NOT NULL,
	"cover_url" text,
	"stream_links" jsonb DEFAULT '{}'::jsonb,
	"embed_url" text,
	"embed_platform" varchar(20),
	"description" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cms_releases_type_check" CHECK ("cms_releases"."type" IN ('single', 'album', 'ep', 'mixtape')),
	CONSTRAINT "cms_releases_platform_check" CHECK ("cms_releases"."embed_platform" IS NULL OR "cms_releases"."embed_platform" IN (
      'spotify', 'youtube', 'apple_music', 'soundcloud', 'bandcamp'
    ))
);
--> statement-breakpoint
CREATE TABLE "cms_sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"domain" varchar(255),
	"default_language" varchar(5) DEFAULT 'en' NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"template" varchar(50),
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cms_sites_tenant_slug_unique" UNIQUE("tenant_id","slug"),
	CONSTRAINT "cms_sites_status_check" CHECK ("cms_sites"."status" IN ('draft', 'published', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "cms_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" varchar(200),
	"unsubscribe_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp,
	CONSTRAINT "cms_subscribers_site_email_unique" UNIQUE("site_id","email"),
	CONSTRAINT "cms_subscribers_status_check" CHECK ("cms_subscribers"."status" IN ('active', 'unsubscribed'))
);
--> statement-breakpoint
CREATE TABLE "cms_tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"plan" varchar(20) DEFAULT 'free' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cms_tenants_slug_unique" UNIQUE("slug"),
	CONSTRAINT "cms_tenants_plan_check" CHECK ("cms_tenants"."plan" IN ('free', 'starter', 'pro', 'enterprise'))
);
--> statement-breakpoint
CREATE TABLE "cms_themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"base_theme" varchar(50) DEFAULT 'netrun-dark' NOT NULL,
	"tokens" jsonb NOT NULL,
	"custom_css" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cms_themes_base_theme_check" CHECK ("cms_themes"."base_theme" IN ('netrun-dark', 'netrun-light', 'kog', 'intirkon', 'minimal', 'frost', 'custom'))
);
--> statement-breakpoint
CREATE TABLE "cms_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(50) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(20) DEFAULT 'editor' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"site_permissions" jsonb DEFAULT '{}'::jsonb,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cms_users_tenant_email_unique" UNIQUE("tenant_id","email"),
	CONSTRAINT "cms_users_role_check" CHECK ("cms_users"."role" IN ('admin', 'editor', 'author', 'viewer')),
	CONSTRAINT "cms_users_email_format_check" CHECK ("cms_users"."email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);
--> statement-breakpoint
ALTER TABLE "cms_artist_profiles" ADD CONSTRAINT "cms_artist_profiles_site_id_cms_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."cms_sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_block_templates" ADD CONSTRAINT "cms_block_templates_site_id_cms_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."cms_sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_contact_submissions" ADD CONSTRAINT "cms_contact_submissions_site_id_cms_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."cms_sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_content_blocks" ADD CONSTRAINT "cms_content_blocks_page_id_cms_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."cms_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_events" ADD CONSTRAINT "cms_events_site_id_cms_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."cms_sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_media" ADD CONSTRAINT "cms_media_site_id_cms_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."cms_sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_page_revisions" ADD CONSTRAINT "cms_page_revisions_page_id_cms_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."cms_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_pages" ADD CONSTRAINT "cms_pages_site_id_cms_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."cms_sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_pages" ADD CONSTRAINT "cms_pages_parent_id_cms_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cms_pages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_releases" ADD CONSTRAINT "cms_releases_site_id_cms_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."cms_sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_sites" ADD CONSTRAINT "cms_sites_tenant_id_cms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."cms_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_subscribers" ADD CONSTRAINT "cms_subscribers_site_id_cms_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."cms_sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_themes" ADD CONSTRAINT "cms_themes_site_id_cms_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."cms_sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_users" ADD CONSTRAINT "cms_users_tenant_id_cms_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."cms_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cms_artist_profiles_site_id" ON "cms_artist_profiles" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_cms_block_templates_site_id" ON "cms_block_templates" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_cms_block_templates_type" ON "cms_block_templates" USING btree ("block_type");--> statement-breakpoint
CREATE INDEX "idx_cms_block_templates_global" ON "cms_block_templates" USING btree ("is_global");--> statement-breakpoint
CREATE INDEX "idx_cms_contact_submissions_site_id" ON "cms_contact_submissions" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_cms_contact_submissions_status" ON "cms_contact_submissions" USING btree ("site_id","status");--> statement-breakpoint
CREATE INDEX "idx_cms_contact_submissions_type" ON "cms_contact_submissions" USING btree ("site_id","type");--> statement-breakpoint
CREATE INDEX "idx_cms_contact_submissions_created_at" ON "cms_contact_submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_cms_content_blocks_page_id" ON "cms_content_blocks" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "idx_cms_content_blocks_type" ON "cms_content_blocks" USING btree ("block_type");--> statement-breakpoint
CREATE INDEX "idx_cms_content_blocks_sort" ON "cms_content_blocks" USING btree ("page_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_cms_events_site_id" ON "cms_events" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_cms_events_date" ON "cms_events" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "idx_cms_events_published" ON "cms_events" USING btree ("site_id","is_published");--> statement-breakpoint
CREATE INDEX "idx_cms_media_site_id" ON "cms_media" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_cms_media_folder" ON "cms_media" USING btree ("site_id","folder");--> statement-breakpoint
CREATE INDEX "idx_cms_media_mime_type" ON "cms_media" USING btree ("mime_type");--> statement-breakpoint
CREATE INDEX "idx_cms_media_created_at" ON "cms_media" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_cms_page_revisions_page" ON "cms_page_revisions" USING btree ("page_id","version");--> statement-breakpoint
CREATE INDEX "idx_cms_pages_site_id" ON "cms_pages" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_cms_pages_parent_id" ON "cms_pages" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_cms_pages_status" ON "cms_pages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_cms_pages_published_at" ON "cms_pages" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "idx_cms_pages_full_path" ON "cms_pages" USING btree ("full_path");--> statement-breakpoint
CREATE INDEX "idx_cms_pages_publish_at" ON "cms_pages" USING btree ("publish_at");--> statement-breakpoint
CREATE INDEX "idx_cms_pages_unpublish_at" ON "cms_pages" USING btree ("unpublish_at");--> statement-breakpoint
CREATE INDEX "idx_cms_pages_fulltext" ON "cms_pages" USING gin (to_tsvector('english', "title" || ' ' || COALESCE("meta_description", '')));--> statement-breakpoint
CREATE INDEX "idx_cms_releases_site_id" ON "cms_releases" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_cms_releases_date" ON "cms_releases" USING btree ("release_date");--> statement-breakpoint
CREATE INDEX "idx_cms_releases_published" ON "cms_releases" USING btree ("site_id","is_published");--> statement-breakpoint
CREATE INDEX "idx_cms_sites_tenant_id" ON "cms_sites" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_cms_sites_status" ON "cms_sites" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_cms_sites_domain" ON "cms_sites" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_cms_subscribers_site_id" ON "cms_subscribers" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_cms_subscribers_status" ON "cms_subscribers" USING btree ("site_id","status");--> statement-breakpoint
CREATE INDEX "idx_cms_subscribers_token" ON "cms_subscribers" USING btree ("unsubscribe_token");--> statement-breakpoint
CREATE INDEX "idx_cms_tenants_slug" ON "cms_tenants" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_cms_tenants_plan" ON "cms_tenants" USING btree ("plan");--> statement-breakpoint
CREATE INDEX "idx_cms_themes_site_id" ON "cms_themes" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_cms_themes_active" ON "cms_themes" USING btree ("site_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_cms_users_tenant_id" ON "cms_users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_cms_users_email" ON "cms_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_cms_users_role" ON "cms_users" USING btree ("role");