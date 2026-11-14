-- Restaurant ordering: tables, security rules and the create_order function.
-- All money is stored in CENTS (integers) to avoid rounding errors.

create extension if not exists pgcrypto;

-- ---------- MENU (public can read, nobody can write from the website) ----------
create table public.categories (
  id         serial primary key,
  name       text not null,
  sort       int  not null default 0
);

create table public.menu_items (
  id           serial primary key,
  category_id  int  not null references public.categories(id),
  name         text not null,
  description  text not null default '',
  price_cents  int  not null check (price_cents >= 0),
  image_url    text,
  available    boolean not null default true,
  sort         int  not null default 0
);

create table public.option_groups (
  id            serial primary key,
  menu_item_id  int  not null references public.menu_items(id) on delete cascade,
  name          text not null,
  min_select    int  not null default 0 check (min_select >= 0),
  max_select    int  not null default 1 check (max_select >= 1),
  sort          int  not null default 0
);

create table public.options (
  id           serial primary key,
  group_id     int  not null references public.option_groups(id) on delete cascade,
  name         text not null,
  price_cents  int  not null default 0 check (price_cents >= 0),
  sort         int  not null default 0
);

create index on public.menu_items (category_id);
create index on public.option_groups (menu_item_id);
create index on public.options (group_id);

-- ---------- ORDERS (only the server, using the secret key, can touch these) ----------
create table public.orders (
  id                         uuid primary key default gen_random_uuid(),
  order_number               bigint generated always as identity unique,
  idempotency_key            uuid not null unique,
  device_id                  uuid not null,
  customer_name              text not null,
  phone                      text not null,
  table_number               text not null,
  subtotal_cents             int  not null,
  service_charge_cents       int  not null,
  gst_cents                  int  not null,
  total_cents                int  not null check (total_cents > 0),
  status                     text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  hitpay_payment_request_id  text unique,
  hitpay_url                 text,
  hitpay_payment_id          text,
  paid_at                    timestamptz,
  done_at                    timestamptz,
  created_at                 timestamptz not null default now()
);

create index on public.orders (device_id, created_at desc);
create index on public.orders (status, paid_at desc);

create table public.order_items (
  id                bigint generated always as identity primary key,
  order_id          uuid not null references public.orders(id) on delete cascade,
  menu_item_id      int  not null references public.menu_items(id),
  name              text not null,
  quantity          int  not null check (quantity between 1 and 50),
  unit_price_cents  int  not null,
  line_total_cents  int  not null,
  options           jsonb not null default '[]'::jsonb,
  note              text not null default ''
);

create index on public.order_items (order_id);

-- ---------- ROW LEVEL SECURITY ----------
alter table public.categories    enable row level security;
alter table public.menu_items    enable row level security;
alter table public.option_groups enable row level security;
alter table public.options       enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;

create policy "menu is public" on public.categories    for select to anon, authenticated using (true);
create policy "menu is public" on public.menu_items    for select to anon, authenticated using (true);
create policy "menu is public" on public.option_groups for select to anon, authenticated using (true);
create policy "menu is public" on public.options       for select to anon, authenticated using (true);

-- No policies on orders/order_items = the public key can't read or write them.
-- Belt and braces: remove the default grants as well.
revoke all on public.orders, public.order_items from anon, authenticated;

-- ---------- create_order: saves an order + its items in ONE step ----------
-- If the same idempotency_key is sent twice (double tap on "Pay"),
-- the second call does NOT create a new order; it returns the first one.
create or replace function public.create_order(p_order jsonb, p_items jsonb)
returns table (order_id uuid, created boolean)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.orders (
    idempotency_key, device_id, customer_name, phone, table_number,
    subtotal_cents, service_charge_cents, gst_cents, total_cents
  ) values (
    (p_order->>'idempotency_key')::uuid,
    (p_order->>'device_id')::uuid,
    p_order->>'customer_name',
    p_order->>'phone',
    p_order->>'table_number',
    (p_order->>'subtotal_cents')::int,
    (p_order->>'service_charge_cents')::int,
    (p_order->>'gst_cents')::int,
    (p_order->>'total_cents')::int
  )
  on conflict (idempotency_key) do nothing
  returning id into v_id;

  if v_id is null then
    select o.id into v_id from public.orders o
      where o.idempotency_key = (p_order->>'idempotency_key')::uuid;
    return query select v_id, false;
    return;
  end if;

  insert into public.order_items (
    order_id, menu_item_id, name, quantity, unit_price_cents, line_total_cents, options, note
  )
  select v_id,
         (i->>'menu_item_id')::int,
         i->>'name',
         (i->>'quantity')::int,
         (i->>'unit_price_cents')::int,
         (i->>'line_total_cents')::int,
         coalesce(i->'options', '[]'::jsonb),
         coalesce(i->>'note', '')
  from jsonb_array_elements(p_items) as i;

  return query select v_id, true;
end;
$$;

revoke execute on function public.create_order(jsonb, jsonb) from public, anon, authenticated;
grant  execute on function public.create_order(jsonb, jsonb) to service_role;
