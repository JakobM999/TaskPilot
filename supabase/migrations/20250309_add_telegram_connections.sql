-- Create telegram_connections table
create table telegram_connections (
    user_id uuid references auth.users(id) primary key,
    chat_id bigint not null,
    connected_at timestamp with time zone default now(),
    enabled boolean default true
);

-- Add RLS policies
alter table telegram_connections enable row level security;

create policy "Users can view their own telegram connection"
    on telegram_connections for select
    using (auth.uid() = user_id);

create policy "Users can manage their own telegram connection"
    on telegram_connections for all
    using (auth.uid() = user_id);
