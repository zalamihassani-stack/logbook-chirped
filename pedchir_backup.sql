--
-- PostgreSQL database dump
--

\restrict vOdB1tVA9JGNtYWfqzVneifYBzKaAgUiUfOSbEGSBoneegLpbKff3Gd71bp2tOt

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: activity_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.activity_type AS ENUM (
    'expose',
    'supervise',
    'autonome'
);


--
-- Name: device_platform; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.device_platform AS ENUM (
    'ios',
    'android',
    'web'
);


--
-- Name: notif_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notif_type AS ENUM (
    'new_submission',
    'validated',
    'refused'
);


--
-- Name: realisation_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.realisation_status AS ENUM (
    'pending',
    'validated',
    'refused'
);


--
-- Name: travail_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.travail_status AS ENUM (
    'soumis',
    'accepte',
    'publie',
    'en_cours',
    'presente'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'resident',
    'enseignant',
    'admin'
);


--
-- Name: validation_action; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.validation_action AS ENUM (
    'submitted',
    'validated',
    'refused',
    'resubmitted'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in',
    'like',
    'ilike',
    'is',
    'match',
    'imatch',
    'isdistinct'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text,
	negate boolean
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: graphql(text, text, jsonb, jsonb); Type: FUNCTION; Schema: graphql_public; Owner: -
--

CREATE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


--
-- Name: can_submit_autonome(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_submit_autonome(p_resident_id uuid, p_procedure_id uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  select
    case
      when p.objectif_final <> 3 then false
      when coalesce(v.count_supervise, 0) >= p.seuil_deblocage_autonomie then true
      else false
    end
  from public.procedures p
  left join public.v_resident_procedure_counts v
    on v.procedure_id = p.id
   and v.resident_id = p_resident_id
  where p.id = p_procedure_id
    and p.is_active = true;
$$;


--
-- Name: current_user_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_user_role() RETURNS public.user_role
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;


--
-- Name: enforce_procedure_category_service(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_procedure_category_service() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  category_service text;
begin
  select service
  into category_service
  from public.categories
  where id = new.category_id;

  if category_service is null then
    raise exception 'Categorie introuvable pour ce geste.';
  end if;

  if category_service <> new.service then
    raise exception 'La categorie selectionnee ne correspond pas au service du geste.';
  end if;

  return new;
end;
$$;


--
-- Name: get_my_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_role() RETURNS public.user_role
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;


--
-- Name: get_resident_progress(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_resident_progress(p_resident_id uuid) RETURNS TABLE(procedure_id uuid, count_expose integer, count_supervise integer, count_autonome integer, niveau_atteint integer, autonomie_debloquee boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select
    v.procedure_id,
    v.count_expose,
    v.count_supervise,
    v.count_autonome,
    v.niveau_atteint,
    v.autonomie_debloquee
  from public.v_resident_niveau v
  where v.resident_id = p_resident_id;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'resident',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


--
-- Name: is_travail_author(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_travail_author(p_travail_id uuid, p_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1
    from travail_auteurs
    where travail_id = p_travail_id
      and profile_id = p_user_id
  );
$$;


--
-- Name: is_travail_resident(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_travail_resident(p_travail_id uuid, p_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1
    from travaux_scientifiques
    where id = p_travail_id
      and resident_id = p_user_id
  );
$$;


--
-- Name: set_app_settings_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_app_settings_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
    -- Regclass of the table e.g. public.notes
    entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

    -- I, U, D, T: insert, update ...
    action realtime.action = (
        case wal ->> 'action'
            when 'I' then 'INSERT'
            when 'U' then 'UPDATE'
            when 'D' then 'DELETE'
            else 'ERROR'
        end
    );

    -- Is row level security enabled for the table
    is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

    subscriptions realtime.subscription[] = array_agg(subs)
        from
            realtime.subscription subs
        where
            subs.entity = entity_
            -- Filter by action early - only get subscriptions interested in this action
            -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
            and (subs.action_filter = '*' or subs.action_filter = action::text);

    -- Subscription vars
    working_role regrole;
    working_selected_columns text[];
    claimed_role regrole;
    claims jsonb;

    subscription_id uuid;
    subscription_has_access bool;
    visible_to_subscription_ids uuid[] = '{}';

    -- structured info for wal's columns
    columns realtime.wal_column[];
    -- previous identity values for update/delete
    old_columns realtime.wal_column[];

    error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

    -- Primary jsonb output for record
    output jsonb;

    -- Loop record for iterating unique roles (outer loop)
    role_record record;
    -- Loop record for iterating unique selected_columns within a role (inner loop)
    cols_record record;
    -- Subscription ids visible at the role level (before fanning out by selected_columns)
    visible_role_sub_ids uuid[] = '{}';

begin
    perform set_config('role', null, true);

    columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'columns') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    old_columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'identity') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    for role_record in
        select claims_role
        from (select distinct claims_role from unnest(subscriptions)) t
        order by claims_role::text
    loop
        working_role := role_record.claims_role;

        -- Update `is_selectable` for columns and old_columns (once per role)
        columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(columns) c;

        old_columns =
                array_agg(
                    (
                        c.name,
                        c.type_name,
                        c.type_oid,
                        c.value,
                        c.is_pkey,
                        pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                    )::realtime.wal_column
                )
                from
                    unnest(old_columns) c;

        if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
            -- Fan out 400 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 400: Bad Request, no primary key']
                )::realtime.wal_rls;
            end loop;

        -- The claims role does not have SELECT permission to the primary key of entity
        elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
            -- Fan out 401 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 401: Unauthorized']
                )::realtime.wal_rls;
            end loop;

        else
            -- Create the prepared statement (once per role)
            if is_rls_enabled and action <> 'DELETE' then
                if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                    deallocate walrus_rls_stmt;
                end if;
                execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
            end if;

            -- Collect all visible subscription IDs for this role (filter check + RLS check)
            visible_role_sub_ids = '{}';

            for subscription_id, claims in (
                    select
                        subs.subscription_id,
                        subs.claims
                    from
                        unnest(subscriptions) subs
                    where
                        subs.entity = entity_
                        and subs.claims_role = working_role
                        and (
                            realtime.is_visible_through_filters(columns, subs.filters)
                            or (
                              action = 'DELETE'
                              and realtime.is_visible_through_filters(old_columns, subs.filters)
                            )
                        )
            ) loop

                if not is_rls_enabled or action = 'DELETE' then
                    visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                else
                    -- Check if RLS allows the role to see the record
                    perform
                        -- Trim leading and trailing quotes from working_role because set_config
                        -- doesn't recognize the role as valid if they are included
                        set_config('role', trim(both '"' from working_role::text), true),
                        set_config('request.jwt.claims', claims::text, true);

                    execute 'execute walrus_rls_stmt' into subscription_has_access;

                    if subscription_has_access then
                        visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                    end if;
                end if;
            end loop;

            perform set_config('role', null, true);

            -- Inner loop: per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;

                output = jsonb_build_object(
                    'schema', wal ->> 'schema',
                    'table', wal ->> 'table',
                    'type', action,
                    'commit_timestamp', to_char(
                        ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                    ),
                    'columns', (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'name', pa.attname,
                                    'type', pt.typname
                                )
                                order by pa.attnum asc
                            )
                        from
                            pg_attribute pa
                            join pg_type pt
                                on pa.atttypid = pt.oid
                            left join (
                                select unnest(conkey) as pkey_attnum
                                from pg_constraint
                                where conrelid = entity_ and contype = 'p'
                            ) pk on pk.pkey_attnum = pa.attnum
                        where
                            attrelid = entity_
                            and attnum > 0
                            and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
                            and (working_selected_columns is null or pa.attname = any(working_selected_columns) or pk.pkey_attnum is not null)
                    )
                )
                -- Add "record" key for insert and update
                || case
                    when action in ('INSERT', 'UPDATE') then
                        jsonb_build_object(
                            'record',
                            (
                                select
                                    jsonb_object_agg(
                                        -- if unchanged toast, get column name and value from old record
                                        coalesce((c).name, (oc).name),
                                        case
                                            when (c).name is null then (oc).value
                                            else (c).value
                                        end
                                    )
                                from
                                    unnest(columns) c
                                    full outer join unnest(old_columns) oc
                                        on (c).name = (oc).name
                                where
                                    coalesce((c).is_selectable, (oc).is_selectable)
                                    and (working_selected_columns is null or coalesce((c).name, (oc).name) = any(working_selected_columns) or coalesce((c).is_pkey, (oc).is_pkey))
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            )
                        )
                    else '{}'::jsonb
                end
                -- Add "old_record" key for update and delete
                || case
                    when action = 'UPDATE' then
                        jsonb_build_object(
                                'old_record',
                                (
                                    select jsonb_object_agg((c).name, (c).value)
                                    from unnest(old_columns) c
                                    where
                                        (c).is_selectable
                                        and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                        and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                )
                            )
                    when action = 'DELETE' then
                        jsonb_build_object(
                            'old_record',
                            (
                                select jsonb_object_agg((c).name, (c).value)
                                from unnest(old_columns) c
                                where
                                    (c).is_selectable
                                    and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                    and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                            )
                        )
                    else '{}'::jsonb
                end;

                -- Filter visible_role_sub_ids to those matching the current selected_columns group
                visible_to_subscription_ids = coalesce(
                    (
                        select array_agg(s.subscription_id)
                        from unnest(subscriptions) s
                        where s.claims_role = working_role
                          and (s.selected_columns is not distinct from working_selected_columns)
                          and s.subscription_id = any(visible_role_sub_ids)
                    ),
                    '{}'::uuid[]
                );

                return next (
                    output,
                    is_rls_enabled,
                    visible_to_subscription_ids,
                    case
                        when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                        else '{}'
                    end
                )::realtime.wal_rls;
            end loop;

        end if;
    end loop;

    perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
/*
Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
*/
declare
    op_symbol text = (
        case
            when op = 'eq' then '='
            when op = 'neq' then '!='
            when op = 'lt' then '<'
            when op = 'lte' then '<='
            when op = 'gt' then '>'
            when op = 'gte' then '>='
            when op = 'in' then '= any'
            else 'UNKNOWN OP'
        end
    );
    res boolean;
begin
    execute format(
        'select %L::'|| type_::text || ' ' || op_symbol
        || ' ( %L::'
        || (
            case
                when op = 'in' then type_::text || '[]'
                else type_::text end
        )
        || ')', val_1, val_2) into res;
    return res;
end;
$$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) RETURNS boolean
    LANGUAGE plpgsql STABLE
    AS $$
declare
    op_symbol text;
    res boolean;
begin
    -- IS DISTINCT FROM / IS NOT DISTINCT FROM: infix, both sides typed literals
    if op = 'isdistinct' then
        execute format(
            'select %L::%s %s %L::%s',
            val_1,
            type_::text,
            case when negate then 'IS NOT DISTINCT FROM' else 'IS DISTINCT FROM' end,
            val_2,
            type_::text
        ) into res;
        return res;
    end if;

    -- IS requires a keyword RHS (NULL, TRUE, FALSE, UNKNOWN), not a typed literal
    if op = 'is' then
        if val_2 not in ('null', 'true', 'false', 'unknown') then
            raise exception 'invalid value for is filter: must be null, true, false, or unknown';
        end if;
        execute format(
            'select %L::%s %s %s',
            val_1,
            type_::text,
            case when negate then 'IS NOT' else 'IS' end,
            upper(val_2)
        ) into res;
        return res;
    end if;

    op_symbol = case
        when op = 'eq'    then '='
        when op = 'neq'   then '!='
        when op = 'lt'    then '<'
        when op = 'lte'   then '<='
        when op = 'gt'    then '>'
        when op = 'gte'   then '>='
        when op = 'in'    then '= any'
        when op = 'like'   then 'LIKE'
        when op = 'ilike'  then 'ILIKE'
        when op = 'match'  then '~'
        when op = 'imatch' then '~*'
        else null
    end;

    if op_symbol is null then
        raise exception 'unsupported equality operator: %', op::text;
    end if;

    execute format(
        'select %L::%s %s (%L::%s)',
        val_1,
        type_::text,
        op_symbol,
        val_2,
        case when op = 'in' then type_::text || '[]' else type_::text end
    ) into res;

    return case when negate then not res else res end;
end;
$$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
    select
        filters is null
        or array_length(filters, 1) is null
        or coalesce(
            count(col.name) = count(1)
            and sum(
                realtime.check_equality_op(
                    op:=f.op,
                    type_:=coalesce(col.type_oid::regtype, col.type_name::regtype),
                    val_1:=col.value #>> '{}',
                    val_2:=f.value,
                    negate:=coalesce(f.negate, false)
                )::int
            ) filter (where col.name is not null) = count(col.name),
            false
        )
    from
        unnest(filters) f
        left join unnest(columns) col
            on f.column_name = col.name;
$$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         pg_logical_slot_get_changes(
           slot_name, null, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  SELECT
    realtime.wal2json_escape_identifier(nsp.nspname::text)
    || '.'
    || realtime.wal2json_escape_identifier(pc.relname::text)
  FROM pg_class pc
  JOIN pg_namespace nsp ON pc.relnamespace = nsp.oid
  WHERE pc.oid = entity
$$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: send_binary(bytea, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, binary_payload, event, topic, private, extension)
    VALUES (generated_id, payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
    col_names text[] = coalesce(
            array_agg(a.attname order by a.attnum),
            '{}'::text[]
        )
        from
            pg_catalog.pg_attribute a
        where
            a.attrelid = new.entity
            and a.attnum > 0
            and not a.attisdropped
            and pg_catalog.has_column_privilege(
                (new.claims ->> 'role'),
                a.attrelid,
                a.attnum,
                'SELECT'
            );
    filter realtime.user_defined_filter;
    col_type regtype;
    in_val jsonb;
    selected_col text;
begin
    for filter in select * from unnest(new.filters) loop
        if not filter.column_name = any(col_names) then
            raise exception 'invalid column for filter %', filter.column_name;
        end if;

        col_type = (
            select atttypid::regtype
            from pg_catalog.pg_attribute
            where attrelid = new.entity
                  and attname = filter.column_name
        );
        if col_type is null then
            raise exception 'failed to lookup type for column %', filter.column_name;
        end if;

        if filter.op = 'in'::realtime.equality_op then
            in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
            if coalesce(jsonb_array_length(in_val), 0) > 100 then
                raise exception 'too many values for `in` filter. Maximum 100';
            end if;
        elsif filter.op = 'is'::realtime.equality_op then
            -- `is` requires a keyword RHS rather than a typed literal
            if filter.value not in ('null', 'true', 'false', 'unknown') then
                raise exception 'invalid value for is filter: must be null, true, false, or unknown';
            end if;
            -- IS NULL works for any type, but IS TRUE/FALSE/UNKNOWN require a boolean
            -- operand. Reject the non-null keywords on non-boolean columns here so they
            -- don't abort apply_rls at WAL time.
            if filter.value <> 'null' and col_type <> 'boolean'::regtype then
                raise exception 'is % filter requires a boolean column, got %', filter.value, col_type::text;
            end if;
        elsif filter.op in ('like'::realtime.equality_op, 'ilike'::realtime.equality_op) then
            -- like/ilike apply the text pattern operator (~~); reject column types that
            -- have no such operator instead of failing at WAL time
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = '~~' and oprleft = col_type
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
        elsif filter.op in ('match'::realtime.equality_op, 'imatch'::realtime.equality_op) then
            -- match/imatch apply the regex operators ~ / ~*; reject column types that have
            -- no such operator (e.g. integer) instead of failing at WAL time, mirroring the
            -- like/ilike guard above.
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = case when filter.op = 'imatch'::realtime.equality_op then '~*' else '~' end
                  and oprleft = col_type
                  and oprright = col_type
                  and oprresult = 'boolean'::regtype
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
            -- validate the regex eagerly so a bad pattern is rejected here, not inside
            -- apply_rls where it would abort the WAL stream for the entity
            begin
                perform '' ~ filter.value;
            exception when others then
                raise exception 'invalid regular expression for % filter: %', filter.op::text, sqlerrm;
            end;
        else
            -- eq/neq/lt/lte/gt/gte: value must be coercable to the type
            perform realtime.cast(filter.value, col_type);
        end if;
    end loop;

    if new.selected_columns is not null then
        for selected_col in select * from unnest(new.selected_columns) loop
            if not selected_col = any(col_names) then
                raise exception 'invalid column for select %', selected_col;
            end if;
        end loop;
    end if;

    -- Apply consistent order to filters so the unique constraint can't be tricked by a
    -- different filter order. negate is part of the sort key.
    new.filters = coalesce(
        array_agg(f order by f.column_name, f.op, f.value, f.negate),
        '{}'
    ) from unnest(new.filters) f;

    new.selected_columns = (
        select array_agg(c order by c)
        from unnest(new.selected_columns) c
    );

    return new;
end;
$$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: wal2json_escape_identifier(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.wal2json_escape_identifier(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  -- Prefix `\`, `,`, `.`, and any whitespace with `\`
  SELECT regexp_replace(name, '([\\,.[:space:]])', '\\\1', 'g')
$$;


--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


--
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom_claims_allowlist text[] DEFAULT '{}'::text[] NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


--
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    id integer DEFAULT 1 NOT NULL,
    push_notifications boolean DEFAULT false NOT NULL,
    validation_required boolean DEFAULT true NOT NULL,
    allow_hors_objectifs boolean DEFAULT true NOT NULL,
    compte_rendu_required boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT app_settings_singleton CHECK ((id = 1))
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    color_hex text DEFAULT '#888888'::text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    service text DEFAULT 'viscerale_urologie'::text NOT NULL,
    CONSTRAINT categories_service_check CHECK ((service = ANY (ARRAY['viscerale_urologie'::text, 'traumato_orthopedie'::text])))
);


--
-- Name: notification_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    platform public.device_platform NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    realisation_id uuid,
    type public.notif_type NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    travail_id uuid
);


--
-- Name: procedure_objectives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.procedure_objectives (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    procedure_id uuid NOT NULL,
    year integer NOT NULL,
    required_level integer NOT NULL,
    min_count integer DEFAULT 2 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT procedure_objectives_min_count_check CHECK ((min_count >= 1)),
    CONSTRAINT procedure_objectives_required_level_check CHECK ((required_level = ANY (ARRAY[2, 3]))),
    CONSTRAINT procedure_objectives_year_check CHECK (((year >= 1) AND (year <= 5)))
);


--
-- Name: procedures_procedure_code_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.procedures_procedure_code_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: procedures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.procedures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    procedure_code integer DEFAULT nextval('public.procedures_procedure_code_seq'::regclass) NOT NULL,
    category_id uuid NOT NULL,
    name text NOT NULL,
    pathologie text,
    objectif_final integer NOT NULL,
    seuil_exposition_min integer DEFAULT 2 NOT NULL,
    seuil_supervision_min integer DEFAULT 0 NOT NULL,
    seuil_autonomie_min integer DEFAULT 0 NOT NULL,
    seuil_deblocage_autonomie integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    target_level integer,
    target_count integer,
    target_year integer,
    service text DEFAULT 'viscerale_urologie'::text NOT NULL,
    CONSTRAINT procedures_objectif_final_check CHECK ((objectif_final = ANY (ARRAY[1, 2, 3]))),
    CONSTRAINT procedures_service_check CHECK ((service = ANY (ARRAY['viscerale_urologie'::text, 'traumato_orthopedie'::text]))),
    CONSTRAINT procedures_target_count_check CHECK (((target_count IS NULL) OR (target_count >= 1))),
    CONSTRAINT procedures_target_level_check CHECK (((target_level IS NULL) OR (target_level = ANY (ARRAY[1, 2, 3])))),
    CONSTRAINT procedures_target_year_check CHECK (((target_year IS NULL) OR ((target_year >= 1) AND (target_year <= 5))))
);


--
-- Name: COLUMN procedures.target_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.procedures.target_level IS 'Niveau objectif simplifie: 1 exposition, 2 sous supervision, 3 maitrise/autonomie.';


--
-- Name: COLUMN procedures.target_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.procedures.target_count IS 'Nombre de realisations compatibles requis pour atteindre l''objectif.';


--
-- Name: COLUMN procedures.target_year; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.procedures.target_year IS 'Annee cible de l''objectif, de 1 a 5.';


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text NOT NULL,
    role public.user_role DEFAULT 'resident'::public.user_role NOT NULL,
    residanat_start_date date,
    promotion text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    service text,
    CONSTRAINT profiles_service_check CHECK (((service IS NULL) OR (service = ANY (ARRAY['viscerale_urologie'::text, 'traumato_orthopedie'::text]))))
);


--
-- Name: realisations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.realisations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    resident_id uuid NOT NULL,
    procedure_id uuid NOT NULL,
    enseignant_id uuid,
    superviseur_resident_id uuid,
    activity_type public.activity_type NOT NULL,
    performed_at date DEFAULT CURRENT_DATE NOT NULL,
    resident_year_at_time integer,
    ipp_patient text,
    compte_rendu text,
    commentaire text,
    status public.realisation_status DEFAULT 'pending'::public.realisation_status NOT NULL,
    is_hors_objectifs boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT realisations_resident_year_at_time_check CHECK (((resident_year_at_time >= 1) AND (resident_year_at_time <= 5)))
);


--
-- Name: resident_current_year; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.resident_current_year AS
 SELECT id,
    full_name,
    residanat_start_date,
    LEAST(5, GREATEST(1, ((EXTRACT(year FROM age((CURRENT_DATE)::timestamp with time zone, (residanat_start_date)::timestamp with time zone)))::integer + 1))) AS current_year
   FROM public.profiles
  WHERE ((role = 'resident'::public.user_role) AND (is_active IS NOT FALSE) AND (residanat_start_date IS NOT NULL) AND ((id = auth.uid()) OR (public.get_my_role() = ANY (ARRAY['enseignant'::public.user_role, 'admin'::public.user_role]))));


--
-- Name: travail_auteurs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.travail_auteurs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    travail_id uuid NOT NULL,
    profile_id uuid,
    external_name text,
    author_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT travail_auteurs_author_check CHECK (((profile_id IS NOT NULL) OR (NULLIF(TRIM(BOTH FROM external_name), ''::text) IS NOT NULL)))
);


--
-- Name: travail_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.travail_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    color_hex text DEFAULT '#888888'::text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: travail_validation_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.travail_validation_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    travail_id uuid NOT NULL,
    enseignant_id uuid,
    action text NOT NULL,
    feedback text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: travaux_scientifiques; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.travaux_scientifiques (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    resident_id uuid NOT NULL,
    type_id uuid,
    title text NOT NULL,
    journal_or_event text,
    year integer,
    authors text,
    doi_or_url text,
    status public.travail_status DEFAULT 'soumis'::public.travail_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    encadrant_id uuid,
    validation_status text DEFAULT 'pending_initial'::text NOT NULL,
    initial_validated_by uuid,
    initial_validated_at timestamp with time zone,
    final_validated_by uuid,
    final_validated_at timestamp with time zone,
    validation_feedback text,
    CONSTRAINT travaux_scientifiques_validation_status_check CHECK ((validation_status = ANY (ARRAY['pending_initial'::text, 'initial_validated'::text, 'pending_final'::text, 'final_validated'::text, 'refused'::text])))
);


--
-- Name: v_resident_procedure_counts; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_resident_procedure_counts AS
 SELECT resident_id,
    procedure_id,
    (count(*) FILTER (WHERE (activity_type = 'expose'::public.activity_type)))::integer AS count_expose,
    (count(*) FILTER (WHERE (activity_type = 'supervise'::public.activity_type)))::integer AS count_supervise,
    (count(*) FILTER (WHERE (activity_type = 'autonome'::public.activity_type)))::integer AS count_autonome
   FROM public.realisations
  WHERE ((status = 'validated'::public.realisation_status) AND ((resident_id = auth.uid()) OR (public.get_my_role() = ANY (ARRAY['enseignant'::public.user_role, 'admin'::public.user_role]))))
  GROUP BY resident_id, procedure_id;


--
-- Name: v_resident_niveau; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_resident_niveau AS
 SELECT c.resident_id,
    c.procedure_id,
    c.count_expose,
    c.count_supervise,
    c.count_autonome,
        CASE
            WHEN (c.count_autonome >= GREATEST(1, COALESCE(p.seuil_autonomie_min, 1))) THEN 3
            WHEN (c.count_supervise >= GREATEST(1, COALESCE(p.seuil_supervision_min, 1))) THEN 2
            WHEN (((c.count_expose + c.count_supervise) + c.count_autonome) >= GREATEST(1, COALESCE(p.seuil_exposition_min, 1))) THEN 1
            ELSE 0
        END AS niveau_atteint,
    ((c.count_supervise >= GREATEST(1, COALESCE(p.seuil_deblocage_autonomie, p.seuil_supervision_min, 1))) OR (c.count_autonome > 0)) AS autonomie_debloquee
   FROM (public.v_resident_procedure_counts c
     JOIN public.procedures p ON ((p.id = c.procedure_id)));


--
-- Name: validation_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.validation_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    realisation_id uuid NOT NULL,
    enseignant_id uuid,
    action public.validation_action NOT NULL,
    feedback text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea
)
PARTITION BY RANGE (inserted_at);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    selected_columns text[],
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.custom_oauth_providers (id, provider_type, identifier, name, client_id, client_secret, acceptable_client_ids, scopes, pkce_enabled, attribute_mapping, authorization_params, enabled, email_optional, issuer, discovery_url, skip_nonce_check, cached_discovery, discovery_cached_at, authorization_url, token_url, userinfo_url, jwks_uri, created_at, updated_at, custom_claims_allowlist) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at, invite_token, referrer, oauth_client_state_id, linking_target_id, email_optional) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
37a6a380-6a67-4df7-9d7d-f55048d19497	37a6a380-6a67-4df7-9d7d-f55048d19497	{"sub": "37a6a380-6a67-4df7-9d7d-f55048d19497", "email": "zakarya.alami@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-06 00:33:13.012539+00	2026-04-06 00:33:13.012596+00	2026-04-06 00:33:13.012596+00	9ae4b7f1-2480-4130-b36c-09727fd55af1
457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	{"sub": "457c2052-a9d6-46ed-ad6f-6910ecbc0d7c", "email": "z.alamihassani@uae.ac.ma", "email_verified": false, "phone_verified": false}	email	2026-04-06 00:34:52.795897+00	2026-04-06 00:34:52.795958+00	2026-04-06 00:34:52.795958+00	82d2a440-0e7d-434a-aaf0-b44289e51204
9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	{"sub": "9d3f74f6-9a5d-4929-8498-c6d6e3fc400a", "email": "o.dalero@uae.ac.ma", "email_verified": false, "phone_verified": false}	email	2026-04-20 12:17:22.864985+00	2026-04-20 12:17:22.865038+00	2026-04-20 12:17:22.865038+00	b0a48b78-a910-4b67-95e5-764407ccec3b
a9f17afd-2b60-47c5-9fe5-e02b2bc4e705	a9f17afd-2b60-47c5-9fe5-e02b2bc4e705	{"sub": "a9f17afd-2b60-47c5-9fe5-e02b2bc4e705", "email": "nizarchoukri8@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-20 12:17:57.938533+00	2026-04-20 12:17:57.938601+00	2026-04-20 12:17:57.938601+00	5eb393a3-97f4-45a5-87ae-e8c5355f32bb
a201d07a-bc49-4138-b9b8-b2f07957b319	a201d07a-bc49-4138-b9b8-b2f07957b319	{"sub": "a201d07a-bc49-4138-b9b8-b2f07957b319", "email": "iliass.elbadan@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-20 12:18:26.61531+00	2026-04-20 12:18:26.615358+00	2026-04-20 12:18:26.615358+00	f3de0d62-1cb6-47fc-a654-2f8111f4f773
160ffc09-0b4c-4699-8957-bd99b9ef0c00	160ffc09-0b4c-4699-8957-bd99b9ef0c00	{"sub": "160ffc09-0b4c-4699-8957-bd99b9ef0c00", "email": "saidisafae61@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-20 12:18:56.231236+00	2026-04-20 12:18:56.231281+00	2026-04-20 12:18:56.231281+00	f3730143-98f7-44c9-82e6-4f90accdd92c
710c7ae1-b26a-434c-ab74-f32082584799	710c7ae1-b26a-434c-ab74-f32082584799	{"sub": "710c7ae1-b26a-434c-ab74-f32082584799", "email": "boulaakoulmohamedreda05@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-20 12:20:38.634235+00	2026-04-20 12:20:38.634288+00	2026-04-20 12:20:38.634288+00	63c6c6ce-a6e4-410d-8efe-e2fc32c980b2
c8800173-b3ad-4bdc-bcfa-339423893d82	c8800173-b3ad-4bdc-bcfa-339423893d82	{"sub": "c8800173-b3ad-4bdc-bcfa-339423893d82", "email": "elghouzliabdelmajid@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-20 12:39:04.987419+00	2026-04-20 12:39:04.987471+00	2026-04-20 12:39:04.987471+00	e858dbad-ff95-4499-989c-a4214f7dfa32
a9b3ca2a-672d-439f-91cd-ef17d5df0a3a	a9b3ca2a-672d-439f-91cd-ef17d5df0a3a	{"sub": "a9b3ca2a-672d-439f-91cd-ef17d5df0a3a", "email": "samirouen96@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-20 12:39:27.058516+00	2026-04-20 12:39:27.058574+00	2026-04-20 12:39:27.058574+00	a254e0ea-c359-4f1b-a294-d4b50f5ea41a
8e11e081-4d4a-4ec3-9e11-23fba7650bed	8e11e081-4d4a-4ec3-9e11-23fba7650bed	{"sub": "8e11e081-4d4a-4ec3-9e11-23fba7650bed", "email": "oussama.kchich16@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-20 12:39:58.816818+00	2026-04-20 12:39:58.81687+00	2026-04-20 12:39:58.81687+00	1876b32a-9c97-41e8-9caa-0b76df6d1fae
06840608-8341-418c-81d5-e3b241c18055	06840608-8341-418c-81d5-e3b241c18055	{"sub": "06840608-8341-418c-81d5-e3b241c18055", "email": "darknisrine4@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-20 12:40:21.195402+00	2026-04-20 12:40:21.195453+00	2026-04-20 12:40:21.195453+00	b3f8e53b-8647-4264-b870-b71e5e3c96ad
86e5b80c-0e01-4faa-b569-826e4962c57c	86e5b80c-0e01-4faa-b569-826e4962c57c	{"sub": "86e5b80c-0e01-4faa-b569-826e4962c57c", "email": "marwane.tahiri@usmba.ac.ma", "email_verified": false, "phone_verified": false}	email	2026-04-20 12:40:52.345956+00	2026-04-20 12:40:52.346026+00	2026-04-20 12:40:52.346026+00	c97de9e6-fc9b-4c69-be2b-e95fed75f210
b551aa5c-9919-45c9-bdaa-0938912e9339	b551aa5c-9919-45c9-bdaa-0938912e9339	{"sub": "b551aa5c-9919-45c9-bdaa-0938912e9339", "email": "ismailbajji@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-20 12:41:46.341335+00	2026-04-20 12:41:46.341423+00	2026-04-20 12:41:46.341423+00	88923f9c-ef28-4690-a9b2-d391345abf55
32725c72-31cb-4120-a007-c925037e2e8e	32725c72-31cb-4120-a007-c925037e2e8e	{"sub": "32725c72-31cb-4120-a007-c925037e2e8e", "email": "mehdi.ouhallabel@usmba.ac.ma", "email_verified": false, "phone_verified": false}	email	2026-04-20 12:42:21.776823+00	2026-04-20 12:42:21.776874+00	2026-04-20 12:42:21.776874+00	adb9907d-2b64-408b-bac6-c4741425ca2c
10735af6-64f4-496f-93ef-8703acef0ae2	10735af6-64f4-496f-93ef-8703acef0ae2	{"sub": "10735af6-64f4-496f-93ef-8703acef0ae2", "email": "salmaerroni.se@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-20 12:42:55.130043+00	2026-04-20 12:42:55.130096+00	2026-04-20 12:42:55.130096+00	da090577-e3b5-4f91-b803-f0cd93cb21e7
2f8eb962-b393-4ed0-bd11-f4b2899f13e3	2f8eb962-b393-4ed0-bd11-f4b2899f13e3	{"sub": "2f8eb962-b393-4ed0-bd11-f4b2899f13e3", "email": "dr.chami.manal@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-20 12:43:23.672865+00	2026-04-20 12:43:23.672922+00	2026-04-20 12:43:23.672922+00	577ee207-6dff-4cba-aea3-faf42750c380
a05fdaee-0b96-4a78-b79c-e78b894084ad	a05fdaee-0b96-4a78-b79c-e78b894084ad	{"sub": "a05fdaee-0b96-4a78-b79c-e78b894084ad", "email": "mizalfatiha@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-20 12:43:51.353858+00	2026-04-20 12:43:51.353923+00	2026-04-20 12:43:51.353923+00	925553ca-fb08-46c0-abca-2bb505b6e63b
2ecc6c4f-11c7-4e08-9bd3-717a6bcbf62c	2ecc6c4f-11c7-4e08-9bd3-717a6bcbf62c	{"sub": "2ecc6c4f-11c7-4e08-9bd3-717a6bcbf62c", "email": "ahmed98berchida@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-20 12:44:23.730399+00	2026-04-20 12:44:23.730447+00	2026-04-20 12:44:23.730447+00	66176325-6925-49e0-a2d6-e990ec893fc0
a572a776-649b-4958-a68e-d2b8e0618df4	a572a776-649b-4958-a68e-d2b8e0618df4	{"sub": "a572a776-649b-4958-a68e-d2b8e0618df4", "email": "reda.elbaraka06@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-20 12:44:49.998684+00	2026-04-20 12:44:49.998744+00	2026-04-20 12:44:49.998744+00	97ca4f69-0d7c-44d3-ade8-bea2ffcd109d
c3cef922-184a-4b80-a524-1ab1df01b242	c3cef922-184a-4b80-a524-1ab1df01b242	{"sub": "c3cef922-184a-4b80-a524-1ab1df01b242", "email": "elbourakkadichaymae@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-20 12:45:24.350449+00	2026-04-20 12:45:24.350502+00	2026-04-20 12:45:24.350502+00	fa51d055-6d71-4532-98a7-336e88e9ef28
c38d267d-e4c5-42da-8546-7a31f502b021	c38d267d-e4c5-42da-8546-7a31f502b021	{"sub": "c38d267d-e4c5-42da-8546-7a31f502b021", "email": "s.andaloussi@uae.ac.ma", "email_verified": false, "phone_verified": false}	email	2026-04-20 12:45:56.063623+00	2026-04-20 12:45:56.063675+00	2026-04-20 12:45:56.063675+00	4ba5b724-f69b-4168-aa43-39ce182de5a6
4538320c-ed3b-4228-900f-2d1bddd251ec	4538320c-ed3b-4228-900f-2d1bddd251ec	{"sub": "4538320c-ed3b-4228-900f-2d1bddd251ec", "email": "dalero@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-20 13:29:14.928626+00	2026-04-20 13:29:14.92868+00	2026-04-20 13:29:14.92868+00	2b748efe-1fd6-43ff-811e-e1146591998a
4550722a-08a3-429d-98aa-dd8de14d5ed2	4550722a-08a3-429d-98aa-dd8de14d5ed2	{"sub": "4550722a-08a3-429d-98aa-dd8de14d5ed2", "email": "a.elmadi@uae.ac.ma", "email_verified": false, "phone_verified": false}	email	2026-04-28 11:46:53.760406+00	2026-04-28 11:46:53.760461+00	2026-04-28 11:46:53.760461+00	2f56b6a7-e6f3-4e74-8e4f-97a558c67d2c
7edc9937-8d31-4c92-a31d-eb975ddbadf8	7edc9937-8d31-4c92-a31d-eb975ddbadf8	{"sub": "7edc9937-8d31-4c92-a31d-eb975ddbadf8", "email": "s.annattah@uae.ac.ma", "email_verified": false, "phone_verified": false}	email	2026-04-30 11:03:20.07873+00	2026-04-30 11:03:20.07881+00	2026-04-30 11:03:20.07881+00	3fba8fdc-ca5d-4cf5-b6c8-ad527ad5acf0
f0c41500-05fc-452e-9792-c56a84c63fd4	f0c41500-05fc-452e-9792-c56a84c63fd4	{"sub": "f0c41500-05fc-452e-9792-c56a84c63fd4", "email": "hajar.wart@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-05-14 18:58:07.442129+00	2026-05-14 18:58:07.442183+00	2026-05-14 18:58:07.442183+00	0fd27a5f-f715-4733-9316-6257a6bbead3
8e1f9deb-262d-4bce-8223-5c3418610fa7	8e1f9deb-262d-4bce-8223-5c3418610fa7	{"sub": "8e1f9deb-262d-4bce-8223-5c3418610fa7", "email": "testresident@logbook.com", "email_verified": false, "phone_verified": false}	email	2026-05-21 21:50:04.063061+00	2026-05-21 21:50:04.063117+00	2026-05-21 21:50:04.063117+00	39f86d9d-8d8e-479e-92e5-928801274632
5a36e5ff-30c5-4b08-a21a-b9a74a23e279	5a36e5ff-30c5-4b08-a21a-b9a74a23e279	{"sub": "5a36e5ff-30c5-4b08-a21a-b9a74a23e279", "email": "testenseignant@logbook.com", "email_verified": false, "phone_verified": false}	email	2026-05-21 21:50:30.433142+00	2026-05-21 21:50:30.433225+00	2026-05-21 21:50:30.433225+00	1f290050-814b-4bfc-af39-0fce13b0fe79
f9c64108-3651-4e55-9104-e2e0bfe8f984	f9c64108-3651-4e55-9104-e2e0bfe8f984	{"sub": "f9c64108-3651-4e55-9104-e2e0bfe8f984", "email": "h.aboueljaoud@uae.ac.ma", "email_verified": false, "phone_verified": false}	email	2026-06-03 12:34:58.056379+00	2026-06-03 12:34:58.056454+00	2026-06-03 12:34:58.056454+00	809af327-8650-4ef0-8fd8-56849e86d475
3f622bd5-218d-4f92-bf49-71c92fb03940	3f622bd5-218d-4f92-bf49-71c92fb03940	{"sub": "3f622bd5-218d-4f92-bf49-71c92fb03940", "email": "testresident@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-07-08 20:03:02.153946+00	2026-07-08 20:03:02.154018+00	2026-07-08 20:03:02.154018+00	9f5bc898-4c7a-47a8-9a78-233d290a78d5
59c9e6e2-1906-4b98-9190-b8b869bc7cca	59c9e6e2-1906-4b98-9190-b8b869bc7cca	{"sub": "59c9e6e2-1906-4b98-9190-b8b869bc7cca", "email": "testprof@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-07-08 20:03:35.114532+00	2026-07-08 20:03:35.114597+00	2026-07-08 20:03:35.114597+00	b837d3b5-b127-4b42-86d6-175c6c87576e
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
38f79123-565f-41db-b4cb-4f71d17d1695	2026-05-02 16:56:24.81048+00	2026-05-02 16:56:24.81048+00	password	642d851f-f849-4c9d-b3d0-d76110273e8c
eeb84ee8-bbc6-4331-8459-e80d9edb2897	2026-05-18 08:22:56.732997+00	2026-05-18 08:22:56.732997+00	password	d61e8088-2520-490d-a861-d8f976361679
2acbf36a-ccb2-4cfe-80e5-db7565dc2c2b	2026-06-03 13:17:16.215706+00	2026-06-03 13:17:16.215706+00	password	2146aaa2-8c6b-498b-81c0-212dfecfe948
41cd93c4-3208-4c94-9d3d-5bfeec9e046c	2026-07-08 08:35:26.441605+00	2026-07-08 08:35:26.441605+00	password	5c6f9ed6-4a5e-410c-bb33-dc948c1b3546
4fc690f4-a3b7-4b76-9323-bab539417505	2026-07-08 20:04:02.732613+00	2026-07-08 20:04:02.732613+00	password	99877eb2-7aa1-4c87-971e-0220a20845ee
b3a15e7b-84f7-46bb-9a5b-a3aa4189d2e2	2026-07-08 20:04:04.020283+00	2026-07-08 20:04:04.020283+00	password	8c431f1e-7533-4717-8bb0-f71a5d942250
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type, token_endpoint_auth_method) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
00000000-0000-0000-0000-000000000000	147	aotcavqinhxg	7edc9937-8d31-4c92-a31d-eb975ddbadf8	f	2026-05-02 16:56:24.788871+00	2026-05-02 16:56:24.788871+00	\N	38f79123-565f-41db-b4cb-4f71d17d1695
00000000-0000-0000-0000-000000000000	243	35hcxmkcgzau	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	t	2026-05-18 08:22:56.713392+00	2026-05-19 11:48:22.971113+00	\N	eeb84ee8-bbc6-4331-8459-e80d9edb2897
00000000-0000-0000-0000-000000000000	247	uih43dvebqqx	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	f	2026-05-19 11:48:22.978229+00	2026-05-19 11:48:22.978229+00	35hcxmkcgzau	eeb84ee8-bbc6-4331-8459-e80d9edb2897
00000000-0000-0000-0000-000000000000	254	cztzwxgzbbl6	f9c64108-3651-4e55-9104-e2e0bfe8f984	t	2026-06-03 13:17:16.214144+00	2026-06-03 14:34:21.588536+00	\N	2acbf36a-ccb2-4cfe-80e5-db7565dc2c2b
00000000-0000-0000-0000-000000000000	255	irqkytlflysq	f9c64108-3651-4e55-9104-e2e0bfe8f984	f	2026-06-03 14:34:21.63492+00	2026-06-03 14:34:21.63492+00	cztzwxgzbbl6	2acbf36a-ccb2-4cfe-80e5-db7565dc2c2b
00000000-0000-0000-0000-000000000000	258	xtg4mgunmp77	f9c64108-3651-4e55-9104-e2e0bfe8f984	t	2026-07-08 08:35:26.43631+00	2026-07-08 10:31:35.258163+00	\N	41cd93c4-3208-4c94-9d3d-5bfeec9e046c
00000000-0000-0000-0000-000000000000	259	xzissehln4pq	f9c64108-3651-4e55-9104-e2e0bfe8f984	f	2026-07-08 10:31:35.298602+00	2026-07-08 10:31:35.298602+00	xtg4mgunmp77	41cd93c4-3208-4c94-9d3d-5bfeec9e046c
00000000-0000-0000-0000-000000000000	271	xgcfddlnza3b	3f622bd5-218d-4f92-bf49-71c92fb03940	f	2026-07-08 20:04:02.731337+00	2026-07-08 20:04:02.731337+00	\N	4fc690f4-a3b7-4b76-9323-bab539417505
00000000-0000-0000-0000-000000000000	272	zft35mg7k7lw	3f622bd5-218d-4f92-bf49-71c92fb03940	f	2026-07-08 20:04:04.018943+00	2026-07-08 20:04:04.018943+00	\N	b3a15e7b-84f7-46bb-9a5b-a3aa4189d2e2
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
20260219120000
20260302000000
20260625000000
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
2acbf36a-ccb2-4cfe-80e5-db7565dc2c2b	f9c64108-3651-4e55-9104-e2e0bfe8f984	2026-06-03 13:17:16.212955+00	2026-06-03 14:34:21.673172+00	\N	aal1	\N	2026-06-03 14:34:21.673023	node	154.144.241.158	\N	\N	\N	\N	\N
38f79123-565f-41db-b4cb-4f71d17d1695	7edc9937-8d31-4c92-a31d-eb975ddbadf8	2026-05-02 16:56:24.747601+00	2026-05-02 16:56:24.747601+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1	197.253.253.229	\N	\N	\N	\N	\N
eeb84ee8-bbc6-4331-8459-e80d9edb2897	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	2026-05-18 08:22:56.694601+00	2026-05-19 11:48:22.994149+00	\N	aal1	\N	2026-05-19 11:48:22.99404	node	3.8.16.2	\N	\N	\N	\N	\N
41cd93c4-3208-4c94-9d3d-5bfeec9e046c	f9c64108-3651-4e55-9104-e2e0bfe8f984	2026-07-08 08:35:26.422131+00	2026-07-08 10:31:35.606035+00	\N	aal1	\N	2026-07-08 10:31:35.605938	node	102.50.240.74	\N	\N	\N	\N	\N
4fc690f4-a3b7-4b76-9323-bab539417505	3f622bd5-218d-4f92-bf49-71c92fb03940	2026-07-08 20:04:02.730258+00	2026-07-08 20:04:02.730258+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	102.97.194.213	\N	\N	\N	\N	\N
b3a15e7b-84f7-46bb-9a5b-a3aa4189d2e2	3f622bd5-218d-4f92-bf49-71c92fb03940	2026-07-08 20:04:04.017892+00	2026-07-08 20:04:04.017892+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	102.97.194.213	\N	\N	\N	\N	\N
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
00000000-0000-0000-0000-000000000000	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	authenticated	authenticated	z.alamihassani@uae.ac.ma	$2a$10$n/iAR3JNDlcYPI4msrB8S.J5rDKVM1uC.LSwTEDRNZGuzVfRhlOAa	2026-04-06 00:34:52.797413+00	\N		\N		\N			\N	2026-07-08 11:49:10.843124+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-06 00:34:52.790023+00	2026-07-08 11:49:10.872141+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	37a6a380-6a67-4df7-9d7d-f55048d19497	authenticated	authenticated	zakarya.alami@gmail.com	$2a$10$r/OsqgMC4gh4cC8.FrnPf.rv/gCwIuHt0qpU5G8ghR97h1FWhpvNu	2026-04-06 00:33:13.016652+00	\N		\N		\N			\N	2026-07-08 19:47:04.335914+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-06 00:33:12.997061+00	2026-07-08 19:47:04.344034+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	authenticated	authenticated	o.dalero@uae.ac.ma	$2a$10$B1x5q6VsPj8f1EWDfl2QS.7gmoLGhgIT3kG1FZhm/kiUvfWHEyEDi	2026-04-20 12:17:22.871123+00	\N		\N		\N			\N	2026-05-18 08:22:56.692634+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-20 12:17:22.848217+00	2026-05-19 11:48:22.982274+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	710c7ae1-b26a-434c-ab74-f32082584799	authenticated	authenticated	boulaakoulmohamedreda05@gmail.com	$2a$10$Ov/EU4aBMI4wzcPqTiyS.uFBw4HFahrFnebbtetMC2aAjAcNcvY1y	2026-04-20 12:20:38.636079+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-20 12:20:38.627372+00	2026-04-20 12:20:38.63686+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	06840608-8341-418c-81d5-e3b241c18055	authenticated	authenticated	darknisrine4@gmail.com	$2a$10$EyK5M7BArNC6aDfoMBQYg.FCdrogfDIMS8sWehp7d4ocA3oWa4.uS	2026-04-20 12:40:21.200289+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-20 12:40:21.191224+00	2026-04-20 12:40:21.201349+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	a9f17afd-2b60-47c5-9fe5-e02b2bc4e705	authenticated	authenticated	nizarchoukri8@gmail.com	$2a$10$HopFZLtOP/vxsnauBMdKYO2fb8YOAUWDFfCZmz/dGDIJyyCt.JvjK	2026-04-20 12:17:57.941525+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-20 12:17:57.924043+00	2026-04-20 12:17:57.94238+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	c8800173-b3ad-4bdc-bcfa-339423893d82	authenticated	authenticated	elghouzliabdelmajid@gmail.com	$2a$10$PmhJCmVvEGMCWfdDPpTLJ.XV5DwuydQMFfA/nokc0L/eV28wjKQlW	2026-04-20 12:39:04.992268+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-20 12:39:04.975804+00	2026-04-20 12:39:04.994868+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	a201d07a-bc49-4138-b9b8-b2f07957b319	authenticated	authenticated	iliass.elbadan@gmail.com	$2a$10$GRWDE8.v9ZlRoh05EwHanOCtE6QKnLN34Vhq8fb0J7zW8F6q88oNu	2026-04-20 12:18:26.616969+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-20 12:18:26.613908+00	2026-04-20 12:18:26.617679+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	32725c72-31cb-4120-a007-c925037e2e8e	authenticated	authenticated	mehdi.ouhallabel@usmba.ac.ma	$2a$10$dhsfwgsrUSJ264Cx09CO/.3tw3wDT2s6E7gOm10biBlkywnqvPNii	2026-04-20 12:42:21.778366+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-20 12:42:21.774021+00	2026-04-20 12:42:21.779072+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	a9b3ca2a-672d-439f-91cd-ef17d5df0a3a	authenticated	authenticated	samirouen96@gmail.com	$2a$10$ZVvshIy/ZUR8Vle73JHDSeZGIA7u.lP0D3FazCu0lons3KTiLzvdu	2026-04-20 12:39:27.060236+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-20 12:39:27.056257+00	2026-04-20 12:39:27.060933+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	160ffc09-0b4c-4699-8957-bd99b9ef0c00	authenticated	authenticated	saidisafae61@gmail.com	$2a$10$IQR4Q3I5fN5oJZDttVE2qOHD5GScoU58qNBG4iYVNsRbLTbVVETCW	2026-04-20 12:18:56.233137+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-20 12:18:56.229211+00	2026-04-20 12:18:56.233814+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	86e5b80c-0e01-4faa-b569-826e4962c57c	authenticated	authenticated	marwane.tahiri@usmba.ac.ma	$2a$10$DD7wUVidsVlBn4UZv/GQSe/LkWZwvLjev.LEDcwszCNnl.dStcqHu	2026-04-20 12:40:52.352194+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-20 12:40:52.319236+00	2026-04-20 12:40:52.35312+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	8e11e081-4d4a-4ec3-9e11-23fba7650bed	authenticated	authenticated	oussama.kchich16@gmail.com	$2a$10$kvIxVidWR9v84XqPWWLyPe42rj92HHdEtP/wzgPThHIJsmar/WPyS	2026-04-20 12:39:58.82039+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-20 12:39:58.807104+00	2026-04-20 12:39:58.821412+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	2f8eb962-b393-4ed0-bd11-f4b2899f13e3	authenticated	authenticated	dr.chami.manal@gmail.com	$2a$10$9i7gkMPUQIy573OAugLBKOZHDCxCLPYp.HjFkwD5XkShI/WzIHdiu	2026-04-20 12:43:23.675109+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-20 12:43:23.671484+00	2026-04-20 12:43:23.676036+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	b551aa5c-9919-45c9-bdaa-0938912e9339	authenticated	authenticated	ismailbajji@gmail.com	$2a$10$w5nTpaqgW6kRX.Ss3PYfDeV32H9uOjDnt4VJlOAuSXQtiB2vTcWHS	2026-04-20 12:41:46.346044+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-20 12:41:46.314971+00	2026-04-20 12:41:46.346903+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	10735af6-64f4-496f-93ef-8703acef0ae2	authenticated	authenticated	salmaerroni.se@gmail.com	$2a$10$RGlPe49s8R3kyukIVm6R/e980zJQQ4yAkWXIBv.kvcxivJQGR3eW2	2026-04-20 12:42:55.131902+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-20 12:42:55.126433+00	2026-04-20 12:42:55.132759+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	2ecc6c4f-11c7-4e08-9bd3-717a6bcbf62c	authenticated	authenticated	ahmed98berchida@gmail.com	$2a$10$d5M63/M.FftCaXVU8fVci.hcnDImggVXG13uFs0dHdDLEpgUrQnX.	2026-04-20 12:44:23.732178+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-20 12:44:23.727469+00	2026-04-20 12:44:23.734844+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	a572a776-649b-4958-a68e-d2b8e0618df4	authenticated	authenticated	reda.elbaraka06@gmail.com	$2a$10$gLE3QNJQEXaGg2wOCu2o5u6.rmOTyg233l7AlTy2S643ItYbDo9bq	2026-04-20 12:44:50.000155+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-20 12:44:49.997287+00	2026-04-20 12:44:50.000841+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	a05fdaee-0b96-4a78-b79c-e78b894084ad	authenticated	authenticated	mizalfatiha@gmail.com	$2a$10$FPRpT3xCrIgOc/Pq4XnCteM3S7QjYzpeNey69EJ44J0RjKAO7N9jG	2026-04-20 12:43:51.356278+00	\N		\N		\N			\N	2026-04-21 13:20:44.755757+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-20 12:43:51.349736+00	2026-04-21 13:20:44.761985+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	c3cef922-184a-4b80-a524-1ab1df01b242	authenticated	authenticated	elbourakkadichaymae@gmail.com	$2a$10$19mH7nEHNUKnTALqM2B50OVA2oRg45fjsG7pNfyx338G9PfrbLAEm	2026-04-20 12:45:24.353275+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-20 12:45:24.34738+00	2026-04-20 12:45:24.353991+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	c38d267d-e4c5-42da-8546-7a31f502b021	authenticated	authenticated	s.andaloussi@uae.ac.ma	$2a$10$qxrnwR0E8D5Q4K28/CtjaebHAs6qa0vZ6YaiTE5V5LA2e4wMd3i.i	2026-04-20 12:45:56.065465+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-20 12:45:56.059166+00	2026-04-20 12:45:56.070136+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	4538320c-ed3b-4228-900f-2d1bddd251ec	authenticated	authenticated	dalero@gmail.com	$2a$10$2aR5kM8qBw2v9ujlSCRjeusDRM.RWulw6IaREgxVP7TA4UA3rAHjm	2026-04-20 13:29:14.934111+00	\N		\N		\N			\N	2026-05-18 08:22:22.762838+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-20 13:29:14.912911+00	2026-05-18 08:22:22.788437+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	f9c64108-3651-4e55-9104-e2e0bfe8f984	authenticated	authenticated	h.aboueljaoud@uae.ac.ma	$2a$10$KyEsyg5s.r0vhYaNcZtFK.ZuQQWq.UHPUK75JG72Un30hx2Ywpz6e	2026-06-03 12:34:58.061779+00	\N		\N		\N			\N	2026-07-08 08:35:26.41086+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-06-03 12:34:57.994309+00	2026-07-08 10:31:35.321518+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	f0c41500-05fc-452e-9792-c56a84c63fd4	authenticated	authenticated	hajar.wart@gmail.com	$2a$10$pK9elYyw91n/wTAP2clHiuUpEbGtkUwebNMq7ThprTwha4aJQWdo6	2026-05-14 18:58:07.445927+00	\N		\N		\N			\N	2026-07-08 20:02:19.476645+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-05-14 18:58:07.423396+00	2026-07-08 20:02:19.489852+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	8e1f9deb-262d-4bce-8223-5c3418610fa7	authenticated	authenticated	testresident@logbook.com	$2a$10$FWFGHwk7bdmV86LSP8I0v.HPrT/xWq5LSXgshoWQOedRsSrj1U50y	2026-05-21 21:50:04.067208+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-05-21 21:50:04.035283+00	2026-05-21 21:50:04.068089+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	7edc9937-8d31-4c92-a31d-eb975ddbadf8	authenticated	authenticated	s.annattah@uae.ac.ma	$2a$10$FzMiJ6VT.xbwcfAAztoA6.rLaF/G4sywdGuD/xm/wATYxsnhKitMC	2026-04-30 11:03:20.084191+00	\N		\N		\N			\N	2026-05-02 16:56:24.746434+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-30 11:03:20.044524+00	2026-05-02 16:56:24.807093+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	5a36e5ff-30c5-4b08-a21a-b9a74a23e279	authenticated	authenticated	testenseignant@logbook.com	$2a$10$6HNpNk5oEMKpmw3WN/U34OCPWJr1FHF0RyDdn.ucBHTwkoKDT4NVq	2026-05-21 21:50:30.435083+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-05-21 21:50:30.426406+00	2026-05-21 21:50:30.436016+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	4550722a-08a3-429d-98aa-dd8de14d5ed2	authenticated	authenticated	a.elmadi@uae.ac.ma	$2a$10$BZr9B4YfGEUgXhUL7vNduenLQXe./h/qcyua/MU.hP9A7a6W0eDnq	2026-04-28 11:46:53.763425+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-28 11:46:53.740528+00	2026-04-28 11:46:53.764298+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	59c9e6e2-1906-4b98-9190-b8b869bc7cca	authenticated	authenticated	testprof@gmail.com	$2a$10$RGmMnOsbMpDS8EHF0aDOaO0YaKP/d4RYTbAVd4kSZ0XN9AEEWmIa6	2026-07-08 20:03:35.116082+00	\N		\N		\N			\N	2026-07-08 20:03:45.529274+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-07-08 20:03:35.111841+00	2026-07-08 20:03:45.531536+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	3f622bd5-218d-4f92-bf49-71c92fb03940	authenticated	authenticated	testresident@gmail.com	$2a$10$rQgEcym0g0uEOArGftOCqO475bzlMmx.BtP12Ri71SnyWbkJ4Erue	2026-07-08 20:03:02.163242+00	\N		\N		\N			\N	2026-07-08 20:04:04.017798+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-07-08 20:03:02.107311+00	2026-07-08 20:04:04.019944+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.webauthn_challenges (id, user_id, challenge_type, session_data, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.webauthn_credentials (id, user_id, credential_id, public_key, attestation_type, aaguid, sign_count, transports, backup_eligible, backed_up, friendly_name, created_at, updated_at, last_used_at) FROM stdin;
\.


--
-- Data for Name: app_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_settings (id, push_notifications, validation_required, allow_hors_objectifs, compte_rendu_required, created_at, updated_at) FROM stdin;
1	f	t	t	f	2026-05-14 19:17:32.595312+00	2026-05-14 19:17:32.595312+00
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, color_hex, display_order, service) FROM stdin;
9fe0a6c3-41f9-747f-3f10-81e0ad237943	Chirurgie urologique	#4A90D9	1	viscerale_urologie
5d28c384-ce0b-7215-8f01-263b1140a981	Chirurgie d'urgence	#E05A5A	2	viscerale_urologie
77897cdf-2089-da9a-cb6e-c3969be80695	Chirurgie néonatale	#F5A623	3	viscerale_urologie
412f26d7-e954-5150-5c07-0574c7f3fc1c	Chirurgie digestive	#7ED321	4	viscerale_urologie
45404103-0e11-ea18-3661-d6f78e0b4bcf	Chirurgie de la tête et du cou	#9B59B6	5	viscerale_urologie
32b8eb60-1e1f-1b99-2e48-d8aa10d60df0	Chirurgie ambulatoire	#1ABC9C	6	viscerale_urologie
4c8ff9f7-9a09-06b7-831e-70fae96084bb	Bénigne	#95A5A6	7	viscerale_urologie
3a58ece7-912a-1422-2158-e4a498c3eab0	Chirurgie thoracique	#3498DB	8	viscerale_urologie
5a5bbcaa-e186-6aed-695d-7b970beb3ec6	Maligne	#E74C3C	9	viscerale_urologie
32c0f7ca-31fa-4e49-bc5f-79148627912d	Traumatologie et orthopedie pediatrique	#b45309	50	traumato_orthopedie
2b23d89a-7544-4a42-9227-20a57d3a6d3d	Urologie	#4A90D9	1	viscerale_urologie
aa16e6e4-f232-4996-982e-9d6d24267816	Viscerale	#7ED321	2	viscerale_urologie
bec558e3-d601-44ec-a7fc-211b97864d34	Traumatologie	#b45309	1	traumato_orthopedie
33ebfbab-6408-4069-a7d8-c96cd6bc0cab	Orthopedie congenitale	#166534	2	traumato_orthopedie
\.


--
-- Data for Name: notification_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_tokens (id, user_id, token, platform, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, realisation_id, type, is_read, created_at, travail_id) FROM stdin;
bcabd85e-ad84-46c6-86dd-7f329106c17e	37a6a380-6a67-4df7-9d7d-f55048d19497	b73bb582-9131-49bd-9cf1-719179430eb8	validated	f	2026-05-11 09:50:46.772384+00	\N
4141da9b-9902-42db-b55e-772055841980	37a6a380-6a67-4df7-9d7d-f55048d19497	7663b62b-1ed1-45d7-9bfa-34e27871070e	validated	f	2026-05-11 09:51:00.084472+00	\N
5bf6cdc6-89bb-429d-8dee-22f031cc95fe	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	3ed8fea9-77d2-4bd9-bef5-53c19155147b	new_submission	f	2026-05-11 10:17:53.218632+00	\N
0003597b-3e68-4e4d-8189-40ea44ca3195	37a6a380-6a67-4df7-9d7d-f55048d19497	3ed8fea9-77d2-4bd9-bef5-53c19155147b	validated	f	2026-05-11 10:42:16.579613+00	\N
d532d1f2-481e-4e47-b486-b57bb3b94337	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	98346776-a19d-4e11-bf30-ff6ff48359e4	new_submission	f	2026-05-11 11:04:32.723225+00	\N
a2e186f9-c49f-4642-b761-7d750ec8ee97	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	98346776-a19d-4e11-bf30-ff6ff48359e4	new_submission	f	2026-05-11 11:04:49.102746+00	\N
c40432be-2844-46b7-b020-04ed53ee91ab	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	f445a175-4f98-4289-a7a7-0fff029f2231	new_submission	f	2026-05-11 11:05:40.995064+00	\N
ae5e3e97-5d1a-4d35-8585-6cb6cb6113b1	37a6a380-6a67-4df7-9d7d-f55048d19497	f445a175-4f98-4289-a7a7-0fff029f2231	validated	f	2026-05-13 19:22:49.684408+00	\N
d54a217a-d276-41a1-8e70-ee6bc4213ee7	37a6a380-6a67-4df7-9d7d-f55048d19497	98346776-a19d-4e11-bf30-ff6ff48359e4	validated	f	2026-05-13 19:22:55.040603+00	\N
60587c05-a89e-4595-880c-a0e33a68b950	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	b3769bbd-7e6e-46b9-a1ac-d64e4dc30204	new_submission	f	2026-05-14 18:49:33.053969+00	\N
89b388e1-8fd3-465b-b2fd-2bd148e1550d	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	77a8a39d-055a-48d6-8873-fd399032fa54	new_submission	f	2026-05-14 18:50:09.629542+00	\N
50a367e3-eb5c-4e5d-be2b-83d4042023f6	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	5be31102-8daa-454e-9a8c-7626ceb43710	new_submission	f	2026-05-14 18:51:00.179038+00	\N
1dfce7c3-760f-48fb-81d5-9fc7c60496e3	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	8dbe02a6-223f-464e-9175-734b700ad546	new_submission	f	2026-05-14 18:51:20.671414+00	\N
7764f4a9-b57a-431f-a7b1-d31a8ec4b373	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	97869407-c687-4607-9430-01e6f84a02cb	new_submission	f	2026-05-14 18:51:39.586755+00	\N
0a9a9261-3228-42a4-801d-dc4b5a5325ac	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	7bef7bae-957b-4199-9c47-aa9c18710ba3	new_submission	f	2026-05-14 18:51:59.952099+00	\N
de06c9ed-d90b-422d-b802-2f44dd192744	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	95cb3f72-c26a-4dc2-bcec-479fe1647e24	new_submission	f	2026-05-14 18:52:19.221695+00	\N
b4ff1d70-e144-4418-becb-6dd3828108dc	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	f587f806-71c5-43c3-b849-2c81f9608eab	new_submission	f	2026-05-14 18:52:35.87248+00	\N
41e4ec34-3fba-4395-badc-de3662dc3ee4	37a6a380-6a67-4df7-9d7d-f55048d19497	f587f806-71c5-43c3-b849-2c81f9608eab	validated	f	2026-05-14 18:53:08.068398+00	\N
c3bf4902-e3a8-4e22-be71-446ec3da1da5	37a6a380-6a67-4df7-9d7d-f55048d19497	95cb3f72-c26a-4dc2-bcec-479fe1647e24	validated	f	2026-05-14 18:53:12.669195+00	\N
0e1e23db-3f11-437b-bb98-71ddaab87704	37a6a380-6a67-4df7-9d7d-f55048d19497	7bef7bae-957b-4199-9c47-aa9c18710ba3	validated	f	2026-05-14 18:53:16.964556+00	\N
9bdef936-757b-4ee9-a5af-883063656486	37a6a380-6a67-4df7-9d7d-f55048d19497	97869407-c687-4607-9430-01e6f84a02cb	validated	f	2026-05-14 18:53:22.39374+00	\N
719a5ae4-ae85-4daa-853a-a3ee6ee5f1a9	37a6a380-6a67-4df7-9d7d-f55048d19497	8dbe02a6-223f-464e-9175-734b700ad546	validated	f	2026-05-14 18:53:27.181635+00	\N
994d761c-31cc-44b0-9440-6feae78cd44a	37a6a380-6a67-4df7-9d7d-f55048d19497	b3769bbd-7e6e-46b9-a1ac-d64e4dc30204	validated	f	2026-05-14 18:53:34.948441+00	\N
d5d433cd-d819-4a1e-950d-73b25a3a10e6	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	db9ee2d9-e8ff-49c7-8cfb-4395f0916630	new_submission	f	2026-05-14 18:54:21.704817+00	\N
173dd1f1-8606-4a46-afb4-0910da35b076	37a6a380-6a67-4df7-9d7d-f55048d19497	5be31102-8daa-454e-9a8c-7626ceb43710	validated	f	2026-05-14 18:54:40.822726+00	\N
7fcb1e63-8ac0-40ad-aa02-09701c15d7ad	37a6a380-6a67-4df7-9d7d-f55048d19497	db9ee2d9-e8ff-49c7-8cfb-4395f0916630	validated	f	2026-05-14 18:54:45.403047+00	\N
ace7b601-c51a-42e7-b9ef-6edcc8fe927f	37a6a380-6a67-4df7-9d7d-f55048d19497	77a8a39d-055a-48d6-8873-fd399032fa54	validated	f	2026-05-14 18:54:51.871074+00	\N
0cb1d114-e384-4de1-8166-59012493252f	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	a2655108-d096-43ec-8089-e40dbf318e0e	new_submission	f	2026-05-14 19:43:02.650561+00	\N
ec4b15c6-256c-4511-a324-8d4ca6592ad7	37a6a380-6a67-4df7-9d7d-f55048d19497	a2655108-d096-43ec-8089-e40dbf318e0e	validated	f	2026-05-14 19:43:40.034148+00	\N
68e00d45-124d-4b33-b66e-828565e7beb2	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	0578b2f7-0b1e-40b4-ae2e-809263e28344	new_submission	f	2026-05-15 14:21:09.779618+00	\N
30704332-32f1-4ac0-b4af-43a77e862fcd	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	25ed635c-23cb-41c9-986e-5f6ea6eb6fe1	new_submission	f	2026-05-15 23:04:32.628577+00	\N
bdcfae2b-6e41-4b86-a81c-5c83b6907863	37a6a380-6a67-4df7-9d7d-f55048d19497	25ed635c-23cb-41c9-986e-5f6ea6eb6fe1	validated	f	2026-05-16 18:41:00.128162+00	\N
319d2d02-2aaf-467f-8dd8-5c849cb2ae5e	37a6a380-6a67-4df7-9d7d-f55048d19497	0578b2f7-0b1e-40b4-ae2e-809263e28344	validated	f	2026-05-17 21:41:02.296491+00	\N
b0b8b621-dfcc-4223-9f26-d9832739a390	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	b6107dc4-6038-4b9a-96e8-fa9bd9d01023	new_submission	f	2026-05-18 08:18:23.490134+00	\N
ecd37366-7d2a-4f46-8147-9b859efae257	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	9c6c2976-51af-4ba3-aae1-1cf38a261cd5	new_submission	f	2026-05-18 08:22:00.564861+00	\N
db73468f-64a6-4067-9adb-ec6a79a7f5df	37a6a380-6a67-4df7-9d7d-f55048d19497	9c6c2976-51af-4ba3-aae1-1cf38a261cd5	validated	f	2026-05-18 08:23:38.605862+00	\N
8fbb08a8-907a-47b0-90a2-975d41058898	37a6a380-6a67-4df7-9d7d-f55048d19497	b6107dc4-6038-4b9a-96e8-fa9bd9d01023	validated	f	2026-05-18 08:23:50.200074+00	\N
afa2acf2-ab73-4d3b-9108-5cf658977cfe	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	75a7c975-e2f3-4ecf-9a7c-f2b47acd2249	new_submission	f	2026-05-19 11:47:54.147307+00	\N
6fb115c2-3dc5-4018-83a7-f806557952a7	37a6a380-6a67-4df7-9d7d-f55048d19497	b6107dc4-6038-4b9a-96e8-fa9bd9d01023	validated	f	2026-05-19 11:48:49.798664+00	\N
56c4464e-03a9-41f8-bb10-9c69644f132f	37a6a380-6a67-4df7-9d7d-f55048d19497	75a7c975-e2f3-4ecf-9a7c-f2b47acd2249	validated	f	2026-05-19 11:49:00.367437+00	\N
9ab12879-4bc4-47a6-8223-eb85b2a96da8	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	f5a94b4f-9b05-4fd1-841a-ceb546784877	new_submission	f	2026-05-19 11:52:11.916467+00	\N
743a2d9c-a435-4096-b944-ea2026c0fbee	37a6a380-6a67-4df7-9d7d-f55048d19497	75a7c975-e2f3-4ecf-9a7c-f2b47acd2249	validated	f	2026-05-19 11:53:06.382936+00	\N
fd622d2e-e7bb-4897-be81-1a2ad1a4b273	f9c64108-3651-4e55-9104-e2e0bfe8f984	fb69352b-eb7f-48ef-825f-09579da94ee6	new_submission	f	2026-06-03 13:17:09.473429+00	\N
454d4d93-8565-4a2a-b499-bef12592a092	37a6a380-6a67-4df7-9d7d-f55048d19497	fb69352b-eb7f-48ef-825f-09579da94ee6	validated	f	2026-06-03 13:17:25.367926+00	\N
5b01c846-9897-4674-bb2b-c9f0f48783b8	59c9e6e2-1906-4b98-9190-b8b869bc7cca	904bb2da-f5fb-4695-a90d-dbd6964131b2	new_submission	f	2026-07-08 20:04:37.498986+00	\N
5d5c9c95-1edb-4419-b795-23f4f783c3a4	59c9e6e2-1906-4b98-9190-b8b869bc7cca	ea892393-93af-4673-aab3-4059ca813414	new_submission	f	2026-07-08 20:05:02.068423+00	\N
\.


--
-- Data for Name: procedure_objectives; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.procedure_objectives (id, procedure_id, year, required_level, min_count, is_active, notes, created_at, updated_at) FROM stdin;
588515db-8715-4727-9659-77c36525b98b	f622586f-9fdd-3d0b-5cab-78a517d517a7	2	3	2	t	\N	2026-05-14 19:05:09.615966+00	2026-05-14 19:05:09.615966+00
bc5445f7-ae15-42f1-9e98-e1d26f33e621	ababa531-b0f3-5f45-f9cc-1d17a9e4c11c	3	3	3	t	\N	2026-05-14 19:10:09.979961+00	2026-05-14 19:10:09.979961+00
bb3e0184-844a-4af8-8fb3-1dff39e3f908	67be8c16-3517-6e2c-31cb-e8579be09f23	2	3	5	t	\N	2026-05-14 19:11:17.012279+00	2026-05-14 19:11:17.012279+00
9a52d666-a866-4002-a915-8f0885cbaf2a	ef4389ad-fc9a-b624-8f6c-7fee27e7dd3b	4	2	2	t	\N	2026-05-14 22:25:07.874419+00	2026-05-14 22:25:07.874419+00
17229783-f052-4cc6-b83f-958f9d683092	082a0224-80e9-a0c1-5c6d-aba096abd8f1	4	2	2	t	\N	2026-05-14 22:25:07.874419+00	2026-05-14 22:25:07.874419+00
5a6a419e-9f8a-4614-b49b-918a5033f515	68178893-9b13-241e-9d03-d7578e07b1ea	4	2	2	t	\N	2026-05-14 22:25:07.874419+00	2026-05-14 22:25:07.874419+00
dd9504a5-1dcb-4023-9508-1f605571b0aa	5d591937-8472-92f0-1e4a-26e392c668d8	4	2	2	t	\N	2026-05-14 22:25:07.874419+00	2026-05-14 22:25:07.874419+00
ca0eb075-65a2-450b-8bec-5530ba6b5bd9	d996517a-4499-d7b6-420c-1c9836ae82c3	4	2	5	t	\N	2026-05-14 22:25:07.874419+00	2026-05-14 22:25:07.874419+00
19ef35d7-036c-4f50-a000-86af509c5fe6	7e509ee6-02d7-d97c-0f26-26d0035f864f	4	2	5	t	\N	2026-05-14 22:25:07.874419+00	2026-05-14 22:25:07.874419+00
4832ae6f-2180-48d6-b63d-cb9970563c93	171d4efd-9c1d-fc7f-0b2f-933e073b1a82	4	2	2	t	\N	2026-05-14 22:25:07.874419+00	2026-05-14 22:25:07.874419+00
797c17e9-cf24-4dc8-b97b-118d8b0e18bd	4d6bc98d-5228-e200-08db-482063792f61	4	2	2	t	\N	2026-05-14 22:25:07.874419+00	2026-05-14 22:25:07.874419+00
349590e7-cd36-4e94-9adf-f0e6acb2be9d	904732a0-8b80-c705-7697-e4df47523000	4	2	2	t	\N	2026-05-14 22:25:07.874419+00	2026-05-14 22:25:07.874419+00
37ea1a9b-3c5e-44b1-8b13-5a1c111c01ec	c967818e-98a3-8776-25fd-a68faf0e2d52	4	2	2	t	\N	2026-05-14 22:25:07.874419+00	2026-05-14 22:25:07.874419+00
9596e4f5-14ec-4887-8d4b-47a667dab7f3	79cda60f-990e-ce43-95b7-f14586185aae	4	2	2	t	\N	2026-05-14 22:25:07.874419+00	2026-05-14 22:25:07.874419+00
176bf9d2-c884-4111-8d8c-965d8d7ad461	e79d0ba5-4406-097c-9e09-cc66511266b1	4	2	2	t	\N	2026-05-14 22:25:07.874419+00	2026-05-14 22:25:07.874419+00
d612e2d0-081c-4343-8b0b-b35342dca006	bcdc655a-9e50-f328-7574-9deeddcb55f7	4	2	2	t	\N	2026-05-14 22:25:07.874419+00	2026-05-14 22:25:07.874419+00
9b7ad9e1-b393-422b-9863-2448b09bc01a	bfc1c76a-1449-f022-9662-3c207ce78988	4	2	2	t	\N	2026-05-14 22:25:07.874419+00	2026-05-14 22:25:07.874419+00
38c80d11-e82f-4568-b28c-7b33d6dc47c6	9a369871-c300-39b1-4e1b-49e7d53cc217	4	2	2	t	\N	2026-05-14 22:25:07.874419+00	2026-05-14 22:25:07.874419+00
b9f61758-37ab-49db-9cdc-4e903890f167	7ff8cf4a-a92c-7c53-e393-753e0677a09f	4	2	2	t	\N	2026-05-14 22:25:07.874419+00	2026-05-14 22:25:07.874419+00
f0190463-affe-4fb9-a964-f04c0452791a	205b1e22-01a6-86d2-ad99-dffb48aaf182	4	2	2	t	\N	2026-05-14 22:25:07.874419+00	2026-05-14 22:25:07.874419+00
671b32a7-babc-4d8d-836c-9b9c7b31d8b0	c629a239-a497-493c-9468-3bbd85aefc84	4	2	5	t	\N	2026-05-14 22:25:07.874419+00	2026-05-14 22:25:07.874419+00
bf763568-2fb9-4752-86a9-f1503949f4d3	32cb2505-4109-eb8c-664e-855eb574a8ea	4	2	5	t	\N	2026-05-14 22:25:07.874419+00	2026-05-14 22:25:07.874419+00
e6fe9887-3bd6-4188-92a3-a0c4231d97e1	1206bc3b-ed31-5d10-6dd2-c768f732704c	4	2	2	t	\N	2026-05-14 22:25:07.874419+00	2026-05-14 22:25:07.874419+00
07a2bcf1-ffe5-4b78-96da-cd79fdf57ad6	3eda4d3a-0f3b-5ec7-5f47-b5f7a538fa1c	4	2	5	t	\N	2026-05-14 22:25:07.874419+00	2026-05-14 22:25:07.874419+00
d8225337-ccb5-42e4-8612-e3a982cc623b	735d68c7-cf7d-1bd4-b249-e361318f36ba	3	3	3	t	\N	2026-05-18 08:14:55.969336+00	2026-05-18 08:14:55.969336+00
f9079375-5f0a-4865-8c3d-6586c7f6e36d	1968baff-cb7b-7ea6-ac97-d628e4452415	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
098c6067-93d8-435c-ba60-89bca91cd796	0f0a58dc-f194-2907-b28b-c17f85ab87a7	3	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
d00a57d8-298d-4db4-a372-bc716cf4a6de	9f381533-8c89-77ea-c4c9-5e0c2e04892f	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
76f81263-ee4c-4084-b452-267108a10e2b	37e28f86-de9a-fa11-0ba1-c7b6412d06a6	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
b221049e-9255-4f51-b654-9251c7a4a49c	dd69063d-8bea-6324-a841-e868e2a71e88	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
6f4a66fb-ed88-4ead-8fa7-805f7b4db977	836c51f4-b553-82d1-d465-f9af2159bc74	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
563cbcd6-b696-4c8d-ace7-ed09d96b6111	98e1b5a4-13f9-8aca-62c7-69991c52c889	3	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
11dfc078-0aa2-4a90-8d88-329f8baf5bde	8838b9e9-5cdb-87b1-2345-0847530213ff	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
78386e49-4b7e-48fd-8c52-a063f16bff67	a7a8034e-4ec2-57af-991b-19b2188305ba	3	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
536f63e0-9f2a-46f7-9f1d-45fe84332742	5a3c286b-34a0-0ff8-c396-57b3e3910e03	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
3059257b-eaaa-44b7-9ff0-e9c4a0e5a028	a875d130-7e92-1d1f-a100-b8ed06c7860c	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
a4c82e77-82d4-4ff0-ae28-8ad54f336905	59703dca-87fe-b5eb-4a94-d9956cfaaf6c	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
82ad7414-1a7f-42ee-b78f-ffe6133060b4	1696cc39-c819-de90-9090-192bb831a311	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
ad009433-7994-4f81-80a7-d30f6becb20b	d6a8b027-0317-bd58-66d1-ae27e4362df9	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
adc2a307-e7b6-48dd-8921-4903fdbb7827	5a4dd532-c32c-83b7-c946-0ff2adf9a96e	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
7d51a7c8-92b2-48cf-af24-ab3f4b0a17f3	c8b6aa6e-3f5e-bfb5-77a4-351b509293e5	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
e6f3c637-7fb3-4abc-a8e8-d906c7985133	ac1c8150-5602-3136-fd45-9139d6a6addd	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
03e41310-5aab-4a83-a95b-5132298c3aff	f7ab1694-4390-788a-ec23-437a5c0e90e0	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
ac8ebc2b-e9bf-4102-b2fb-7521855ca0fb	1d58ce7b-d898-95e6-5c48-7e052f9b0e5c	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
45588884-be64-4210-a7f8-18400e2c4a11	019944c4-386d-d754-510e-3ceadb3f096b	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
0727e8f9-b477-4366-b8b8-db3252a0aff0	4ad39ae0-787b-f3f0-bef7-10f422670c17	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
a0d4be10-e5d5-46dd-9e40-440b2a362708	7df60091-ac01-cd29-b556-cb85739b0d65	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
be57249d-ffb5-4374-8982-22006be8a2f5	307e4c2e-4c58-8a78-2b19-8e3c50153b54	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
283d6cb9-e3f3-4778-ac8c-4d38d9b8134c	e30c3674-d7f2-236e-f453-847a5f2f905b	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
e08c58db-1e69-4775-8b37-4155b87e74ab	337e4392-2bf8-9871-a5a9-74a223a6db02	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
e3d4b50c-e7b2-4934-8a1a-e5affd42ab99	a657987e-2ee1-c384-d86d-4b3eb02c6dd9	3	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
d3f3138a-e1e4-43f6-9fe6-bdc5ccc55b19	d32fa081-6959-176e-7e0a-c54f9476186e	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
56e546ee-6163-4da9-89ad-77d5efab4499	6e8082d5-4253-749a-4abf-58657e0cf145	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
007f4b85-0554-4513-8b47-60cbb30d1835	5422151b-05d0-7cb3-30e8-8660544c4b53	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
0170aed3-49b3-4f64-81eb-94c98f17ed7b	a8f28e08-dcfa-9839-a59a-54ef68bedd57	3	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
9c090963-86e1-40eb-9607-fff6fa59b080	04372a5d-6ebb-5989-3587-3a1b6fc9f2fb	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
7bcead72-3313-4136-b553-8a18352e2dbf	f38db6c7-8050-fa11-509a-5dcfa7133906	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
60c1052f-b141-4ce0-9817-d50d39e08b18	b016a9b1-5d64-7397-b79a-14c0b819cd57	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
4cd518e8-a366-416b-bae2-604858a9aff4	aab4819d-0ee3-dc99-a9c0-99776cc447e7	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
aeee7b79-3559-4a89-8b2a-5c2f2e1c0ace	52d64dde-5f70-54fb-355f-25d3ddfe4a28	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
c70009fe-628b-4fda-a931-deff7e939103	42289632-89e2-0c30-976d-457396832fc7	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
569859f0-f2f5-4cc1-ac9c-1ed07f09a241	cb886c03-0ed0-0dfc-8e38-3d95a1c8c4ac	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
7c3ec3d3-2774-4912-80d0-866862780b9e	65dda049-83a7-ad90-32d9-446945cd3803	3	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
f788d0a6-0a10-4f3f-8669-527e8d6a4253	b5537022-2fd8-262b-1491-26ecdcdb18c3	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
0ec50fb8-bfa4-43e0-b7b4-99ebf775e245	b8ef8ba0-7472-85ff-e3e5-a929c19704b6	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
8dd0f994-fb5b-4a98-aa9a-c176dd3cfa19	62dc0831-db57-d8b8-0f53-d0ccdafaadd8	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
016a949d-fb60-471d-8fba-64616bd7a34d	99c76e12-d151-245a-d5a0-3b93ec30ac9a	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
862bfe18-43ba-44ed-a332-beb037af59cb	b587e583-0338-7c02-6db6-a7593f9d1a37	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
f1c799e0-8b6f-4fb7-9d4c-211673bf3ea8	7b4a615e-6914-9b13-5dbb-c0b1e5592e1a	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
1a73748d-0e38-4847-a238-7740ebedf85d	9dba29ac-7f51-2eea-3d49-87b27391e8f8	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
f3baa79b-29e6-4eef-a618-fb5227c8a816	57cc561b-7efd-fede-da47-d439bfb4406b	3	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
1688e74a-d48e-45bc-9ed2-271eab28f46f	90d34ebf-832e-dd70-0d2b-74336d3d4d1f	3	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
1c29783b-054e-4710-b418-b30de81abad3	c3d41374-d475-6114-5857-ee7ac14bbb4e	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
416e619b-654c-47cb-829b-c5902a909919	a10fd93f-3aca-330e-b6e5-29333fd16420	3	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
c5b9dac7-db2a-4f19-af33-12d1ad046244	73011bea-c68f-9743-b842-c77337707092	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
c19640ca-094c-4144-abb9-d5b5bfc54d15	50acb11b-f337-2be5-e5fa-2c49e197289d	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
45c7e513-56ac-486d-b91d-2947f109b91a	19c8bccf-53a1-b33d-eff5-eb63d4a69d77	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
20df8353-74f7-4618-99be-a30046d6c104	e74dbcdf-971b-4fee-3cdc-cb1496f74b6b	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
0f50a18d-857a-4b80-b662-dbbd20f2a9c5	f08c1a82-1171-4436-c350-36e2369b5980	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
3e8fc436-0def-4573-94b0-9470113a412c	062b2e46-e9cb-75fe-a986-88ad3a92c13b	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
4079230c-86c2-40aa-9c6e-561b9a2e7a1f	a8833b60-7b01-a962-1dbc-6832f44d682c	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
07236a64-a639-4ecc-85a6-7a6726474b8f	7f8b5e63-b4d8-7844-caf5-a65d69c4f0b4	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
585a1789-80fc-49a9-a954-c70dbecf4066	386c030e-3802-e840-2b27-19acdf7a594c	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
8986109d-c558-442f-bf74-250b18e3302f	db2f9619-bf7d-088e-b52b-e4e58c7c10a4	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
80c32136-a240-459e-a316-3f804db1e398	377f0285-0852-5876-8cd9-47d472301ec5	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
e9fb7939-41c1-400c-a2d7-e25fa387c44b	160d6325-e74b-ec71-c4a5-0289d7097ef5	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
1f55e4e8-baed-4005-8c9a-6be9824ad105	1718643e-ccd0-6d36-ad74-ca176eeefa3b	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
a7dda790-60de-4ee4-a4fe-57a7e54d9f41	9751168f-cd78-7aa2-64be-fdf85be6a3dd	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
1c7a9034-3ad8-4450-b4a3-7e520bd46497	13e5d40a-4edb-9768-6e1a-0af0ab06a0b2	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
a54ce481-902a-4772-adb8-f3d6e4b043c3	4729484e-30cc-04e2-0d31-d9e170c404bc	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
c2c95516-c509-40af-998c-99a286d0e6a3	7fbd479e-71c5-efc1-9678-c3e77fb14d93	5	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
094c7e81-61a7-4aa6-9a3c-ae95b0b3d03b	2f1a6791-8bab-447e-8d58-c1ebcc9b6e9b	3	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
3142a85d-a10e-4402-ae2b-d496111c1ebe	a8f991ee-e57d-2905-af86-87f2cbee122b	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
2f3067da-3ac4-4d9f-8798-6547b4d7bc7b	82e17dbd-918f-e4a6-a7ee-2abfe9dc4fc5	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
d37035f4-f36f-4b4d-8f12-170f5a93130b	e30df5ed-a954-dbf9-af41-adb586e653be	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
3a6bd9fa-5e52-470e-9c81-46b078488c4e	ce2087d5-ff81-45ed-f3d1-999e4c966644	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
f62a8254-0481-40dc-abff-942920e8a245	b176b7f7-7fd7-d0d5-3ff7-e5eef981abd0	4	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
7eb8588a-5c1f-4b23-bddb-4dccb72a74ac	3844fce2-61f3-ab1a-5f24-e47a9d13b2ff	3	3	3	t	Objectif annuel affiché : autonomie	2026-05-02 11:28:57.367016+00	2026-05-02 11:28:57.367016+00
\.


--
-- Data for Name: procedures; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.procedures (id, procedure_code, category_id, name, pathologie, objectif_final, seuil_exposition_min, seuil_supervision_min, seuil_autonomie_min, seuil_deblocage_autonomie, is_active, target_level, target_count, target_year, service) FROM stdin;
f622586f-9fdd-3d0b-5cab-78a517d517a7	21	5d28c384-ce0b-7215-8f01-263b1140a981	Drainage des abcès	Drainage des abcès	3	2	5	3	5	t	3	2	2	viscerale_urologie
f7ab1694-4390-788a-ec23-437a5c0e90e0	39	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Hypospadias antérieur (TIP/Snodgrass)	Hypospadias antérieur	3	2	5	3	5	t	3	3	4	viscerale_urologie
90d34ebf-832e-dd70-0d2b-74336d3d4d1f	124	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Exploration et orchidopexie	Torsion du pédicule spermatique	3	2	5	3	5	t	3	3	3	viscerale_urologie
9751168f-cd78-7aa2-64be-fdf85be6a3dd	40	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Hypospadias antérieur (Mathieu)	Hypospadias antérieur	3	2	5	3	5	t	3	3	4	viscerale_urologie
99c76e12-d151-245a-d5a0-3b93ec30ac9a	35	77897cdf-2089-da9a-cb6e-c3969be80695	Hernie diaphragmatique congénitale	Hernie diaphragmatique congénitale	3	2	5	3	5	t	3	3	5	viscerale_urologie
9f381533-8c89-77ea-c4c9-5e0c2e04892f	107	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Réimplantation urétérale extra-vésicale type Lich-Gregoir (laparotomie)	Reflux vésico-uretéral	3	2	5	3	5	t	3	3	5	viscerale_urologie
a10fd93f-3aca-330e-b6e5-29333fd16420	38	32b8eb60-1e1f-1b99-2e48-d8aa10d60df0	Hydrocèle	Hydrocèle	3	2	5	3	5	t	3	3	3	viscerale_urologie
a657987e-2ee1-c384-d86d-4b3eb02c6dd9	2	5d28c384-ce0b-7215-8f01-263b1140a981	Appendicectomie	Appendicite	3	2	5	3	5	t	3	3	3	viscerale_urologie
a7a8034e-4ec2-57af-991b-19b2188305ba	102	5d28c384-ce0b-7215-8f01-263b1140a981	Pose de drain thoracique	Pleurésie purulente	3	2	5	3	5	t	3	3	3	viscerale_urologie
a875d130-7e92-1d1f-a100-b8ed06c7860c	113	412f26d7-e954-5150-5c07-0574c7f3fc1c	Sténose de pylore	Sténose de pylore	3	2	5	3	5	t	3	3	4	viscerale_urologie
a8833b60-7b01-a962-1dbc-6832f44d682c	76	77897cdf-2089-da9a-cb6e-c3969be80695	Malformation anorectale basse (anoplastie périnéale)	Malformations anorectale basse	3	2	5	3	5	t	3	3	5	viscerale_urologie
a8f28e08-dcfa-9839-a59a-54ef68bedd57	125	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Exploration et orchidectomie	Torsion du pédicule spermatique	3	2	5	3	5	t	3	3	3	viscerale_urologie
a8f991ee-e57d-2905-af86-87f2cbee122b	31	412f26d7-e954-5150-5c07-0574c7f3fc1c	Gastrostomie chirurgicale ouverte	Gastrostomie	3	2	5	3	5	t	3	3	4	viscerale_urologie
aab4819d-0ee3-dc99-a9c0-99776cc447e7	108	5d28c384-ce0b-7215-8f01-263b1140a981	Résection intestinale avec anastomose primaire	Résection intestinale	3	2	5	3	5	t	3	3	5	viscerale_urologie
ac1c8150-5602-3136-fd45-9139d6a6addd	104	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Traitement endoscopique du reflux vésico-urétéral (Deflux)	Reflux vésico-uretéral	3	2	5	3	5	t	3	3	5	viscerale_urologie
b016a9b1-5d64-7397-b79a-14c0b819cd57	94	77897cdf-2089-da9a-cb6e-c3969be80695	Omphalocèle (fermeture primitive)	Omphalocèle	3	2	5	3	5	t	3	3	5	viscerale_urologie
b176b7f7-7fd7-d0d5-3ff7-e5eef981abd0	12	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Cystoscopie exploratrice	Cystoscopie exploratrice	3	2	5	3	5	t	3	3	4	viscerale_urologie
b5537022-2fd8-262b-1491-26ecdcdb18c3	41	32b8eb60-1e1f-1b99-2e48-d8aa10d60df0	Hypospadias glandulaire (MAGPI / méatoplastie)	Hypospadias glandulaire	3	2	5	3	5	t	3	3	5	viscerale_urologie
b587e583-0338-7c02-6db6-a7593f9d1a37	101	5d28c384-ce0b-7215-8f01-263b1140a981	Péritonite par perforation digestive (réparation / dérivation selon cas)	Péritonites	3	2	5	3	5	t	3	3	4	viscerale_urologie
b8ef8ba0-7472-85ff-e3e5-a929c19704b6	13	412f26d7-e954-5150-5c07-0574c7f3fc1c	Iléostomie	Dérivation digestive	3	2	5	3	5	t	3	3	4	viscerale_urologie
bcdc655a-9e50-f328-7574-9deeddcb55f7	74	412f26d7-e954-5150-5c07-0574c7f3fc1c	Maladie de Hirschsprung (Soave transanal)	Maladie d’Hirschsprung	2	2	2	0	0	t	2	2	4	viscerale_urologie
bfc1c76a-1449-f022-9662-3c207ce78988	82	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Néphrectomie (par laparotomie)	Néphrectomie	2	2	2	0	0	t	2	2	4	viscerale_urologie
c3d41374-d475-6114-5857-ee7ac14bbb4e	57	4c8ff9f7-9a09-06b7-831e-70fae96084bb	Kyste ovarien compliqué / torsion (annexectomie / détorsion selon cas)	Kyste ovarien	3	2	5	3	5	t	3	3	5	viscerale_urologie
c629a239-a497-493c-9468-3bbd85aefc84	106	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Réimplantation urétérale extra-vésicale type Lich-Gregoir (coelioscopie)	Reflux vésico-uretéral	2	2	5	0	0	t	2	5	4	viscerale_urologie
c8b6aa6e-3f5e-bfb5-77a4-351b509293e5	9	45404103-0e11-ea18-3661-d6f78e0b4bcf	Biopsie ganglionnaire	Biopsie ganglionnaire	3	2	5	3	5	t	3	3	4	viscerale_urologie
c967818e-98a3-8776-25fd-a68faf0e2d52	44	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Hypospadias postérieur (Onlay)	Hypospadias postérieur	2	2	2	0	0	t	2	2	4	viscerale_urologie
cb886c03-0ed0-0dfc-8e38-3d95a1c8c4ac	52	412f26d7-e954-5150-5c07-0574c7f3fc1c	Kyste hydatique du foie (résection du dôme saillant)	Kyste hydatique du foie	3	2	5	3	5	t	3	3	4	viscerale_urologie
ce2087d5-ff81-45ed-f3d1-999e4c966644	15	412f26d7-e954-5150-5c07-0574c7f3fc1c	Sigmoïdostomie	Dérivation digestive	3	2	5	3	5	t	3	3	4	viscerale_urologie
d32fa081-6959-176e-7e0a-c54f9476186e	92	5d28c384-ce0b-7215-8f01-263b1140a981	Occlusion intestinale avec nécrose/perforation (résection intestinale)	Occlusion intestinale	3	2	5	3	5	t	3	3	4	viscerale_urologie
d6a8b027-0317-bd58-66d1-ae27e4362df9	69	4c8ff9f7-9a09-06b7-831e-70fae96084bb	Lymphangiome périphérique (exérèse)	Lymphangiome	3	2	5	3	5	t	3	3	5	viscerale_urologie
d996517a-4499-d7b6-420c-1c9836ae82c3	7	77897cdf-2089-da9a-cb6e-c3969be80695	Atrésie du grêle (résection-anastomose)	Atrésie du grêle	2	2	5	0	0	t	2	5	4	viscerale_urologie
db2f9619-bf7d-088e-b52b-e4e58c7c10a4	78	77897cdf-2089-da9a-cb6e-c3969be80695	Malrotation intestinale (procédure de Ladd)	Malrotation/volvulus	3	2	5	3	5	t	3	3	5	viscerale_urologie
dd69063d-8bea-6324-a841-e868e2a71e88	19	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Vésicostomie	Dérivation vésicale incontinente	3	2	5	3	5	t	3	3	4	viscerale_urologie
e30c3674-d7f2-236e-f453-847a5f2f905b	54	3a58ece7-912a-1422-2158-e4a498c3eab0	Kyste hydatique du poumon (kystectomie + capitonnage)	Kyste hydatique du poumon	3	2	5	3	5	t	3	3	5	viscerale_urologie
e30df5ed-a954-dbf9-af41-adb586e653be	53	412f26d7-e954-5150-5c07-0574c7f3fc1c	Kyste hydatique du foie (périkystectomie / geste hépatique conservateur)	Kyste hydatique du foie	3	2	5	3	5	t	3	3	4	viscerale_urologie
e74dbcdf-971b-4fee-3cdc-cb1496f74b6b	105	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Réimplantation urétérale type Cohen	Reflux vésico-uretéral	3	2	5	3	5	t	3	3	5	viscerale_urologie
e79d0ba5-4406-097c-9e09-cc66511266b1	61	77897cdf-2089-da9a-cb6e-c3969be80695	Gastroschisis (réintégration + fermeture primitive)	Laparoschisis	2	2	2	0	0	t	2	2	4	viscerale_urologie
ef4389ad-fc9a-b624-8f6c-7fee27e7dd3b	3	77897cdf-2089-da9a-cb6e-c3969be80695	Atrésie de l’œsophage	Atrésie de l’œsophage	2	2	2	0	0	t	2	2	4	viscerale_urologie
f08c1a82-1171-4436-c350-36e2369b5980	111	412f26d7-e954-5150-5c07-0574c7f3fc1c	Splénectomie par laparotomie	Splénectomie	3	2	5	3	5	t	3	3	5	viscerale_urologie
a5a2170b-61a4-4979-b479-84fe98936dd8	131	32c0f7ca-31fa-4e49-bc5f-79148627912d	Palette	Fracture du coude	3	0	0	3	0	t	3	3	2	traumato_orthopedie
98e1b5a4-13f9-8aca-62c7-69991c52c889	118	32b8eb60-1e1f-1b99-2e48-d8aa10d60df0	Testicule non descendu non palpable (cœlioscopie diagnostique / orchidopexie)	Testicule non descendu	3	2	5	3	5	t	3	3	3	viscerale_urologie
9a369871-c300-39b1-4e1b-49e7d53cc217	83	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Néphrectomie (par coelioscopie)	Néphrectomie	2	2	2	0	0	t	2	2	4	viscerale_urologie
9dba29ac-7f51-2eea-3d49-87b27391e8f8	126	5d28c384-ce0b-7215-8f01-263b1140a981	Trachéotomie	Trachéotomie	3	2	5	3	5	t	3	3	4	viscerale_urologie
f38db6c7-8050-fa11-509a-5dcfa7133906	97	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Kyste de l’ouraque (exérèse)	Pathologie de l'ouraque	3	2	5	3	5	t	3	3	5	viscerale_urologie
ababa531-b0f3-5f45-f9cc-1d17a9e4c11c	36	32b8eb60-1e1f-1b99-2e48-d8aa10d60df0	Hernie inguinale	Hernie inguinale	3	2	5	3	5	t	3	3	3	viscerale_urologie
6290d63c-c01b-0d46-5310-5fb6413250d6	66	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Néphrolithotomie percutanée	Lithiase urinaire	1	1	0	0	0	t	1	1	1	viscerale_urologie
27c8d07f-3b50-cc12-bfc9-5a3a2b72b3da	67	3a58ece7-912a-1422-2158-e4a498c3eab0	Lobectomie pulmonaire	Lobectomie, pneumonectomie	1	1	0	0	0	t	1	1	1	viscerale_urologie
404353e4-e2f9-74f4-e897-b682ada7426e	68	3a58ece7-912a-1422-2158-e4a498c3eab0	Pneumonectomie	Lobectomie, pneumonectomie	1	1	0	0	0	t	1	1	1	viscerale_urologie
837c15d0-d480-b704-41e7-2ab9dd47b947	75	412f26d7-e954-5150-5c07-0574c7f3fc1c	Maladie de Hirschsprung (technique de Deloyer)	Maladie d’Hirschsprung	1	1	0	0	0	t	1	1	1	viscerale_urologie
367d1030-d1da-4e0d-d5eb-adf49bd39cae	77	77897cdf-2089-da9a-cb6e-c3969be80695	Malformation anorectale haute (anorectoplastie sagittale postérieure - PSARP)	Malformations anorectale haute	1	1	0	0	0	t	1	1	1	viscerale_urologie
a5b316a0-452c-9956-eacf-9f62a2645183	79	412f26d7-e954-5150-5c07-0574c7f3fc1c	Méga-œsophage (myotomie de Heller par laparotomie)	Méga-oesophage	1	1	0	0	0	t	1	1	1	viscerale_urologie
d96783cd-017a-866e-946b-4db36d5f049f	80	412f26d7-e954-5150-5c07-0574c7f3fc1c	Méga-œsophage (myotomie de Heller par laparoscopie)	Méga-oesophage	1	1	0	0	0	t	1	1	1	viscerale_urologie
d369d32c-651e-5283-e148-c2a2b880ec53	87	4c8ff9f7-9a09-06b7-831e-70fae96084bb	Néphrome mésoblastique congénital	Néphrome mésoblastique congénital	1	1	0	0	0	t	1	1	1	viscerale_urologie
d723877c-ec47-d88a-36a6-da7e63888d1d	93	3a58ece7-912a-1422-2158-e4a498c3eab0	Œsophagoplastie de remplacement	Œsophagoplastie	1	1	0	0	0	t	1	1	1	viscerale_urologie
f39acbf1-699c-5e76-8fc8-eecec125f557	95	77897cdf-2089-da9a-cb6e-c3969be80695	Omphalocèle (Technique de Schuster)	Omphalocèle	1	1	0	0	0	t	1	1	1	viscerale_urologie
62142f6f-2744-dba3-ac4b-318b6345d7a4	110	5a5bbcaa-e186-6aed-695d-7b970beb3ec6	Rhabdomyosarcome	Rhabdomyosarcome	1	1	0	0	0	t	1	1	1	viscerale_urologie
539b9d80-1ed8-0f00-0acd-29e198624be0	115	4c8ff9f7-9a09-06b7-831e-70fae96084bb	Tératome sacro-coccygien (exérèse)	Tératome	1	1	0	0	0	t	1	1	1	viscerale_urologie
0b2774a7-4ac3-9aea-8c28-a2b80d71954e	116	4c8ff9f7-9a09-06b7-831e-70fae96084bb	Tératome autre localisation (exérèse)	Tératome	1	1	0	0	0	t	1	1	1	viscerale_urologie
b8bffd9e-2222-4b3a-6e1b-48a02b33e61d	121	3a58ece7-912a-1422-2158-e4a498c3eab0	Thoracotomie pour tumeur thoracique	Thoracotomie pour tumeur	1	1	0	0	0	t	1	1	1	viscerale_urologie
bfdb8840-a944-759a-3d1e-e2dc186dfe2b	122	3a58ece7-912a-1422-2158-e4a498c3eab0	Thymectomie	Thymectomie	1	1	0	0	0	t	1	1	1	viscerale_urologie
23ba6374-5b60-5bf6-3f08-25a54d99a277	123	45404103-0e11-ea18-3661-d6f78e0b4bcf	Thyroïdectomie	Thyroïdectomie	1	1	0	0	0	t	1	1	1	viscerale_urologie
d1da8516-1935-6a2a-90aa-a4831c4b2538	128	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Vaginoplastie	Vaginoplastie	1	1	0	0	0	t	1	1	1	viscerale_urologie
0c395fff-44ee-c742-684b-266da5954a05	64	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Cystolithotomie	Lithiase urinaire	1	1	0	0	0	t	1	1	1	viscerale_urologie
b99e44a4-202e-f07d-65fb-5635e155521a	28	412f26d7-e954-5150-5c07-0574c7f3fc1c	Fundoplicature de Nissen par laparotomie	Fundoplicature	1	1	0	0	0	t	1	1	1	viscerale_urologie
e77411d0-a78a-fe52-fd7e-88904c038d02	1	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Entérocystoplastie d’agrandissement	Agrandissement de la vessie	1	1	0	0	0	t	1	1	1	viscerale_urologie
d3d59e45-4361-1ef0-1c54-75f92a9d8b81	16	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Dérivation urinaire continente (Mitrofanoff)	Dérivation urinaire continente	1	1	0	0	0	t	1	1	1	viscerale_urologie
eb13bca9-2ba1-18ee-6f46-5442a539bca5	17	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Dérivation urinaire continente (Monti)	Dérivation urinaire continente	1	1	0	0	0	t	1	1	1	viscerale_urologie
92d21c63-6560-4608-899c-054bc23934ae	24	77897cdf-2089-da9a-cb6e-c3969be80695	Extrophie (Fermeture de la plaque vésicale)	Extrophie	1	1	0	0	0	t	1	1	1	viscerale_urologie
2ba7fc6c-77cb-de45-fad9-71ee8eff50d2	29	412f26d7-e954-5150-5c07-0574c7f3fc1c	Fundoplicature de Nissen par cœlioscopie	Fundoplicature	1	1	0	0	0	t	1	1	1	viscerale_urologie
2f0dc44b-5ea7-d109-9f78-b3060dc503f6	30	4c8ff9f7-9a09-06b7-831e-70fae96084bb	Ganglioneurome	Ganglioneurome	1	1	0	0	0	t	1	1	1	viscerale_urologie
b99f2ad5-6ce7-b6f3-4304-59565d7a212d	46	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Hypospadias postérieur (Koyanagi)	Hypospadias postérieur	1	1	0	0	0	t	1	1	1	viscerale_urologie
6d4dfb14-3a60-b002-674e-88b0a4ea6754	47	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Hypospadias postérieur (Bracka en deux temps)	Hypospadias postérieur	1	1	0	0	0	t	1	1	1	viscerale_urologie
05f443e0-1e7c-c510-72ef-0e0088ff3cbc	62	77897cdf-2089-da9a-cb6e-c3969be80695	Gastroschisis (Technique de Schuster)	Laparoschisis	1	1	0	0	0	t	1	1	1	viscerale_urologie
24c376ba-c487-6a4c-60fb-97975e9bb74a	90	5a5bbcaa-e186-6aed-695d-7b970beb3ec6	Neuroblastome	Neuroblastome	1	1	0	0	0	t	1	1	1	viscerale_urologie
019944c4-386d-d754-510e-3ceadb3f096b	91	5d28c384-ce0b-7215-8f01-263b1140a981	Occlusion intestinale sur bride (bridektomie / adhésiolyse)	Occlusion intestinale	3	2	5	3	5	t	3	3	4	viscerale_urologie
04372a5d-6ebb-5989-3587-3a1b6fc9f2fb	88	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Néphrostomie percutanée	Néphrostomie	3	2	5	3	5	t	3	3	5	viscerale_urologie
062b2e46-e9cb-75fe-a986-88ad3a92c13b	96	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Sinus/fistule de l’ouraque (exérèse)	Pathologie de l'ouraque	3	2	5	3	5	t	3	3	5	viscerale_urologie
082a0224-80e9-a0c1-5c6d-aba096abd8f1	4	412f26d7-e954-5150-5c07-0574c7f3fc1c	Atrésie des voies biliaires (intervention de Kasai)	Atrésie des voies biliaires	2	2	2	0	0	t	2	2	4	viscerale_urologie
0f0a58dc-f194-2907-b28b-c17f85ab87a7	103	5d28c384-ce0b-7215-8f01-263b1140a981	Thoracoscopie	Pleurésie purulente	3	2	5	3	5	t	3	3	3	viscerale_urologie
1206bc3b-ed31-5d10-6dd2-c768f732704c	129	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Valve de l’urètre postérieur (ablation endoscopique)	Valve de l’urètre postérieur	2	2	2	0	0	t	2	2	4	viscerale_urologie
13e5d40a-4edb-9768-6e1a-0af0ab06a0b2	89	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Néphrostomie chirurgicale	Néphrostomie	3	2	5	3	5	t	3	3	5	viscerale_urologie
160d6325-e74b-ec71-c4a5-0289d7097ef5	51	45404103-0e11-ea18-3661-d6f78e0b4bcf	Kyste dermoïde	Kyste dermoïde	3	2	5	3	5	t	3	3	4	viscerale_urologie
1696cc39-c819-de90-9090-192bb831a311	43	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Hypospadias moyen (Onlay)	Hypospadias moyen	3	2	5	3	5	t	3	3	5	viscerale_urologie
1718643e-ccd0-6d36-ad74-ca176eeefa3b	72	45404103-0e11-ea18-3661-d6f78e0b4bcf	Lymphangiome kystique axillaire / thoracique (exérèse)	Lymphangiome kystique	3	2	5	3	5	t	3	3	5	viscerale_urologie
171d4efd-9c1d-fc7f-0b2f-933e073b1a82	25	45404103-0e11-ea18-3661-d6f78e0b4bcf	Fente labiale unilatérale (Technique de Fischer)	Fentes labiales	2	2	2	0	0	t	2	2	4	viscerale_urologie
1968baff-cb7b-7ea6-ac97-d628e4452415	33	4c8ff9f7-9a09-06b7-831e-70fae96084bb	Hémangiome	Hémangiome	3	2	5	3	5	t	3	3	5	viscerale_urologie
19c8bccf-53a1-b33d-eff5-eb63d4a69d77	48	5d28c384-ce0b-7215-8f01-263b1140a981	Invagination intestinale aiguë (réduction hydrostatique)	Invagination intestinale aigue	3	2	5	3	5	t	3	3	4	viscerale_urologie
1d58ce7b-d898-95e6-5c48-7e052f9b0e5c	50	5d28c384-ce0b-7215-8f01-263b1140a981	Invagination intestinale aiguë (réduction chirurgicale)	Invagination intestinale aigue	3	2	5	3	5	t	3	3	4	viscerale_urologie
205b1e22-01a6-86d2-ad99-dffb48aaf182	85	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Néphrectomie partielle par coelioscopie	Néphrectomie	2	2	2	0	0	t	2	2	4	viscerale_urologie
2f1a6791-8bab-447e-8d58-c1ebcc9b6e9b	34	32b8eb60-1e1f-1b99-2e48-d8aa10d60df0	Hernie de la ligne blanche	Hernie de la ligne blanche	3	2	5	3	5	t	3	3	3	viscerale_urologie
307e4c2e-4c58-8a78-2b19-8e3c50153b54	32	412f26d7-e954-5150-5c07-0574c7f3fc1c	Gastrostomie sous cœlioscopie	Gastrostomie	3	2	5	3	5	t	3	3	4	viscerale_urologie
32cb2505-4109-eb8c-664e-855eb574a8ea	112	412f26d7-e954-5150-5c07-0574c7f3fc1c	Splénectomie par coelioscopie	Splénectomie	2	2	5	0	0	t	2	5	4	viscerale_urologie
337e4392-2bf8-9871-a5a9-74a223a6db02	99	77897cdf-2089-da9a-cb6e-c3969be80695	Péritonite méconiale (résection-anastomose / stomie)	Péritonite méconiale	3	2	5	3	5	t	3	3	5	viscerale_urologie
377f0285-0852-5876-8cd9-47d472301ec5	42	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Hypospadias moyen (TIP/Snodgrass)	Hypospadias moyen	3	2	5	3	5	t	3	3	5	viscerale_urologie
386c030e-3802-e840-2b27-19acdf7a594c	109	5d28c384-ce0b-7215-8f01-263b1140a981	Résection intestinale avec stomie	Résection intestinale	3	2	5	3	5	t	3	3	5	viscerale_urologie
3a998ae7-3c41-fe37-8eb3-db8caf61c5f4	65	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Urétéroscopie / extraction endoscopique	Lithiase urinaire	1	1	0	0	0	t	1	1	1	viscerale_urologie
37e28f86-de9a-fa11-0ba1-c7b6412d06a6	71	45404103-0e11-ea18-3661-d6f78e0b4bcf	Lymphangiome kystique cervical (exérèse)	Lymphangiome kystique	3	2	5	3	5	t	3	3	5	viscerale_urologie
3844fce2-61f3-ab1a-5f24-e47a9d13b2ff	20	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Dilatation urétrale	Dilatation urétrale	3	2	5	3	5	t	3	3	3	viscerale_urologie
3eda4d3a-0f3b-5ec7-5f47-b5f7a538fa1c	22	77897cdf-2089-da9a-cb6e-c3969be80695	Entérocolite ulcéro-nécrosante (laparotomie / résection / stomie)	Entérocolite ulcéro-nécrosante	2	2	5	0	0	t	2	5	4	viscerale_urologie
42289632-89e2-0c30-976d-457396832fc7	60	45404103-0e11-ea18-3661-d6f78e0b4bcf	Fistule bronchogénique / duplication bronchique (exérèse)	Kystes et fistules bronchiales	3	2	5	3	5	t	3	3	5	viscerale_urologie
4729484e-30cc-04e2-0d31-d9e170c404bc	119	3a58ece7-912a-1422-2158-e4a498c3eab0	Thoracotomie exploratrice	Thoracotomie	3	2	5	3	5	t	3	3	5	viscerale_urologie
7f8b5e63-b4d8-7844-caf5-a65d69c4f0b4	59	45404103-0e11-ea18-3661-d6f78e0b4bcf	Kyste bronchogénique (exérèse)	Kystes et fistules bronchiales	3	2	5	3	5	t	3	3	5	viscerale_urologie
7ff8cf4a-a92c-7c53-e393-753e0677a09f	84	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Néphrectomie partielle par laparotomie	Néphrectomie	2	2	2	0	0	t	2	2	4	viscerale_urologie
82e17dbd-918f-e4a6-a7ee-2abfe9dc4fc5	49	5d28c384-ce0b-7215-8f01-263b1140a981	Invagination intestinale aiguë (réduction pneumatique)	Invagination intestinale aigue	3	2	5	3	5	t	3	3	4	viscerale_urologie
836c51f4-b553-82d1-d465-f9af2159bc74	120	3a58ece7-912a-1422-2158-e4a498c3eab0	Thoracotomie pour kyste médiastinal / pulmonaire	Thoracotomie pour kyste	3	2	5	3	5	t	3	3	5	viscerale_urologie
8838b9e9-5cdb-87b1-2345-0847530213ff	130	32b8eb60-1e1f-1b99-2e48-d8aa10d60df0	Varicocèle coelio	Varicocèle coelio	3	2	5	3	5	t	3	3	5	viscerale_urologie
904732a0-8b80-c705-7697-e4df47523000	27	45404103-0e11-ea18-3661-d6f78e0b4bcf	Fente palatine	Fentes palatines	2	2	2	0	0	t	2	2	4	viscerale_urologie
735d68c7-cf7d-1bd4-b249-e361318f36ba	100	5d28c384-ce0b-7215-8f01-263b1140a981	Péritonite appendiculaire (lavage-drainage)	Péritonites	3	0	0	3	5	t	3	3	3	viscerale_urologie
8f95cacf-df4c-b489-e5fd-eac66dea1a4b	23	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Epispadias	Epispadias	1	1	0	0	0	t	1	1	1	viscerale_urologie
fd496a91-3bc0-24ae-19a1-5bc72ad538fe	86	5a5bbcaa-e186-6aed-695d-7b970beb3ec6	Néphréctomie totale élargie	Néphroblastome	1	1	0	0	0	t	1	1	1	viscerale_urologie
4ad39ae0-787b-f3f0-bef7-10f422670c17	81	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Montée endoscopique de sonde urétérale	Montée endoscopique de sonde urétérale	3	2	5	3	5	t	3	3	4	viscerale_urologie
4d6bc98d-5228-e200-08db-482063792f61	26	45404103-0e11-ea18-3661-d6f78e0b4bcf	Fente labiale bilatérale	Fentes labiales	2	2	2	0	0	t	2	2	4	viscerale_urologie
50acb11b-f337-2be5-e5fa-2c49e197289d	10	412f26d7-e954-5150-5c07-0574c7f3fc1c	Cholécystectomie	Cholécystectomie	3	2	5	3	5	t	3	3	5	viscerale_urologie
52d64dde-5f70-54fb-355f-25d3ddfe4a28	98	77897cdf-2089-da9a-cb6e-c3969be80695	Péritonite méconiale (lavage + drainage)	Péritonite méconiale	3	2	5	3	5	t	3	3	5	viscerale_urologie
5422151b-05d0-7cb3-30e8-8660544c4b53	73	412f26d7-e954-5150-5c07-0574c7f3fc1c	Maladie de Hirschsprung (biopsie rectale)	Maladie d’Hirschsprung	3	2	5	3	5	t	3	3	5	viscerale_urologie
57cc561b-7efd-fede-da47-d439bfb4406b	37	32b8eb60-1e1f-1b99-2e48-d8aa10d60df0	Hernie ombilicale	Hernie ombilicale	3	2	5	3	5	t	3	3	3	viscerale_urologie
59703dca-87fe-b5eb-4a94-d9956cfaaf6c	58	45404103-0e11-ea18-3661-d6f78e0b4bcf	Kyste thyréoglosse	Kyste thyréoglosse	3	2	5	3	5	t	3	3	5	viscerale_urologie
5a3c286b-34a0-0ff8-c396-57b3e3910e03	56	4c8ff9f7-9a09-06b7-831e-70fae96084bb	Kyste ovarien (kystectomie)	Kyste ovarien	3	2	5	3	5	t	3	3	5	viscerale_urologie
5a4dd532-c32c-83b7-c946-0ff2adf9a96e	55	3a58ece7-912a-1422-2158-e4a498c3eab0	Kyste hydatique du poumon compliqué (résection atypique / lobectomie selon cas)	Kyste hydatique du poumon	3	2	5	3	5	t	3	3	5	viscerale_urologie
5d591937-8472-92f0-1e4a-26e392c668d8	6	412f26d7-e954-5150-5c07-0574c7f3fc1c	Atrésie des voies biliaires (Biopsie hépatique)	Atrésie des voies biliaires	2	2	2	0	0	t	2	2	4	viscerale_urologie
62dc0831-db57-d8b8-0f53-d0ccdafaadd8	14	412f26d7-e954-5150-5c07-0574c7f3fc1c	Colostomie transverse	Dérivation digestive	3	2	5	3	5	t	3	3	4	viscerale_urologie
65dda049-83a7-ad90-32d9-446945cd3803	117	32b8eb60-1e1f-1b99-2e48-d8aa10d60df0	Testicule non descendu palpable (orchidopexie inguinale)	Testicule non descendu	3	2	5	3	5	t	3	3	3	viscerale_urologie
67be8c16-3517-6e2c-31cb-e8579be09f23	11	32b8eb60-1e1f-1b99-2e48-d8aa10d60df0	Circoncision	Circoncision	3	2	5	3	5	t	3	5	2	viscerale_urologie
68178893-9b13-241e-9d03-d7578e07b1ea	5	412f26d7-e954-5150-5c07-0574c7f3fc1c	Atrésie des voies biliaires Cholangiographie	Atrésie des voies biliaires	2	2	2	0	0	t	2	2	4	viscerale_urologie
6e8082d5-4253-749a-4abf-58657e0cf145	114	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Pyéloplastie	Syndrome de la jonction	3	2	5	3	5	t	3	3	5	viscerale_urologie
73011bea-c68f-9743-b842-c77337707092	127	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Urétérostomie	Urétérostomie	3	2	5	3	5	t	3	3	4	viscerale_urologie
79cda60f-990e-ce43-95b7-f14586185aae	45	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Hypospadias postérieur (Duckett)	Hypospadias postérieur	2	2	2	0	0	t	2	2	4	viscerale_urologie
7b4a615e-6914-9b13-5dbb-c0b1e5592e1a	18	9fe0a6c3-41f9-747f-3f10-81e0ad237943	Mise en place d'un cystocatheter	Dérivation vésicale incontinente	3	2	5	3	5	t	3	3	4	viscerale_urologie
7df60091-ac01-cd29-b556-cb85739b0d65	63	5d28c384-ce0b-7215-8f01-263b1140a981	Cœlioscopie diagnostique	Laparoscopie	3	2	5	3	5	t	3	3	4	viscerale_urologie
7e509ee6-02d7-d97c-0f26-26d0035f864f	8	77897cdf-2089-da9a-cb6e-c3969be80695	Atrésie duodénale	Atrésie duodénale	2	2	5	0	0	t	2	5	4	viscerale_urologie
7fbd479e-71c5-efc1-9678-c3e77fb14d93	70	4c8ff9f7-9a09-06b7-831e-70fae96084bb	Lymphangiome profond (exérèse)	Lymphangiome	3	2	5	3	5	t	3	3	5	viscerale_urologie
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, full_name, role, residanat_start_date, promotion, is_active, created_at, updated_at, service) FROM stdin;
37a6a380-6a67-4df7-9d7d-f55048d19497	Zakarya Alami Hassani	resident	2023-07-04		t	2026-04-06 00:33:12.996697+00	2026-04-20 12:06:57.561114+00	\N
a9f17afd-2b60-47c5-9fe5-e02b2bc4e705	Nizar Choukri	resident	2025-05-05	\N	t	2026-04-20 12:17:57.923697+00	2026-04-20 12:17:58.100228+00	\N
a201d07a-bc49-4138-b9b8-b2f07957b319	Ilyass El Badan	resident	2025-05-05	\N	t	2026-04-20 12:18:26.613564+00	2026-04-20 12:18:26.766414+00	\N
160ffc09-0b4c-4699-8957-bd99b9ef0c00	Safae Saidi Alaoui	resident	2025-05-05	\N	t	2026-04-20 12:18:56.228924+00	2026-04-20 12:18:56.36622+00	\N
710c7ae1-b26a-434c-ab74-f32082584799	Mohamed Reda  Boulaakoul	resident	2024-05-05	\N	t	2026-04-20 12:20:38.626201+00	2026-04-20 12:20:38.813904+00	\N
c8800173-b3ad-4bdc-bcfa-339423893d82	Abdelmajid EL GHOUZLI	resident	2024-05-05	\N	t	2026-04-20 12:39:04.97547+00	2026-04-20 12:39:05.53869+00	\N
a9b3ca2a-672d-439f-91cd-ef17d5df0a3a	Sami Bakkali	resident	2024-05-05	\N	t	2026-04-20 12:39:27.055901+00	2026-04-20 12:39:27.368611+00	\N
8e11e081-4d4a-4ec3-9e11-23fba7650bed	Oussama Kchich	resident	2024-05-05	\N	t	2026-04-20 12:39:58.806063+00	2026-04-20 12:39:59.136215+00	\N
06840608-8341-418c-81d5-e3b241c18055	Nisrine Belcaid	resident	2024-05-05	\N	t	2026-04-20 12:40:21.190904+00	2026-04-20 12:40:21.347309+00	\N
86e5b80c-0e01-4faa-b569-826e4962c57c	Marwane Tahiri	resident	2021-05-05	\N	t	2026-04-20 12:40:52.317513+00	2026-04-20 12:40:53.055569+00	\N
b551aa5c-9919-45c9-bdaa-0938912e9339	Ismail Bajji	resident	2022-05-05	\N	t	2026-04-20 12:41:46.312583+00	2026-04-20 12:41:46.692774+00	\N
32725c72-31cb-4120-a007-c925037e2e8e	Mehdi Ouhallab	resident	2025-05-05	\N	t	2026-04-20 12:42:21.773075+00	2026-04-20 12:42:21.935006+00	\N
10735af6-64f4-496f-93ef-8703acef0ae2	Salma Erroni	resident	2023-05-05	\N	t	2026-04-20 12:42:55.126068+00	2026-04-20 12:42:55.287512+00	\N
2f8eb962-b393-4ed0-bd11-f4b2899f13e3	Manal Chami	resident	2021-05-05	\N	t	2026-04-20 12:43:23.671164+00	2026-04-20 12:43:23.816549+00	\N
a05fdaee-0b96-4a78-b79c-e78b894084ad	Fatiha Mizal	resident	2025-05-05	\N	t	2026-04-20 12:43:51.348567+00	2026-04-20 12:43:51.86808+00	\N
2ecc6c4f-11c7-4e08-9bd3-717a6bcbf62c	Ahmed Berchida	resident	2024-05-05	\N	t	2026-04-20 12:44:23.727118+00	2026-04-20 12:44:23.876802+00	\N
a572a776-649b-4958-a68e-d2b8e0618df4	Reda El Baraka	resident	2025-05-05	\N	t	2026-04-20 12:44:49.996958+00	2026-04-20 12:44:50.185737+00	\N
c3cef922-184a-4b80-a524-1ab1df01b242	Chaymae El Bourakkadi	resident	2021-05-05	\N	t	2026-04-20 12:45:24.34706+00	2026-04-20 12:45:24.590168+00	\N
4538320c-ed3b-4228-900f-2d1bddd251ec	Omar Dalero	resident	2025-05-05	\N	t	2026-04-20 13:29:14.912564+00	2026-04-20 13:29:15.074477+00	\N
f0c41500-05fc-452e-9792-c56a84c63fd4	hajar.wart	admin	\N	\N	t	2026-05-14 18:58:07.423018+00	2026-05-14 18:58:35.874195+00	\N
8e1f9deb-262d-4bce-8223-5c3418610fa7	Test test	resident	2022-03-01	\N	t	2026-05-21 21:50:04.034163+00	2026-05-21 21:50:04.276915+00	\N
457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	Zakarya Alami Hassani	enseignant	\N	\N	t	2026-04-06 00:34:52.789699+00	2026-06-03 12:21:29.254905+00	viscerale_urologie
9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	Omar Dalero	enseignant	\N	\N	t	2026-04-20 12:17:22.847873+00	2026-06-03 12:21:29.254905+00	viscerale_urologie
c38d267d-e4c5-42da-8546-7a31f502b021	Saad Andaloussi	enseignant	\N	\N	t	2026-04-20 12:45:56.058811+00	2026-06-03 12:21:29.254905+00	viscerale_urologie
4550722a-08a3-429d-98aa-dd8de14d5ed2	Aziz El Madi	enseignant	\N	\N	t	2026-04-28 11:46:53.74019+00	2026-06-03 12:21:29.254905+00	viscerale_urologie
7edc9937-8d31-4c92-a31d-eb975ddbadf8	Saad annattah	enseignant	\N	\N	t	2026-04-30 11:03:20.043245+00	2026-06-03 12:21:29.254905+00	viscerale_urologie
5a36e5ff-30c5-4b08-a21a-b9a74a23e279	test enseignant	enseignant	\N	\N	t	2026-05-21 21:50:30.426026+00	2026-06-03 12:21:29.254905+00	viscerale_urologie
f9c64108-3651-4e55-9104-e2e0bfe8f984	Hind Aboueljaoud	enseignant	\N	\N	t	2026-06-03 12:34:57.987386+00	2026-06-03 12:34:58.276333+00	traumato_orthopedie
3f622bd5-218d-4f92-bf49-71c92fb03940	Test resident	resident	2024-07-08	\N	t	2026-07-08 20:03:02.106952+00	2026-07-08 20:03:02.490865+00	\N
59c9e6e2-1906-4b98-9190-b8b869bc7cca	Test prof	enseignant	\N	\N	t	2026-07-08 20:03:35.107542+00	2026-07-08 20:03:35.425169+00	viscerale_urologie
\.


--
-- Data for Name: realisations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.realisations (id, resident_id, procedure_id, enseignant_id, superviseur_resident_id, activity_type, performed_at, resident_year_at_time, ipp_patient, compte_rendu, commentaire, status, is_hors_objectifs, created_at, updated_at) FROM stdin;
b73bb582-9131-49bd-9cf1-719179430eb8	37a6a380-6a67-4df7-9d7d-f55048d19497	1696cc39-c819-de90-9090-192bb831a311	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	\N	supervise	2026-05-11	3	99000000	\N	\N	validated	t	2026-05-11 09:46:15.645449+00	2026-05-11 09:46:15.645449+00
7663b62b-1ed1-45d7-9bfa-34e27871070e	37a6a380-6a67-4df7-9d7d-f55048d19497	a657987e-2ee1-c384-d86d-4b3eb02c6dd9	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	\N	autonome	2026-05-11	3	900000	\N	\N	validated	f	2026-05-11 09:36:36.245354+00	2026-05-11 09:36:36.245354+00
3ed8fea9-77d2-4bd9-bef5-53c19155147b	37a6a380-6a67-4df7-9d7d-f55048d19497	0f0a58dc-f194-2907-b28b-c17f85ab87a7	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	\N	autonome	2026-05-11	3	90000000	\N	\N	validated	f	2026-05-11 10:17:52.988181+00	2026-05-11 10:17:52.988181+00
f445a175-4f98-4289-a7a7-0fff029f2231	37a6a380-6a67-4df7-9d7d-f55048d19497	d3d59e45-4361-1ef0-1c54-75f92a9d8b81	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	\N	expose	2026-05-11	3	9000000	\N	\N	validated	t	2026-05-11 11:05:40.781305+00	2026-05-11 11:05:40.781305+00
98346776-a19d-4e11-bf30-ff6ff48359e4	37a6a380-6a67-4df7-9d7d-f55048d19497	0f0a58dc-f194-2907-b28b-c17f85ab87a7	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	\N	autonome	2026-05-11	3	900000000	zgkjepgj"pgeal	agrmegkpo"mkgreq	validated	f	2026-05-11 11:04:32.465871+00	2026-05-11 11:04:32.465871+00
f587f806-71c5-43c3-b849-2c81f9608eab	37a6a380-6a67-4df7-9d7d-f55048d19497	a8f28e08-dcfa-9839-a59a-54ef68bedd57	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	\N	supervise	2026-05-14	3	500000000	\N	\N	validated	f	2026-05-14 18:52:35.743631+00	2026-05-14 18:52:35.743631+00
95cb3f72-c26a-4dc2-bcec-479fe1647e24	37a6a380-6a67-4df7-9d7d-f55048d19497	a8f28e08-dcfa-9839-a59a-54ef68bedd57	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	\N	supervise	2026-05-14	3	5000000000	\N	\N	validated	f	2026-05-14 18:52:19.086172+00	2026-05-14 18:52:19.086172+00
7bef7bae-957b-4199-9c47-aa9c18710ba3	37a6a380-6a67-4df7-9d7d-f55048d19497	a8f28e08-dcfa-9839-a59a-54ef68bedd57	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	\N	supervise	2026-05-14	3	\N	\N	\N	validated	f	2026-05-14 18:51:59.824671+00	2026-05-14 18:51:59.824671+00
97869407-c687-4607-9430-01e6f84a02cb	37a6a380-6a67-4df7-9d7d-f55048d19497	a8f28e08-dcfa-9839-a59a-54ef68bedd57	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	4538320c-ed3b-4228-900f-2d1bddd251ec	supervise	2026-05-14	3	3000000000	\N	\N	validated	f	2026-05-14 18:51:39.455646+00	2026-05-14 18:51:39.455646+00
8dbe02a6-223f-464e-9175-734b700ad546	37a6a380-6a67-4df7-9d7d-f55048d19497	a8f28e08-dcfa-9839-a59a-54ef68bedd57	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	8e11e081-4d4a-4ec3-9e11-23fba7650bed	supervise	2026-05-14	3	5000000	\N	\N	validated	f	2026-05-14 18:51:20.549842+00	2026-05-14 18:51:20.549842+00
b3769bbd-7e6e-46b9-a1ac-d64e4dc30204	37a6a380-6a67-4df7-9d7d-f55048d19497	0f0a58dc-f194-2907-b28b-c17f85ab87a7	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	\N	autonome	2026-05-14	3	600000000	\N	\N	validated	f	2026-05-14 18:49:32.925229+00	2026-05-14 18:49:32.925229+00
5be31102-8daa-454e-9a8c-7626ceb43710	37a6a380-6a67-4df7-9d7d-f55048d19497	a8f28e08-dcfa-9839-a59a-54ef68bedd57	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	\N	autonome	2026-05-14	3	\N	\N	\N	validated	f	2026-05-14 18:51:00.056403+00	2026-05-14 18:51:00.056403+00
db9ee2d9-e8ff-49c7-8cfb-4395f0916630	37a6a380-6a67-4df7-9d7d-f55048d19497	a8f28e08-dcfa-9839-a59a-54ef68bedd57	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	\N	autonome	2026-05-14	3	6000000	\N	\N	validated	f	2026-05-14 18:54:21.572995+00	2026-05-14 18:54:21.572995+00
77a8a39d-055a-48d6-8873-fd399032fa54	37a6a380-6a67-4df7-9d7d-f55048d19497	f622586f-9fdd-3d0b-5cab-78a517d517a7	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	\N	autonome	2026-05-14	3	9000000000000	\N	\N	validated	f	2026-05-14 18:50:09.49313+00	2026-05-14 18:50:09.49313+00
a2655108-d096-43ec-8089-e40dbf318e0e	37a6a380-6a67-4df7-9d7d-f55048d19497	a657987e-2ee1-c384-d86d-4b3eb02c6dd9	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	\N	autonome	2026-05-14	3	9000000000	\N	\N	validated	f	2026-05-14 19:43:02.506365+00	2026-05-14 19:43:02.506365+00
25ed635c-23cb-41c9-986e-5f6ea6eb6fe1	37a6a380-6a67-4df7-9d7d-f55048d19497	a657987e-2ee1-c384-d86d-4b3eb02c6dd9	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	\N	autonome	2026-05-15	3	900000000	\N	\N	validated	f	2026-05-15 23:04:32.466621+00	2026-05-15 23:04:32.466621+00
0578b2f7-0b1e-40b4-ae2e-809263e28344	37a6a380-6a67-4df7-9d7d-f55048d19497	a657987e-2ee1-c384-d86d-4b3eb02c6dd9	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	\N	autonome	2026-05-15	3	\N	\N	\N	validated	f	2026-05-15 14:21:09.553983+00	2026-05-15 14:21:09.553983+00
9c6c2976-51af-4ba3-aae1-1cf38a261cd5	37a6a380-6a67-4df7-9d7d-f55048d19497	c629a239-a497-493c-9468-3bbd85aefc84	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	\N	autonome	2026-05-18	3	5748494	\N	\N	validated	t	2026-05-18 08:22:00.318354+00	2026-05-18 08:22:00.318354+00
b6107dc4-6038-4b9a-96e8-fa9bd9d01023	37a6a380-6a67-4df7-9d7d-f55048d19497	735d68c7-cf7d-1bd4-b249-e361318f36ba	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	\N	autonome	2026-05-18	3	9000000	\N	\N	validated	f	2026-05-18 08:18:23.270826+00	2026-05-18 08:18:23.270826+00
f5a94b4f-9b05-4fd1-841a-ceb546784877	37a6a380-6a67-4df7-9d7d-f55048d19497	9751168f-cd78-7aa2-64be-fdf85be6a3dd	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	\N	autonome	2026-05-19	3	45789	\N	\N	pending	t	2026-05-19 11:52:11.645541+00	2026-05-19 11:52:11.645541+00
75a7c975-e2f3-4ecf-9a7c-f2b47acd2249	37a6a380-6a67-4df7-9d7d-f55048d19497	a657987e-2ee1-c384-d86d-4b3eb02c6dd9	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	\N	autonome	2026-05-19	3	90000000	\N	\N	validated	f	2026-05-19 11:47:53.912794+00	2026-05-19 11:47:53.912794+00
fb69352b-eb7f-48ef-825f-09579da94ee6	37a6a380-6a67-4df7-9d7d-f55048d19497	a5a2170b-61a4-4979-b479-84fe98936dd8	f9c64108-3651-4e55-9104-e2e0bfe8f984	\N	expose	2026-06-03	3	ezfa	\N	\N	validated	f	2026-06-03 13:17:09.312874+00	2026-06-03 13:17:09.312874+00
904bb2da-f5fb-4695-a90d-dbd6964131b2	3f622bd5-218d-4f92-bf49-71c92fb03940	a657987e-2ee1-c384-d86d-4b3eb02c6dd9	59c9e6e2-1906-4b98-9190-b8b869bc7cca	\N	autonome	2026-07-08	3	110000	\N	\N	pending	f	2026-07-08 20:04:37.101198+00	2026-07-08 20:04:37.101198+00
ea892393-93af-4673-aab3-4059ca813414	3f622bd5-218d-4f92-bf49-71c92fb03940	735d68c7-cf7d-1bd4-b249-e361318f36ba	59c9e6e2-1906-4b98-9190-b8b869bc7cca	\N	supervise	2026-07-08	3	203494939	\N	\N	pending	f	2026-07-08 20:05:01.658391+00	2026-07-08 20:05:01.658391+00
\.


--
-- Data for Name: travail_auteurs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.travail_auteurs (id, travail_id, profile_id, external_name, author_order, created_at) FROM stdin;
0521f9a9-94bc-4d6b-b405-ffeefbdba0fc	0429a4ef-1bf8-4dc9-ac27-757fe7b6742e	4550722a-08a3-429d-98aa-dd8de14d5ed2	\N	0	2026-05-13 19:56:56.388251+00
997d6053-ab4c-47ea-82c2-af3216d7bf3e	0429a4ef-1bf8-4dc9-ac27-757fe7b6742e	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	\N	1	2026-05-13 19:56:56.388251+00
ebfcea38-e6a5-4894-b24a-4172f28fa4ac	0429a4ef-1bf8-4dc9-ac27-757fe7b6742e	c38d267d-e4c5-42da-8546-7a31f502b021	\N	2	2026-05-13 19:56:56.388251+00
139dc612-18ae-4602-94df-ec52d6f061f1	8bd8753a-04b8-4f4a-8824-0f50b5339242	4550722a-08a3-429d-98aa-dd8de14d5ed2	\N	0	2026-05-13 20:24:54.728445+00
f15517e7-69fa-40d7-91e2-c303e77b1bd4	8bd8753a-04b8-4f4a-8824-0f50b5339242	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	\N	1	2026-05-13 20:24:54.728445+00
35c60341-82b2-4edd-ba74-299c295fe7f8	8bd8753a-04b8-4f4a-8824-0f50b5339242	c38d267d-e4c5-42da-8546-7a31f502b021	\N	2	2026-05-13 20:24:54.728445+00
1b8c7b47-1007-4dc1-a5d5-b2257db1b9d9	8bd8753a-04b8-4f4a-8824-0f50b5339242	7edc9937-8d31-4c92-a31d-eb975ddbadf8	\N	3	2026-05-13 20:24:54.728445+00
edc18d05-950a-4b64-a31d-77cfcb216033	8bd8753a-04b8-4f4a-8824-0f50b5339242	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	\N	4	2026-05-13 20:24:54.728445+00
5a36dc28-8a74-4f24-ab62-e5f7bd09153d	917b9cf2-5d10-40ec-b34c-59ecdbf1440b	37a6a380-6a67-4df7-9d7d-f55048d19497	\N	0	2026-05-13 20:58:03.499756+00
2612efb2-4584-4907-8bdd-0a288a830a65	917b9cf2-5d10-40ec-b34c-59ecdbf1440b	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	\N	1	2026-05-13 20:58:03.499756+00
19a5e7be-c2a6-44b7-986a-9de79bd82d95	917b9cf2-5d10-40ec-b34c-59ecdbf1440b	4550722a-08a3-429d-98aa-dd8de14d5ed2	\N	2	2026-05-13 20:58:03.499756+00
979a4d2e-9aa2-40a8-9eb7-14e2fa0dd51e	917b9cf2-5d10-40ec-b34c-59ecdbf1440b	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	\N	3	2026-05-13 20:58:03.499756+00
6fb76d15-b68e-4515-ae30-e8921b20605a	917b9cf2-5d10-40ec-b34c-59ecdbf1440b	c38d267d-e4c5-42da-8546-7a31f502b021	\N	4	2026-05-13 20:58:03.499756+00
0d0a9821-1a37-46a1-8ba0-f14809bb5cac	917b9cf2-5d10-40ec-b34c-59ecdbf1440b	7edc9937-8d31-4c92-a31d-eb975ddbadf8	\N	5	2026-05-13 20:58:03.499756+00
e84a7e9d-d00b-489b-9b32-6700e34da352	b2653ba0-199b-4fcd-946e-f0aa20565843	37a6a380-6a67-4df7-9d7d-f55048d19497	\N	0	2026-05-13 21:12:01.725294+00
cb7287c4-c3bc-42e0-93b5-f0f112487c90	b2653ba0-199b-4fcd-946e-f0aa20565843	4550722a-08a3-429d-98aa-dd8de14d5ed2	\N	1	2026-05-13 21:12:01.725294+00
d44edf92-c0cf-4d8f-9c91-49e5872b3a27	b2653ba0-199b-4fcd-946e-f0aa20565843	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	\N	2	2026-05-13 21:12:01.725294+00
125f3de2-ddbd-4ace-88d7-f344947f717e	b2653ba0-199b-4fcd-946e-f0aa20565843	c38d267d-e4c5-42da-8546-7a31f502b021	\N	3	2026-05-13 21:12:01.725294+00
60929715-425f-44d0-923a-ac078145cba7	d58dd7bf-474b-46c8-a391-bb81da956e14	37a6a380-6a67-4df7-9d7d-f55048d19497	\N	0	2026-05-13 21:16:18.613698+00
610287aa-2f6f-46c5-8151-c9a2f59c7e7e	d58dd7bf-474b-46c8-a391-bb81da956e14	4550722a-08a3-429d-98aa-dd8de14d5ed2	\N	1	2026-05-13 21:16:18.613698+00
d1f4ad08-e4b0-4ebc-bbf1-0be7754d2625	d58dd7bf-474b-46c8-a391-bb81da956e14	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	\N	2	2026-05-13 21:16:18.613698+00
b518be74-f0aa-4e62-be0b-597dbd9d6b2d	ed865e20-702c-4fb9-b7b9-505b0633c458	37a6a380-6a67-4df7-9d7d-f55048d19497	\N	0	2026-05-13 21:24:32.505375+00
9c68650a-122a-4ba4-b75f-cd9959a104b3	ed865e20-702c-4fb9-b7b9-505b0633c458	06840608-8341-418c-81d5-e3b241c18055	\N	1	2026-05-13 21:24:32.505375+00
4b12b50c-957e-4fa8-a045-f0078be2964c	ed865e20-702c-4fb9-b7b9-505b0633c458	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	\N	2	2026-05-13 21:24:32.505375+00
6f7a3595-9221-42e1-88cd-b53c72801439	ed865e20-702c-4fb9-b7b9-505b0633c458	4550722a-08a3-429d-98aa-dd8de14d5ed2	\N	3	2026-05-13 21:24:32.505375+00
b2e43563-256e-4607-83cb-995c0747d56b	8773f403-43ef-4e37-8f4d-0eaabda8f1e9	37a6a380-6a67-4df7-9d7d-f55048d19497	\N	0	2026-05-13 21:31:02.932108+00
a27301c4-4761-41b6-8f5c-17614d9a5218	8773f403-43ef-4e37-8f4d-0eaabda8f1e9	710c7ae1-b26a-434c-ab74-f32082584799	\N	1	2026-05-13 21:31:02.932108+00
7c18c703-87a8-47f4-bafb-e02d3cc7954b	8773f403-43ef-4e37-8f4d-0eaabda8f1e9	4550722a-08a3-429d-98aa-dd8de14d5ed2	\N	2	2026-05-13 21:31:02.932108+00
f34aa463-4ae0-4c2b-8426-9ecd906e333d	8773f403-43ef-4e37-8f4d-0eaabda8f1e9	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	\N	3	2026-05-13 21:31:02.932108+00
1ea4b95c-96cc-4f4e-bae3-f6b8202724fb	8773f403-43ef-4e37-8f4d-0eaabda8f1e9	c38d267d-e4c5-42da-8546-7a31f502b021	\N	4	2026-05-13 21:31:02.932108+00
4e85b219-e101-4725-9529-05ae6a3595b5	ba678f61-7b99-4118-8f7d-68a5866e4fae	4550722a-08a3-429d-98aa-dd8de14d5ed2	\N	0	2026-05-15 21:48:25.836098+00
a26d30da-1235-41ac-8766-e6f992142e8d	ba678f61-7b99-4118-8f7d-68a5866e4fae	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	\N	1	2026-05-15 21:48:25.836098+00
eb29e25c-09d0-4377-be58-b3866ba2f075	ba678f61-7b99-4118-8f7d-68a5866e4fae	c38d267d-e4c5-42da-8546-7a31f502b021	\N	2	2026-05-15 21:48:25.836098+00
2b144cee-bd34-455f-b65f-9013fb7f88e9	ba678f61-7b99-4118-8f7d-68a5866e4fae	2ecc6c4f-11c7-4e08-9bd3-717a6bcbf62c	\N	3	2026-05-15 21:48:25.836098+00
1769145c-9b2f-4f5a-8c13-10b2c8aa925f	58d833d5-8df6-4dda-8812-d36b41c6c659	37a6a380-6a67-4df7-9d7d-f55048d19497	\N	0	2026-05-15 21:49:48.366664+00
af3b0dd9-7127-4e5a-be77-9a60b3de7e49	58d833d5-8df6-4dda-8812-d36b41c6c659	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	\N	1	2026-05-15 21:49:48.366664+00
6189e004-fc68-4860-a8ff-8c236175aadf	58d833d5-8df6-4dda-8812-d36b41c6c659	c38d267d-e4c5-42da-8546-7a31f502b021	\N	2	2026-05-15 21:49:48.366664+00
f04d8e5f-c3fb-49d9-97b9-eb2d59d13d11	58d833d5-8df6-4dda-8812-d36b41c6c659	4550722a-08a3-429d-98aa-dd8de14d5ed2	\N	3	2026-05-15 21:49:48.366664+00
d2dc7f54-9cf6-4839-881f-642d3cc69b03	1e96d12c-05f3-4f71-ab88-3711729a2d66	37a6a380-6a67-4df7-9d7d-f55048d19497	\N	0	2026-05-15 23:05:08.485586+00
694a925c-0cf6-4161-b51e-20877c66185e	1e96d12c-05f3-4f71-ab88-3711729a2d66	32725c72-31cb-4120-a007-c925037e2e8e	\N	1	2026-05-15 23:05:08.485586+00
3eb3dfae-0f04-4ba4-a00b-80dd7142f249	1e96d12c-05f3-4f71-ab88-3711729a2d66	4550722a-08a3-429d-98aa-dd8de14d5ed2	\N	2	2026-05-15 23:05:08.485586+00
773fb2b6-c8da-4232-a136-3890080e7ab9	1e96d12c-05f3-4f71-ab88-3711729a2d66	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	\N	3	2026-05-15 23:05:08.485586+00
5365bb58-81be-4677-9891-7b3c589bc058	1e96d12c-05f3-4f71-ab88-3711729a2d66	c38d267d-e4c5-42da-8546-7a31f502b021	\N	4	2026-05-15 23:05:08.485586+00
590f1350-acbd-4e8a-bcb6-69903bf8cdc0	ec6bfb43-72f7-442f-9fde-b83d774a39a9	4550722a-08a3-429d-98aa-dd8de14d5ed2	\N	0	2026-05-16 23:45:12.774375+00
4f308154-3700-467e-9b8d-e29e7f539669	ec6bfb43-72f7-442f-9fde-b83d774a39a9	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	\N	1	2026-05-16 23:45:12.774375+00
c92b3a6b-2859-4d23-a673-5469f9a14584	ec6bfb43-72f7-442f-9fde-b83d774a39a9	c38d267d-e4c5-42da-8546-7a31f502b021	\N	2	2026-05-16 23:45:12.774375+00
607085e7-dd99-4887-8f94-4a2bce59ffa1	13cb0985-b978-4a9b-821f-74eac6156bc4	37a6a380-6a67-4df7-9d7d-f55048d19497	\N	0	2026-05-18 08:24:45.029348+00
2745b1c4-3e11-4478-a56a-9320d21e020d	13cb0985-b978-4a9b-821f-74eac6156bc4	c38d267d-e4c5-42da-8546-7a31f502b021	\N	1	2026-05-18 08:24:45.029348+00
6f6efcf2-69bb-4d68-857b-7fdc00d0e039	13cb0985-b978-4a9b-821f-74eac6156bc4	7edc9937-8d31-4c92-a31d-eb975ddbadf8	\N	2	2026-05-18 08:24:45.029348+00
ef9c6323-1fb6-4739-8776-46423aa06f06	13cb0985-b978-4a9b-821f-74eac6156bc4	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	\N	3	2026-05-18 08:24:45.029348+00
\.


--
-- Data for Name: travail_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.travail_types (id, name, color_hex, display_order, is_active) FROM stdin;
3e9bfb40-2bde-4a32-a689-f0df13a80e74	Article	#0D2B4E	1	t
c4994bac-e518-4375-98b1-a42c23dfce4d	Communication orale	#166534	2	t
62fb4c05-1035-455f-ab7f-881b382af732	Communication affichée	#854d0e	3	t
\.


--
-- Data for Name: travail_validation_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.travail_validation_history (id, travail_id, enseignant_id, action, feedback, created_at) FROM stdin;
608bc363-1b61-4b51-9a26-ab381ed69253	8bd8753a-04b8-4f4a-8824-0f50b5339242	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	initial_validated	\N	2026-05-13 19:54:33.907598+00
0cd45838-349e-4927-9ac6-7757d140e552	ba678f61-7b99-4118-8f7d-68a5866e4fae	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	initial_validated	\N	2026-05-13 20:05:12.821158+00
94d08813-37d3-4191-9da3-29efe412eeda	0429a4ef-1bf8-4dc9-ac27-757fe7b6742e	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	initial_validated	\N	2026-05-13 20:05:15.825566+00
bb8148e3-0fb8-4546-a015-9d284b29b341	ec6bfb43-72f7-442f-9fde-b83d774a39a9	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	initial_validated	\N	2026-05-13 20:22:20.991196+00
10fba67e-f8b5-49d9-9dd1-b07eaedd72dc	917b9cf2-5d10-40ec-b34c-59ecdbf1440b	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	initial_validated	\N	2026-05-13 21:00:04.620156+00
9c1c2e04-1e78-4ed8-9fd0-26c3802cadeb	8bd8753a-04b8-4f4a-8824-0f50b5339242	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	final_validated	\N	2026-05-13 21:04:48.933524+00
69ac4b65-9411-4f3c-a559-418ce6d7694e	b2653ba0-199b-4fcd-946e-f0aa20565843	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	initial_validated	\N	2026-05-13 21:09:57.671256+00
595f8ded-fc65-449d-a136-46de3b4f39fb	b2653ba0-199b-4fcd-946e-f0aa20565843	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	final_validated	\N	2026-05-13 21:12:41.034346+00
027d3036-5728-46f1-b530-fd9b208c2ab4	d58dd7bf-474b-46c8-a391-bb81da956e14	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	initial_validated	\N	2026-05-13 21:16:36.03586+00
9351f96a-1bbe-45d8-a243-9fa0a170266c	ed865e20-702c-4fb9-b7b9-505b0633c458	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	initial_validated	\N	2026-05-13 21:28:50.182953+00
3860a4ca-dbb2-4353-8cc0-d7d51d0efa41	0429a4ef-1bf8-4dc9-ac27-757fe7b6742e	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	final_validated	\N	2026-05-13 21:29:18.740555+00
5afba38d-fde9-4441-9c70-f9b03c7366e4	8773f403-43ef-4e37-8f4d-0eaabda8f1e9	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	initial_validated	\N	2026-05-13 21:30:29.881435+00
4e6ecd1c-4999-4cf0-8b86-d6cde43a289a	8773f403-43ef-4e37-8f4d-0eaabda8f1e9	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	final_validated	\N	2026-05-13 21:31:26.064609+00
bf33bbd6-d395-40a8-b081-7f96eec1a808	ba678f61-7b99-4118-8f7d-68a5866e4fae	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	final_validated	\N	2026-05-16 16:41:19.137002+00
41fd9273-39a9-49f2-8145-fa8f3bbba391	58d833d5-8df6-4dda-8812-d36b41c6c659	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	initial_validated	\N	2026-05-16 18:47:49.394934+00
bbe4dc11-e7ac-44c8-8ff7-cc3712de50bb	1e96d12c-05f3-4f71-ab88-3711729a2d66	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	initial_validated	\N	2026-05-16 18:47:53.287865+00
b69c2e16-6988-4252-b977-d4eeb79e2a85	ec6bfb43-72f7-442f-9fde-b83d774a39a9	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	final_validated	\N	2026-05-16 23:48:29.422139+00
fb414460-b377-4a51-8058-2f57232e3aad	13cb0985-b978-4a9b-821f-74eac6156bc4	\N	submitted	Soumission initiale	2026-05-18 08:24:45.131222+00
8206748f-f56e-41a1-84ff-ae5777d79825	13cb0985-b978-4a9b-821f-74eac6156bc4	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	initial_validated	\N	2026-05-18 08:25:14.828265+00
\.


--
-- Data for Name: travaux_scientifiques; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.travaux_scientifiques (id, resident_id, type_id, title, journal_or_event, year, authors, doi_or_url, status, created_at, encadrant_id, validation_status, initial_validated_by, initial_validated_at, final_validated_by, final_validated_at, validation_feedback) FROM stdin;
917b9cf2-5d10-40ec-b34c-59ecdbf1440b	37a6a380-6a67-4df7-9d7d-f55048d19497	c4994bac-e518-4375-98b1-a42c23dfce4d	Carcinome	SMCP	2026	Zakarya Alami Hassani, Omar Dalero, Aziz El Madi, Omar Dalero, Saad Andaloussi, Saad annattah		soumis	2026-05-13 20:58:03.363562+00	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	initial_validated	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	2026-05-13 21:00:00.359+00	\N	\N	\N
8bd8753a-04b8-4f4a-8824-0f50b5339242	37a6a380-6a67-4df7-9d7d-f55048d19497	3e9bfb40-2bde-4a32-a689-f0df13a80e74	sigmoid	Case report	2026	Aziz El Madi, Omar Dalero, Saad Andaloussi, Saad annattah, Zakarya Alami Hassani		publie	2026-05-11 11:15:06.001782+00	4550722a-08a3-429d-98aa-dd8de14d5ed2	final_validated	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	2026-05-13 19:54:29.488+00	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	2026-05-13 21:04:44.687+00	\N
b2653ba0-199b-4fcd-946e-f0aa20565843	37a6a380-6a67-4df7-9d7d-f55048d19497	3e9bfb40-2bde-4a32-a689-f0df13a80e74	qazfa	afzcq	2026	Zakarya Alami Hassani, Aziz El Madi, Omar Dalero, Saad Andaloussi	azfcq	publie	2026-05-13 21:09:26.157852+00	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	final_validated	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	2026-05-13 21:09:53.439+00	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	2026-05-13 21:12:36.782+00	\N
d58dd7bf-474b-46c8-a391-bb81da956e14	37a6a380-6a67-4df7-9d7d-f55048d19497	3e9bfb40-2bde-4a32-a689-f0df13a80e74	qfafqscqsx		2026	Zakarya Alami Hassani, Aziz El Madi, Omar Dalero		soumis	2026-05-13 21:16:18.440675+00	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	initial_validated	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	2026-05-13 21:16:31.784+00	\N	\N	\N
ed865e20-702c-4fb9-b7b9-505b0633c458	37a6a380-6a67-4df7-9d7d-f55048d19497	3e9bfb40-2bde-4a32-a689-f0df13a80e74	afaojpjosqcj		2026	Zakarya Alami Hassani, Nisrine Belcaid, Omar Dalero, Aziz El Madi		en_cours	2026-05-13 21:24:32.367398+00	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	initial_validated	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	2026-05-13 21:28:45.931+00	\N	\N	\N
0429a4ef-1bf8-4dc9-ac27-757fe7b6742e	37a6a380-6a67-4df7-9d7d-f55048d19497	c4994bac-e518-4375-98b1-a42c23dfce4d	zetazgtzegqefgeqz	SMCP	2026	Aziz El Madi, Omar Dalero, Saad Andaloussi	\N	presente	2026-05-13 19:56:56.246297+00	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	final_validated	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	2026-05-13 20:05:11.524+00	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	2026-05-13 21:29:14.501+00	\N
8773f403-43ef-4e37-8f4d-0eaabda8f1e9	37a6a380-6a67-4df7-9d7d-f55048d19497	3e9bfb40-2bde-4a32-a689-f0df13a80e74	qvvvvvvvvvvvv	\N	2026	Zakarya Alami Hassani, Mohamed Reda  Boulaakoul, Aziz El Madi, Omar Dalero, Saad Andaloussi	qdaqc	publie	2026-05-13 21:30:00.553776+00	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	final_validated	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	2026-05-13 21:30:25.66+00	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	2026-05-13 21:31:21.847+00	\N
ba678f61-7b99-4118-8f7d-68a5866e4fae	37a6a380-6a67-4df7-9d7d-f55048d19497	3e9bfb40-2bde-4a32-a689-f0df13a80e74	coup de couteau	dafff	2026	Aziz El Madi, Omar Dalero, Saad Andaloussi, Ahmed Berchida	huk	publie	2026-05-13 19:22:10.020978+00	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	final_validated	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	2026-05-13 20:05:08.516+00	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	2026-05-16 16:41:19.194+00	\N
58d833d5-8df6-4dda-8812-d36b41c6c659	37a6a380-6a67-4df7-9d7d-f55048d19497	c4994bac-e518-4375-98b1-a42c23dfce4d	yghlhjlihku		2026	Zakarya Alami Hassani, Omar Dalero, Saad Andaloussi, Aziz El Madi		en_cours	2026-05-15 21:49:48.214654+00	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	initial_validated	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	2026-05-16 18:47:49.556+00	\N	\N	\N
1e96d12c-05f3-4f71-ab88-3711729a2d66	37a6a380-6a67-4df7-9d7d-f55048d19497	3e9bfb40-2bde-4a32-a689-f0df13a80e74	jomilbj		2026	Zakarya Alami Hassani, Mehdi Ouhallab, Aziz El Madi, Omar Dalero, Saad Andaloussi		en_cours	2026-05-15 23:05:08.322088+00	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	initial_validated	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	2026-05-16 18:47:53.47+00	\N	\N	\N
ec6bfb43-72f7-442f-9fde-b83d774a39a9	37a6a380-6a67-4df7-9d7d-f55048d19497	62fb4c05-1035-455f-ab7f-881b382af732	zfaafazffzazf	SMCP	2026	Aziz El Madi, Omar Dalero, Saad Andaloussi	\N	presente	2026-05-13 20:09:56.442501+00	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	final_validated	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	2026-05-13 20:22:16.653+00	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	2026-05-16 23:48:29.794+00	\N
13cb0985-b978-4a9b-821f-74eac6156bc4	37a6a380-6a67-4df7-9d7d-f55048d19497	3e9bfb40-2bde-4a32-a689-f0df13a80e74	Nephro		2026	Zakarya Alami Hassani, Saad Andaloussi, Saad annattah, Omar Dalero		en_cours	2026-05-18 08:24:44.819005+00	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	initial_validated	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	2026-05-18 08:25:14.651+00	\N	\N	\N
\.


--
-- Data for Name: validation_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.validation_history (id, realisation_id, enseignant_id, action, feedback, created_at) FROM stdin;
c1bfbfdd-6317-47f3-b618-d29d4e4e0327	b73bb582-9131-49bd-9cf1-719179430eb8	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	validated		2026-05-11 09:50:46.667678+00
5ddd65ff-31b3-4086-8431-772e8fd75e5b	7663b62b-1ed1-45d7-9bfa-34e27871070e	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	validated		2026-05-11 09:50:59.920812+00
89491bcb-610f-4c4c-bc89-b1961be3a154	3ed8fea9-77d2-4bd9-bef5-53c19155147b	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	submitted	\N	2026-05-11 10:17:53.099473+00
deef25a3-f9e5-42f4-b831-10ad0433fd1d	3ed8fea9-77d2-4bd9-bef5-53c19155147b	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	validated		2026-05-11 10:42:16.312956+00
8db006cb-20cb-44df-80cc-e8a9c6aa2163	98346776-a19d-4e11-bf30-ff6ff48359e4	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	submitted	\N	2026-05-11 11:04:32.586541+00
b9f4fc2c-0807-466b-a151-ec541ab3b529	98346776-a19d-4e11-bf30-ff6ff48359e4	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	resubmitted	\N	2026-05-11 11:04:48.954464+00
3e608fe3-e0f0-4242-b118-68437886c9e4	f445a175-4f98-4289-a7a7-0fff029f2231	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	submitted	\N	2026-05-11 11:05:40.877072+00
a6be100a-c6a2-42b3-9713-a86e166428f6	f445a175-4f98-4289-a7a7-0fff029f2231	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	validated		2026-05-13 19:22:49.557027+00
0fc47e18-54f4-4483-b332-39e25ed06664	98346776-a19d-4e11-bf30-ff6ff48359e4	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	validated		2026-05-13 19:22:54.973479+00
376b55d9-949b-42e8-9132-b07548a32e60	b3769bbd-7e6e-46b9-a1ac-d64e4dc30204	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	submitted	\N	2026-05-14 18:49:32.988898+00
ade99667-45a2-470e-9883-576e20b931c7	77a8a39d-055a-48d6-8873-fd399032fa54	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	submitted	\N	2026-05-14 18:50:09.569146+00
87a15765-718b-4c32-a360-88057104a5db	5be31102-8daa-454e-9a8c-7626ceb43710	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	submitted	\N	2026-05-14 18:51:00.119156+00
633ef219-e47e-4a2f-b7a7-8f00026e662f	8dbe02a6-223f-464e-9175-734b700ad546	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	submitted	\N	2026-05-14 18:51:20.611847+00
ca24296b-02a6-41b9-a8ca-21026cd146a7	97869407-c687-4607-9430-01e6f84a02cb	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	submitted	\N	2026-05-14 18:51:39.52077+00
fe7c5f2b-21cb-4bb4-bcb1-6c7a2777f779	7bef7bae-957b-4199-9c47-aa9c18710ba3	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	submitted	\N	2026-05-14 18:51:59.887222+00
59bc23c7-57ac-4cb3-a3dc-a50dcd09952f	95cb3f72-c26a-4dc2-bcec-479fe1647e24	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	submitted	\N	2026-05-14 18:52:19.151711+00
de10d34b-add6-4d3d-bef2-515adc48e2a4	f587f806-71c5-43c3-b849-2c81f9608eab	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	submitted	\N	2026-05-14 18:52:35.80272+00
e6175699-bc22-499b-8bca-311d95b8bdd3	f587f806-71c5-43c3-b849-2c81f9608eab	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	validated		2026-05-14 18:53:08.00028+00
9e8411c4-2f74-4ea3-94ab-05fe09fdfc85	95cb3f72-c26a-4dc2-bcec-479fe1647e24	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	validated		2026-05-14 18:53:12.605651+00
e55bdc1b-9b3f-4e5f-a6c9-95390da489b8	7bef7bae-957b-4199-9c47-aa9c18710ba3	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	validated		2026-05-14 18:53:16.902687+00
e787dd09-502c-4504-b95e-98f8bfe7adf8	97869407-c687-4607-9430-01e6f84a02cb	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	validated		2026-05-14 18:53:22.331555+00
6e039f43-5497-4d94-a76a-3d34629f787a	8dbe02a6-223f-464e-9175-734b700ad546	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	validated		2026-05-14 18:53:27.104853+00
910e0240-368d-4e47-8033-f6fc965c2e8d	b3769bbd-7e6e-46b9-a1ac-d64e4dc30204	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	validated		2026-05-14 18:53:34.887558+00
d855d85c-a9d5-4940-8400-959c4ca83917	db9ee2d9-e8ff-49c7-8cfb-4395f0916630	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	submitted	\N	2026-05-14 18:54:21.645801+00
9e2161b0-1d59-4035-a165-55e4bea4bea3	5be31102-8daa-454e-9a8c-7626ceb43710	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	validated		2026-05-14 18:54:40.763173+00
c799b8a9-5e5b-4143-b5dc-84a314af6d38	db9ee2d9-e8ff-49c7-8cfb-4395f0916630	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	validated		2026-05-14 18:54:45.342522+00
78becf6e-9101-43d7-8a08-1c824a1c025a	77a8a39d-055a-48d6-8873-fd399032fa54	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	validated		2026-05-14 18:54:51.806654+00
ffd0f31b-4543-4bf4-ae82-76dab9b6a43c	a2655108-d096-43ec-8089-e40dbf318e0e	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	submitted	\N	2026-05-14 19:43:02.585244+00
54d3ff97-ceae-4e58-b8ae-56ec4496f9cd	a2655108-d096-43ec-8089-e40dbf318e0e	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	validated		2026-05-14 19:43:39.9706+00
e7be9d47-383d-42cf-a6c1-413b3f230c3b	0578b2f7-0b1e-40b4-ae2e-809263e28344	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	submitted	\N	2026-05-15 14:21:09.683166+00
3cb5ca07-6059-4dc8-a649-830b05db9471	25ed635c-23cb-41c9-986e-5f6ea6eb6fe1	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	submitted	\N	2026-05-15 23:04:32.556904+00
355679af-b8c5-4b61-990c-f2c967e2b201	25ed635c-23cb-41c9-986e-5f6ea6eb6fe1	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	validated		2026-05-16 18:41:00.037356+00
b9d19e3f-305a-4be3-ad73-d0abc0de5a73	0578b2f7-0b1e-40b4-ae2e-809263e28344	457c2052-a9d6-46ed-ad6f-6910ecbc0d7c	validated		2026-05-17 21:41:02.209548+00
0b099575-5c00-47ee-944c-cf723093a08e	b6107dc4-6038-4b9a-96e8-fa9bd9d01023	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	submitted	\N	2026-05-18 08:18:23.382204+00
f093d9f6-703a-411c-a24e-b22f1c27dad1	9c6c2976-51af-4ba3-aae1-1cf38a261cd5	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	submitted	\N	2026-05-18 08:22:00.456599+00
8e26177f-6706-46b8-9703-214f8bbbabc5	9c6c2976-51af-4ba3-aae1-1cf38a261cd5	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	validated		2026-05-18 08:23:38.496803+00
8b972ca8-0a6a-4b6f-a02d-ed30108a0ae1	b6107dc4-6038-4b9a-96e8-fa9bd9d01023	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	validated		2026-05-18 08:23:50.098437+00
d4b7d959-c5a3-42a4-9864-39a46c2a0bf7	75a7c975-e2f3-4ecf-9a7c-f2b47acd2249	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	submitted	\N	2026-05-19 11:47:54.03743+00
45cc9d7c-5cb4-41b8-9ac6-14ca47e3b0f4	b6107dc4-6038-4b9a-96e8-fa9bd9d01023	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	validated		2026-05-19 11:48:49.512748+00
4d769e75-859e-4f61-8026-858f21a51894	75a7c975-e2f3-4ecf-9a7c-f2b47acd2249	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	validated		2026-05-19 11:49:00.260555+00
28b8ec1f-faae-483e-ab25-8c3eb6013eec	f5a94b4f-9b05-4fd1-841a-ceb546784877	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	submitted	\N	2026-05-19 11:52:11.794864+00
e6be8685-9ca5-45bd-8f26-3be85d531a46	75a7c975-e2f3-4ecf-9a7c-f2b47acd2249	9d3f74f6-9a5d-4929-8498-c6d6e3fc400a	validated		2026-05-19 11:53:06.276336+00
dd0d27c1-9793-47a5-9736-e8c10bd374d5	fb69352b-eb7f-48ef-825f-09579da94ee6	f9c64108-3651-4e55-9104-e2e0bfe8f984	submitted	\N	2026-06-03 13:17:09.396278+00
b812212b-e7fb-4d79-889e-e6a8ce773170	fb69352b-eb7f-48ef-825f-09579da94ee6	f9c64108-3651-4e55-9104-e2e0bfe8f984	validated		2026-06-03 13:17:25.292601+00
df08bb20-e212-4c9d-9617-6edcb76e7227	904bb2da-f5fb-4695-a90d-dbd6964131b2	59c9e6e2-1906-4b98-9190-b8b869bc7cca	submitted	\N	2026-07-08 20:04:37.229836+00
d22d32cc-bdc1-46ef-9468-b07dc2c47a03	ea892393-93af-4673-aab3-4059ca813414	59c9e6e2-1906-4b98-9190-b8b869bc7cca	submitted	\N	2026-07-08 20:05:01.949382+00
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2026-04-05 18:25:22
20211116045059	2026-04-05 18:25:22
20211116050929	2026-04-05 18:25:22
20211116051442	2026-04-05 18:25:22
20211116212300	2026-04-05 18:25:22
20211116213355	2026-04-05 18:25:22
20211116213934	2026-04-05 18:25:22
20211116214523	2026-04-05 18:25:22
20211122062447	2026-04-05 18:25:22
20211124070109	2026-04-05 18:25:22
20211202204204	2026-04-05 18:25:22
20211202204605	2026-04-05 18:25:22
20211210212804	2026-04-05 18:25:22
20211228014915	2026-04-05 18:25:22
20220107221237	2026-04-05 18:25:22
20220228202821	2026-04-05 18:25:22
20220312004840	2026-04-05 18:25:22
20220603231003	2026-04-05 18:25:22
20220603232444	2026-04-05 18:25:22
20220615214548	2026-04-05 22:32:07
20220712093339	2026-04-05 22:32:07
20220908172859	2026-04-05 22:32:07
20220916233421	2026-04-05 22:32:07
20230119133233	2026-04-05 22:32:07
20230128025114	2026-04-05 22:32:07
20230128025212	2026-04-05 22:32:07
20230227211149	2026-04-05 22:32:07
20230228184745	2026-04-05 22:32:07
20230308225145	2026-04-05 22:32:07
20230328144023	2026-04-05 22:32:07
20231018144023	2026-04-05 22:32:07
20231204144023	2026-04-05 22:32:07
20231204144024	2026-04-05 22:32:07
20231204144025	2026-04-05 22:32:07
20240108234812	2026-04-05 22:32:07
20240109165339	2026-04-05 22:32:07
20240227174441	2026-04-05 22:32:07
20240311171622	2026-04-05 22:32:07
20240321100241	2026-04-05 22:32:07
20240401105812	2026-04-05 22:32:07
20240418121054	2026-04-05 22:32:07
20240523004032	2026-04-05 22:32:07
20240618124746	2026-04-05 22:32:07
20240801235015	2026-04-05 22:32:07
20240805133720	2026-04-05 22:32:07
20240827160934	2026-04-05 22:32:07
20240919163303	2026-04-05 22:32:07
20240919163305	2026-04-05 22:32:07
20241019105805	2026-04-05 22:32:07
20241030150047	2026-04-05 22:32:07
20241108114728	2026-04-05 22:32:07
20241121104152	2026-04-05 22:32:07
20241130184212	2026-04-05 22:32:07
20241220035512	2026-04-05 22:32:07
20241220123912	2026-04-05 22:32:07
20241224161212	2026-04-05 22:32:07
20250107150512	2026-04-05 22:32:07
20250110162412	2026-04-05 22:32:07
20250123174212	2026-04-05 22:32:07
20250128220012	2026-04-05 22:32:07
20250506224012	2026-04-05 22:32:07
20250523164012	2026-04-05 22:32:07
20250714121412	2026-04-05 22:32:07
20250905041441	2026-04-05 22:32:07
20251103001201	2026-04-05 22:32:07
20251120212548	2026-04-05 22:32:07
20251120215549	2026-04-05 22:32:07
20260218120000	2026-04-05 22:32:07
20260326120000	2026-04-11 14:34:06
20260514120000	2026-06-03 09:46:09
20260527120000	2026-06-03 09:46:09
20260528120000	2026-06-03 09:46:09
20260603120000	2026-07-08 10:50:26
20260605120000	2026-07-08 10:50:26
20260606110000	2026-07-08 10:50:26
20260616120000	2026-07-08 10:50:27
20260624120000	2026-07-08 10:50:27
20260626120000	2026-07-08 10:50:27
20260706120000	2026-07-08 10:50:27
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at, action_filter, selected_columns) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2026-04-05 18:25:50.645676
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2026-04-05 18:25:50.678563
2	storage-schema	f6a1fa2c93cbcd16d4e487b362e45fca157a8dbd	2026-04-05 18:25:50.681037
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2026-04-05 18:25:50.706131
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2026-04-05 18:25:50.720329
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2026-04-05 18:25:50.723328
6	change-column-name-in-get-size	ded78e2f1b5d7e616117897e6443a925965b30d2	2026-04-05 18:25:50.727
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2026-04-05 18:25:50.730592
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2026-04-05 18:25:50.733268
9	fix-search-function	af597a1b590c70519b464a4ab3be54490712796b	2026-04-05 18:25:50.736496
10	search-files-search-function	b595f05e92f7e91211af1bbfe9c6a13bb3391e16	2026-04-05 18:25:50.739446
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2026-04-05 18:25:50.742576
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2026-04-05 18:25:50.746202
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2026-04-05 18:25:50.74938
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2026-04-05 18:25:50.752738
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2026-04-05 18:25:50.775373
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2026-04-05 18:25:50.779513
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2026-04-05 18:25:50.782625
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2026-04-05 18:25:50.785737
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2026-04-05 18:25:50.790269
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2026-04-05 18:25:50.793363
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2026-04-05 18:25:50.798188
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2026-04-05 18:25:50.810467
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2026-04-05 18:25:50.81944
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2026-04-05 18:25:50.823255
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2026-04-05 18:25:50.826143
26	objects-prefixes	215cabcb7f78121892a5a2037a09fedf9a1ae322	2026-04-05 18:25:50.829271
27	search-v2	859ba38092ac96eb3964d83bf53ccc0b141663a6	2026-04-05 18:25:50.831929
28	object-bucket-name-sorting	c73a2b5b5d4041e39705814fd3a1b95502d38ce4	2026-04-05 18:25:50.834506
29	create-prefixes	ad2c1207f76703d11a9f9007f821620017a66c21	2026-04-05 18:25:50.836817
30	update-object-levels	2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6	2026-04-05 18:25:50.839084
31	objects-level-index	b40367c14c3440ec75f19bbce2d71e914ddd3da0	2026-04-05 18:25:50.841627
32	backward-compatible-index-on-objects	e0c37182b0f7aee3efd823298fb3c76f1042c0f7	2026-04-05 18:25:50.844041
33	backward-compatible-index-on-prefixes	b480e99ed951e0900f033ec4eb34b5bdcb4e3d49	2026-04-05 18:25:50.846427
34	optimize-search-function-v1	ca80a3dc7bfef894df17108785ce29a7fc8ee456	2026-04-05 18:25:50.848842
35	add-insert-trigger-prefixes	458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc	2026-04-05 18:25:50.851051
36	optimise-existing-functions	6ae5fca6af5c55abe95369cd4f93985d1814ca8f	2026-04-05 18:25:50.853509
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2026-04-05 18:25:50.855813
38	iceberg-catalog-flag-on-buckets	02716b81ceec9705aed84aa1501657095b32e5c5	2026-04-05 18:25:50.859708
39	add-search-v2-sort-support	6706c5f2928846abee18461279799ad12b279b78	2026-04-05 18:25:50.869233
40	fix-prefix-race-conditions-optimized	7ad69982ae2d372b21f48fc4829ae9752c518f6b	2026-04-05 18:25:50.871576
41	add-object-level-update-trigger	07fcf1a22165849b7a029deed059ffcde08d1ae0	2026-04-05 18:25:50.874103
42	rollback-prefix-triggers	771479077764adc09e2ea2043eb627503c034cd4	2026-04-05 18:25:50.876836
43	fix-object-level	84b35d6caca9d937478ad8a797491f38b8c2979f	2026-04-05 18:25:50.879465
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2026-04-05 18:25:50.881765
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2026-04-05 18:25:50.885118
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2026-04-05 18:25:50.893718
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2026-04-05 18:25:50.896585
48	iceberg-catalog-ids	e0e8b460c609b9999ccd0df9ad14294613eed939	2026-04-05 18:25:50.898929
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2026-04-05 18:25:50.912784
50	search-v2-optimised	6323ac4f850aa14e7387eb32102869578b5bd478	2026-04-05 18:25:50.915943
51	index-backward-compatible-search	2ee395d433f76e38bcd3856debaf6e0e5b674011	2026-04-05 18:25:51.638903
52	drop-not-used-indexes-and-functions	5cc44c8696749ac11dd0dc37f2a3802075f3a171	2026-04-05 18:25:51.640564
53	drop-index-lower-name	d0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854	2026-04-05 18:25:51.647854
54	drop-index-object-level	6289e048b1472da17c31a7eba1ded625a6457e67	2026-04-05 18:25:51.649794
55	prevent-direct-deletes	262a4798d5e0f2e7c8970232e03ce8be695d5819	2026-04-05 18:25:51.651273
57	s3-multipart-uploads-metadata	f127886e00d1b374fadbc7c6b31e09336aad5287	2026-04-11 14:34:08.837949
58	operation-ergonomics	00ca5d483b3fe0d522133d9002ccc5df98365120	2026-04-11 14:34:08.848696
56	fix-optimized-search-function	b823ed1e418101032fa01374edc9a436e54e3ed4	2026-04-05 18:25:51.65468
59	drop-unused-functions	38456f13e39691c2bbb4b5151d0d1cdbabd4a8c4	2026-05-14 19:32:02.399863
60	optimize-existing-functions-again	db35e1c91a9201e59f4fef8d972c2f277d68b157	2026-05-14 19:32:02.414283
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata, metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: -
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: -
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 272, true);


--
-- Name: procedures_procedure_code_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.procedures_procedure_code_seq', 131, false);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: -
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: notification_tokens notification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_tokens
    ADD CONSTRAINT notification_tokens_pkey PRIMARY KEY (id);


--
-- Name: notification_tokens notification_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_tokens
    ADD CONSTRAINT notification_tokens_token_key UNIQUE (token);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: procedure_objectives procedure_objectives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_objectives
    ADD CONSTRAINT procedure_objectives_pkey PRIMARY KEY (id);


--
-- Name: procedure_objectives procedure_objectives_procedure_id_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_objectives
    ADD CONSTRAINT procedure_objectives_procedure_id_year_key UNIQUE (procedure_id, year);


--
-- Name: procedure_objectives procedure_objectives_unique_procedure_year_level; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_objectives
    ADD CONSTRAINT procedure_objectives_unique_procedure_year_level UNIQUE (procedure_id, year, required_level);


--
-- Name: procedures procedures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedures
    ADD CONSTRAINT procedures_pkey PRIMARY KEY (id);


--
-- Name: procedures procedures_procedure_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedures
    ADD CONSTRAINT procedures_procedure_code_key UNIQUE (procedure_code);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: realisations realisations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realisations
    ADD CONSTRAINT realisations_pkey PRIMARY KEY (id);


--
-- Name: travail_auteurs travail_auteurs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.travail_auteurs
    ADD CONSTRAINT travail_auteurs_pkey PRIMARY KEY (id);


--
-- Name: travail_types travail_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.travail_types
    ADD CONSTRAINT travail_types_pkey PRIMARY KEY (id);


--
-- Name: travail_validation_history travail_validation_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.travail_validation_history
    ADD CONSTRAINT travail_validation_history_pkey PRIMARY KEY (id);


--
-- Name: travaux_scientifiques travaux_scientifiques_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.travaux_scientifiques
    ADD CONSTRAINT travaux_scientifiques_pkey PRIMARY KEY (id);


--
-- Name: validation_history validation_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validation_history
    ADD CONSTRAINT validation_history_pkey PRIMARY KEY (id);


--
-- Name: messages messages_payload_exclusive; Type: CHECK CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages
    ADD CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL))) NOT VALID;


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- Name: categories_service_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX categories_service_idx ON public.categories USING btree (service);


--
-- Name: categories_service_name_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX categories_service_name_unique ON public.categories USING btree (service, lower(name));


--
-- Name: notifications_travail_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_travail_idx ON public.notifications USING btree (travail_id);


--
-- Name: procedure_objectives_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX procedure_objectives_active_idx ON public.procedure_objectives USING btree (is_active);


--
-- Name: procedure_objectives_active_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX procedure_objectives_active_year_idx ON public.procedure_objectives USING btree (year, is_active);


--
-- Name: procedure_objectives_procedure_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX procedure_objectives_procedure_idx ON public.procedure_objectives USING btree (procedure_id);


--
-- Name: procedure_objectives_unique_active_year; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX procedure_objectives_unique_active_year ON public.procedure_objectives USING btree (procedure_id, year) WHERE (is_active IS TRUE);


--
-- Name: procedure_objectives_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX procedure_objectives_year_idx ON public.procedure_objectives USING btree (year);


--
-- Name: procedures_procedure_code_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX procedures_procedure_code_unique ON public.procedures USING btree (procedure_code);


--
-- Name: procedures_service_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX procedures_service_idx ON public.procedures USING btree (service);


--
-- Name: profiles_service_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX profiles_service_idx ON public.profiles USING btree (service);


--
-- Name: realisations_procedure_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX realisations_procedure_id_idx ON public.realisations USING btree (procedure_id);


--
-- Name: realisations_resident_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX realisations_resident_id_idx ON public.realisations USING btree (resident_id);


--
-- Name: realisations_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX realisations_status_idx ON public.realisations USING btree (status);


--
-- Name: travail_auteurs_profile_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX travail_auteurs_profile_idx ON public.travail_auteurs USING btree (profile_id);


--
-- Name: travail_auteurs_travail_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX travail_auteurs_travail_idx ON public.travail_auteurs USING btree (travail_id, author_order);


--
-- Name: travail_validation_history_travail_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX travail_validation_history_travail_idx ON public.travail_validation_history USING btree (travail_id, created_at DESC);


--
-- Name: travaux_scientifiques_encadrant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX travaux_scientifiques_encadrant_idx ON public.travaux_scientifiques USING btree (encadrant_id);


--
-- Name: travaux_scientifiques_validation_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX travaux_scientifiques_validation_status_idx ON public.travaux_scientifiques USING btree (validation_status);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_selec; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_selec ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter, COALESCE(selected_columns, '{}'::text[]));


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- Name: procedures procedures_category_service_check_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER procedures_category_service_check_trg BEFORE INSERT OR UPDATE OF category_id, service ON public.procedures FOR EACH ROW EXECUTE FUNCTION public.enforce_procedure_category_service();


--
-- Name: app_settings set_app_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.set_app_settings_updated_at();


--
-- Name: profiles trg_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: notification_tokens notification_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_tokens
    ADD CONSTRAINT notification_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


--
-- Name: notifications notifications_realisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_realisation_id_fkey FOREIGN KEY (realisation_id) REFERENCES public.realisations(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_travail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_travail_id_fkey FOREIGN KEY (travail_id) REFERENCES public.travaux_scientifiques(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


--
-- Name: procedure_objectives procedure_objectives_procedure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_objectives
    ADD CONSTRAINT procedure_objectives_procedure_id_fkey FOREIGN KEY (procedure_id) REFERENCES public.procedures(id) ON DELETE CASCADE;


--
-- Name: procedures procedures_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedures
    ADD CONSTRAINT procedures_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: realisations realisations_enseignant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realisations
    ADD CONSTRAINT realisations_enseignant_id_fkey FOREIGN KEY (enseignant_id) REFERENCES public.profiles(id);


--
-- Name: realisations realisations_procedure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realisations
    ADD CONSTRAINT realisations_procedure_id_fkey FOREIGN KEY (procedure_id) REFERENCES public.procedures(id);


--
-- Name: realisations realisations_resident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realisations
    ADD CONSTRAINT realisations_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.profiles(id);


--
-- Name: realisations realisations_superviseur_resident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.realisations
    ADD CONSTRAINT realisations_superviseur_resident_id_fkey FOREIGN KEY (superviseur_resident_id) REFERENCES public.profiles(id);


--
-- Name: travail_auteurs travail_auteurs_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.travail_auteurs
    ADD CONSTRAINT travail_auteurs_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: travail_auteurs travail_auteurs_travail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.travail_auteurs
    ADD CONSTRAINT travail_auteurs_travail_id_fkey FOREIGN KEY (travail_id) REFERENCES public.travaux_scientifiques(id) ON DELETE CASCADE;


--
-- Name: travail_validation_history travail_validation_history_enseignant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.travail_validation_history
    ADD CONSTRAINT travail_validation_history_enseignant_id_fkey FOREIGN KEY (enseignant_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: travail_validation_history travail_validation_history_travail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.travail_validation_history
    ADD CONSTRAINT travail_validation_history_travail_id_fkey FOREIGN KEY (travail_id) REFERENCES public.travaux_scientifiques(id) ON DELETE CASCADE;


--
-- Name: travaux_scientifiques travaux_scientifiques_encadrant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.travaux_scientifiques
    ADD CONSTRAINT travaux_scientifiques_encadrant_id_fkey FOREIGN KEY (encadrant_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: travaux_scientifiques travaux_scientifiques_final_validated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.travaux_scientifiques
    ADD CONSTRAINT travaux_scientifiques_final_validated_by_fkey FOREIGN KEY (final_validated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: travaux_scientifiques travaux_scientifiques_initial_validated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.travaux_scientifiques
    ADD CONSTRAINT travaux_scientifiques_initial_validated_by_fkey FOREIGN KEY (initial_validated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: travaux_scientifiques travaux_scientifiques_resident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.travaux_scientifiques
    ADD CONSTRAINT travaux_scientifiques_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.profiles(id);


--
-- Name: travaux_scientifiques travaux_scientifiques_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.travaux_scientifiques
    ADD CONSTRAINT travaux_scientifiques_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.travail_types(id);


--
-- Name: validation_history validation_history_enseignant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validation_history
    ADD CONSTRAINT validation_history_enseignant_id_fkey FOREIGN KEY (enseignant_id) REFERENCES public.profiles(id);


--
-- Name: validation_history validation_history_realisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validation_history
    ADD CONSTRAINT validation_history_realisation_id_fkey FOREIGN KEY (realisation_id) REFERENCES public.realisations(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: app_settings Admins can manage app settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage app settings" ON public.app_settings TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: app_settings Authenticated users can read app settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read app settings" ON public.app_settings FOR SELECT TO authenticated USING (true);


--
-- Name: app_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: categories categories_admin_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY categories_admin_write ON public.categories USING ((public.get_my_role() = 'admin'::public.user_role)) WITH CHECK ((public.get_my_role() = 'admin'::public.user_role));


--
-- Name: categories categories_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY categories_select_all ON public.categories FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: notification_tokens notif_tokens_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notif_tokens_own ON public.notification_tokens USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: notification_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications notifications_enseignant_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notifications_enseignant_insert ON public.notifications FOR INSERT WITH CHECK ((public.get_my_role() = ANY (ARRAY['enseignant'::public.user_role, 'admin'::public.user_role])));


--
-- Name: notifications notifications_own_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notifications_own_select ON public.notifications FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: notifications notifications_own_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notifications_own_update ON public.notifications FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: procedure_objectives procedure objectives readable by authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "procedure objectives readable by authenticated users" ON public.procedure_objectives FOR SELECT TO authenticated USING (true);


--
-- Name: procedure_objectives procedure objectives writable by admins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "procedure objectives writable by admins" ON public.procedure_objectives TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: procedure_objectives; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.procedure_objectives ENABLE ROW LEVEL SECURITY;

--
-- Name: procedure_objectives procedure_objectives_admin_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY procedure_objectives_admin_write ON public.procedure_objectives USING ((public.get_my_role() = 'admin'::public.user_role)) WITH CHECK ((public.get_my_role() = 'admin'::public.user_role));


--
-- Name: procedure_objectives procedure_objectives_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY procedure_objectives_select_all ON public.procedure_objectives FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: procedures; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;

--
-- Name: procedures procedures readable by authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "procedures readable by authenticated users" ON public.procedures FOR SELECT TO authenticated USING (true);


--
-- Name: procedures procedures writable by admins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "procedures writable by admins" ON public.procedures TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: procedures procedures_admin_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY procedures_admin_write ON public.procedures USING ((public.get_my_role() = 'admin'::public.user_role)) WITH CHECK ((public.get_my_role() = 'admin'::public.user_role));


--
-- Name: procedures procedures_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY procedures_select_all ON public.procedures FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_admin_all ON public.profiles USING ((public.get_my_role() = 'admin'::public.user_role)) WITH CHECK ((public.get_my_role() = 'admin'::public.user_role));


--
-- Name: profiles profiles_enseignant_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_enseignant_select_all ON public.profiles FOR SELECT USING ((public.get_my_role() = 'enseignant'::public.user_role));


--
-- Name: profiles profiles_resident_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_resident_select_own ON public.profiles FOR SELECT USING (((auth.uid() = id) AND (public.get_my_role() = 'resident'::public.user_role)));


--
-- Name: profiles profiles_self_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_self_read ON public.profiles FOR SELECT USING (((id = auth.uid()) OR (public.current_user_role() = ANY (ARRAY['enseignant'::public.user_role, 'admin'::public.user_role]))));


--
-- Name: profiles profiles_self_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));


--
-- Name: realisations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.realisations ENABLE ROW LEVEL SECURITY;

--
-- Name: realisations realisations_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY realisations_admin_all ON public.realisations USING ((public.get_my_role() = 'admin'::public.user_role)) WITH CHECK ((public.get_my_role() = 'admin'::public.user_role));


--
-- Name: realisations realisations_enseignant_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY realisations_enseignant_select_all ON public.realisations FOR SELECT USING ((public.get_my_role() = 'enseignant'::public.user_role));


--
-- Name: realisations realisations_enseignant_update_status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY realisations_enseignant_update_status ON public.realisations FOR UPDATE USING ((public.get_my_role() = 'enseignant'::public.user_role)) WITH CHECK ((public.get_my_role() = 'enseignant'::public.user_role));


--
-- Name: realisations realisations_resident_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY realisations_resident_insert_own ON public.realisations FOR INSERT WITH CHECK (((public.get_my_role() = 'resident'::public.user_role) AND (resident_id = auth.uid())));


--
-- Name: realisations realisations_resident_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY realisations_resident_select_own ON public.realisations FOR SELECT USING (((public.get_my_role() = 'resident'::public.user_role) AND (resident_id = auth.uid())));


--
-- Name: realisations realisations_resident_update_pending; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY realisations_resident_update_pending ON public.realisations FOR UPDATE USING (((public.get_my_role() = 'resident'::public.user_role) AND (resident_id = auth.uid()) AND (status = 'pending'::public.realisation_status))) WITH CHECK (((resident_id = auth.uid()) AND (status = 'pending'::public.realisation_status)));


--
-- Name: travail_auteurs travail auteurs insertable by residents and admins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "travail auteurs insertable by residents and admins" ON public.travail_auteurs FOR INSERT TO authenticated WITH CHECK ((public.is_travail_resident(travail_id, auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'enseignant'::public.user_role])))))));


--
-- Name: travail_auteurs travail auteurs updatable by owner and staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "travail auteurs updatable by owner and staff" ON public.travail_auteurs TO authenticated USING ((public.is_travail_resident(travail_id, auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'enseignant'::public.user_role]))))))) WITH CHECK ((public.is_travail_resident(travail_id, auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'enseignant'::public.user_role])))))));


--
-- Name: travail_validation_history travail validation history insertable by teachers and admins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "travail validation history insertable by teachers and admins" ON public.travail_validation_history FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'enseignant'::public.user_role]))))));


--
-- Name: travail_auteurs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.travail_auteurs ENABLE ROW LEVEL SECURITY;

--
-- Name: travail_auteurs travail_auteurs_select_secure; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY travail_auteurs_select_secure ON public.travail_auteurs FOR SELECT USING (((public.get_my_role() = ANY (ARRAY['enseignant'::public.user_role, 'admin'::public.user_role])) OR (profile_id = auth.uid()) OR public.is_travail_resident(travail_id, auth.uid())));


--
-- Name: travail_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.travail_types ENABLE ROW LEVEL SECURITY;

--
-- Name: travail_types travail_types_admin_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY travail_types_admin_write ON public.travail_types USING ((public.get_my_role() = 'admin'::public.user_role)) WITH CHECK ((public.get_my_role() = 'admin'::public.user_role));


--
-- Name: travail_types travail_types_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY travail_types_select_all ON public.travail_types FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: travail_validation_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.travail_validation_history ENABLE ROW LEVEL SECURITY;

--
-- Name: travail_validation_history travail_validation_history_select_secure; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY travail_validation_history_select_secure ON public.travail_validation_history FOR SELECT USING (((public.get_my_role() = ANY (ARRAY['enseignant'::public.user_role, 'admin'::public.user_role])) OR (EXISTS ( SELECT 1
   FROM public.travaux_scientifiques ts
  WHERE ((ts.id = travail_validation_history.travail_id) AND ((ts.resident_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.travail_auteurs ta
          WHERE ((ta.travail_id = ts.id) AND (ta.profile_id = auth.uid()))))))))));


--
-- Name: travaux_scientifiques travaux_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY travaux_admin_all ON public.travaux_scientifiques USING ((public.get_my_role() = 'admin'::public.user_role)) WITH CHECK ((public.get_my_role() = 'admin'::public.user_role));


--
-- Name: travaux_scientifiques travaux_resident_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY travaux_resident_own ON public.travaux_scientifiques USING (((public.get_my_role() = 'resident'::public.user_role) AND (resident_id = auth.uid()))) WITH CHECK ((resident_id = auth.uid()));


--
-- Name: travaux_scientifiques; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.travaux_scientifiques ENABLE ROW LEVEL SECURITY;

--
-- Name: travaux_scientifiques travaux_select_secure; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY travaux_select_secure ON public.travaux_scientifiques FOR SELECT USING (((public.get_my_role() = ANY (ARRAY['enseignant'::public.user_role, 'admin'::public.user_role])) OR (resident_id = auth.uid()) OR public.is_travail_author(id, auth.uid())));


--
-- Name: validation_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.validation_history ENABLE ROW LEVEL SECURITY;

--
-- Name: validation_history validation_history_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY validation_history_admin_all ON public.validation_history USING ((public.get_my_role() = 'admin'::public.user_role)) WITH CHECK ((public.get_my_role() = 'admin'::public.user_role));


--
-- Name: validation_history validation_history_enseignant_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY validation_history_enseignant_insert ON public.validation_history FOR INSERT WITH CHECK (((public.get_my_role() = 'enseignant'::public.user_role) AND (enseignant_id = auth.uid())));


--
-- Name: validation_history validation_history_enseignant_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY validation_history_enseignant_select ON public.validation_history FOR SELECT USING ((public.get_my_role() = 'enseignant'::public.user_role));


--
-- Name: validation_history validation_history_resident_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY validation_history_resident_select ON public.validation_history FOR SELECT USING (((public.get_my_role() = 'resident'::public.user_role) AND (EXISTS ( SELECT 1
   FROM public.realisations r
  WHERE ((r.id = validation_history.realisation_id) AND (r.resident_id = auth.uid()))))));


--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

\unrestrict vOdB1tVA9JGNtYWfqzVneifYBzKaAgUiUfOSbEGSBoneegLpbKff3Gd71bp2tOt

