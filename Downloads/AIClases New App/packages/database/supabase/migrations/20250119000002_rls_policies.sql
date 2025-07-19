-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.user_credits enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.user_badges enable row level security;
alter table public.user_streaks enable row level security;
alter table public.daily_usage enable row level security;

-- Users policies
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- Courses policies (public read)
create policy "Courses are viewable by everyone" on public.courses
  for select using (published = true);

-- Lessons policies (public read for published courses)
create policy "Lessons are viewable for published courses" on public.lessons
  for select using (
    published = true and 
    course_id in (select id from public.courses where published = true)
  );

-- User credits policies
create policy "Users can view own credits" on public.user_credits
  for select using (auth.uid() = user_id);

create policy "Users can update own credits" on public.user_credits
  for update using (auth.uid() = user_id);

-- Credit transactions policies
create policy "Users can view own transactions" on public.credit_transactions
  for select using (auth.uid() = user_id);

create policy "Users can insert own transactions" on public.credit_transactions
  for insert with check (auth.uid() = user_id);

-- User progress policies
create policy "Users can view own progress" on public.user_progress
  for all using (auth.uid() = user_id);

-- User subscriptions policies
create policy "Users can view own subscriptions" on public.user_subscriptions
  for select using (auth.uid() = user_id);

create policy "Users can update own subscriptions" on public.user_subscriptions
  for update using (auth.uid() = user_id);

-- User badges policies
create policy "Users can view own badges" on public.user_badges
  for select using (auth.uid() = user_id);

create policy "Users can insert own badges" on public.user_badges
  for insert with check (auth.uid() = user_id);

-- User streaks policies
create policy "Users can view own streaks" on public.user_streaks
  for all using (auth.uid() = user_id);

-- Daily usage policies
create policy "Users can view own usage" on public.daily_usage
  for select using (auth.uid() = user_id);

create policy "Users can update own usage" on public.daily_usage
  for all using (auth.uid() = user_id);