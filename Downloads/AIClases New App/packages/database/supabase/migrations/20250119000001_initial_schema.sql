-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create users table (extends auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create courses table
create table public.courses (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  slug text unique not null,
  thumbnail text,
  category text not null,
  level text check (level in ('beginner', 'intermediate', 'advanced')) not null,
  duration_hours integer not null,
  price_credits integer not null default 0,
  published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  auto_update_version integer default 1
);

-- Create lessons table
create table public.lessons (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  description text not null,
  content text not null,
  order_index integer not null,
  duration_minutes integer not null,
  dynamic_content_blocks jsonb,
  published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_credits table
create table public.user_credits (
  user_id uuid references public.users(id) on delete cascade primary key,
  total_earned integer default 0,
  total_spent integer default 0,
  current_balance integer default 0,
  level integer generated always as (floor(sqrt(total_earned / 100)) + 1) stored,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create credit_transactions table
create table public.credit_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  amount integer not null, -- Positive = earned, Negative = spent
  transaction_type text not null,
  reference_id uuid, -- ID of related lesson/course/etc
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_progress table
create table public.user_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  completed_lessons integer default 0,
  total_lessons integer default 0,
  last_lesson_id uuid references public.lessons(id),
  completion_percentage integer generated always as (
    case 
      when total_lessons = 0 then 0 
      else round((completed_lessons::float / total_lessons::float) * 100)
    end
  ) stored,
  last_accessed timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, course_id)
);

-- Create user_subscriptions table
create table public.user_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  subscription_type text check (subscription_type in ('free', 'course', 'plus')) not null default 'free',
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone
);

-- Create user_badges table
create table public.user_badges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  badge_id text not null,
  earned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  credits_awarded integer default 0,
  unique(user_id, badge_id)
);

-- Create user_streaks table
create table public.user_streaks (
  user_id uuid references public.users(id) on delete cascade primary key,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_activity_date date,
  streak_freeze_count integer default 0
);

-- Create daily_usage table for rate limiting
create table public.daily_usage (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  action_type text not null,
  count integer default 1,
  date date default current_date,
  unique(user_id, action_type, date)
);

-- Create indexes for better performance
create index idx_courses_published on public.courses(published);
create index idx_courses_category on public.courses(category);
create index idx_courses_level on public.courses(level);
create index idx_lessons_course_id on public.lessons(course_id);
create index idx_lessons_order_index on public.lessons(course_id, order_index);
create index idx_credit_transactions_user_id on public.credit_transactions(user_id);
create index idx_credit_transactions_created_at on public.credit_transactions(created_at desc);
create index idx_user_progress_user_id on public.user_progress(user_id);
create index idx_user_progress_course_id on public.user_progress(course_id);
create index idx_daily_usage_user_date on public.daily_usage(user_id, date);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger handle_users_updated_at before update on public.users
  for each row execute procedure public.handle_updated_at();

create trigger handle_courses_updated_at before update on public.courses
  for each row execute procedure public.handle_updated_at();

create trigger handle_lessons_updated_at before update on public.lessons
  for each row execute procedure public.handle_updated_at();

create trigger handle_user_credits_updated_at before update on public.user_credits
  for each row execute procedure public.handle_updated_at();

create trigger handle_user_progress_updated_at before update on public.user_progress
  for each row execute procedure public.handle_updated_at();