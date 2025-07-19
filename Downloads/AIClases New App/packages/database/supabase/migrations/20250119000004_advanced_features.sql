-- Advanced features for production-ready AIClases platform

-- Create instructors table
create table public.instructors (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null unique,
  bio text,
  expertise text[],
  social_links jsonb,
  verified boolean default false,
  rating numeric(3,2) default 0.0,
  total_students integer default 0,
  total_courses integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add instructor_id to courses table
alter table public.courses add column instructor_id uuid references public.instructors(id);

-- Create course_reviews table
create table public.course_reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  helpful_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, course_id)
);

-- Create course_enrollments table
create table public.course_enrollments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  enrolled_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  credits_spent integer not null,
  payment_method text,
  refunded boolean default false,
  certificate_issued boolean default false,
  unique(user_id, course_id)
);

-- Create lesson_completions table
create table public.lesson_completions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  time_spent_minutes integer,
  unique(user_id, lesson_id)
);

-- Create notifications table
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text check (type in ('course', 'achievement', 'credit', 'system', 'mentor')) not null,
  read boolean default false,
  action_url text,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_preferences table
create table public.user_preferences (
  user_id uuid references public.users(id) on delete cascade primary key,
  language text default 'es',
  timezone text default 'UTC',
  email_notifications boolean default true,
  push_notifications boolean default true,
  daily_reminder boolean default true,
  weekly_summary boolean default true,
  theme text check (theme in ('light', 'dark', 'auto')) default 'auto',
  mentor_personality text check (mentor_personality in ('friendly', 'professional', 'casual')) default 'friendly',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create mentor_conversations table
create table public.mentor_conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text,
  last_message_at timestamp with time zone default timezone('utc'::text, now()) not null,
  message_count integer default 0,
  credits_used integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create mentor_messages table
create table public.mentor_messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.mentor_conversations(id) on delete cascade not null,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  credits_cost integer default 0,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create payment_transactions table
create table public.payment_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  amount_usd numeric(10,2) not null,
  credits_purchased integer not null,
  payment_method text not null,
  payment_provider text not null, -- stripe, mercadopago, etc
  provider_transaction_id text unique,
  status text check (status in ('pending', 'completed', 'failed', 'refunded')) default 'pending',
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create course_updates table for tracking auto-updates
create table public.course_updates (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  version_number integer not null,
  update_type text check (update_type in ('content', 'structure', 'metadata')) not null,
  changes_summary text not null,
  mcp_context jsonb, -- Context7 MCP integration data
  applied_at timestamp with time zone default timezone('utc'::text, now()) not null,
  applied_by uuid references public.users(id) -- null for automatic updates
);

-- Create user_certificates table
create table public.user_certificates (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  certificate_hash text unique not null, -- blockchain hash
  issued_at timestamp with time zone default timezone('utc'::text, now()) not null,
  verified boolean default true,
  ipfs_hash text, -- IPFS storage for certificate
  verification_url text,
  unique(user_id, course_id)
);

-- Create referrals table
create table public.referrals (
  id uuid default uuid_generate_v4() primary key,
  referrer_id uuid references public.users(id) on delete cascade not null,
  referred_id uuid references public.users(id) on delete cascade not null,
  credits_awarded integer default 200,
  status text check (status in ('pending', 'completed')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  unique(referrer_id, referred_id)
);

-- Create community_posts table
create table public.community_posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  content text not null,
  post_type text check (post_type in ('question', 'discussion', 'showcase', 'help')) not null,
  tags text[],
  upvotes integer default 0,
  reply_count integer default 0,
  solved boolean default false,
  featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create community_replies table
create table public.community_replies (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.community_posts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  upvotes integer default 0,
  is_solution boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Additional indexes for performance
create index idx_instructors_verified on public.instructors(verified);
create index idx_course_reviews_course_id on public.course_reviews(course_id);
create index idx_course_reviews_rating on public.course_reviews(rating desc);
create index idx_course_enrollments_user_id on public.course_enrollments(user_id);
create index idx_course_enrollments_course_id on public.course_enrollments(course_id);
create index idx_lesson_completions_user_id on public.lesson_completions(user_id);
create index idx_lesson_completions_lesson_id on public.lesson_completions(lesson_id);
create index idx_notifications_user_id_read on public.notifications(user_id, read);
create index idx_notifications_created_at on public.notifications(created_at desc);
create index idx_mentor_conversations_user_id on public.mentor_conversations(user_id);
create index idx_mentor_messages_conversation_id on public.mentor_messages(conversation_id);
create index idx_payment_transactions_user_id on public.payment_transactions(user_id);
create index idx_payment_transactions_status on public.payment_transactions(status);
create index idx_course_updates_course_id on public.course_updates(course_id);
create index idx_course_updates_version on public.course_updates(course_id, version_number);
create index idx_user_certificates_user_id on public.user_certificates(user_id);
create index idx_user_certificates_hash on public.user_certificates(certificate_hash);
create index idx_referrals_referrer_id on public.referrals(referrer_id);
create index idx_referrals_status on public.referrals(status);
create index idx_community_posts_type on public.community_posts(post_type);
create index idx_community_posts_created_at on public.community_posts(created_at desc);
create index idx_community_posts_featured on public.community_posts(featured);
create index idx_community_replies_post_id on public.community_replies(post_id);

-- Add updated_at triggers for new tables
create trigger handle_instructors_updated_at before update on public.instructors
  for each row execute procedure public.handle_updated_at();

create trigger handle_course_reviews_updated_at before update on public.course_reviews
  for each row execute procedure public.handle_updated_at();

create trigger handle_user_preferences_updated_at before update on public.user_preferences
  for each row execute procedure public.handle_updated_at();

create trigger handle_payment_transactions_updated_at before update on public.payment_transactions
  for each row execute procedure public.handle_updated_at();

create trigger handle_community_posts_updated_at before update on public.community_posts
  for each row execute procedure public.handle_updated_at();

create trigger handle_community_replies_updated_at before update on public.community_replies
  for each row execute procedure public.handle_updated_at();