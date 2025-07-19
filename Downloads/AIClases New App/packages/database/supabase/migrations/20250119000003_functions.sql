-- Function to award credits
create or replace function public.award_credits(
  p_user_id uuid,
  p_amount integer,
  p_transaction_type text,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
as $$
begin
  -- Insert transaction record
  insert into public.credit_transactions (user_id, amount, transaction_type, metadata)
  values (p_user_id, p_amount, p_transaction_type, p_metadata);
  
  -- Update user credits
  insert into public.user_credits (user_id, total_earned, current_balance)
  values (p_user_id, p_amount, p_amount)
  on conflict (user_id) do update set
    total_earned = public.user_credits.total_earned + p_amount,
    current_balance = public.user_credits.current_balance + p_amount,
    updated_at = timezone('utc'::text, now());
  
  return true;
exception
  when others then
    return false;
end;
$$;

-- Function to deduct credits
create or replace function public.deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_transaction_type text,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
as $$
declare
  current_balance integer;
begin
  -- Check current balance
  select user_credits.current_balance into current_balance
  from public.user_credits
  where user_id = p_user_id;
  
  -- Return false if insufficient credits
  if current_balance is null or current_balance < p_amount then
    return false;
  end if;
  
  -- Insert transaction record (negative amount)
  insert into public.credit_transactions (user_id, amount, transaction_type, metadata)
  values (p_user_id, -p_amount, p_transaction_type, p_metadata);
  
  -- Update user credits
  update public.user_credits
  set 
    total_spent = total_spent + p_amount,
    current_balance = current_balance - p_amount,
    updated_at = timezone('utc'::text, now())
  where user_id = p_user_id;
  
  return true;
exception
  when others then
    return false;
end;
$$;

-- Function to update lesson progress
create or replace function public.update_lesson_progress(
  p_user_id uuid,
  p_course_id uuid,
  p_lesson_id uuid
)
returns boolean
language plpgsql
security definer
as $$
declare
  course_lesson_count integer;
  user_completed_count integer;
begin
  -- Get total lessons in course
  select count(*) into course_lesson_count
  from public.lessons
  where course_id = p_course_id and published = true;
  
  -- Update or insert user progress
  insert into public.user_progress (user_id, course_id, completed_lessons, total_lessons, last_lesson_id)
  values (p_user_id, p_course_id, 1, course_lesson_count, p_lesson_id)
  on conflict (user_id, course_id) do update set
    completed_lessons = 
      case 
        when public.user_progress.last_lesson_id != p_lesson_id then 
          public.user_progress.completed_lessons + 1
        else 
          public.user_progress.completed_lessons
      end,
    total_lessons = course_lesson_count,
    last_lesson_id = p_lesson_id,
    last_accessed = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now());
  
  return true;
exception
  when others then
    return false;
end;
$$;

-- Function to update user streak
create or replace function public.update_user_streak(p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  last_activity date;
  current_streak integer;
  today date := current_date;
begin
  -- Get current streak data
  select last_activity_date, current_streak 
  into last_activity, current_streak
  from public.user_streaks
  where user_id = p_user_id;
  
  -- If no record exists, create one
  if not found then
    insert into public.user_streaks (user_id, current_streak, longest_streak, last_activity_date)
    values (p_user_id, 1, 1, today);
    return true;
  end if;
  
  -- If activity was yesterday, increment streak
  if last_activity = today - interval '1 day' then
    update public.user_streaks
    set 
      current_streak = current_streak + 1,
      longest_streak = greatest(longest_streak, current_streak + 1),
      last_activity_date = today
    where user_id = p_user_id;
  -- If activity was today, don't change streak
  elsif last_activity = today then
    -- Already counted for today
    return true;
  -- If activity was more than 1 day ago, reset streak
  else
    update public.user_streaks
    set 
      current_streak = 1,
      last_activity_date = today
    where user_id = p_user_id;
  end if;
  
  return true;
exception
  when others then
    return false;
end;
$$;

-- Function to check daily limit
create or replace function public.check_daily_limit(
  p_user_id uuid,
  p_action_type text,
  p_limit integer
)
returns boolean
language plpgsql
security definer
as $$
declare
  usage_count integer;
begin
  -- Get today's usage count
  select count into usage_count
  from public.daily_usage
  where user_id = p_user_id 
    and action_type = p_action_type 
    and date = current_date;
  
  -- Return true if under limit
  return coalesce(usage_count, 0) < p_limit;
end;
$$;

-- Function to increment daily usage
create or replace function public.increment_daily_usage(
  p_user_id uuid,
  p_action_type text
)
returns boolean
language plpgsql
security definer
as $$
begin
  insert into public.daily_usage (user_id, action_type, count, date)
  values (p_user_id, p_action_type, 1, current_date)
  on conflict (user_id, action_type, date) do update set
    count = public.daily_usage.count + 1;
  
  return true;
exception
  when others then
    return false;
end;
$$;