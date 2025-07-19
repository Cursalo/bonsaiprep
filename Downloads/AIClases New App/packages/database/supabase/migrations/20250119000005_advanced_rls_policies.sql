-- Row Level Security policies for advanced features

-- Enable RLS on new tables
alter table public.instructors enable row level security;
alter table public.course_reviews enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.lesson_completions enable row level security;
alter table public.notifications enable row level security;
alter table public.user_preferences enable row level security;
alter table public.mentor_conversations enable row level security;
alter table public.mentor_messages enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.course_updates enable row level security;
alter table public.user_certificates enable row level security;
alter table public.referrals enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_replies enable row level security;

-- Instructors policies
create policy "Instructors are viewable by everyone" on public.instructors
  for select using (verified = true);

create policy "Users can view own instructor profile" on public.instructors
  for select using (auth.uid() = user_id);

create policy "Users can update own instructor profile" on public.instructors
  for update using (auth.uid() = user_id);

create policy "Users can create instructor profile" on public.instructors
  for insert with check (auth.uid() = user_id);

-- Course reviews policies
create policy "Reviews are viewable by everyone" on public.course_reviews
  for select using (true);

create policy "Users can create reviews for enrolled courses" on public.course_reviews
  for insert with check (
    auth.uid() = user_id and
    course_id in (
      select course_id from public.course_enrollments 
      where user_id = auth.uid()
    )
  );

create policy "Users can update own reviews" on public.course_reviews
  for update using (auth.uid() = user_id);

create policy "Users can delete own reviews" on public.course_reviews
  for delete using (auth.uid() = user_id);

-- Course enrollments policies
create policy "Users can view own enrollments" on public.course_enrollments
  for select using (auth.uid() = user_id);

create policy "Users can create own enrollments" on public.course_enrollments
  for insert with check (auth.uid() = user_id);

-- Lesson completions policies
create policy "Users can view own completions" on public.lesson_completions
  for select using (auth.uid() = user_id);

create policy "Users can create own completions" on public.lesson_completions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own completions" on public.lesson_completions
  for update using (auth.uid() = user_id);

-- Notifications policies
create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- User preferences policies
create policy "Users can view own preferences" on public.user_preferences
  for select using (auth.uid() = user_id);

create policy "Users can manage own preferences" on public.user_preferences
  for all using (auth.uid() = user_id);

-- Mentor conversations policies
create policy "Users can view own conversations" on public.mentor_conversations
  for select using (auth.uid() = user_id);

create policy "Users can create own conversations" on public.mentor_conversations
  for insert with check (auth.uid() = user_id);

create policy "Users can update own conversations" on public.mentor_conversations
  for update using (auth.uid() = user_id);

-- Mentor messages policies
create policy "Users can view messages from own conversations" on public.mentor_messages
  for select using (
    conversation_id in (
      select id from public.mentor_conversations 
      where user_id = auth.uid()
    )
  );

create policy "Users can create messages in own conversations" on public.mentor_messages
  for insert with check (
    conversation_id in (
      select id from public.mentor_conversations 
      where user_id = auth.uid()
    )
  );

-- Payment transactions policies
create policy "Users can view own transactions" on public.payment_transactions
  for select using (auth.uid() = user_id);

create policy "Users can create own transactions" on public.payment_transactions
  for insert with check (auth.uid() = user_id);

-- Course updates policies (read-only for users)
create policy "Users can view course updates" on public.course_updates
  for select using (true);

-- User certificates policies
create policy "Users can view own certificates" on public.user_certificates
  for select using (auth.uid() = user_id);

create policy "Certificates are publicly verifiable" on public.user_certificates
  for select using (verified = true);

-- Referrals policies
create policy "Users can view own referrals" on public.referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referred_id);

create policy "Users can create referrals" on public.referrals
  for insert with check (auth.uid() = referrer_id);

-- Community posts policies
create policy "Posts are viewable by everyone" on public.community_posts
  for select using (true);

create policy "Authenticated users can create posts" on public.community_posts
  for insert with check (auth.uid() = user_id);

create policy "Users can update own posts" on public.community_posts
  for update using (auth.uid() = user_id);

create policy "Users can delete own posts" on public.community_posts
  for delete using (auth.uid() = user_id);

-- Community replies policies
create policy "Replies are viewable by everyone" on public.community_replies
  for select using (true);

create policy "Authenticated users can create replies" on public.community_replies
  for insert with check (auth.uid() = user_id);

create policy "Users can update own replies" on public.community_replies
  for update using (auth.uid() = user_id);

create policy "Users can delete own replies" on public.community_replies
  for delete using (auth.uid() = user_id);

-- Admin policies for course management (requires admin role)
create policy "Admins can manage courses" on public.courses
  for all using (
    auth.jwt() ->> 'role' = 'admin' or
    auth.uid() in (
      select user_id from public.instructors 
      where id = instructor_id
    )
  );

create policy "Admins can manage lessons" on public.lessons
  for all using (
    auth.jwt() ->> 'role' = 'admin' or
    course_id in (
      select c.id from public.courses c
      join public.instructors i on c.instructor_id = i.id
      where i.user_id = auth.uid()
    )
  );

-- Function to create user profile automatically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  
  insert into public.user_credits (user_id, total_earned, current_balance)
  values (new.id, 100, 100); -- Welcome bonus
  
  insert into public.user_preferences (user_id)
  values (new.id);
  
  insert into public.user_streaks (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create user profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();