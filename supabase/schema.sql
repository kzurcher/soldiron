create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  email text primary key,
  full_name text,
  phone_number text,
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  email text primary key references public.user_profiles(email) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null,
  plan_name text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_email text not null references public.user_profiles(email) on delete cascade,
  listing_type text not null,
  category text not null,
  make text not null,
  model text not null,
  year text not null,
  operating_hours text,
  serial_number text,
  location text not null,
  latitude text,
  longitude text,
  asking_price text not null,
  description text not null,
  photo_paths text[] not null default '{}',
  full_name text not null,
  company_name text,
  phone_number text,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  listing_title text not null,
  seller_name text,
  seller_email text not null references public.user_profiles(email) on delete cascade,
  sender_name text not null,
  sender_phone text not null,
  sender_email text,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.message_replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  seller_email text not null references public.user_profiles(email) on delete cascade,
  reply text not null,
  created_at timestamptz not null default now()
);
