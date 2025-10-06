# Database Schema Reference

Generated: 2025-01-27
Total Tables: 125
Total Schemas: 8

## AUTH SCHEMA
Tables: 17

### audit_log_entries
**Schema:** auth
**Rows:** 110
**RLS:** disabled
**Comment:** Auth: Audit trail for user actions.

**Primary Key:** id

**Columns:**
  - instance_id: uuid NULL
  - id: uuid NOT NULL
  - payload: json NULL
  - created_at: timestamp with time zone NULL
  - ip_address: character varying(64) NOT NULL DEFAULT ''::character varying

**Indexes:**
  - audit_log_entries_pkey: UNIQUE CREATE UNIQUE INDEX audit_log_entries_pkey ON auth.audit_log_entries USING btree (id)
  - audit_logs_instance_id_idx: CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id)

---

### flow_state
**Schema:** auth
**Rows:** -1
**RLS:** disabled
**Comment:** stores metadata for pkce logins

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL
  - user_id: uuid NULL
  - auth_code: text NOT NULL
  - code_challenge_method: auth.code_challenge_method NOT NULL
  - code_challenge: text NOT NULL
  - provider_type: text NOT NULL
  - provider_access_token: text NULL
  - provider_refresh_token: text NULL
  - created_at: timestamp with time zone NULL
  - updated_at: timestamp with time zone NULL
  - authentication_method: text NOT NULL
  - auth_code_issued_at: timestamp with time zone NULL

**Indexes:**
  - flow_state_created_at_idx: CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC)
  - flow_state_pkey: UNIQUE CREATE UNIQUE INDEX flow_state_pkey ON auth.flow_state USING btree (id)
  - idx_auth_code: CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code)
  - idx_user_id_auth_method: CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method)

---

### identities
**Schema:** auth
**Rows:** 7
**RLS:** disabled
**Comment:** Auth: Stores identities associated to a user.

**Primary Key:** id

**Columns:**
  - provider_id: text NOT NULL
  - user_id: uuid NOT NULL
  - identity_data: jsonb NOT NULL
  - provider: text NOT NULL
  - last_sign_in_at: timestamp with time zone NULL
  - created_at: timestamp with time zone NULL
  - updated_at: timestamp with time zone NULL
  - email: text NULL DEFAULT lower((identity_data ->> 'email'::text)) GENERATED lower((identity_data ->> 'email'::text)) -- Auth: Email is a generated column that references the optional email property in the identity_data
  - id: uuid NOT NULL DEFAULT gen_random_uuid()

**Foreign Keys:**
  - identities_user_id_fkey: (user_id) -> auth.users(id)

**Indexes:**
  - identities_email_idx: CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops)
  - identities_pkey: UNIQUE CREATE UNIQUE INDEX identities_pkey ON auth.identities USING btree (id)
  - identities_provider_id_provider_unique: UNIQUE CREATE UNIQUE INDEX identities_provider_id_provider_unique ON auth.identities USING btree (provider_id, provider)
  - identities_user_id_idx: CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id)

---

### instances
**Schema:** auth
**Rows:** -1
**RLS:** disabled
**Comment:** Auth: Manages users across multiple sites.

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL
  - uuid: uuid NULL
  - raw_base_config: text NULL
  - created_at: timestamp with time zone NULL
  - updated_at: timestamp with time zone NULL

**Indexes:**
  - instances_pkey: UNIQUE CREATE UNIQUE INDEX instances_pkey ON auth.instances USING btree (id)

---

### mfa_amr_claims
**Schema:** auth
**Rows:** -1
**RLS:** disabled
**Comment:** auth: stores authenticator method reference claims for multi factor authentication

**Primary Key:** id

**Columns:**
  - session_id: uuid NOT NULL
  - created_at: timestamp with time zone NOT NULL
  - updated_at: timestamp with time zone NOT NULL
  - authentication_method: text NOT NULL
  - id: uuid NOT NULL

**Foreign Keys:**
  - mfa_amr_claims_session_id_fkey: (session_id) -> auth.sessions(id)

**Indexes:**
  - amr_id_pk: UNIQUE CREATE UNIQUE INDEX amr_id_pk ON auth.mfa_amr_claims USING btree (id)
  - mfa_amr_claims_session_id_authentication_method_pkey: UNIQUE CREATE UNIQUE INDEX mfa_amr_claims_session_id_authentication_method_pkey ON auth.mfa_amr_claims USING btree (session_id, authentication_method)

---

### mfa_challenges
**Schema:** auth
**Rows:** -1
**RLS:** disabled
**Comment:** auth: stores metadata about challenge requests made

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL
  - factor_id: uuid NOT NULL
  - created_at: timestamp with time zone NOT NULL
  - verified_at: timestamp with time zone NULL
  - ip_address: inet NOT NULL
  - otp_code: text NULL
  - web_authn_session_data: jsonb NULL

**Foreign Keys:**
  - mfa_challenges_auth_factor_id_fkey: (factor_id) -> auth.mfa_factors(id)

**Indexes:**
  - mfa_challenge_created_at_idx: CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC)
  - mfa_challenges_pkey: UNIQUE CREATE UNIQUE INDEX mfa_challenges_pkey ON auth.mfa_challenges USING btree (id)

---

### mfa_factors
**Schema:** auth
**Rows:** -1
**RLS:** disabled
**Comment:** auth: stores metadata about factors

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL
  - user_id: uuid NOT NULL
  - friendly_name: text NULL
  - factor_type: auth.factor_type NOT NULL
  - status: auth.factor_status NOT NULL
  - created_at: timestamp with time zone NOT NULL
  - updated_at: timestamp with time zone NOT NULL
  - secret: text NULL
  - phone: text NULL
  - last_challenged_at: timestamp with time zone NULL
  - web_authn_credential: jsonb NULL
  - web_authn_aaguid: uuid NULL

**Foreign Keys:**
  - mfa_factors_user_id_fkey: (user_id) -> auth.users(id)

**Indexes:**
  - factor_id_created_at_idx: CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at)
  - mfa_factors_last_challenged_at_key: UNIQUE CREATE UNIQUE INDEX mfa_factors_last_challenged_at_key ON auth.mfa_factors USING btree (last_challenged_at)
  - mfa_factors_pkey: UNIQUE CREATE UNIQUE INDEX mfa_factors_pkey ON auth.mfa_factors USING btree (id)
  - mfa_factors_user_friendly_name_unique: UNIQUE CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text)
  - mfa_factors_user_id_idx: CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id)
  - unique_phone_factor_per_user: UNIQUE CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone)

---

### oauth_clients
**Schema:** auth
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL
  - client_id: text NOT NULL
  - client_secret_hash: text NOT NULL
  - registration_type: auth.oauth_registration_type NOT NULL
  - redirect_uris: text NOT NULL
  - grant_types: text NOT NULL
  - client_name: text NULL
  - client_uri: text NULL
  - logo_uri: text NULL
  - created_at: timestamp with time zone NOT NULL DEFAULT now()
  - updated_at: timestamp with time zone NOT NULL DEFAULT now()
  - deleted_at: timestamp with time zone NULL

**Indexes:**
  - oauth_clients_client_id_idx: CREATE INDEX oauth_clients_client_id_idx ON auth.oauth_clients USING btree (client_id)
  - oauth_clients_client_id_key: UNIQUE CREATE UNIQUE INDEX oauth_clients_client_id_key ON auth.oauth_clients USING btree (client_id)
  - oauth_clients_deleted_at_idx: CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at)
  - oauth_clients_pkey: UNIQUE CREATE UNIQUE INDEX oauth_clients_pkey ON auth.oauth_clients USING btree (id)

---

### one_time_tokens
**Schema:** auth
**Rows:** 5
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL
  - user_id: uuid NOT NULL
  - token_type: auth.one_time_token_type NOT NULL
  - token_hash: text NOT NULL
  - relates_to: text NOT NULL
  - created_at: timestamp without time zone NOT NULL DEFAULT now()
  - updated_at: timestamp without time zone NOT NULL DEFAULT now()

**Foreign Keys:**
  - one_time_tokens_user_id_fkey: (user_id) -> auth.users(id)

**Indexes:**
  - one_time_tokens_pkey: UNIQUE CREATE UNIQUE INDEX one_time_tokens_pkey ON auth.one_time_tokens USING btree (id)
  - one_time_tokens_relates_to_hash_idx: CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to)
  - one_time_tokens_token_hash_hash_idx: CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash)
  - one_time_tokens_user_id_token_type_key: UNIQUE CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type)

---

### refresh_tokens
**Schema:** auth
**Rows:** 24
**RLS:** disabled
**Comment:** Auth: Store of tokens used to refresh JWT tokens once they expire.

**Primary Key:** id

**Columns:**
  - instance_id: uuid NULL
  - id: bigint NOT NULL DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass)
  - token: character varying(255) NULL
  - user_id: character varying(255) NULL
  - revoked: boolean NULL
  - created_at: timestamp with time zone NULL
  - updated_at: timestamp with time zone NULL
  - parent: character varying(255) NULL
  - session_id: uuid NULL

**Foreign Keys:**
  - refresh_tokens_session_id_fkey: (session_id) -> auth.sessions(id)

**Indexes:**
  - refresh_tokens_instance_id_idx: CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id)
  - refresh_tokens_instance_id_user_id_idx: CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id)
  - refresh_tokens_parent_idx: CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent)
  - refresh_tokens_pkey: UNIQUE CREATE UNIQUE INDEX refresh_tokens_pkey ON auth.refresh_tokens USING btree (id)
  - refresh_tokens_session_id_revoked_idx: CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked)
  - refresh_tokens_token_unique: UNIQUE CREATE UNIQUE INDEX refresh_tokens_token_unique ON auth.refresh_tokens USING btree (token)
  - refresh_tokens_updated_at_idx: CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC)

---

### saml_providers
**Schema:** auth
**Rows:** -1
**RLS:** disabled
**Comment:** Auth: Manages SAML Identity Provider connections.

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL
  - sso_provider_id: uuid NOT NULL
  - entity_id: text NOT NULL
  - metadata_xml: text NOT NULL
  - metadata_url: text NULL
  - attribute_mapping: jsonb NULL
  - created_at: timestamp with time zone NULL
  - updated_at: timestamp with time zone NULL
  - name_id_format: text NULL

**Foreign Keys:**
  - saml_providers_sso_provider_id_fkey: (sso_provider_id) -> auth.sso_providers(id)

**Indexes:**
  - saml_providers_entity_id_key: UNIQUE CREATE UNIQUE INDEX saml_providers_entity_id_key ON auth.saml_providers USING btree (entity_id)
  - saml_providers_pkey: UNIQUE CREATE UNIQUE INDEX saml_providers_pkey ON auth.saml_providers USING btree (id)
  - saml_providers_sso_provider_id_idx: CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id)

---

### saml_relay_states
**Schema:** auth
**Rows:** -1
**RLS:** disabled
**Comment:** Auth: Contains SAML Relay State information for each Service Provider initiated login.

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL
  - sso_provider_id: uuid NOT NULL
  - request_id: text NOT NULL
  - for_email: text NULL
  - redirect_to: text NULL
  - created_at: timestamp with time zone NULL
  - updated_at: timestamp with time zone NULL
  - flow_state_id: uuid NULL

**Foreign Keys:**
  - saml_relay_states_flow_state_id_fkey: (flow_state_id) -> auth.flow_state(id)
  - saml_relay_states_sso_provider_id_fkey: (sso_provider_id) -> auth.sso_providers(id)

**Indexes:**
  - saml_relay_states_created_at_idx: CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC)
  - saml_relay_states_for_email_idx: CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email)
  - saml_relay_states_pkey: UNIQUE CREATE UNIQUE INDEX saml_relay_states_pkey ON auth.saml_relay_states USING btree (id)
  - saml_relay_states_sso_provider_id_idx: CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id)

---

### schema_migrations
**Schema:** auth
**Rows:** 62
**RLS:** disabled
**Comment:** Auth: Manages updates to the auth system.

**Primary Key:** version

**Columns:**
  - version: character varying(255) NOT NULL

**Indexes:**
  - schema_migrations_pkey: UNIQUE CREATE UNIQUE INDEX schema_migrations_pkey ON auth.schema_migrations USING btree (version)

---

### sessions
**Schema:** auth
**Rows:** -1
**RLS:** disabled
**Comment:** Auth: Stores session data associated to a user.

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL
  - user_id: uuid NOT NULL
  - created_at: timestamp with time zone NULL
  - updated_at: timestamp with time zone NULL
  - factor_id: uuid NULL
  - aal: auth.aal_level NULL
  - not_after: timestamp with time zone NULL -- Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.
  - refreshed_at: timestamp without time zone NULL
  - user_agent: text NULL
  - ip: inet NULL
  - tag: text NULL

**Foreign Keys:**
  - sessions_user_id_fkey: (user_id) -> auth.users(id)

**Indexes:**
  - sessions_not_after_idx: CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC)
  - sessions_pkey: UNIQUE CREATE UNIQUE INDEX sessions_pkey ON auth.sessions USING btree (id)
  - sessions_user_id_idx: CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id)
  - user_id_created_at_idx: CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at)

---

### sso_domains
**Schema:** auth
**Rows:** -1
**RLS:** disabled
**Comment:** Auth: Manages SSO email address domain mapping to an SSO Identity Provider.

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL
  - sso_provider_id: uuid NOT NULL
  - domain: text NOT NULL
  - created_at: timestamp with time zone NULL
  - updated_at: timestamp with time zone NULL

**Foreign Keys:**
  - sso_domains_sso_provider_id_fkey: (sso_provider_id) -> auth.sso_providers(id)

**Indexes:**
  - sso_domains_domain_idx: UNIQUE CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain))
  - sso_domains_pkey: UNIQUE CREATE UNIQUE INDEX sso_domains_pkey ON auth.sso_domains USING btree (id)
  - sso_domains_sso_provider_id_idx: CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id)

---

### sso_providers
**Schema:** auth
**Rows:** -1
**RLS:** disabled
**Comment:** Auth: Manages SSO identity provider information; see saml_providers for SAML.

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL
  - resource_id: text NULL -- Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.
  - created_at: timestamp with time zone NULL
  - updated_at: timestamp with time zone NULL
  - disabled: boolean NULL

**Indexes:**
  - sso_providers_pkey: UNIQUE CREATE UNIQUE INDEX sso_providers_pkey ON auth.sso_providers USING btree (id)
  - sso_providers_resource_id_idx: UNIQUE CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id))
  - sso_providers_resource_id_pattern_idx: CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops)

---

### users
**Schema:** auth
**Rows:** 21
**RLS:** disabled
**Comment:** Auth: Stores user login data within a secure schema.

**Primary Key:** id

**Columns:**
  - instance_id: uuid NULL
  - id: uuid NOT NULL
  - aud: character varying(255) NULL
  - role: character varying(255) NULL
  - email: character varying(255) NULL
  - encrypted_password: character varying(255) NULL
  - email_confirmed_at: timestamp with time zone NULL
  - invited_at: timestamp with time zone NULL
  - confirmation_token: character varying(255) NULL
  - confirmation_sent_at: timestamp with time zone NULL
  - recovery_token: character varying(255) NULL
  - recovery_sent_at: timestamp with time zone NULL
  - email_change_token_new: character varying(255) NULL
  - email_change: character varying(255) NULL
  - email_change_sent_at: timestamp with time zone NULL
  - last_sign_in_at: timestamp with time zone NULL
  - raw_app_meta_data: jsonb NULL
  - raw_user_meta_data: jsonb NULL
  - is_super_admin: boolean NULL
  - created_at: timestamp with time zone NULL
  - updated_at: timestamp with time zone NULL
  - phone: text NULL DEFAULT NULL::character varying
  - phone_confirmed_at: timestamp with time zone NULL
  - phone_change: text NULL DEFAULT ''::character varying
  - phone_change_token: character varying(255) NULL DEFAULT ''::character varying
  - phone_change_sent_at: timestamp with time zone NULL
  - confirmed_at: timestamp with time zone NULL DEFAULT LEAST(email_confirmed_at, phone_confirmed_at) GENERATED LEAST(email_confirmed_at, phone_confirmed_at)
  - email_change_token_current: character varying(255) NULL DEFAULT ''::character varying
  - email_change_confirm_status: smallint NULL DEFAULT 0
  - banned_until: timestamp with time zone NULL
  - reauthentication_token: character varying(255) NULL DEFAULT ''::character varying
  - reauthentication_sent_at: timestamp with time zone NULL
  - is_sso_user: boolean NOT NULL DEFAULT false -- Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.
  - deleted_at: timestamp with time zone NULL
  - is_anonymous: boolean NOT NULL DEFAULT false

**Indexes:**
  - confirmation_token_idx: UNIQUE CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text)
  - email_change_token_current_idx: UNIQUE CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text)
  - email_change_token_new_idx: UNIQUE CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text)
  - reauthentication_token_idx: UNIQUE CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text)
  - recovery_token_idx: UNIQUE CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text)
  - users_email_partial_key: UNIQUE CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false) WHERE (is_sso_user = false)
  - users_instance_id_email_idx: CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text))
  - users_instance_id_idx: CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id)
  - users_is_anonymous_idx: CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous)
  - users_phone_key: UNIQUE CREATE UNIQUE INDEX users_phone_key ON auth.users USING btree (phone)
  - users_pkey: UNIQUE CREATE UNIQUE INDEX users_pkey ON auth.users USING btree (id)

---

## CIVICS SCHEMA
Tables: 1

### rate_limits
**Schema:** civics
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - ip_hmac: text NOT NULL
  - window_start: timestamp with time zone NOT NULL
  - request_count: integer NOT NULL DEFAULT 1
  - created_at: timestamp with time zone NOT NULL DEFAULT now()

**Indexes:**
  - idx_rate_limits_ip: CREATE INDEX idx_rate_limits_ip ON civics.rate_limits USING btree (ip_hmac)
  - idx_rate_limits_window: CREATE INDEX idx_rate_limits_window ON civics.rate_limits USING btree (window_start)
  - rate_limits_ip_hmac_window_start_key: UNIQUE CREATE UNIQUE INDEX rate_limits_ip_hmac_window_start_key ON civics.rate_limits USING btree (ip_hmac, window_start)
  - rate_limits_pkey: UNIQUE CREATE UNIQUE INDEX rate_limits_pkey ON civics.rate_limits USING btree (id)

---

## CRON SCHEMA
Tables: 2

### job
**Schema:** cron
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** jobid

**Columns:**
  - jobid: bigint NOT NULL DEFAULT nextval('cron.jobid_seq'::regclass)
  - schedule: text NOT NULL
  - command: text NOT NULL
  - nodename: text NOT NULL DEFAULT 'localhost'::text
  - nodeport: integer NOT NULL DEFAULT inet_server_port()
  - database: text NOT NULL DEFAULT current_database()
  - username: text NOT NULL DEFAULT CURRENT_USER
  - active: boolean NOT NULL DEFAULT true
  - jobname: text NULL

**Indexes:**
  - job_pkey: UNIQUE CREATE UNIQUE INDEX job_pkey ON cron.job USING btree (jobid)
  - jobname_username_uniq: UNIQUE CREATE UNIQUE INDEX jobname_username_uniq ON cron.job USING btree (jobname, username)

---

### job_run_details
**Schema:** cron
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** runid

**Columns:**
  - jobid: bigint NULL
  - runid: bigint NOT NULL DEFAULT nextval('cron.runid_seq'::regclass)
  - job_pid: integer NULL
  - database: text NULL
  - username: text NULL
  - command: text NULL
  - status: text NULL
  - return_message: text NULL
  - start_time: timestamp with time zone NULL
  - end_time: timestamp with time zone NULL

**Indexes:**
  - job_run_details_pkey: UNIQUE CREATE UNIQUE INDEX job_run_details_pkey ON cron.job_run_details USING btree (runid)

---

## PUBLIC SCHEMA
Tables: 88

### analytics_contributions
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - poll_id: uuid NULL
  - user_id: uuid NULL
  - age_bucket: text NULL
  - region_bucket: text NULL
  - education_bucket: text NULL
  - vote_choice: integer NULL
  - participation_time: interval NULL
  - consent_granted: boolean NULL DEFAULT false
  - created_at: timestamp with time zone NULL DEFAULT now()

**Foreign Keys:**
  - analytics_contributions_poll_id_fkey: (poll_id) -> public.polls(id)
  - analytics_contributions_user_id_fkey: (user_id) -> auth.users(id)

**Indexes:**
  - analytics_contributions_pkey: UNIQUE CREATE UNIQUE INDEX analytics_contributions_pkey ON public.analytics_contributions USING btree (id)
  - idx_analytics_contributions_consent: CREATE INDEX idx_analytics_contributions_consent ON public.analytics_contributions USING btree (consent_granted)
  - idx_analytics_contributions_poll_id: CREATE INDEX idx_analytics_contributions_poll_id ON public.analytics_contributions USING btree (poll_id)
  - idx_analytics_contributions_user_id: CREATE INDEX idx_analytics_contributions_user_id ON public.analytics_contributions USING btree (user_id)

---

### analytics_demographics
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT uuid_generate_v4()
  - poll_id: text NOT NULL
  - demographic_key: demographic_key NOT NULL
  - demographic_value: text NOT NULL
  - vote_count: integer NULL DEFAULT 0
  - created_at: timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP

**Indexes:**
  - analytics_demographics_pkey: UNIQUE CREATE UNIQUE INDEX analytics_demographics_pkey ON public.analytics_demographics USING btree (id)
  - idx_analytics_demographics_poll: CREATE INDEX idx_analytics_demographics_poll ON public.analytics_demographics USING btree (poll_id, demographic_key)

---

### analytics_events
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT uuid_generate_v4()
  - event_type: event_type NOT NULL
  - poll_id: text NULL
  - user_id: uuid NULL
  - metadata: jsonb NULL
  - created_at: timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP

**Indexes:**
  - analytics_events_pkey: UNIQUE CREATE UNIQUE INDEX analytics_events_pkey ON public.analytics_events USING btree (id)
  - idx_analytics_events_metadata_gin: CREATE INDEX idx_analytics_events_metadata_gin ON public.analytics_events USING gin (metadata)
  - idx_analytics_events_type: CREATE INDEX idx_analytics_events_type ON public.analytics_events USING btree (event_type)
  - idx_analytics_events_user: CREATE INDEX idx_analytics_events_user ON public.analytics_events USING btree (user_id)

---

### audit_logs
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - user_id: uuid NULL
  - action: text NOT NULL
  - table_name: text NULL
  - record_id: uuid NULL
  - old_values: jsonb NULL
  - new_values: jsonb NULL
  - ip_address: inet NULL
  - user_agent: text NULL
  - created_at: timestamp with time zone NULL DEFAULT now()

**Foreign Keys:**
  - audit_logs_user_id_fkey: (user_id) -> auth.users(id)

**Indexes:**
  - audit_logs_pkey: UNIQUE CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id)
  - idx_audit_logs_action: CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action)
  - idx_audit_logs_created_at: CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC)
  - idx_audit_logs_user_id: CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id)

---

### bias_detection_logs
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - media_poll_id: uuid NULL
  - detection_type: text NOT NULL
  - severity: text NULL DEFAULT 'low'::text
  - description: text NOT NULL
  - evidence: jsonb NULL DEFAULT '[]'::jsonb
  - impact_score: numeric(3,2) NULL DEFAULT 0
  - recommendations: jsonb NULL DEFAULT '[]'::jsonb
  - metadata: jsonb NULL DEFAULT '{}'::jsonb
  - created_at: timestamp with time zone NULL DEFAULT now()

**Foreign Keys:**
  - bias_detection_logs_media_poll_id_fkey: (media_poll_id) -> public.media_polls(id)

**Indexes:**
  - bias_detection_logs_pkey: UNIQUE CREATE UNIQUE INDEX bias_detection_logs_pkey ON public.bias_detection_logs USING btree (id)

---

### biometric_auth_logs
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - user_id: uuid NULL
  - credential_id: text NULL
  - authentication_result: boolean NOT NULL
  - failure_reason: text NULL
  - ip_address: inet NULL
  - user_agent: text NULL
  - device_info: jsonb NULL
  - location_info: jsonb NULL
  - risk_score: numeric(3,2) NULL DEFAULT 0.0
  - created_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - biometric_auth_logs_pkey: UNIQUE CREATE UNIQUE INDEX biometric_auth_logs_pkey ON public.biometric_auth_logs USING btree (id)
  - idx_biometric_auth_logs_created_at: CREATE INDEX idx_biometric_auth_logs_created_at ON public.biometric_auth_logs USING btree (created_at)
  - idx_biometric_auth_logs_result: CREATE INDEX idx_biometric_auth_logs_result ON public.biometric_auth_logs USING btree (authentication_result)
  - idx_biometric_auth_logs_risk_score: CREATE INDEX idx_biometric_auth_logs_risk_score ON public.biometric_auth_logs USING btree (risk_score)
  - idx_biometric_auth_logs_user_id: CREATE INDEX idx_biometric_auth_logs_user_id ON public.biometric_auth_logs USING btree (user_id)

---

### biometric_trust_scores
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - user_id: uuid NULL
  - base_score: numeric(3,2) NULL DEFAULT 0.0
  - device_consistency_score: numeric(3,2) NULL DEFAULT 0.0
  - behavior_score: numeric(3,2) NULL DEFAULT 0.0
  - location_score: numeric(3,2) NULL DEFAULT 0.0
  - overall_score: numeric(3,2) NULL DEFAULT 0.0
  - last_calculated_at: timestamp with time zone NULL DEFAULT now()
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - biometric_trust_scores_pkey: UNIQUE CREATE UNIQUE INDEX biometric_trust_scores_pkey ON public.biometric_trust_scores USING btree (id)
  - biometric_trust_scores_user_id_key: UNIQUE CREATE UNIQUE INDEX biometric_trust_scores_user_id_key ON public.biometric_trust_scores USING btree (user_id)
  - idx_biometric_trust_scores_overall_score: CREATE INDEX idx_biometric_trust_scores_overall_score ON public.biometric_trust_scores USING btree (overall_score)
  - idx_biometric_trust_scores_user_id: CREATE INDEX idx_biometric_trust_scores_user_id ON public.biometric_trust_scores USING btree (user_id)

---

### breaking_news
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - headline: text NOT NULL
  - summary: text NOT NULL
  - full_story: text NULL
  - source_url: text NULL
  - source_name: text NOT NULL
  - source_reliability: numeric(3,2) NULL DEFAULT 0.9
  - category: text[] NULL DEFAULT '{}'::text[]
  - urgency: text NULL DEFAULT 'medium'::text
  - sentiment: text NULL DEFAULT 'neutral'::text
  - entities: jsonb NULL DEFAULT '{}'::jsonb
  - metadata: jsonb NULL DEFAULT '{}'::jsonb
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - breaking_news_pkey: UNIQUE CREATE UNIQUE INDEX breaking_news_pkey ON public.breaking_news USING btree (id)
  - idx_breaking_news_category: CREATE INDEX idx_breaking_news_category ON public.breaking_news USING gin (category)
  - idx_breaking_news_created_at: CREATE INDEX idx_breaking_news_created_at ON public.breaking_news USING btree (created_at DESC)
  - idx_breaking_news_source_reliability: CREATE INDEX idx_breaking_news_source_reliability ON public.breaking_news USING btree (source_reliability DESC)
  - idx_breaking_news_urgency: CREATE INDEX idx_breaking_news_urgency ON public.breaking_news USING btree (urgency)

---

### campaign_finance
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - candidate_id: uuid NULL
  - committee_id: text NULL
  - committee_name: text NULL
  - cycle: integer NOT NULL
  - total_receipts: numeric(15,2) NULL DEFAULT 0.0
  - total_disbursements: numeric(15,2) NULL DEFAULT 0.0
  - cash_on_hand: numeric(15,2) NULL DEFAULT 0.0
  - debt: numeric(15,2) NULL DEFAULT 0.0
  - individual_contributions: numeric(15,2) NULL DEFAULT 0.0
  - pac_contributions: numeric(15,2) NULL DEFAULT 0.0
  - party_contributions: numeric(15,2) NULL DEFAULT 0.0
  - self_financing: numeric(15,2) NULL DEFAULT 0.0
  - independence_score: numeric(3,2) NULL DEFAULT 0.0
  - top_donor_percentage: numeric(5,2) NULL DEFAULT 0.0
  - corporate_donor_percentage: numeric(5,2) NULL DEFAULT 0.0
  - data_sources: text[] NOT NULL
  - quality_score: numeric(3,2) NULL DEFAULT 0.0
  - last_updated: timestamp with time zone NULL DEFAULT now()
  - created_at: timestamp with time zone NULL DEFAULT now()
  - provenance: jsonb NULL DEFAULT '{}'::jsonb
  - license_key: text NULL

**Foreign Keys:**
  - campaign_finance_candidate_id_fkey: (candidate_id) -> public.candidates(id)

**Indexes:**
  - campaign_finance_pkey: UNIQUE CREATE UNIQUE INDEX campaign_finance_pkey ON public.campaign_finance USING btree (id)
  - idx_campaign_finance_candidate: CREATE INDEX idx_campaign_finance_candidate ON public.campaign_finance USING btree (candidate_id)
  - idx_campaign_finance_cycle: CREATE INDEX idx_campaign_finance_cycle ON public.campaign_finance USING btree (cycle)

---

### candidate_jurisdictions
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - candidate_id: uuid NOT NULL
  - ocd_division_id: text NOT NULL
  - role: text NOT NULL
  - effective_from: date NULL
  - effective_to: date NULL
  - source: text NOT NULL
  - metadata: jsonb NOT NULL DEFAULT '{}'::jsonb
  - created_at: timestamp with time zone NOT NULL DEFAULT now()
  - updated_at: timestamp with time zone NOT NULL DEFAULT now()

**Foreign Keys:**
  - candidate_jurisdictions_candidate_id_fkey: (candidate_id) -> public.candidates(id)
  - candidate_jurisdictions_ocd_division_id_fkey: (ocd_division_id) -> public.civic_jurisdictions(ocd_division_id)

**Indexes:**
  - candidate_jurisdictions_candidate_id_ocd_division_id_role_key: UNIQUE CREATE UNIQUE INDEX candidate_jurisdictions_candidate_id_ocd_division_id_role_key ON public.candidate_jurisdictions USING btree (candidate_id, ocd_division_id, role)
  - candidate_jurisdictions_pkey: UNIQUE CREATE UNIQUE INDEX candidate_jurisdictions_pkey ON public.candidate_jurisdictions USING btree (id)
  - idx_candidate_jurisdictions_ocd: CREATE INDEX idx_candidate_jurisdictions_ocd ON public.candidate_jurisdictions USING btree (ocd_division_id)

---

### candidates
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - canonical_id: text NOT NULL
  - name: text NOT NULL
  - first_name: text NULL
  - last_name: text NULL
  - party: text NULL
  - office: text NOT NULL
  - chamber: text NULL
  - state: text NOT NULL
  - district: text NULL
  - level: text NOT NULL
  - email: text NULL
  - phone: text NULL
  - website: text NULL
  - photo_url: text NULL
  - social_media: jsonb NULL DEFAULT '{}'::jsonb
  - ocd_division_id: text NULL
  - jurisdiction_ids: text[] NULL
  - verified: boolean NULL DEFAULT false
  - verification_method: text NULL
  - verification_date: timestamp with time zone NULL
  - data_sources: text[] NOT NULL
  - quality_score: numeric(3,2) NULL DEFAULT 0.0
  - last_updated: timestamp with time zone NULL DEFAULT now()
  - created_at: timestamp with time zone NULL DEFAULT now()
  - provenance: jsonb NULL DEFAULT '{}'::jsonb
  - license_key: text NULL

**Indexes:**
  - candidates_canonical_id_key: UNIQUE CREATE UNIQUE INDEX candidates_canonical_id_key ON public.candidates USING btree (canonical_id)
  - candidates_pkey: UNIQUE CREATE UNIQUE INDEX candidates_pkey ON public.candidates USING btree (id)
  - idx_candidates_canonical_id: CREATE INDEX idx_candidates_canonical_id ON public.candidates USING btree (canonical_id)
  - idx_candidates_state_district: CREATE INDEX idx_candidates_state_district ON public.candidates USING btree (state, district)
  - idx_candidates_verified: CREATE INDEX idx_candidates_verified ON public.candidates USING btree (verified)

---

### civic_jurisdictions
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** ocd_division_id

**Columns:**
  - ocd_division_id: text NOT NULL
  - name: text NOT NULL
  - level: text NOT NULL
  - jurisdiction_type: text NULL
  - parent_ocd_id: text NULL
  - country_code: text NULL DEFAULT 'US'::text
  - state_code: text NULL
  - county_name: text NULL
  - city_name: text NULL
  - geo_scope: text NULL
  - centroid_lat: numeric(9,6) NULL
  - centroid_lon: numeric(9,6) NULL
  - bounding_box: jsonb NULL
  - population: integer NULL
  - source: text NOT NULL DEFAULT 'import'::text
  - last_refreshed: timestamp with time zone NOT NULL DEFAULT now()
  - metadata: jsonb NOT NULL DEFAULT '{}'::jsonb

**Foreign Keys:**
  - civic_jurisdictions_parent_ocd_id_fkey: (parent_ocd_id) -> public.civic_jurisdictions(ocd_division_id)

**Indexes:**
  - civic_jurisdictions_pkey: UNIQUE CREATE UNIQUE INDEX civic_jurisdictions_pkey ON public.civic_jurisdictions USING btree (ocd_division_id)
  - idx_civic_jurisdictions_level: CREATE INDEX idx_civic_jurisdictions_level ON public.civic_jurisdictions USING btree (level)
  - idx_civic_jurisdictions_parent: CREATE INDEX idx_civic_jurisdictions_parent ON public.civic_jurisdictions USING btree (parent_ocd_id)
  - idx_civic_jurisdictions_state: CREATE INDEX idx_civic_jurisdictions_state ON public.civic_jurisdictions USING btree (state_code)

---

### civics_feed_items
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** Social feed items for civic engagement

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - representative_id: uuid NULL
  - user_id: uuid NULL
  - content_type: text NOT NULL
  - title: text NOT NULL
  - description: text NULL
  - image_url: text NULL
  - url: text NULL
  - date: timestamp with time zone NOT NULL
  - engagement_metrics: jsonb NULL DEFAULT '{}'::jsonb
  - is_public: boolean NULL DEFAULT true
  - created_at: timestamp with time zone NULL DEFAULT now()

**Foreign Keys:**
  - civics_feed_items_representative_id_fkey: (representative_id) -> public.representatives_core(id)

**Indexes:**
  - civics_feed_items_pkey: UNIQUE CREATE UNIQUE INDEX civics_feed_items_pkey ON public.civics_feed_items USING btree (id)
  - idx_feed_items_rep_date: CREATE INDEX idx_feed_items_rep_date ON public.civics_feed_items USING btree (representative_id, date DESC)
  - idx_feed_items_type_date: CREATE INDEX idx_feed_items_type_date ON public.civics_feed_items USING btree (content_type, date DESC)
  - idx_feed_items_user_public: CREATE INDEX idx_feed_items_user_public ON public.civics_feed_items USING btree (user_id, is_public, date DESC)

---

### contributions
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - candidate_id: uuid NULL
  - committee_id: text NULL
  - contributor_name_hash: text NULL
  - contributor_city: text NULL
  - contributor_state: text NULL
  - contributor_zip5: text NULL
  - contributor_employer: text NULL
  - contributor_occupation: text NULL
  - amount: numeric(15,2) NOT NULL
  - contribution_date: date NOT NULL
  - contribution_type: text NULL
  - sector: text NULL
  - industry: text NULL
  - data_sources: text[] NOT NULL
  - quality_score: numeric(3,2) NULL DEFAULT 0.0
  - last_updated: timestamp with time zone NULL DEFAULT now()
  - created_at: timestamp with time zone NULL DEFAULT now()
  - provenance: jsonb NULL DEFAULT '{}'::jsonb
  - license_key: text NULL
  - retention_until: date NULL

**Foreign Keys:**
  - contributions_candidate_id_fkey: (candidate_id) -> public.candidates(id)

**Indexes:**
  - contributions_pkey: UNIQUE CREATE UNIQUE INDEX contributions_pkey ON public.contributions USING btree (id)
  - idx_contributions_candidate: CREATE INDEX idx_contributions_candidate ON public.contributions USING btree (candidate_id)
  - idx_contributions_date: CREATE INDEX idx_contributions_date ON public.contributions USING btree (contribution_date)

---

### data_checksums
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - table_name: text NOT NULL
  - record_id: uuid NOT NULL
  - checksum_type: text NOT NULL
  - checksum_value: text NOT NULL
  - data_snapshot: jsonb NULL
  - calculated_at: timestamp with time zone NOT NULL
  - created_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - data_checksums_pkey: UNIQUE CREATE UNIQUE INDEX data_checksums_pkey ON public.data_checksums USING btree (id)
  - data_checksums_table_name_record_id_checksum_type_key: UNIQUE CREATE UNIQUE INDEX data_checksums_table_name_record_id_checksum_type_key ON public.data_checksums USING btree (table_name, record_id, checksum_type)
  - idx_data_checksums_table: CREATE INDEX idx_data_checksums_table ON public.data_checksums USING btree (table_name, record_id)
  - idx_data_checksums_type: CREATE INDEX idx_data_checksums_type ON public.data_checksums USING btree (checksum_type)

---

### data_licenses
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** license_key

**Columns:**
  - license_key: text NOT NULL
  - source_name: text NOT NULL
  - attribution_text: text NOT NULL
  - display_requirements: text NULL
  - cache_ttl_seconds: integer NULL
  - usage_restrictions: jsonb NULL
  - created_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - data_licenses_pkey: UNIQUE CREATE UNIQUE INDEX data_licenses_pkey ON public.data_licenses USING btree (license_key)

---

### data_lineage
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - source_table: text NOT NULL
  - source_record_id: uuid NOT NULL
  - target_table: text NOT NULL
  - target_record_id: uuid NOT NULL
  - transformation_type: text NOT NULL
  - transformation_version: text NOT NULL
  - transformation_params: jsonb NULL
  - source_data_hash: text NULL
  - target_data_hash: text NULL
  - processing_started_at: timestamp with time zone NOT NULL
  - processing_completed_at: timestamp with time zone NULL
  - processing_duration_ms: integer NULL
  - success: boolean NULL DEFAULT false
  - error_message: text NULL
  - retry_count: integer NULL DEFAULT 0
  - created_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - data_lineage_pkey: UNIQUE CREATE UNIQUE INDEX data_lineage_pkey ON public.data_lineage USING btree (id)
  - idx_data_lineage_source: CREATE INDEX idx_data_lineage_source ON public.data_lineage USING btree (source_table, source_record_id)
  - idx_data_lineage_success: CREATE INDEX idx_data_lineage_success ON public.data_lineage USING btree (success)
  - idx_data_lineage_target: CREATE INDEX idx_data_lineage_target ON public.data_lineage USING btree (target_table, target_record_id)
  - idx_data_lineage_transformation: CREATE INDEX idx_data_lineage_transformation ON public.data_lineage USING btree (transformation_type, transformation_version)

---

### data_quality_audit
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - table_name: text NOT NULL
  - record_id: uuid NOT NULL
  - completeness_score: numeric(3,2) NULL DEFAULT 0.0
  - accuracy_score: numeric(3,2) NULL DEFAULT 0.0
  - consistency_score: numeric(3,2) NULL DEFAULT 0.0
  - timeliness_score: numeric(3,2) NULL DEFAULT 0.0
  - overall_score: numeric(3,2) NULL DEFAULT 0.0
  - primary_source: text NULL
  - secondary_sources: text[] NULL
  - conflict_resolution: text NULL
  - last_validation: timestamp with time zone NULL DEFAULT now()
  - validation_method: text NULL
  - issues_found: text[] NULL
  - resolved_issues: text[] NULL
  - created_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - data_quality_audit_pkey: UNIQUE CREATE UNIQUE INDEX data_quality_audit_pkey ON public.data_quality_audit USING btree (id)

---

### data_quality_checks
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - check_name: text NOT NULL
  - check_type: text NOT NULL
  - table_name: text NOT NULL
  - record_id: uuid NULL
  - check_params: jsonb NULL
  - expected_result: text NULL
  - actual_result: text NULL
  - passed: boolean NOT NULL
  - severity: text NULL
  - error_message: text NULL
  - suggested_fix: text NULL
  - check_executed_at: timestamp with time zone NOT NULL
  - check_version: text NOT NULL
  - created_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - data_quality_checks_pkey: UNIQUE CREATE UNIQUE INDEX data_quality_checks_pkey ON public.data_quality_checks USING btree (id)
  - idx_data_quality_checks_passed: CREATE INDEX idx_data_quality_checks_passed ON public.data_quality_checks USING btree (passed)
  - idx_data_quality_checks_severity: CREATE INDEX idx_data_quality_checks_severity ON public.data_quality_checks USING btree (severity)
  - idx_data_quality_checks_table: CREATE INDEX idx_data_quality_checks_table ON public.data_quality_checks USING btree (table_name)
  - idx_data_quality_checks_type: CREATE INDEX idx_data_quality_checks_type ON public.data_quality_checks USING btree (check_type)

---

### data_quality_metrics
**Schema:** public
**Rows:** 0
**RLS:** enabled
**Comment:** Data quality metrics and scoring for representatives

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - representative_id: uuid NULL
  - metric_name: text NOT NULL
  - metric_value: numeric NOT NULL
  - metric_type: text NOT NULL
  - data_source: text NOT NULL
  - calculated_at: timestamp with time zone NULL DEFAULT now()
  - created_at: timestamp with time zone NULL DEFAULT now()
  - metric_description: text NULL
  - source: text NOT NULL DEFAULT 'system'::text

**Foreign Keys:**
  - data_quality_metrics_representative_id_fkey: (representative_id) -> public.representatives_core(id)

**Indexes:**
  - data_quality_metrics_pkey: UNIQUE CREATE UNIQUE INDEX data_quality_metrics_pkey ON public.data_quality_metrics USING btree (id)
  - idx_data_quality_metrics_calculated: CREATE INDEX idx_data_quality_metrics_calculated ON public.data_quality_metrics USING btree (calculated_at DESC)
  - idx_data_quality_metrics_calculated_at: CREATE INDEX idx_data_quality_metrics_calculated_at ON public.data_quality_metrics USING btree (calculated_at)
  - idx_data_quality_metrics_metric_type: CREATE INDEX idx_data_quality_metrics_metric_type ON public.data_quality_metrics USING btree (metric_type)
  - idx_data_quality_metrics_rep_id: CREATE INDEX idx_data_quality_metrics_rep_id ON public.data_quality_metrics USING btree (representative_id)
  - idx_data_quality_metrics_representative_id: CREATE INDEX idx_data_quality_metrics_representative_id ON public.data_quality_metrics USING btree (representative_id)
  - idx_data_quality_metrics_type: CREATE INDEX idx_data_quality_metrics_type ON public.data_quality_metrics USING btree (metric_type)

---

### data_sources
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - name: text NOT NULL
  - type: text NOT NULL
  - api_endpoint: text NULL
  - api_key: text NULL
  - rate_limit: integer NULL DEFAULT 1000
  - reliability: numeric(3,2) NULL DEFAULT 0.9
  - is_active: boolean NULL DEFAULT true
  - last_updated: timestamp with time zone NULL DEFAULT now()
  - error_count: integer NULL DEFAULT 0
  - success_rate: numeric(5,2) NULL DEFAULT 100.0
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - data_sources_name_key: UNIQUE CREATE UNIQUE INDEX data_sources_name_key ON public.data_sources USING btree (name)
  - data_sources_pkey: UNIQUE CREATE UNIQUE INDEX data_sources_pkey ON public.data_sources USING btree (id)
  - idx_data_sources_is_active: CREATE INDEX idx_data_sources_is_active ON public.data_sources USING btree (is_active)
  - idx_data_sources_type: CREATE INDEX idx_data_sources_type ON public.data_sources USING btree (type)

---

### data_transformations
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - transformation_name: text NOT NULL
  - transformation_version: text NOT NULL
  - source_system: text NOT NULL
  - target_system: text NOT NULL
  - transformation_sql: text NULL
  - transformation_params: jsonb NULL
  - input_records_count: integer NULL
  - output_records_count: integer NULL
  - error_records_count: integer NULL
  - processing_started_at: timestamp with time zone NOT NULL
  - processing_completed_at: timestamp with time zone NULL
  - processing_duration_ms: integer NULL
  - success: boolean NULL DEFAULT false
  - error_message: text NULL
  - retry_count: integer NULL DEFAULT 0
  - created_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - data_transformations_pkey: UNIQUE CREATE UNIQUE INDEX data_transformations_pkey ON public.data_transformations USING btree (id)
  - idx_data_transformations_name: CREATE INDEX idx_data_transformations_name ON public.data_transformations USING btree (transformation_name, transformation_version)
  - idx_data_transformations_success: CREATE INDEX idx_data_transformations_success ON public.data_transformations USING btree (success)

---

### dbt_freshness_sla
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - table_name: text NOT NULL
  - max_age_hours: integer NOT NULL
  - warning_threshold_hours: integer NULL
  - enabled: boolean NULL DEFAULT true
  - last_check: timestamp with time zone NULL
  - last_success: timestamp with time zone NULL
  - last_failure: timestamp with time zone NULL
  - consecutive_failures: integer NULL DEFAULT 0
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - dbt_freshness_sla_pkey: UNIQUE CREATE UNIQUE INDEX dbt_freshness_sla_pkey ON public.dbt_freshness_sla USING btree (id)
  - dbt_freshness_sla_table_name_key: UNIQUE CREATE UNIQUE INDEX dbt_freshness_sla_table_name_key ON public.dbt_freshness_sla USING btree (table_name)
  - idx_dbt_freshness_sla_enabled: CREATE INDEX idx_dbt_freshness_sla_enabled ON public.dbt_freshness_sla USING btree (enabled)
  - idx_dbt_freshness_sla_table_name: CREATE INDEX idx_dbt_freshness_sla_table_name ON public.dbt_freshness_sla USING btree (table_name)

---

### dbt_test_config
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - test_name: text NOT NULL
  - test_type: text NOT NULL
  - table_name: text NOT NULL
  - column_name: text NULL
  - test_config: jsonb NULL DEFAULT '{}'::jsonb
  - enabled: boolean NULL DEFAULT true
  - severity: text NULL DEFAULT 'error'::text
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - dbt_test_config_pkey: UNIQUE CREATE UNIQUE INDEX dbt_test_config_pkey ON public.dbt_test_config USING btree (id)
  - dbt_test_config_test_name_key: UNIQUE CREATE UNIQUE INDEX dbt_test_config_test_name_key ON public.dbt_test_config USING btree (test_name)
  - idx_dbt_test_config_enabled: CREATE INDEX idx_dbt_test_config_enabled ON public.dbt_test_config USING btree (enabled)
  - idx_dbt_test_config_table_name: CREATE INDEX idx_dbt_test_config_table_name ON public.dbt_test_config USING btree (table_name)

---

### dbt_test_execution_log
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - execution_id: uuid NOT NULL
  - test_name: text NOT NULL
  - status: text NOT NULL
  - message: text NULL
  - execution_time_ms: integer NULL
  - executed_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - dbt_test_execution_log_pkey: UNIQUE CREATE UNIQUE INDEX dbt_test_execution_log_pkey ON public.dbt_test_execution_log USING btree (id)
  - idx_dbt_test_execution_log_executed_at: CREATE INDEX idx_dbt_test_execution_log_executed_at ON public.dbt_test_execution_log USING btree (executed_at)
  - idx_dbt_test_execution_log_execution_id: CREATE INDEX idx_dbt_test_execution_log_execution_id ON public.dbt_test_execution_log USING btree (execution_id)

---

### dbt_test_results
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - test_name: text NOT NULL
  - test_type: text NOT NULL
  - table_name: text NOT NULL
  - column_name: text NULL
  - test_config: jsonb NULL DEFAULT '{}'::jsonb
  - status: text NOT NULL
  - message: text NULL
  - rows_affected: bigint NULL
  - execution_time_ms: integer NULL
  - executed_at: timestamp with time zone NULL DEFAULT now()
  - created_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - dbt_test_results_pkey: UNIQUE CREATE UNIQUE INDEX dbt_test_results_pkey ON public.dbt_test_results USING btree (id)
  - idx_dbt_test_results_executed_at: CREATE INDEX idx_dbt_test_results_executed_at ON public.dbt_test_results USING btree (executed_at)
  - idx_dbt_test_results_status: CREATE INDEX idx_dbt_test_results_status ON public.dbt_test_results USING btree (status)
  - idx_dbt_test_results_table_name: CREATE INDEX idx_dbt_test_results_table_name ON public.dbt_test_results USING btree (table_name)

---

### elections
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - canonical_id: text NOT NULL
  - name: text NOT NULL
  - type: text NOT NULL
  - level: text NOT NULL
  - state: text NOT NULL
  - district: text NULL
  - election_date: date NOT NULL
  - registration_deadline: date NULL
  - early_voting_start: date NULL
  - early_voting_end: date NULL
  - ocd_division_id: text NULL
  - jurisdiction_ids: text[] NULL
  - status: text NULL DEFAULT 'upcoming'::text
  - results_available: boolean NULL DEFAULT false
  - data_sources: text[] NOT NULL
  - quality_score: numeric(3,2) NULL DEFAULT 0.0
  - last_updated: timestamp with time zone NULL DEFAULT now()
  - created_at: timestamp with time zone NULL DEFAULT now()
  - provenance: jsonb NULL DEFAULT '{}'::jsonb
  - license_key: text NULL

**Indexes:**
  - elections_canonical_id_key: UNIQUE CREATE UNIQUE INDEX elections_canonical_id_key ON public.elections USING btree (canonical_id)
  - elections_pkey: UNIQUE CREATE UNIQUE INDEX elections_pkey ON public.elections USING btree (id)
  - idx_elections_canonical_id: CREATE INDEX idx_elections_canonical_id ON public.elections USING btree (canonical_id)
  - idx_elections_date: CREATE INDEX idx_elections_date ON public.elections USING btree (election_date)

---

### error_logs
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** System error logging for monitoring and debugging

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - user_id: uuid NULL
  - error_type: text NOT NULL
  - error_message: text NOT NULL
  - stack_trace: text NULL
  - context: jsonb NULL DEFAULT '{}'::jsonb
  - severity: text NOT NULL
  - created_at: timestamp with time zone NULL DEFAULT now()

**Foreign Keys:**
  - error_logs_user_id_fkey: (user_id) -> auth.users(id)

**Indexes:**
  - error_logs_pkey: UNIQUE CREATE UNIQUE INDEX error_logs_pkey ON public.error_logs USING btree (id)
  - idx_error_logs_created_at: CREATE INDEX idx_error_logs_created_at ON public.error_logs USING btree (created_at DESC)
  - idx_error_logs_severity: CREATE INDEX idx_error_logs_severity ON public.error_logs USING btree (severity)
  - idx_error_logs_user_id: CREATE INDEX idx_error_logs_user_id ON public.error_logs USING btree (user_id)

---

### fact_check_sources
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - name: text NOT NULL
  - url: text NULL
  - reliability: numeric(3,2) NULL DEFAULT 0.5
  - bias: text NULL
  - fact_check_rating: text NULL DEFAULT 'unknown'::text
  - api_endpoint: text NULL
  - api_key: text NULL
  - is_active: boolean NULL DEFAULT true
  - metadata: jsonb NULL DEFAULT '{}'::jsonb
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - fact_check_sources_pkey: UNIQUE CREATE UNIQUE INDEX fact_check_sources_pkey ON public.fact_check_sources USING btree (id)

---

### fec_candidate_committee
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** ['fec_candidate_id', 'fec_committee_id', 'cycle']

**Columns:**
  - fec_candidate_id: text NOT NULL
  - fec_committee_id: text NOT NULL
  - designation: text NULL
  - cycle: integer NOT NULL
  - committee_name: text NULL
  - committee_type: text NULL
  - committee_designation: text NULL
  - committee_organization_type: text NULL
  - candidate_name: text NULL
  - candidate_office: text NULL
  - candidate_state: text NULL
  - candidate_district: text NULL
  - candidate_party: text NULL
  - candidate_status: text NULL
  - candidate_incumbent_challenge_status: text NULL
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - fec_candidate_committee_pkey: UNIQUE CREATE UNIQUE INDEX fec_candidate_committee_pkey ON public.fec_candidate_committee USING btree (fec_candidate_id, fec_committee_id, cycle)
  - idx_fec_candidate_committee_candidate: CREATE INDEX idx_fec_candidate_committee_candidate ON public.fec_candidate_committee USING btree (fec_candidate_id)
  - idx_fec_candidate_committee_committee: CREATE INDEX idx_fec_candidate_committee_committee ON public.fec_candidate_committee USING btree (fec_committee_id)
  - idx_fec_candidate_committee_cycle: CREATE INDEX idx_fec_candidate_committee_cycle ON public.fec_candidate_committee USING btree (cycle)
  - idx_fec_candidate_committee_designation: CREATE INDEX idx_fec_candidate_committee_designation ON public.fec_candidate_committee USING btree (designation)

---

### fec_candidates
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** candidate_id

**Columns:**
  - candidate_id: text NOT NULL
  - name: text NOT NULL
  - office: text NULL
  - party: text NULL
  - state: text NULL
  - district: text NULL
  - incumbent_challenge_status: text NULL
  - candidate_status: text NULL
  - candidate_inactive: text NULL
  - election_years: integer[] NULL
  - election_districts: text[] NULL
  - first_file_date: date NULL
  - last_file_date: date NULL
  - last_f2_date: date NULL
  - active_through: integer NULL
  - principal_committees: text[] NULL
  - authorized_committees: text[] NULL
  - total_receipts: numeric(15,2) NULL DEFAULT 0.0
  - total_disbursements: numeric(15,2) NULL DEFAULT 0.0
  - cash_on_hand: numeric(15,2) NULL DEFAULT 0.0
  - debt: numeric(15,2) NULL DEFAULT 0.0
  - last_updated: timestamp with time zone NULL DEFAULT now()
  - created_at: timestamp with time zone NULL DEFAULT now()
  - data_source: text NULL DEFAULT 'fec'::text
  - is_efiling: boolean NULL DEFAULT false
  - is_processed: boolean NULL DEFAULT true
  - provenance: jsonb NULL DEFAULT '{}'::jsonb

**Indexes:**
  - fec_candidates_pkey: UNIQUE CREATE UNIQUE INDEX fec_candidates_pkey ON public.fec_candidates USING btree (candidate_id)
  - idx_fec_candidates_cycles: CREATE INDEX idx_fec_candidates_cycles ON public.fec_candidates USING gin (election_years)
  - idx_fec_candidates_efiling: CREATE INDEX idx_fec_candidates_efiling ON public.fec_candidates USING btree (is_efiling)
  - idx_fec_candidates_office: CREATE INDEX idx_fec_candidates_office ON public.fec_candidates USING btree (office)
  - idx_fec_candidates_party: CREATE INDEX idx_fec_candidates_party ON public.fec_candidates USING btree (party)
  - idx_fec_candidates_processed: CREATE INDEX idx_fec_candidates_processed ON public.fec_candidates USING btree (is_processed)
  - idx_fec_candidates_state: CREATE INDEX idx_fec_candidates_state ON public.fec_candidates USING btree (state)

---

### fec_committees
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** committee_id

**Columns:**
  - committee_id: text NOT NULL
  - committee_name: text NOT NULL
  - committee_type: text NULL
  - committee_designation: text NULL
  - committee_organization_type: text NULL
  - committee_party: text NULL
  - committee_state: text NULL
  - committee_district: text NULL
  - treasurer_name: text NULL
  - treasurer_city: text NULL
  - treasurer_state: text NULL
  - treasurer_zip: text NULL
  - custodian_name: text NULL
  - custodian_city: text NULL
  - custodian_state: text NULL
  - custodian_zip: text NULL
  - street_1: text NULL
  - street_2: text NULL
  - city: text NULL
  - state: text NULL
  - zip: text NULL
  - candidate_id: text NULL
  - candidate_name: text NULL
  - candidate_office: text NULL
  - candidate_state: text NULL
  - candidate_district: text NULL
  - candidate_party: text NULL
  - candidate_status: text NULL
  - candidate_incumbent_challenge_status: text NULL
  - first_file_date: date NULL
  - last_file_date: date NULL
  - last_f1_date: date NULL
  - organization_type: text NULL
  - organization_type_full: text NULL
  - designation: text NULL
  - designation_full: text NULL
  - committee_type_full: text NULL
  - party_full: text NULL
  - filing_frequency: text NULL
  - filing_frequency_full: text NULL
  - cycles: integer[] NULL
  - total_receipts: numeric(15,2) NULL DEFAULT 0.0
  - total_disbursements: numeric(15,2) NULL DEFAULT 0.0
  - cash_on_hand: numeric(15,2) NULL DEFAULT 0.0
  - debt: numeric(15,2) NULL DEFAULT 0.0
  - last_updated: timestamp with time zone NULL DEFAULT now()
  - created_at: timestamp with time zone NULL DEFAULT now()
  - data_source: text NULL DEFAULT 'fec'::text
  - is_efiling: boolean NULL DEFAULT false
  - is_processed: boolean NULL DEFAULT true
  - provenance: jsonb NULL DEFAULT '{}'::jsonb

**Indexes:**
  - fec_committees_pkey: UNIQUE CREATE UNIQUE INDEX fec_committees_pkey ON public.fec_committees USING btree (committee_id)
  - idx_fec_committees_candidate: CREATE INDEX idx_fec_committees_candidate ON public.fec_committees USING btree (candidate_id)
  - idx_fec_committees_cycles: CREATE INDEX idx_fec_committees_cycles ON public.fec_committees USING gin (cycles)
  - idx_fec_committees_efiling: CREATE INDEX idx_fec_committees_efiling ON public.fec_committees USING btree (is_efiling)
  - idx_fec_committees_processed: CREATE INDEX idx_fec_committees_processed ON public.fec_committees USING btree (is_processed)
  - idx_fec_committees_type: CREATE INDEX idx_fec_committees_type ON public.fec_committees USING btree (committee_type)

---

### fec_contributions
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - committee_id: text NOT NULL
  - candidate_id: text NULL
  - contributor_name: text NULL
  - contributor_name_normalized: text NULL
  - contributor_city: text NULL
  - contributor_state: text NULL
  - contributor_zip: text NULL
  - contributor_employer: text NULL
  - contributor_occupation: text NULL
  - contributor_organization_name: text NULL
  - contributor_organization_type: text NULL
  - contributor_committee_id: text NULL
  - contributor_committee_name: text NULL
  - contributor_committee_type: text NULL
  - contributor_committee_designation: text NULL
  - contributor_committee_organization_type: text NULL
  - contributor_committee_party: text NULL
  - contributor_committee_state: text NULL
  - contributor_committee_district: text NULL
  - amount: numeric(15,2) NOT NULL
  - contribution_date: date NOT NULL
  - contribution_type: text NULL
  - contribution_type_desc: text NULL
  - memo_code: text NULL
  - memo_text: text NULL
  - receipt_type: text NULL
  - receipt_type_desc: text NULL
  - receipt_type_full: text NULL
  - line_number: text NULL
  - transaction_id: text NULL
  - file_number: text NULL
  - report_type: text NULL
  - report_type_full: text NULL
  - report_year: integer NULL
  - two_year_transaction_period: integer NOT NULL
  - cycle: integer NOT NULL
  - sub_id: text NULL
  - link_id: text NULL
  - image_number: text NULL
  - file_number_raw: text NULL
  - is_individual: boolean NULL
  - is_corporate: boolean NULL
  - is_pac: boolean NULL
  - is_party: boolean NULL
  - is_self_financing: boolean NULL
  - sector: text NULL
  - industry: text NULL
  - last_updated: timestamp with time zone NULL DEFAULT now()
  - created_at: timestamp with time zone NULL DEFAULT now()
  - data_source: text NULL DEFAULT 'fec'::text
  - is_efiling: boolean NULL DEFAULT false
  - is_processed: boolean NULL DEFAULT true
  - provenance: jsonb NULL DEFAULT '{}'::jsonb

**Indexes:**
  - fec_contributions_pkey: UNIQUE CREATE UNIQUE INDEX fec_contributions_pkey ON public.fec_contributions USING btree (id)
  - idx_fec_contributions_amount: CREATE INDEX idx_fec_contributions_amount ON public.fec_contributions USING btree (amount)
  - idx_fec_contributions_candidate: CREATE INDEX idx_fec_contributions_candidate ON public.fec_contributions USING btree (candidate_id)
  - idx_fec_contributions_committee: CREATE INDEX idx_fec_contributions_committee ON public.fec_contributions USING btree (committee_id)
  - idx_fec_contributions_cycle: CREATE INDEX idx_fec_contributions_cycle ON public.fec_contributions USING btree (cycle)
  - idx_fec_contributions_date: CREATE INDEX idx_fec_contributions_date ON public.fec_contributions USING btree (contribution_date)
  - idx_fec_contributions_efiling: CREATE INDEX idx_fec_contributions_efiling ON public.fec_contributions USING btree (is_efiling)
  - idx_fec_contributions_period: CREATE INDEX idx_fec_contributions_period ON public.fec_contributions USING btree (two_year_transaction_period)
  - idx_fec_contributions_processed: CREATE INDEX idx_fec_contributions_processed ON public.fec_contributions USING btree (is_processed)

---

### fec_cycles
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** cycle

**Columns:**
  - cycle: integer NOT NULL
  - cycle_name: text NOT NULL
  - start_date: date NOT NULL
  - end_date: date NOT NULL
  - election_date: date NOT NULL
  - is_current: boolean NULL DEFAULT false
  - is_upcoming: boolean NULL DEFAULT false
  - is_completed: boolean NULL DEFAULT false
  - data_available: boolean NULL DEFAULT false
  - last_updated: timestamp with time zone NULL DEFAULT now()
  - created_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - fec_cycles_pkey: UNIQUE CREATE UNIQUE INDEX fec_cycles_pkey ON public.fec_cycles USING btree (cycle)
  - idx_fec_cycles_completed: CREATE INDEX idx_fec_cycles_completed ON public.fec_cycles USING btree (is_completed)
  - idx_fec_cycles_current: CREATE INDEX idx_fec_cycles_current ON public.fec_cycles USING btree (is_current)
  - idx_fec_cycles_upcoming: CREATE INDEX idx_fec_cycles_upcoming ON public.fec_cycles USING btree (is_upcoming)

---

### fec_disbursements
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - committee_id: text NOT NULL
  - candidate_id: text NULL
  - recipient_name: text NULL
  - recipient_name_normalized: text NULL
  - recipient_city: text NULL
  - recipient_state: text NULL
  - recipient_zip: text NULL
  - recipient_employer: text NULL
  - recipient_occupation: text NULL
  - recipient_organization_name: text NULL
  - recipient_organization_type: text NULL
  - recipient_committee_id: text NULL
  - recipient_committee_name: text NULL
  - recipient_committee_type: text NULL
  - recipient_committee_designation: text NULL
  - recipient_committee_organization_type: text NULL
  - recipient_committee_party: text NULL
  - recipient_committee_state: text NULL
  - recipient_committee_district: text NULL
  - amount: numeric(15,2) NOT NULL
  - disbursement_date: date NOT NULL
  - disbursement_type: text NULL
  - disbursement_type_desc: text NULL
  - memo_code: text NULL
  - memo_text: text NULL
  - receipt_type: text NULL
  - receipt_type_desc: text NULL
  - receipt_type_full: text NULL
  - line_number: text NULL
  - transaction_id: text NULL
  - file_number: text NULL
  - report_type: text NULL
  - report_type_full: text NULL
  - report_year: integer NULL
  - two_year_transaction_period: integer NOT NULL
  - cycle: integer NOT NULL
  - sub_id: text NULL
  - link_id: text NULL
  - image_number: text NULL
  - file_number_raw: text NULL
  - purpose: text NULL
  - purpose_desc: text NULL
  - category: text NULL
  - category_desc: text NULL
  - last_updated: timestamp with time zone NULL DEFAULT now()
  - created_at: timestamp with time zone NULL DEFAULT now()
  - data_source: text NULL DEFAULT 'fec'::text
  - is_efiling: boolean NULL DEFAULT false
  - is_processed: boolean NULL DEFAULT true
  - provenance: jsonb NULL DEFAULT '{}'::jsonb

**Indexes:**
  - fec_disbursements_pkey: UNIQUE CREATE UNIQUE INDEX fec_disbursements_pkey ON public.fec_disbursements USING btree (id)
  - idx_fec_disbursements_amount: CREATE INDEX idx_fec_disbursements_amount ON public.fec_disbursements USING btree (amount)
  - idx_fec_disbursements_candidate: CREATE INDEX idx_fec_disbursements_candidate ON public.fec_disbursements USING btree (candidate_id)
  - idx_fec_disbursements_committee: CREATE INDEX idx_fec_disbursements_committee ON public.fec_disbursements USING btree (committee_id)
  - idx_fec_disbursements_cycle: CREATE INDEX idx_fec_disbursements_cycle ON public.fec_disbursements USING btree (cycle)
  - idx_fec_disbursements_date: CREATE INDEX idx_fec_disbursements_date ON public.fec_disbursements USING btree (disbursement_date)
  - idx_fec_disbursements_efiling: CREATE INDEX idx_fec_disbursements_efiling ON public.fec_disbursements USING btree (is_efiling)
  - idx_fec_disbursements_period: CREATE INDEX idx_fec_disbursements_period ON public.fec_disbursements USING btree (two_year_transaction_period)
  - idx_fec_disbursements_processed: CREATE INDEX idx_fec_disbursements_processed ON public.fec_disbursements USING btree (is_processed)

---

### fec_independent_expenditures
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - committee_id: text NOT NULL
  - candidate_id: text NULL
  - candidate_name: text NULL
  - candidate_office: text NULL
  - candidate_state: text NULL
  - candidate_district: text NULL
  - candidate_party: text NULL
  - candidate_status: text NULL
  - candidate_incumbent_challenge_status: text NULL
  - spender_name: text NULL
  - spender_city: text NULL
  - spender_state: text NULL
  - spender_zip: text NULL
  - spender_employer: text NULL
  - spender_occupation: text NULL
  - spender_organization_name: text NULL
  - spender_organization_type: text NULL
  - spender_committee_id: text NULL
  - spender_committee_name: text NULL
  - spender_committee_type: text NULL
  - spender_committee_designation: text NULL
  - spender_committee_organization_type: text NULL
  - spender_committee_party: text NULL
  - spender_committee_state: text NULL
  - spender_committee_district: text NULL
  - amount: numeric(15,2) NOT NULL
  - expenditure_date: date NOT NULL
  - expenditure_type: text NULL
  - expenditure_type_desc: text NULL
  - memo_code: text NULL
  - memo_text: text NULL
  - receipt_type: text NULL
  - receipt_type_desc: text NULL
  - receipt_type_full: text NULL
  - line_number: text NULL
  - transaction_id: text NULL
  - file_number: text NULL
  - report_type: text NULL
  - report_type_full: text NULL
  - report_year: integer NULL
  - two_year_transaction_period: integer NOT NULL
  - cycle: integer NOT NULL
  - sub_id: text NULL
  - link_id: text NULL
  - image_number: text NULL
  - file_number_raw: text NULL
  - purpose: text NULL
  - purpose_desc: text NULL
  - category: text NULL
  - category_desc: text NULL
  - support_oppose_indicator: text NULL
  - support_oppose_indicator_desc: text NULL
  - last_updated: timestamp with time zone NULL DEFAULT now()
  - created_at: timestamp with time zone NULL DEFAULT now()
  - data_source: text NULL DEFAULT 'fec'::text
  - is_efiling: boolean NULL DEFAULT false
  - is_processed: boolean NULL DEFAULT true
  - provenance: jsonb NULL DEFAULT '{}'::jsonb

**Indexes:**
  - fec_independent_expenditures_pkey: UNIQUE CREATE UNIQUE INDEX fec_independent_expenditures_pkey ON public.fec_independent_expenditures USING btree (id)
  - idx_fec_ie_amount: CREATE INDEX idx_fec_ie_amount ON public.fec_independent_expenditures USING btree (amount)
  - idx_fec_ie_candidate: CREATE INDEX idx_fec_ie_candidate ON public.fec_independent_expenditures USING btree (candidate_id)
  - idx_fec_ie_committee: CREATE INDEX idx_fec_ie_committee ON public.fec_independent_expenditures USING btree (committee_id)
  - idx_fec_ie_cycle: CREATE INDEX idx_fec_ie_cycle ON public.fec_independent_expenditures USING btree (cycle)
  - idx_fec_ie_date: CREATE INDEX idx_fec_ie_date ON public.fec_independent_expenditures USING btree (expenditure_date)
  - idx_fec_ie_efiling: CREATE INDEX idx_fec_ie_efiling ON public.fec_independent_expenditures USING btree (is_efiling)
  - idx_fec_ie_period: CREATE INDEX idx_fec_ie_period ON public.fec_independent_expenditures USING btree (two_year_transaction_period)
  - idx_fec_ie_processed: CREATE INDEX idx_fec_ie_processed ON public.fec_independent_expenditures USING btree (is_processed)

---

### fec_ingest_cursors
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** ['source', 'cycle', 'cursor_type']

**Columns:**
  - source: text NOT NULL
  - cycle: integer NOT NULL
  - cursor_type: text NOT NULL
  - cursor_value: text NOT NULL
  - last_updated: timestamp with time zone NULL DEFAULT now()
  - created_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - fec_ingest_cursors_pkey: UNIQUE CREATE UNIQUE INDEX fec_ingest_cursors_pkey ON public.fec_ingest_cursors USING btree (source, cycle, cursor_type)
  - idx_fec_ingest_cursors_cycle: CREATE INDEX idx_fec_ingest_cursors_cycle ON public.fec_ingest_cursors USING btree (cycle)
  - idx_fec_ingest_cursors_source: CREATE INDEX idx_fec_ingest_cursors_source ON public.fec_ingest_cursors USING btree (source)

---

### feedback
**Schema:** public
**Rows:** 23
**RLS:** enabled
**Comment:** User feedback and feature requests

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - user_id: uuid NULL
  - poll_id: uuid NULL
  - topic_id: uuid NULL
  - type: text NOT NULL
  - rating: integer NULL
  - description: text NULL
  - metadata: jsonb NULL DEFAULT '{}'::jsonb
  - created_at: timestamp with time zone NULL DEFAULT now()
  - ai_analysis: jsonb NULL DEFAULT '{}'::jsonb
  - user_journey: jsonb NULL DEFAULT '{}'::jsonb
  - screenshot: text NULL
  - status: text NULL DEFAULT 'open'::text
  - priority: text NULL DEFAULT 'medium'::text
  - tags: text[] NULL DEFAULT '{}'::text[]
  - updated_at: timestamp with time zone NULL DEFAULT now()
  - sentiment: text NULL
  - title: text NULL

**Foreign Keys:**
  - feedback_poll_id_fkey: (poll_id) -> public.generated_polls(id)
  - feedback_topic_id_fkey: (topic_id) -> public.trending_topics(id)
  - feedback_user_id_fkey: (user_id) -> auth.users(id)

**Indexes:**
  - feedback_pkey: UNIQUE CREATE UNIQUE INDEX feedback_pkey ON public.feedback USING btree (id)
  - idx_feedback_ai_analysis: CREATE INDEX idx_feedback_ai_analysis ON public.feedback USING gin (ai_analysis)
  - idx_feedback_created_at: CREATE INDEX idx_feedback_created_at ON public.feedback USING btree (created_at)
  - idx_feedback_created_status: CREATE INDEX idx_feedback_created_status ON public.feedback USING btree (created_at, status)
  - idx_feedback_description: CREATE INDEX idx_feedback_description ON public.feedback USING btree (description)
  - idx_feedback_feedback_type: CREATE INDEX idx_feedback_feedback_type ON public.feedback USING btree (type)
  - idx_feedback_poll_id: CREATE INDEX idx_feedback_poll_id ON public.feedback USING btree (poll_id)
  - idx_feedback_priority: CREATE INDEX idx_feedback_priority ON public.feedback USING btree (priority)
  - idx_feedback_sentiment: CREATE INDEX idx_feedback_sentiment ON public.feedback USING btree (sentiment)
  - idx_feedback_status: CREATE INDEX idx_feedback_status ON public.feedback USING btree (status)
  - idx_feedback_status_created: CREATE INDEX idx_feedback_status_created ON public.feedback USING btree (status, created_at DESC)
  - idx_feedback_status_priority: CREATE INDEX idx_feedback_status_priority ON public.feedback USING btree (status, priority)
  - idx_feedback_tags: CREATE INDEX idx_feedback_tags ON public.feedback USING gin (tags)
  - idx_feedback_title: CREATE INDEX idx_feedback_title ON public.feedback USING btree (title)
  - idx_feedback_type: CREATE INDEX idx_feedback_type ON public.feedback USING btree (type)
  - idx_feedback_user_id: CREATE INDEX idx_feedback_user_id ON public.feedback USING btree (user_id)
  - idx_feedback_user_journey: CREATE INDEX idx_feedback_user_journey ON public.feedback USING gin (user_journey)
  - idx_feedback_user_status: CREATE INDEX idx_feedback_user_status ON public.feedback USING btree (user_id, status)

---

### generated_polls
**Schema:** public
**Rows:** 3
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - topic_id: uuid NULL
  - title: text NOT NULL
  - description: text NULL
  - options: jsonb NOT NULL
  - voting_method: text NOT NULL
  - category: text NULL
  - tags: text[] NULL DEFAULT '{}'::text[]
  - quality_score: numeric(3,2) NULL DEFAULT 0.0
  - status: text NULL DEFAULT 'draft'::text
  - approved_by: uuid NULL
  - approved_at: timestamp with time zone NULL
  - topic_analysis: jsonb NULL DEFAULT '{}'::jsonb
  - quality_metrics: jsonb NULL DEFAULT '{}'::jsonb
  - generation_metadata: jsonb NULL DEFAULT '{}'::jsonb
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Foreign Keys:**
  - generated_polls_approved_by_fkey: (approved_by) -> auth.users(id)
  - generated_polls_topic_id_fkey: (topic_id) -> public.trending_topics(id)

**Indexes:**
  - generated_polls_pkey: UNIQUE CREATE UNIQUE INDEX generated_polls_pkey ON public.generated_polls USING btree (id)
  - idx_generated_polls_created_at: CREATE INDEX idx_generated_polls_created_at ON public.generated_polls USING btree (created_at DESC)
  - idx_generated_polls_quality: CREATE INDEX idx_generated_polls_quality ON public.generated_polls USING btree (quality_score)
  - idx_generated_polls_quality_score: CREATE INDEX idx_generated_polls_quality_score ON public.generated_polls USING btree (quality_score DESC)
  - idx_generated_polls_status: CREATE INDEX idx_generated_polls_status ON public.generated_polls USING btree (status)
  - idx_generated_polls_status_quality: CREATE INDEX idx_generated_polls_status_quality ON public.generated_polls USING btree (status, quality_score)
  - idx_generated_polls_topic_id: CREATE INDEX idx_generated_polls_topic_id ON public.generated_polls USING btree (topic_id)
  - idx_generated_polls_topic_status: CREATE INDEX idx_generated_polls_topic_status ON public.generated_polls USING btree (topic_id, status)

---

### id_crosswalk
**Schema:** public
**Rows:** 170
**RLS:** enabled
**Comment:** Crosswalk between different ID systems for representatives

**Primary Key:** entity_uuid

**Columns:**
  - entity_uuid: uuid NOT NULL DEFAULT gen_random_uuid()
  - entity_type: text NOT NULL
  - canonical_id: text NOT NULL
  - source: text NOT NULL
  - source_id: text NOT NULL
  - attrs: jsonb NULL DEFAULT '{}'::jsonb
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - id_crosswalk_pkey: UNIQUE CREATE UNIQUE INDEX id_crosswalk_pkey ON public.id_crosswalk USING btree (entity_uuid)
  - id_crosswalk_source_source_id_key: UNIQUE CREATE UNIQUE INDEX id_crosswalk_source_source_id_key ON public.id_crosswalk USING btree (source, source_id)
  - idx_id_crosswalk_canonical_id: CREATE INDEX idx_id_crosswalk_canonical_id ON public.id_crosswalk USING btree (canonical_id)
  - idx_id_crosswalk_source: CREATE INDEX idx_id_crosswalk_source ON public.id_crosswalk USING btree (source)

---

### idempotency_keys
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** Stores idempotency keys for server actions to prevent double-submission attacks

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - key: text NOT NULL -- Unique idempotency key (namespace:key format)
  - result_data: jsonb NULL -- Cached result data from previous execution
  - expires_at: timestamp with time zone NOT NULL -- When this key expires and can be cleaned up
  - created_at: timestamp with time zone NULL DEFAULT now() -- When this key was created

**Indexes:**
  - idempotency_keys_key_key: UNIQUE CREATE UNIQUE INDEX idempotency_keys_key_key ON public.idempotency_keys USING btree (key)
  - idempotency_keys_pkey: UNIQUE CREATE UNIQUE INDEX idempotency_keys_pkey ON public.idempotency_keys USING btree (id)
  - idx_idempotency_keys_expires_at: CREATE INDEX idx_idempotency_keys_expires_at ON public.idempotency_keys USING btree (expires_at)
  - idx_idempotency_keys_key: CREATE INDEX idx_idempotency_keys_key ON public.idempotency_keys USING btree (key)
  - idx_idempotency_keys_key_expires: CREATE INDEX idx_idempotency_keys_key_expires ON public.idempotency_keys USING btree (key, expires_at)

---

### independence_score_methodology
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** version

**Columns:**
  - version: text NOT NULL
  - formula: text NOT NULL
  - data_sources: text[] NOT NULL
  - confidence_interval: numeric(3,2) NULL
  - experimental: boolean NULL DEFAULT true
  - methodology_url: text NULL
  - created_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - independence_score_methodology_pkey: UNIQUE CREATE UNIQUE INDEX independence_score_methodology_pkey ON public.independence_score_methodology USING btree (version)

---

### ingest_cursors
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** source

**Columns:**
  - source: text NOT NULL
  - cursor: jsonb NOT NULL
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - ingest_cursors_pkey: UNIQUE CREATE UNIQUE INDEX ingest_cursors_pkey ON public.ingest_cursors USING btree (source)

---

### jurisdiction_aliases
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - alias_type: text NOT NULL
  - alias_value: text NOT NULL
  - normalized_value: text NULL
  - ocd_division_id: text NOT NULL
  - confidence: numeric(4,3) NULL DEFAULT 1.000
  - source: text NOT NULL DEFAULT 'import'::text
  - last_refreshed: timestamp with time zone NOT NULL DEFAULT now()
  - metadata: jsonb NOT NULL DEFAULT '{}'::jsonb

**Foreign Keys:**
  - jurisdiction_aliases_ocd_division_id_fkey: (ocd_division_id) -> public.civic_jurisdictions(ocd_division_id)

**Indexes:**
  - idx_jurisdiction_aliases_ocd: CREATE INDEX idx_jurisdiction_aliases_ocd ON public.jurisdiction_aliases USING btree (ocd_division_id)
  - jurisdiction_aliases_pkey: UNIQUE CREATE UNIQUE INDEX jurisdiction_aliases_pkey ON public.jurisdiction_aliases USING btree (id)
  - uid_jurisdiction_aliases_alias: UNIQUE CREATE UNIQUE INDEX uid_jurisdiction_aliases_alias ON public.jurisdiction_aliases USING btree (alias_type, alias_value)

---

### jurisdiction_geometries
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** ocd_division_id

**Columns:**
  - ocd_division_id: text NOT NULL
  - geometry: jsonb NOT NULL
  - geometry_format: text NOT NULL DEFAULT 'geojson'::text
  - simplified_geometry: jsonb NULL
  - area_sq_km: numeric NULL
  - perimeter_km: numeric NULL
  - source: text NOT NULL
  - last_refreshed: timestamp with time zone NOT NULL DEFAULT now()
  - metadata: jsonb NOT NULL DEFAULT '{}'::jsonb

**Foreign Keys:**
  - jurisdiction_geometries_ocd_division_id_fkey: (ocd_division_id) -> public.civic_jurisdictions(ocd_division_id)

**Indexes:**
  - jurisdiction_geometries_pkey: UNIQUE CREATE UNIQUE INDEX jurisdiction_geometries_pkey ON public.jurisdiction_geometries USING btree (ocd_division_id)

---

### jurisdiction_tiles
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** ['ocd_division_id', 'h3_index']

**Columns:**
  - ocd_division_id: text NOT NULL
  - h3_index: text NOT NULL
  - resolution: smallint NOT NULL
  - source: text NOT NULL DEFAULT 'generated'::text
  - created_at: timestamp with time zone NOT NULL DEFAULT now()
  - metadata: jsonb NOT NULL DEFAULT '{}'::jsonb

**Foreign Keys:**
  - jurisdiction_tiles_ocd_division_id_fkey: (ocd_division_id) -> public.civic_jurisdictions(ocd_division_id)

**Indexes:**
  - idx_jurisdiction_tiles_h3: CREATE INDEX idx_jurisdiction_tiles_h3 ON public.jurisdiction_tiles USING btree (h3_index)
  - jurisdiction_tiles_pkey: UNIQUE CREATE UNIQUE INDEX jurisdiction_tiles_pkey ON public.jurisdiction_tiles USING btree (ocd_division_id, h3_index)

---

### latlon_to_ocd
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** ['lat', 'lon']

**Columns:**
  - lat: numeric(10,8) NOT NULL
  - lon: numeric(11,8) NOT NULL
  - ocd_division_id: text NOT NULL
  - confidence: numeric(3,2) NULL DEFAULT 0.0
  - created_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - idx_latlon_to_ocd_coords: CREATE INDEX idx_latlon_to_ocd_coords ON public.latlon_to_ocd USING btree (lat, lon)
  - idx_latlon_to_ocd_ocd: CREATE INDEX idx_latlon_to_ocd_ocd ON public.latlon_to_ocd USING btree (ocd_division_id)
  - latlon_to_ocd_pkey: UNIQUE CREATE UNIQUE INDEX latlon_to_ocd_pkey ON public.latlon_to_ocd USING btree (lat, lon)

---

### location_consent_audit
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - user_id: uuid NOT NULL
  - resolution_id: uuid NULL
  - action: text NOT NULL
  - scope: text NOT NULL
  - actor: text NOT NULL DEFAULT 'user'::text
  - reason: text NULL
  - created_at: timestamp with time zone NOT NULL DEFAULT now()
  - metadata: jsonb NOT NULL DEFAULT '{}'::jsonb

**Foreign Keys:**
  - location_consent_audit_resolution_id_fkey: (resolution_id) -> public.user_location_resolutions(id)
  - location_consent_audit_user_id_fkey: (user_id) -> auth.users(id)

**Indexes:**
  - idx_location_consent_audit_user: CREATE INDEX idx_location_consent_audit_user ON public.location_consent_audit USING btree (user_id, created_at DESC)
  - location_consent_audit_pkey: UNIQUE CREATE UNIQUE INDEX location_consent_audit_pkey ON public.location_consent_audit USING btree (id)

---

### media_polls
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - headline: text NOT NULL
  - question: text NOT NULL
  - options: jsonb NOT NULL DEFAULT '[]'::jsonb
  - source_id: uuid NULL
  - source_data: jsonb NOT NULL
  - methodology: jsonb NOT NULL
  - results: jsonb NOT NULL
  - bias_analysis: jsonb NULL DEFAULT '{}'::jsonb
  - bias_indicators: jsonb NULL DEFAULT '[]'::jsonb
  - fact_check: jsonb NULL DEFAULT '{}'::jsonb
  - propaganda_techniques: jsonb NULL DEFAULT '[]'::jsonb
  - manipulation_score: numeric(3,2) NULL DEFAULT 0
  - overall_bias_score: numeric(3,2) NULL DEFAULT 0
  - url: text NULL
  - published_at: timestamp with time zone NULL
  - metadata: jsonb NULL DEFAULT '{}'::jsonb
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Foreign Keys:**
  - media_polls_source_id_fkey: (source_id) -> public.media_sources(id)

**Indexes:**
  - media_polls_pkey: UNIQUE CREATE UNIQUE INDEX media_polls_pkey ON public.media_polls USING btree (id)

---

### media_sources
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - source_id: text NOT NULL
  - name: text NOT NULL
  - network: text NOT NULL
  - bias: text NULL DEFAULT 'unknown'::text
  - reliability: numeric(3,2) NULL DEFAULT 0.5
  - ownership: text NULL
  - funding: jsonb NULL DEFAULT '[]'::jsonb
  - political_affiliations: jsonb NULL DEFAULT '[]'::jsonb
  - fact_check_rating: text NULL DEFAULT 'unknown'::text
  - propaganda_indicators: jsonb NULL DEFAULT '[]'::jsonb
  - metadata: jsonb NULL DEFAULT '{}'::jsonb
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - media_sources_pkey: UNIQUE CREATE UNIQUE INDEX media_sources_pkey ON public.media_sources USING btree (id)
  - media_sources_source_id_key: UNIQUE CREATE UNIQUE INDEX media_sources_source_id_key ON public.media_sources USING btree (source_id)

---

### migration_log
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: integer NOT NULL DEFAULT nextval('migration_log_id_seq'::regclass)
  - migration_name: text NOT NULL
  - applied_at: timestamp with time zone NOT NULL DEFAULT now()
  - status: text NOT NULL
  - details: text NULL
  - execution_time_ms: integer NULL
  - error_message: text NULL

**Indexes:**
  - idx_migration_log_applied_at: CREATE INDEX idx_migration_log_applied_at ON public.migration_log USING btree (applied_at)
  - idx_migration_log_name: CREATE INDEX idx_migration_log_name ON public.migration_log USING btree (migration_name)
  - migration_log_pkey: UNIQUE CREATE UNIQUE INDEX migration_log_pkey ON public.migration_log USING btree (id)

---

### news_fetch_logs
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - source_id: uuid NULL
  - fetch_type: text NOT NULL
  - status: text NOT NULL
  - articles_found: integer NULL DEFAULT 0
  - articles_processed: integer NULL DEFAULT 0
  - error_message: text NULL
  - processing_time_ms: integer NULL
  - metadata: jsonb NULL DEFAULT '{}'::jsonb
  - created_at: timestamp with time zone NULL DEFAULT now()

**Foreign Keys:**
  - news_fetch_logs_source_id_fkey: (source_id) -> public.news_sources(id)

**Indexes:**
  - idx_news_fetch_logs_created_at: CREATE INDEX idx_news_fetch_logs_created_at ON public.news_fetch_logs USING btree (created_at DESC)
  - idx_news_fetch_logs_source_id: CREATE INDEX idx_news_fetch_logs_source_id ON public.news_fetch_logs USING btree (source_id)
  - idx_news_fetch_logs_status: CREATE INDEX idx_news_fetch_logs_status ON public.news_fetch_logs USING btree (status)
  - news_fetch_logs_pkey: UNIQUE CREATE UNIQUE INDEX news_fetch_logs_pkey ON public.news_fetch_logs USING btree (id)

---

### news_sources
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - name: text NOT NULL
  - domain: text NOT NULL
  - reliability: numeric(3,2) NULL DEFAULT 0.9
  - bias: text NULL DEFAULT 'unknown'::text
  - type: text NULL DEFAULT 'mainstream'::text
  - api_endpoint: text NULL
  - api_key: text NULL
  - rate_limit: integer NULL DEFAULT 1000
  - is_active: boolean NULL DEFAULT true
  - last_updated: timestamp with time zone NULL DEFAULT now()
  - error_count: integer NULL DEFAULT 0
  - success_rate: numeric(5,2) NULL DEFAULT 100.0
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - idx_news_sources_is_active: CREATE INDEX idx_news_sources_is_active ON public.news_sources USING btree (is_active)
  - idx_news_sources_reliability: CREATE INDEX idx_news_sources_reliability ON public.news_sources USING btree (reliability DESC)
  - idx_news_sources_type: CREATE INDEX idx_news_sources_type ON public.news_sources USING btree (type)
  - news_sources_name_key: UNIQUE CREATE UNIQUE INDEX news_sources_name_key ON public.news_sources USING btree (name)
  - news_sources_pkey: UNIQUE CREATE UNIQUE INDEX news_sources_pkey ON public.news_sources USING btree (id)

---

### poll_contexts
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - story_id: uuid NULL
  - question: text NOT NULL
  - context: text NOT NULL
  - why_important: text NOT NULL
  - stakeholders: jsonb NULL DEFAULT '{}'::jsonb
  - options: jsonb NOT NULL
  - voting_method: text NOT NULL
  - estimated_controversy: numeric(3,2) NULL DEFAULT 0.5
  - time_to_live: integer NULL DEFAULT 24
  - status: text NULL DEFAULT 'draft'::text
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Foreign Keys:**
  - poll_contexts_story_id_fkey: (story_id) -> public.breaking_news(id)

**Indexes:**
  - idx_poll_contexts_created_at: CREATE INDEX idx_poll_contexts_created_at ON public.poll_contexts USING btree (created_at DESC)
  - idx_poll_contexts_status: CREATE INDEX idx_poll_contexts_status ON public.poll_contexts USING btree (status)
  - idx_poll_contexts_story_id: CREATE INDEX idx_poll_contexts_story_id ON public.poll_contexts USING btree (story_id)
  - poll_contexts_pkey: UNIQUE CREATE UNIQUE INDEX poll_contexts_pkey ON public.poll_contexts USING btree (id)

---

### poll_generation_logs
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - topic_id: uuid NULL
  - poll_id: uuid NULL
  - generation_step: text NOT NULL
  - status: text NOT NULL
  - error_message: text NULL
  - processing_time_ms: integer NULL
  - metadata: jsonb NULL DEFAULT '{}'::jsonb
  - created_at: timestamp with time zone NULL DEFAULT now()

**Foreign Keys:**
  - poll_generation_logs_poll_id_fkey: (poll_id) -> public.generated_polls(id)
  - poll_generation_logs_topic_id_fkey: (topic_id) -> public.trending_topics(id)

**Indexes:**
  - poll_generation_logs_pkey: UNIQUE CREATE UNIQUE INDEX poll_generation_logs_pkey ON public.poll_generation_logs USING btree (id)

---

### polls
**Schema:** public
**Rows:** 173
**RLS:** enabled
**Comment:** User-created polls with voting options and results

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - title: text NOT NULL
  - description: text NULL
  - options: jsonb NOT NULL
  - voting_method: text NOT NULL
  - privacy_level: text NOT NULL DEFAULT 'public'::text
  - category: text NULL DEFAULT 'general'::text
  - tags: text[] NULL DEFAULT '{}'::text[]
  - created_by: uuid NOT NULL
  - status: text NULL DEFAULT 'active'::text
  - total_votes: integer NULL DEFAULT 0
  - participation: integer NULL DEFAULT 0
  - sponsors: text[] NULL DEFAULT '{}'::text[]
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()
  - end_time: timestamp with time zone NULL
  - is_mock: boolean NULL DEFAULT false
  - settings: jsonb NULL DEFAULT '{}'::jsonb

**Foreign Keys:**
  - polls_created_by_fkey: (created_by) -> auth.users(id)

**Indexes:**
  - idx_polls_category: CREATE INDEX idx_polls_category ON public.polls USING btree (category)
  - idx_polls_created_at: CREATE INDEX idx_polls_created_at ON public.polls USING btree (created_at DESC)
  - idx_polls_created_by: CREATE INDEX idx_polls_created_by ON public.polls USING btree (created_by)
  - idx_polls_creator_status: CREATE INDEX idx_polls_creator_status ON public.polls USING btree (created_by, status)
  - idx_polls_description: CREATE INDEX idx_polls_description ON public.polls USING btree (description)
  - idx_polls_end_time: CREATE INDEX idx_polls_end_time ON public.polls USING btree (end_time)
  - idx_polls_privacy: CREATE INDEX idx_polls_privacy ON public.polls USING btree (privacy_level)
  - idx_polls_status: CREATE INDEX idx_polls_status ON public.polls USING btree (status)
  - idx_polls_status_created: CREATE INDEX idx_polls_status_created ON public.polls USING btree (status, created_at)
  - idx_polls_title: CREATE INDEX idx_polls_title ON public.polls USING btree (title)
  - polls_pkey: UNIQUE CREATE UNIQUE INDEX polls_pkey ON public.polls USING btree (id)

---

### privacy_logs
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - action: text NOT NULL
  - user_id_hash: text NOT NULL
  - created_at: timestamp with time zone NULL DEFAULT now()
  - metadata: jsonb NULL DEFAULT '{}'::jsonb

**Indexes:**
  - idx_privacy_logs_action: CREATE INDEX idx_privacy_logs_action ON public.privacy_logs USING btree (action)
  - idx_privacy_logs_created_at: CREATE INDEX idx_privacy_logs_created_at ON public.privacy_logs USING btree (created_at)
  - privacy_logs_pkey: UNIQUE CREATE UNIQUE INDEX privacy_logs_pkey ON public.privacy_logs USING btree (id)

---

### private_user_data
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - user_id: uuid NULL
  - encrypted_personal_info: bytea NULL
  - encrypted_behavioral_data: bytea NULL
  - encrypted_analytics_data: bytea NULL
  - encryption_key_hash: text NULL
  - last_encrypted_at: timestamp with time zone NULL DEFAULT now()

**Foreign Keys:**
  - private_user_data_user_id_fkey: (user_id) -> auth.users(id)

**Indexes:**
  - idx_private_user_data_user_id: CREATE INDEX idx_private_user_data_user_id ON public.private_user_data USING btree (user_id)
  - private_user_data_pkey: UNIQUE CREATE UNIQUE INDEX private_user_data_pkey ON public.private_user_data USING btree (id)

---

### quality_metrics
**Schema:** public
**Rows:** 0
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - poll_id: uuid NULL
  - bias_score: numeric(3,2) NULL DEFAULT 0.0
  - clarity_score: numeric(3,2) NULL DEFAULT 0.0
  - completeness_score: numeric(3,2) NULL DEFAULT 0.0
  - relevance_score: numeric(3,2) NULL DEFAULT 0.0
  - controversy_score: numeric(3,2) NULL DEFAULT 0.0
  - overall_score: numeric(3,2) NULL DEFAULT 0.0
  - assessment_metadata: jsonb NULL DEFAULT '{}'::jsonb
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Foreign Keys:**
  - quality_metrics_poll_id_fkey: (poll_id) -> public.generated_polls(id)

**Indexes:**
  - idx_quality_metrics_overall: CREATE INDEX idx_quality_metrics_overall ON public.quality_metrics USING btree (overall_score)
  - idx_quality_metrics_overall_score: CREATE INDEX idx_quality_metrics_overall_score ON public.quality_metrics USING btree (overall_score DESC)
  - idx_quality_metrics_poll_id: CREATE INDEX idx_quality_metrics_poll_id ON public.quality_metrics USING btree (poll_id)
  - quality_metrics_pkey: UNIQUE CREATE UNIQUE INDEX quality_metrics_pkey ON public.quality_metrics USING btree (id)

---

### rate_limits
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - ip_address: inet NOT NULL
  - endpoint: text NOT NULL
  - request_count: integer NULL DEFAULT 1
  - window_start: timestamp with time zone NULL DEFAULT now()
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - idx_rate_limits_ip_endpoint: CREATE INDEX idx_rate_limits_ip_endpoint ON public.rate_limits USING btree (ip_address, endpoint, window_start)
  - rate_limits_pkey: UNIQUE CREATE UNIQUE INDEX rate_limits_pkey ON public.rate_limits USING btree (id)

---

### redistricting_history
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - state: text NOT NULL
  - district_type: text NOT NULL
  - old_district: text NULL
  - new_district: text NULL
  - census_cycle_from: integer NOT NULL
  - census_cycle_to: integer NOT NULL
  - change_type: text NULL
  - change_description: text NULL
  - effective_date: date NOT NULL
  - created_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - idx_redistricting_cycle: CREATE INDEX idx_redistricting_cycle ON public.redistricting_history USING btree (census_cycle_from, census_cycle_to)
  - idx_redistricting_state: CREATE INDEX idx_redistricting_state ON public.redistricting_history USING btree (state)
  - redistricting_history_pkey: UNIQUE CREATE UNIQUE INDEX redistricting_history_pkey ON public.redistricting_history USING btree (id)

---

### representative_activity
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** Recent activity for feed generation

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - representative_id: uuid NULL
  - activity_type: text NOT NULL
  - title: text NOT NULL
  - description: text NULL
  - url: text NULL
  - date: timestamp with time zone NOT NULL
  - metadata: jsonb NULL DEFAULT '{}'::jsonb
  - source: text NULL
  - created_at: timestamp with time zone NULL DEFAULT now()

**Foreign Keys:**
  - representative_activity_representative_id_fkey: (representative_id) -> public.representatives_core(id)

**Indexes:**
  - idx_representative_activity_rep_date: CREATE INDEX idx_representative_activity_rep_date ON public.representative_activity USING btree (representative_id, date DESC)
  - idx_representative_activity_type_date: CREATE INDEX idx_representative_activity_type_date ON public.representative_activity USING btree (activity_type, date DESC)
  - representative_activity_pkey: UNIQUE CREATE UNIQUE INDEX representative_activity_pkey ON public.representative_activity USING btree (id)

---

### representative_activity_enhanced
**Schema:** public
**Rows:** 0
**RLS:** disabled
**Comment:** Enhanced activity tracking for feed content generation

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - representative_id: uuid NULL
  - activity_type: text NOT NULL
  - title: text NOT NULL
  - description: text NULL
  - url: text NULL
  - date: timestamp with time zone NOT NULL
  - chamber: text NULL
  - session: text NULL
  - bill_number: text NULL
  - vote_result: text NULL
  - vote_position: text NULL
  - committee_name: text NULL
  - metadata: jsonb NULL DEFAULT '{}'::jsonb
  - source: text NOT NULL
  - created_at: timestamp with time zone NULL DEFAULT now()
  - last_updated: timestamp with time zone NULL DEFAULT now()

**Foreign Keys:**
  - representative_activity_enhanced_representative_id_fkey: (representative_id) -> public.representatives_core(id)

**Indexes:**
  - idx_representative_activity_enhanced_chamber: CREATE INDEX idx_representative_activity_enhanced_chamber ON public.representative_activity_enhanced USING btree (chamber)
  - idx_representative_activity_enhanced_date: CREATE INDEX idx_representative_activity_enhanced_date ON public.representative_activity_enhanced USING btree (date DESC)
  - idx_representative_activity_enhanced_rep_id: CREATE INDEX idx_representative_activity_enhanced_rep_id ON public.representative_activity_enhanced USING btree (representative_id)
  - idx_representative_activity_enhanced_type: CREATE INDEX idx_representative_activity_enhanced_type ON public.representative_activity_enhanced USING btree (activity_type)
  - representative_activity_enhanced_pkey: UNIQUE CREATE UNIQUE INDEX representative_activity_enhanced_pkey ON public.representative_activity_enhanced USING btree (id)

---

### representative_campaign_finance
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** Campaign finance data from FEC API

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - representative_id: uuid NULL
  - election_cycle: text NOT NULL
  - total_receipts: numeric(15,2) NULL DEFAULT 0
  - total_disbursements: numeric(15,2) NULL DEFAULT 0
  - cash_on_hand: numeric(15,2) NULL DEFAULT 0
  - debt: numeric(15,2) NULL DEFAULT 0
  - individual_contributions: numeric(15,2) NULL DEFAULT 0
  - pac_contributions: numeric(15,2) NULL DEFAULT 0
  - party_contributions: numeric(15,2) NULL DEFAULT 0
  - self_financing: numeric(15,2) NULL DEFAULT 0
  - last_updated: timestamp with time zone NULL DEFAULT now()
  - created_at: timestamp with time zone NULL DEFAULT now()

**Foreign Keys:**
  - representative_campaign_finance_representative_id_fkey: (representative_id) -> public.representatives_core(id)

**Indexes:**
  - idx_campaign_finance_rep_cycle: CREATE INDEX idx_campaign_finance_rep_cycle ON public.representative_campaign_finance USING btree (representative_id, election_cycle)
  - representative_campaign_finance_pkey: UNIQUE CREATE UNIQUE INDEX representative_campaign_finance_pkey ON public.representative_campaign_finance USING btree (id)

---

### representative_committees
**Schema:** public
**Rows:** 0
**RLS:** disabled
**Comment:** Committee memberships and positions for representatives

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - representative_id: uuid NULL
  - committee_name: text NOT NULL
  - committee_type: text NULL
  - position: text NULL
  - is_chair: boolean NULL DEFAULT false
  - is_vice_chair: boolean NULL DEFAULT false
  - start_date: date NULL
  - end_date: date NULL
  - source: text NOT NULL
  - created_at: timestamp with time zone NULL DEFAULT now()
  - last_updated: timestamp with time zone NULL DEFAULT now()

**Foreign Keys:**
  - representative_committees_representative_id_fkey: (representative_id) -> public.representatives_core(id)

**Indexes:**
  - idx_representative_committees_chair: CREATE INDEX idx_representative_committees_chair ON public.representative_committees USING btree (is_chair)
  - idx_representative_committees_rep_id: CREATE INDEX idx_representative_committees_rep_id ON public.representative_committees USING btree (representative_id)
  - idx_representative_committees_type: CREATE INDEX idx_representative_committees_type ON public.representative_committees USING btree (committee_type)
  - representative_committees_pkey: UNIQUE CREATE UNIQUE INDEX representative_committees_pkey ON public.representative_committees USING btree (id)

---

### representative_contacts
**Schema:** public
**Rows:** 52
**RLS:** enabled
**Comment:** Detailed contact information for representatives

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - representative_id: uuid NULL
  - type: text NOT NULL
  - value: text NOT NULL
  - label: text NULL
  - is_primary: boolean NULL DEFAULT false
  - is_verified: boolean NULL DEFAULT false
  - source: text NULL
  - last_verified: timestamp with time zone NULL
  - created_at: timestamp with time zone NULL DEFAULT now()
  - office_name: text NULL
  - office_type: text NULL DEFAULT 'general'::text
  - is_campaign: boolean NULL DEFAULT false
  - is_district: boolean NULL DEFAULT false
  - is_capitol: boolean NULL DEFAULT false
  - verification_method: text NULL

**Foreign Keys:**
  - representative_contacts_representative_id_fkey: (representative_id) -> public.representatives_core(id)

**Indexes:**
  - idx_representative_contacts_is_campaign: CREATE INDEX idx_representative_contacts_is_campaign ON public.representative_contacts USING btree (is_campaign)
  - idx_representative_contacts_is_district: CREATE INDEX idx_representative_contacts_is_district ON public.representative_contacts USING btree (is_district)
  - idx_representative_contacts_is_primary: CREATE INDEX idx_representative_contacts_is_primary ON public.representative_contacts USING btree (is_primary)
  - idx_representative_contacts_is_verified: CREATE INDEX idx_representative_contacts_is_verified ON public.representative_contacts USING btree (is_verified)
  - idx_representative_contacts_office_type: CREATE INDEX idx_representative_contacts_office_type ON public.representative_contacts USING btree (office_type)
  - idx_representative_contacts_rep_primary: CREATE INDEX idx_representative_contacts_rep_primary ON public.representative_contacts USING btree (representative_id, is_primary)
  - idx_representative_contacts_rep_type: CREATE INDEX idx_representative_contacts_rep_type ON public.representative_contacts USING btree (representative_id, type)
  - idx_representative_contacts_representative_id: CREATE INDEX idx_representative_contacts_representative_id ON public.representative_contacts USING btree (representative_id)
  - idx_representative_contacts_type: CREATE INDEX idx_representative_contacts_type ON public.representative_contacts USING btree (type)
  - idx_representative_contacts_verified: CREATE INDEX idx_representative_contacts_verified ON public.representative_contacts USING btree (last_verified)
  - representative_contacts_pkey: UNIQUE CREATE UNIQUE INDEX representative_contacts_pkey ON public.representative_contacts USING btree (id)

---

### representative_leadership
**Schema:** public
**Rows:** 0
**RLS:** disabled
**Comment:** Leadership positions held by representatives

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - representative_id: uuid NULL
  - position_title: text NOT NULL
  - position_type: text NULL
  - chamber: text NULL
  - start_date: date NULL
  - end_date: date NULL
  - source: text NOT NULL
  - created_at: timestamp with time zone NULL DEFAULT now()
  - last_updated: timestamp with time zone NULL DEFAULT now()

**Foreign Keys:**
  - representative_leadership_representative_id_fkey: (representative_id) -> public.representatives_core(id)

**Indexes:**
  - idx_representative_leadership_chamber: CREATE INDEX idx_representative_leadership_chamber ON public.representative_leadership USING btree (chamber)
  - idx_representative_leadership_rep_id: CREATE INDEX idx_representative_leadership_rep_id ON public.representative_leadership USING btree (representative_id)
  - idx_representative_leadership_type: CREATE INDEX idx_representative_leadership_type ON public.representative_leadership USING btree (position_type)
  - representative_leadership_pkey: UNIQUE CREATE UNIQUE INDEX representative_leadership_pkey ON public.representative_leadership USING btree (id)

---

### representative_offices
**Schema:** public
**Rows:** 0
**RLS:** disabled
**Comment:** Office locations and contact information for representatives

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - representative_id: uuid NULL
  - office_name: text NOT NULL
  - office_type: text NOT NULL
  - address_line1: text NULL
  - address_line2: text NULL
  - city: text NULL
  - state: text NULL
  - zip_code: text NULL
  - phone: text NULL
  - fax: text NULL
  - email: text NULL
  - hours: text NULL
  - is_primary: boolean NULL DEFAULT false
  - is_district: boolean NULL DEFAULT false
  - is_capitol: boolean NULL DEFAULT false
  - source: text NOT NULL
  - created_at: timestamp with time zone NULL DEFAULT now()
  - last_updated: timestamp with time zone NULL DEFAULT now()

**Foreign Keys:**
  - representative_offices_representative_id_fkey: (representative_id) -> public.representatives_core(id)

**Indexes:**
  - idx_representative_offices_district: CREATE INDEX idx_representative_offices_district ON public.representative_offices USING btree (is_district)
  - idx_representative_offices_primary: CREATE INDEX idx_representative_offices_primary ON public.representative_offices USING btree (is_primary)
  - idx_representative_offices_rep_id: CREATE INDEX idx_representative_offices_rep_id ON public.representative_offices USING btree (representative_id)
  - idx_representative_offices_type: CREATE INDEX idx_representative_offices_type ON public.representative_offices USING btree (office_type)
  - representative_offices_pkey: UNIQUE CREATE UNIQUE INDEX representative_offices_pkey ON public.representative_offices USING btree (id)

---

### representative_photos
**Schema:** public
**Rows:** 0
**RLS:** enabled
**Comment:** Photo collection with ranking and metadata

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - representative_id: uuid NULL
  - url: text NOT NULL
  - source: text NOT NULL
  - quality: text NOT NULL
  - is_primary: boolean NULL DEFAULT false
  - license: text NULL
  - attribution: text NULL
  - width: integer NULL
  - height: integer NULL
  - last_updated: timestamp with time zone NULL DEFAULT now()
  - created_at: timestamp with time zone NULL DEFAULT now()
  - file_size: integer NULL
  - mime_type: text NULL
  - alt_text: text NULL
  - caption: text NULL
  - photographer: text NULL
  - usage_rights: text NULL
  - is_official: boolean NULL DEFAULT false
  - download_count: integer NULL DEFAULT 0
  - last_accessed: timestamp with time zone NULL
  - ranking: integer NULL DEFAULT 0

**Foreign Keys:**
  - representative_photos_representative_id_fkey: (representative_id) -> public.representatives_core(id)

**Indexes:**
  - idx_representative_photos_official: CREATE INDEX idx_representative_photos_official ON public.representative_photos USING btree (is_official)
  - idx_representative_photos_primary: CREATE INDEX idx_representative_photos_primary ON public.representative_photos USING btree (is_primary)
  - idx_representative_photos_quality: CREATE INDEX idx_representative_photos_quality ON public.representative_photos USING btree (quality)
  - idx_representative_photos_ranking: CREATE INDEX idx_representative_photos_ranking ON public.representative_photos USING btree (ranking)
  - idx_representative_photos_rep_primary: CREATE INDEX idx_representative_photos_rep_primary ON public.representative_photos USING btree (representative_id, is_primary)
  - idx_representative_photos_rep_source: CREATE INDEX idx_representative_photos_rep_source ON public.representative_photos USING btree (representative_id, source)
  - idx_representative_photos_representative_id: CREATE INDEX idx_representative_photos_representative_id ON public.representative_photos USING btree (representative_id)
  - idx_representative_photos_source: CREATE INDEX idx_representative_photos_source ON public.representative_photos USING btree (source)
  - representative_photos_pkey: UNIQUE CREATE UNIQUE INDEX representative_photos_pkey ON public.representative_photos USING btree (id)

---

### representative_social_media
**Schema:** public
**Rows:** 0
**RLS:** enabled
**Comment:** Social media profiles and handles for representatives

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - representative_id: uuid NULL
  - platform: text NOT NULL
  - handle: text NOT NULL
  - url: text NULL
  - followers_count: integer NULL DEFAULT 0
  - is_verified: boolean NULL DEFAULT false
  - source: text NULL
  - last_updated: timestamp with time zone NULL DEFAULT now()
  - created_at: timestamp with time zone NULL DEFAULT now()
  - engagement_rate: numeric(5,2) NULL DEFAULT 0
  - last_post_date: timestamp with time zone NULL
  - post_frequency: text NULL
  - content_type: text NULL
  - verification_date: timestamp with time zone NULL

**Foreign Keys:**
  - representative_social_media_representative_id_fkey: (representative_id) -> public.representatives_core(id)

**Indexes:**
  - idx_representative_social_engagement: CREATE INDEX idx_representative_social_engagement ON public.representative_social_media USING btree (engagement_rate)
  - idx_representative_social_followers: CREATE INDEX idx_representative_social_followers ON public.representative_social_media USING btree (followers_count)
  - idx_representative_social_media_is_verified: CREATE INDEX idx_representative_social_media_is_verified ON public.representative_social_media USING btree (is_verified)
  - idx_representative_social_media_platform: CREATE INDEX idx_representative_social_media_platform ON public.representative_social_media USING btree (platform)
  - idx_representative_social_media_representative_id: CREATE INDEX idx_representative_social_media_representative_id ON public.representative_social_media USING btree (representative_id)
  - idx_representative_social_platform_followers: CREATE INDEX idx_representative_social_platform_followers ON public.representative_social_media USING btree (platform, followers_count)
  - idx_representative_social_rep_platform: CREATE INDEX idx_representative_social_rep_platform ON public.representative_social_media USING btree (representative_id, platform)
  - idx_representative_social_updated: CREATE INDEX idx_representative_social_updated ON public.representative_social_media USING btree (last_updated)
  - idx_representative_social_verified: CREATE INDEX idx_representative_social_verified ON public.representative_social_media USING btree (is_verified)
  - representative_social_media_pkey: UNIQUE CREATE UNIQUE INDEX representative_social_media_pkey ON public.representative_social_media USING btree (id)

---

### representative_social_posts
**Schema:** public
**Rows:** 0
**RLS:** disabled
**Comment:** Social media posts and engagement metrics

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - representative_id: uuid NULL
  - platform: text NOT NULL
  - post_id: text NOT NULL
  - content: text NULL
  - post_url: text NULL
  - engagement_metrics: jsonb NULL DEFAULT '{}'::jsonb
  - sentiment_score: numeric(3,2) NULL
  - created_at: timestamp with time zone NOT NULL
  - source: text NOT NULL
  - last_updated: timestamp with time zone NULL DEFAULT now()

**Foreign Keys:**
  - representative_social_posts_representative_id_fkey: (representative_id) -> public.representatives_core(id)

**Indexes:**
  - idx_representative_social_posts_created: CREATE INDEX idx_representative_social_posts_created ON public.representative_social_posts USING btree (created_at DESC)
  - idx_representative_social_posts_platform: CREATE INDEX idx_representative_social_posts_platform ON public.representative_social_posts USING btree (platform)
  - idx_representative_social_posts_rep_id: CREATE INDEX idx_representative_social_posts_rep_id ON public.representative_social_posts USING btree (representative_id)
  - representative_social_posts_pkey: UNIQUE CREATE UNIQUE INDEX representative_social_posts_pkey ON public.representative_social_posts USING btree (id)

---

### representative_voting_records
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** Voting records from Congress.gov and OpenStates

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - representative_id: uuid NULL
  - vote_id: text NOT NULL
  - bill_title: text NULL
  - bill_number: text NULL
  - vote_position: text NOT NULL
  - vote_date: timestamp with time zone NOT NULL
  - chamber: text NULL
  - session: text NULL
  - result: text NULL
  - metadata: jsonb NULL DEFAULT '{}'::jsonb
  - source: text NULL
  - created_at: timestamp with time zone NULL DEFAULT now()

**Foreign Keys:**
  - representative_voting_records_representative_id_fkey: (representative_id) -> public.representatives_core(id)

**Indexes:**
  - idx_voting_records_position: CREATE INDEX idx_voting_records_position ON public.representative_voting_records USING btree (vote_position)
  - idx_voting_records_rep_date: CREATE INDEX idx_voting_records_rep_date ON public.representative_voting_records USING btree (representative_id, vote_date DESC)
  - representative_voting_records_pkey: UNIQUE CREATE UNIQUE INDEX representative_voting_records_pkey ON public.representative_voting_records USING btree (id)

---

### representatives_core
**Schema:** public
**Rows:** 40
**RLS:** enabled
**Comment:** Core representative data with enhanced fields for comprehensive profiles

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - name: text NOT NULL
  - party: text NULL
  - office: text NOT NULL
  - level: text NOT NULL
  - state: text NOT NULL
  - district: text NULL
  - bioguide_id: text NULL
  - openstates_id: text NULL
  - fec_id: text NULL -- Federal Election Commission candidate ID
  - google_civic_id: text NULL
  - primary_email: text NULL -- Primary verified email address for the representative
  - primary_phone: text NULL -- Primary verified phone number for the representative
  - primary_website: text NULL
  - primary_photo_url: text NULL
  - active: boolean NULL DEFAULT true
  - data_quality_score: integer NULL DEFAULT 0 -- Overall data quality score (0-100) calculated from multiple factors
  - last_updated: timestamp with time zone NULL DEFAULT now()
  - created_at: timestamp with time zone NULL DEFAULT now()
  - data_sources: text[] NULL DEFAULT '{}'::text[] -- Array of data source names that contributed to this record
  - last_verified: timestamp with time zone NULL
  - verification_status: text NULL DEFAULT 'unverified'::text
  - twitter_handle: text NULL -- Primary Twitter handle for the representative
  - facebook_url: text NULL -- Primary Facebook URL for the representative
  - instagram_handle: text NULL -- Official Instagram handle
  - linkedin_url: text NULL -- Official LinkedIn profile URL
  - youtube_channel: text NULL -- Official YouTube channel
  - legiscan_id: text NULL -- LegiScan API ID
  - wikipedia_url: text NULL -- Wikipedia page URL
  - ballotpedia_url: text NULL -- Ballotpedia page URL
  - congress_gov_id: text NULL -- Congress.gov API ID
  - govinfo_id: text NULL -- GovInfo API ID
  - last_election_date: date NULL -- Date of last election
  - next_election_date: date NULL -- Date of next election
  - term_start_date: date NULL -- Current term start date
  - term_end_date: date NULL -- Current term end date
  - upcoming_elections: jsonb NULL -- Upcoming election information (JSON)
  - committee_memberships: text[] NULL -- Committee memberships (array)
  - caucus_memberships: text[] NULL -- Caucus memberships (array)
  - leadership_positions: text[] NULL -- Leadership positions (array)
  - official_website: text NULL -- Official government website
  - campaign_website: text NULL -- Campaign website
  - office_locations: jsonb NULL -- Office locations (JSON)
  - recent_activity: jsonb NULL -- Recent legislative activity (JSON)
  - recent_votes: jsonb NULL -- Recent voting record (JSON)
  - recent_bills: jsonb NULL -- Recent bills sponsored/co-sponsored (JSON)
  - floor_speeches: jsonb NULL -- Floor speeches and official statements (JSON)
  - committee_statements: jsonb NULL -- Committee hearing statements and testimony (JSON)
  - official_press_releases: jsonb NULL -- Official press releases and statements (JSON)
  - voting_explanations: jsonb NULL -- Voting explanations and justifications (JSON)
  - social_media_statements: jsonb NULL -- Social media statements and posts (JSON)
  - recent_tweets: jsonb NULL -- Recent Twitter posts and statements (JSON)
  - facebook_posts: jsonb NULL -- Recent Facebook posts and statements (JSON)
  - instagram_posts: jsonb NULL -- Recent Instagram posts and statements (JSON)
  - statement_vs_vote_analysis: jsonb NULL -- Analysis of statements vs. voting record (JSON)
  - campaign_promises_vs_actions: jsonb NULL -- Campaign promises vs. actual actions (JSON)
  - constituent_feedback_alignment: jsonb NULL -- Alignment with constituent feedback (JSON)
  - accountability_score: integer NULL -- Overall accountability score (0-100)
  - total_receipts: numeric(15,2) NULL -- Total money raised by candidate
  - total_disbursements: numeric(15,2) NULL -- Total money spent by candidate
  - cash_on_hand: numeric(15,2) NULL -- Money remaining in campaign account
  - debt: numeric(15,2) NULL
  - individual_contributions: numeric(15,2) NULL -- Contributions from individuals
  - pac_contributions: numeric(15,2) NULL -- Contributions from Political Action Committees
  - party_contributions: numeric(15,2) NULL -- Contributions from political parties
  - self_financing: numeric(15,2) NULL -- Candidate's own money contributed
  - total_contributions: numeric(15,2) NULL
  - fec_last_updated: timestamp with time zone NULL -- Last time FEC data was updated
  - biography: text NULL
  - social_media_score: integer NULL DEFAULT 0
  - photo_score: integer NULL DEFAULT 0
  - contact_score: integer NULL DEFAULT 0
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - idx_representatives_accountability: CREATE INDEX idx_representatives_accountability ON public.representatives_core USING btree (accountability_score)
  - idx_representatives_committee: CREATE INDEX idx_representatives_committee ON public.representatives_core USING gin (committee_memberships)
  - idx_representatives_congress_gov: CREATE INDEX idx_representatives_congress_gov ON public.representatives_core USING btree (congress_gov_id)
  - idx_representatives_core_bioguide: CREATE INDEX idx_representatives_core_bioguide ON public.representatives_core USING btree (bioguide_id)
  - idx_representatives_core_bioguide_id: CREATE INDEX idx_representatives_core_bioguide_id ON public.representatives_core USING btree (bioguide_id)
  - idx_representatives_core_contact_score: CREATE INDEX idx_representatives_core_contact_score ON public.representatives_core USING btree (contact_score)
  - idx_representatives_core_created_at: CREATE INDEX idx_representatives_core_created_at ON public.representatives_core USING btree (created_at)
  - idx_representatives_core_data_quality_score: CREATE INDEX idx_representatives_core_data_quality_score ON public.representatives_core USING btree (data_quality_score)
  - idx_representatives_core_fec: CREATE INDEX idx_representatives_core_fec ON public.representatives_core USING btree (fec_id)
  - idx_representatives_core_fec_id: CREATE INDEX idx_representatives_core_fec_id ON public.representatives_core USING btree (fec_id)
  - idx_representatives_core_google_civic_id: CREATE INDEX idx_representatives_core_google_civic_id ON public.representatives_core USING btree (google_civic_id)
  - idx_representatives_core_last_updated: CREATE INDEX idx_representatives_core_last_updated ON public.representatives_core USING btree (last_updated)
  - idx_representatives_core_last_verified: CREATE INDEX idx_representatives_core_last_verified ON public.representatives_core USING btree (last_verified)
  - idx_representatives_core_legiscan_id: CREATE INDEX idx_representatives_core_legiscan_id ON public.representatives_core USING btree (legiscan_id)
  - idx_representatives_core_level: CREATE INDEX idx_representatives_core_level ON public.representatives_core USING btree (level)
  - idx_representatives_core_level_office: CREATE INDEX idx_representatives_core_level_office ON public.representatives_core USING btree (level, office)
  - idx_representatives_core_name_gin: CREATE INDEX idx_representatives_core_name_gin ON public.representatives_core USING gin (to_tsvector('english'::regconfig, name))
  - idx_representatives_core_office: CREATE INDEX idx_representatives_core_office ON public.representatives_core USING btree (office)
  - idx_representatives_core_openstates: CREATE INDEX idx_representatives_core_openstates ON public.representatives_core USING btree (openstates_id)
  - idx_representatives_core_openstates_id: CREATE INDEX idx_representatives_core_openstates_id ON public.representatives_core USING btree (openstates_id)
  - idx_representatives_core_party: CREATE INDEX idx_representatives_core_party ON public.representatives_core USING btree (party)
  - idx_representatives_core_photo_score: CREATE INDEX idx_representatives_core_photo_score ON public.representatives_core USING btree (photo_score)
  - idx_representatives_core_quality_score: CREATE INDEX idx_representatives_core_quality_score ON public.representatives_core USING btree (data_quality_score)
  - idx_representatives_core_social_score: CREATE INDEX idx_representatives_core_social_score ON public.representatives_core USING btree (social_media_score)
  - idx_representatives_core_state: CREATE INDEX idx_representatives_core_state ON public.representatives_core USING btree (state)
  - idx_representatives_core_state_level: CREATE INDEX idx_representatives_core_state_level ON public.representatives_core USING btree (state, level, active)
  - idx_representatives_core_state_office: CREATE INDEX idx_representatives_core_state_office ON public.representatives_core USING btree (state, office)
  - idx_representatives_core_updated_at: CREATE INDEX idx_representatives_core_updated_at ON public.representatives_core USING btree (updated_at)
  - idx_representatives_core_verification_status: CREATE INDEX idx_representatives_core_verification_status ON public.representatives_core USING btree (verification_status)
  - idx_representatives_fec_id: CREATE INDEX idx_representatives_fec_id ON public.representatives_core USING btree (fec_id)
  - idx_representatives_individual_contributions: CREATE INDEX idx_representatives_individual_contributions ON public.representatives_core USING btree (individual_contributions)
  - idx_representatives_legiscan: CREATE INDEX idx_representatives_legiscan ON public.representatives_core USING btree (legiscan_id)
  - idx_representatives_next_election: CREATE INDEX idx_representatives_next_election ON public.representatives_core USING btree (next_election_date)
  - idx_representatives_total_receipts: CREATE INDEX idx_representatives_total_receipts ON public.representatives_core USING btree (total_receipts)
  - idx_representatives_twitter: CREATE INDEX idx_representatives_twitter ON public.representatives_core USING btree (twitter_handle)
  - representatives_core_bioguide_id_key: UNIQUE CREATE UNIQUE INDEX representatives_core_bioguide_id_key ON public.representatives_core USING btree (bioguide_id)
  - representatives_core_fec_id_key: UNIQUE CREATE UNIQUE INDEX representatives_core_fec_id_key ON public.representatives_core USING btree (fec_id)
  - representatives_core_openstates_id_key: UNIQUE CREATE UNIQUE INDEX representatives_core_openstates_id_key ON public.representatives_core USING btree (openstates_id)
  - representatives_core_pkey: UNIQUE CREATE UNIQUE INDEX representatives_core_pkey ON public.representatives_core USING btree (id)

---

### security_audit_log
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - table_name: text NOT NULL
  - operation: text NOT NULL
  - user_id: uuid NULL
  - ip_address: inet NULL
  - user_agent: text NULL
  - details: jsonb NULL
  - created_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - security_audit_log_pkey: UNIQUE CREATE UNIQUE INDEX security_audit_log_pkey ON public.security_audit_log USING btree (id)

---

### site_messages
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - title: text NOT NULL
  - message: text NOT NULL
  - type: text NOT NULL
  - priority: text NOT NULL DEFAULT 'medium'::text
  - is_active: boolean NOT NULL DEFAULT true
  - expires_at: timestamp with time zone NULL
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - site_messages_pkey: UNIQUE CREATE UNIQUE INDEX site_messages_pkey ON public.site_messages USING btree (id)

---

### state_districts
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - state: text NOT NULL
  - district_type: text NOT NULL
  - district_number: text NULL
  - ocd_division_id: text NOT NULL
  - census_cycle: integer NOT NULL
  - congress_number: integer NULL
  - valid_from: date NOT NULL
  - valid_to: date NULL
  - is_current: boolean NULL DEFAULT (valid_to IS NULL) GENERATED (valid_to IS NULL)
  - created_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - idx_state_districts_current: CREATE INDEX idx_state_districts_current ON public.state_districts USING btree (is_current)
  - idx_state_districts_state: CREATE INDEX idx_state_districts_state ON public.state_districts USING btree (state)
  - idx_state_districts_type: CREATE INDEX idx_state_districts_type ON public.state_districts USING btree (district_type)
  - state_districts_pkey: UNIQUE CREATE UNIQUE INDEX state_districts_pkey ON public.state_districts USING btree (id)
  - state_districts_state_district_type_district_number_census__key: UNIQUE CREATE UNIQUE INDEX state_districts_state_district_type_district_number_census__key ON public.state_districts USING btree (state, district_type, district_number, census_cycle)

---

### system_configuration
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - key: text NOT NULL
  - value: jsonb NOT NULL
  - description: text NULL
  - is_active: boolean NULL DEFAULT true
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - system_configuration_key_key: UNIQUE CREATE UNIQUE INDEX system_configuration_key_key ON public.system_configuration USING btree (key)
  - system_configuration_pkey: UNIQUE CREATE UNIQUE INDEX system_configuration_pkey ON public.system_configuration USING btree (id)

---

### trending_topics
**Schema:** public
**Rows:** 6
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - title: text NOT NULL
  - description: text NULL
  - source_url: text NULL
  - source_name: text NOT NULL
  - source_type: text NOT NULL
  - category: text[] NULL DEFAULT '{}'::text[]
  - trending_score: numeric(5,2) NULL DEFAULT 0.0
  - velocity: numeric(5,2) NULL DEFAULT 0.0
  - momentum: numeric(5,2) NULL DEFAULT 0.0
  - sentiment_score: numeric(3,2) NULL DEFAULT 0.0
  - entities: jsonb NULL DEFAULT '{}'::jsonb
  - metadata: jsonb NULL DEFAULT '{}'::jsonb
  - processing_status: text NULL DEFAULT 'pending'::text
  - analysis_data: jsonb NULL DEFAULT '{}'::jsonb
  - last_processed_at: timestamp with time zone NULL
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - idx_trending_topics_category: CREATE INDEX idx_trending_topics_category ON public.trending_topics USING gin (category)
  - idx_trending_topics_created: CREATE INDEX idx_trending_topics_created ON public.trending_topics USING btree (created_at)
  - idx_trending_topics_created_at: CREATE INDEX idx_trending_topics_created_at ON public.trending_topics USING btree (created_at DESC)
  - idx_trending_topics_created_status: CREATE INDEX idx_trending_topics_created_status ON public.trending_topics USING btree (created_at, processing_status)
  - idx_trending_topics_processing_status: CREATE INDEX idx_trending_topics_processing_status ON public.trending_topics USING btree (processing_status)
  - idx_trending_topics_score: CREATE INDEX idx_trending_topics_score ON public.trending_topics USING btree (trending_score)
  - idx_trending_topics_status: CREATE INDEX idx_trending_topics_status ON public.trending_topics USING btree (processing_status)
  - idx_trending_topics_status_score: CREATE INDEX idx_trending_topics_status_score ON public.trending_topics USING btree (processing_status, trending_score)
  - idx_trending_topics_trending_score: CREATE INDEX idx_trending_topics_trending_score ON public.trending_topics USING btree (trending_score DESC)
  - trending_topics_pkey: UNIQUE CREATE UNIQUE INDEX trending_topics_pkey ON public.trending_topics USING btree (id)

---

### user_civics_preferences
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** User preferences for personalized feed

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - user_id: uuid NOT NULL
  - state: text NULL
  - district: text NULL
  - interests: text[] NULL
  - followed_representatives: uuid[] NULL
  - feed_preferences: jsonb NULL DEFAULT '{}'::jsonb
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - idx_user_preferences_state: CREATE INDEX idx_user_preferences_state ON public.user_civics_preferences USING btree (state)
  - idx_user_preferences_user_id: CREATE INDEX idx_user_preferences_user_id ON public.user_civics_preferences USING btree (user_id)
  - user_civics_preferences_pkey: UNIQUE CREATE UNIQUE INDEX user_civics_preferences_pkey ON public.user_civics_preferences USING btree (id)

---

### user_consent
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - user_id: uuid NULL
  - consent_type: text NOT NULL
  - granted: boolean NOT NULL
  - granted_at: timestamp with time zone NULL DEFAULT now()
  - revoked_at: timestamp with time zone NULL
  - consent_version: integer NULL DEFAULT 1
  - purpose: text NOT NULL
  - data_types: text[] NOT NULL DEFAULT '{}'::text[]

**Foreign Keys:**
  - user_consent_user_id_fkey: (user_id) -> auth.users(id)

**Indexes:**
  - idx_user_consent_active: CREATE INDEX idx_user_consent_active ON public.user_consent USING btree (user_id, consent_type, granted, revoked_at)
  - idx_user_consent_type: CREATE INDEX idx_user_consent_type ON public.user_consent USING btree (consent_type)
  - idx_user_consent_user_id: CREATE INDEX idx_user_consent_user_id ON public.user_consent USING btree (user_id)
  - unique_active_consent: UNIQUE CREATE UNIQUE INDEX unique_active_consent ON public.user_consent USING btree (user_id, consent_type)
  - user_consent_pkey: UNIQUE CREATE UNIQUE INDEX user_consent_pkey ON public.user_consent USING btree (id)

---

### user_location_resolutions
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - user_id: uuid NOT NULL
  - address_hash: text NULL
  - resolved_ocd_id: text NULL
  - lat_q11: numeric(9,6) NULL
  - lon_q11: numeric(9,6) NULL
  - accuracy_m: integer NULL
  - geo_precision: text NOT NULL
  - source: text NOT NULL
  - consent_version: integer NOT NULL DEFAULT 1
  - consent_scope: text NULL DEFAULT 'demographics'::text
  - coarse_hash: text NULL
  - captured_at: timestamp with time zone NOT NULL DEFAULT now()
  - expires_at: timestamp with time zone NULL
  - revoked_at: timestamp with time zone NULL
  - metadata: jsonb NOT NULL DEFAULT '{}'::jsonb

**Foreign Keys:**
  - user_location_resolutions_resolved_ocd_id_fkey: (resolved_ocd_id) -> public.civic_jurisdictions(ocd_division_id)
  - user_location_resolutions_user_id_fkey: (user_id) -> auth.users(id)

**Indexes:**
  - idx_user_location_resolutions_hash: CREATE INDEX idx_user_location_resolutions_hash ON public.user_location_resolutions USING btree (address_hash) WHERE (address_hash IS NOT NULL) WHERE (address_hash IS NOT NULL)
  - idx_user_location_resolutions_ocd: CREATE INDEX idx_user_location_resolutions_ocd ON public.user_location_resolutions USING btree (resolved_ocd_id) WHERE (revoked_at IS NULL) WHERE (revoked_at IS NULL)
  - uid_user_location_resolutions_active: UNIQUE CREATE UNIQUE INDEX uid_user_location_resolutions_active ON public.user_location_resolutions USING btree (user_id) WHERE (revoked_at IS NULL) WHERE (revoked_at IS NULL)
  - user_location_resolutions_pkey: UNIQUE CREATE UNIQUE INDEX user_location_resolutions_pkey ON public.user_location_resolutions USING btree (id)

---

### user_profiles
**Schema:** public
**Rows:** 14
**RLS:** enabled
**Comment:** User profile data linked to auth.users

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - user_id: uuid NOT NULL
  - username: text NOT NULL
  - email: text NOT NULL
  - trust_tier: text NOT NULL DEFAULT 'T0'::text
  - avatar_url: text NULL
  - bio: text NULL
  - is_active: boolean NULL DEFAULT true
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()
  - is_admin: boolean NULL DEFAULT false
  - geo_lat: numeric(9,6) NULL
  - geo_lon: numeric(9,6) NULL
  - geo_precision: text NULL
  - geo_updated_at: timestamp with time zone NULL
  - geo_source: text NULL
  - geo_consent_version: integer NULL
  - geo_coarse_hash: text NULL
  - geo_trust_gate: text NULL DEFAULT 'all'::text
  - display_name: character varying(100) NULL
  - preferences: jsonb NULL DEFAULT '{}'::jsonb
  - privacy_settings: jsonb NULL DEFAULT '{"show_email": false, "show_activity": true, "allow_messages": true, "allow_analytics": true, "profile_visibility": "public", "share_demographics": false}'::jsonb
  - primary_concerns: text[] NULL
  - community_focus: text[] NULL
  - participation_style: text NULL DEFAULT 'observer'::text
  - demographics: jsonb NULL DEFAULT '{}'::jsonb

**Foreign Keys:**
  - user_profiles_user_id_fkey: (user_id) -> auth.users(id)

**Indexes:**
  - idx_user_profiles_active: CREATE INDEX idx_user_profiles_active ON public.user_profiles USING btree (is_active)
  - idx_user_profiles_admin: CREATE INDEX idx_user_profiles_admin ON public.user_profiles USING btree (is_admin)
  - idx_user_profiles_admin_active: CREATE INDEX idx_user_profiles_admin_active ON public.user_profiles USING btree (is_admin, is_active)
  - idx_user_profiles_created: CREATE INDEX idx_user_profiles_created ON public.user_profiles USING btree (created_at)
  - idx_user_profiles_created_active: CREATE INDEX idx_user_profiles_created_active ON public.user_profiles USING btree (created_at, is_active)
  - idx_user_profiles_display_name: CREATE INDEX idx_user_profiles_display_name ON public.user_profiles USING btree (display_name)
  - idx_user_profiles_email: CREATE INDEX idx_user_profiles_email ON public.user_profiles USING btree (email)
  - idx_user_profiles_geo_updated_at: CREATE INDEX idx_user_profiles_geo_updated_at ON public.user_profiles USING btree (geo_updated_at) WHERE (geo_updated_at IS NOT NULL) WHERE (geo_updated_at IS NOT NULL)
  - idx_user_profiles_is_active: CREATE INDEX idx_user_profiles_is_active ON public.user_profiles USING btree (is_active)
  - idx_user_profiles_trust_tier: CREATE INDEX idx_user_profiles_trust_tier ON public.user_profiles USING btree (trust_tier)
  - idx_user_profiles_user_id: CREATE INDEX idx_user_profiles_user_id ON public.user_profiles USING btree (user_id)
  - idx_user_profiles_username: CREATE INDEX idx_user_profiles_username ON public.user_profiles USING btree (username)
  - user_profiles_pkey: UNIQUE CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id)
  - user_profiles_username_key: UNIQUE CREATE UNIQUE INDEX user_profiles_username_key ON public.user_profiles USING btree (username)

---

### user_profiles_encrypted
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - user_id: uuid NULL
  - username: text NULL
  - public_bio: text NULL
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()
  - encrypted_demographics: bytea NULL
  - encrypted_preferences: bytea NULL
  - encrypted_contact_info: bytea NULL
  - encryption_version: integer NULL DEFAULT 1
  - key_derivation_salt: bytea NULL
  - key_hash: text NULL

**Foreign Keys:**
  - user_profiles_encrypted_user_id_fkey: (user_id) -> auth.users(id)

**Indexes:**
  - idx_user_profiles_encrypted_user_id: CREATE INDEX idx_user_profiles_encrypted_user_id ON public.user_profiles_encrypted USING btree (user_id)
  - idx_user_profiles_encrypted_username: CREATE INDEX idx_user_profiles_encrypted_username ON public.user_profiles_encrypted USING btree (username)
  - user_profiles_encrypted_pkey: UNIQUE CREATE UNIQUE INDEX user_profiles_encrypted_pkey ON public.user_profiles_encrypted USING btree (id)
  - user_profiles_encrypted_user_id_key: UNIQUE CREATE UNIQUE INDEX user_profiles_encrypted_user_id_key ON public.user_profiles_encrypted USING btree (user_id)
  - user_profiles_encrypted_username_key: UNIQUE CREATE UNIQUE INDEX user_profiles_encrypted_username_key ON public.user_profiles_encrypted USING btree (username)

---

### votes
**Schema:** public
**Rows:** 3
**RLS:** enabled
**Comment:** User votes on polls with verification

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - poll_id: uuid NOT NULL
  - user_id: uuid NOT NULL
  - choice: integer NOT NULL
  - voting_method: text NOT NULL
  - vote_data: jsonb NULL DEFAULT '{}'::jsonb
  - verification_token: text NULL
  - is_verified: boolean NULL DEFAULT false
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Foreign Keys:**
  - votes_poll_id_fkey: (poll_id) -> public.polls(id)
  - votes_user_id_fkey: (user_id) -> auth.users(id)

**Indexes:**
  - idx_votes_created_at: CREATE INDEX idx_votes_created_at ON public.votes USING btree (created_at DESC)
  - idx_votes_created_verified: CREATE INDEX idx_votes_created_verified ON public.votes USING btree (created_at, is_verified)
  - idx_votes_poll_id: CREATE INDEX idx_votes_poll_id ON public.votes USING btree (poll_id)
  - idx_votes_poll_user: CREATE INDEX idx_votes_poll_user ON public.votes USING btree (poll_id, user_id)
  - idx_votes_user_id: CREATE INDEX idx_votes_user_id ON public.votes USING btree (user_id)
  - idx_votes_verified: CREATE INDEX idx_votes_verified ON public.votes USING btree (is_verified)
  - votes_pkey: UNIQUE CREATE UNIQUE INDEX votes_pkey ON public.votes USING btree (id)
  - votes_poll_id_user_id_key: UNIQUE CREATE UNIQUE INDEX votes_poll_id_user_id_key ON public.votes USING btree (poll_id, user_id)

---

### voting_records
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - candidate_id: uuid NULL
  - bill_id: text NULL
  - bill_title: text NULL
  - bill_subject: text NULL
  - vote: text NOT NULL
  - vote_date: date NOT NULL
  - chamber: text NULL
  - bill_type: text NULL
  - bill_number: text NULL
  - congress_number: integer NULL
  - vote_description: text NULL
  - vote_question: text NULL
  - data_sources: text[] NOT NULL
  - quality_score: numeric(3,2) NULL DEFAULT 0.0
  - last_updated: timestamp with time zone NULL DEFAULT now()
  - created_at: timestamp with time zone NULL DEFAULT now()
  - provenance: jsonb NULL DEFAULT '{}'::jsonb
  - license_key: text NULL

**Foreign Keys:**
  - voting_records_candidate_id_fkey: (candidate_id) -> public.candidates(id)

**Indexes:**
  - idx_voting_records_candidate: CREATE INDEX idx_voting_records_candidate ON public.voting_records USING btree (candidate_id)
  - idx_voting_records_date: CREATE INDEX idx_voting_records_date ON public.voting_records USING btree (vote_date)
  - voting_records_pkey: UNIQUE CREATE UNIQUE INDEX voting_records_pkey ON public.voting_records USING btree (id)

---

### webauthn_challenges
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** Stores temporary WebAuthn challenges for registration and authentication

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - user_id: uuid NOT NULL
  - rp_id: text NOT NULL
  - kind: text NOT NULL
  - challenge: bytea NOT NULL
  - expires_at: timestamp with time zone NOT NULL
  - used_at: timestamp with time zone NULL
  - origin: text NULL
  - created_at: timestamp with time zone NOT NULL DEFAULT now()

**Foreign Keys:**
  - webauthn_challenges_user_id_fkey: (user_id) -> auth.users(id)

**Indexes:**
  - idx_webauthn_challenges_exp: CREATE INDEX idx_webauthn_challenges_exp ON public.webauthn_challenges USING btree (expires_at)
  - idx_webauthn_challenges_lookup: CREATE INDEX idx_webauthn_challenges_lookup ON public.webauthn_challenges USING btree (user_id, kind) WHERE (used_at IS NULL) WHERE (used_at IS NULL)
  - uq_webauthn_challenge_active: UNIQUE CREATE UNIQUE INDEX uq_webauthn_challenge_active ON public.webauthn_challenges USING btree (user_id, kind) WHERE (used_at IS NULL) WHERE (used_at IS NULL)
  - webauthn_challenges_pkey: UNIQUE CREATE UNIQUE INDEX webauthn_challenges_pkey ON public.webauthn_challenges USING btree (id)

---

### webauthn_credentials
**Schema:** public
**Rows:** -1
**RLS:** enabled
**Comment:** Stores WebAuthn public key credentials for users

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - user_id: uuid NOT NULL
  - rp_id: text NOT NULL
  - credential_id: bytea NOT NULL -- Base64URL encoded credential ID
  - public_key: bytea NOT NULL -- Raw COSE public key
  - cose_alg: smallint NULL
  - counter: bigint NOT NULL DEFAULT 0 -- Signature counter for replay protection
  - transports: text[] NULL DEFAULT '{}'::text[] -- Array of supported transports (usb, nfc, ble, internal)
  - aaguid: uuid NULL -- Authenticator Attestation Globally Unique Identifier
  - backed_up: boolean NULL -- Whether the credential is currently backed up
  - backup_eligible: boolean NULL -- Whether the credential is eligible for backup
  - device_label: text NULL
  - device_info: jsonb NULL
  - created_at: timestamp with time zone NOT NULL DEFAULT now()
  - last_used_at: timestamp with time zone NULL

**Foreign Keys:**
  - webauthn_credentials_user_id_fkey: (user_id) -> auth.users(id)

**Indexes:**
  - idx_webauthn_credentials_rp: CREATE INDEX idx_webauthn_credentials_rp ON public.webauthn_credentials USING btree (rp_id)
  - idx_webauthn_credentials_user: CREATE INDEX idx_webauthn_credentials_user ON public.webauthn_credentials USING btree (user_id)
  - webauthn_credentials_credential_id_key: UNIQUE CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON public.webauthn_credentials USING btree (credential_id)
  - webauthn_credentials_pkey: UNIQUE CREATE UNIQUE INDEX webauthn_credentials_pkey ON public.webauthn_credentials USING btree (id)

---

### zip_to_ocd
**Schema:** public
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** zip5

**Columns:**
  - zip5: text NOT NULL
  - ocd_division_id: text NOT NULL
  - confidence: numeric(3,2) NULL DEFAULT 0.0
  - created_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - idx_zip_to_ocd_ocd: CREATE INDEX idx_zip_to_ocd_ocd ON public.zip_to_ocd USING btree (ocd_division_id)
  - idx_zip_to_ocd_zip: CREATE INDEX idx_zip_to_ocd_zip ON public.zip_to_ocd USING btree (zip5)
  - zip_to_ocd_pkey: UNIQUE CREATE UNIQUE INDEX zip_to_ocd_pkey ON public.zip_to_ocd USING btree (zip5)

---

## REALTIME SCHEMA
Tables: 3

### messages
**Schema:** realtime
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** ['id', 'inserted_at']

**Columns:**
  - topic: text NOT NULL
  - extension: text NOT NULL
  - payload: jsonb NULL
  - event: text NULL
  - private: boolean NULL DEFAULT false
  - updated_at: timestamp without time zone NOT NULL DEFAULT now()
  - inserted_at: timestamp without time zone NOT NULL DEFAULT now()
  - id: uuid NOT NULL DEFAULT gen_random_uuid()

**Indexes:**
  - messages_inserted_at_topic_index: CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE)) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE))
  - messages_pkey: UNIQUE CREATE UNIQUE INDEX messages_pkey ON ONLY realtime.messages USING btree (id, inserted_at)

---

### schema_migrations
**Schema:** realtime
**Rows:** 63
**RLS:** disabled
**Comment:** None

**Primary Key:** version

**Columns:**
  - version: bigint NOT NULL
  - inserted_at: timestamp(0) without time zone NULL

**Indexes:**
  - schema_migrations_pkey: UNIQUE CREATE UNIQUE INDEX schema_migrations_pkey ON realtime.schema_migrations USING btree (version)

---

### subscription
**Schema:** realtime
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: bigint NOT NULL
  - subscription_id: uuid NOT NULL
  - entity: regclass NOT NULL
  - filters: realtime.user_defined_filter[] NOT NULL DEFAULT '{}'::realtime.user_defined_filter[]
  - claims: jsonb NOT NULL
  - claims_role: regrole NOT NULL DEFAULT realtime.to_regrole((claims ->> 'role'::text)) GENERATED realtime.to_regrole((claims ->> 'role'::text))
  - created_at: timestamp without time zone NOT NULL DEFAULT timezone('utc'::text, now())

**Indexes:**
  - ix_realtime_subscription_entity: CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity)
  - pk_subscription: UNIQUE CREATE UNIQUE INDEX pk_subscription ON realtime.subscription USING btree (id)
  - subscription_subscription_id_entity_filters_key: UNIQUE CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters)

---

## STAGING SCHEMA
Tables: 6

### congress_gov_raw
**Schema:** staging
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - retrieved_at: timestamp with time zone NOT NULL
  - request_url: text NOT NULL
  - api_version: text NULL
  - etag: text NULL
  - payload: jsonb NOT NULL
  - md5_hash: text NULL
  - response_status: integer NULL
  - response_headers: jsonb NULL
  - processing_status: text NULL DEFAULT 'pending'::text
  - processing_started_at: timestamp with time zone NULL
  - processing_completed_at: timestamp with time zone NULL
  - processing_error: text NULL
  - retry_count: integer NULL DEFAULT 0
  - max_retries: integer NULL DEFAULT 3
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - congress_gov_raw_pkey: UNIQUE CREATE UNIQUE INDEX congress_gov_raw_pkey ON staging.congress_gov_raw USING btree (id)
  - idx_staging_congress_gov_etag: CREATE INDEX idx_staging_congress_gov_etag ON staging.congress_gov_raw USING btree (etag)
  - idx_staging_congress_gov_retrieved: CREATE INDEX idx_staging_congress_gov_retrieved ON staging.congress_gov_raw USING btree (retrieved_at)
  - idx_staging_congress_gov_status: CREATE INDEX idx_staging_congress_gov_status ON staging.congress_gov_raw USING btree (processing_status)

---

### fec_raw
**Schema:** staging
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - retrieved_at: timestamp with time zone NOT NULL
  - request_url: text NOT NULL
  - api_version: text NULL
  - etag: text NULL
  - payload: jsonb NOT NULL
  - md5_hash: text NULL
  - response_status: integer NULL
  - response_headers: jsonb NULL
  - processing_status: text NULL DEFAULT 'pending'::text
  - processing_started_at: timestamp with time zone NULL
  - processing_completed_at: timestamp with time zone NULL
  - processing_error: text NULL
  - retry_count: integer NULL DEFAULT 0
  - max_retries: integer NULL DEFAULT 3
  - data_type: text NULL
  - cycle: integer NULL
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - fec_raw_pkey: UNIQUE CREATE UNIQUE INDEX fec_raw_pkey ON staging.fec_raw USING btree (id)
  - idx_staging_fec_cycle: CREATE INDEX idx_staging_fec_cycle ON staging.fec_raw USING btree (cycle)
  - idx_staging_fec_etag: CREATE INDEX idx_staging_fec_etag ON staging.fec_raw USING btree (etag)
  - idx_staging_fec_retrieved: CREATE INDEX idx_staging_fec_retrieved ON staging.fec_raw USING btree (retrieved_at)
  - idx_staging_fec_status: CREATE INDEX idx_staging_fec_status ON staging.fec_raw USING btree (processing_status)
  - idx_staging_fec_type: CREATE INDEX idx_staging_fec_type ON staging.fec_raw USING btree (data_type)

---

### google_civic_raw
**Schema:** staging
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - retrieved_at: timestamp with time zone NOT NULL
  - request_url: text NOT NULL
  - api_version: text NULL
  - etag: text NULL
  - payload: jsonb NOT NULL
  - md5_hash: text NULL
  - response_status: integer NULL
  - response_headers: jsonb NULL
  - processing_status: text NULL DEFAULT 'pending'::text
  - processing_started_at: timestamp with time zone NULL
  - processing_completed_at: timestamp with time zone NULL
  - processing_error: text NULL
  - retry_count: integer NULL DEFAULT 0
  - max_retries: integer NULL DEFAULT 3
  - data_type: text NULL
  - address: text NULL
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - google_civic_raw_pkey: UNIQUE CREATE UNIQUE INDEX google_civic_raw_pkey ON staging.google_civic_raw USING btree (id)
  - idx_staging_google_civic_retrieved: CREATE INDEX idx_staging_google_civic_retrieved ON staging.google_civic_raw USING btree (retrieved_at)
  - idx_staging_google_civic_status: CREATE INDEX idx_staging_google_civic_status ON staging.google_civic_raw USING btree (processing_status)
  - idx_staging_google_civic_type: CREATE INDEX idx_staging_google_civic_type ON staging.google_civic_raw USING btree (data_type)

---

### govtrack_raw
**Schema:** staging
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - retrieved_at: timestamp with time zone NOT NULL
  - request_url: text NOT NULL
  - api_version: text NULL
  - etag: text NULL
  - payload: jsonb NOT NULL
  - md5_hash: text NULL
  - response_status: integer NULL
  - response_headers: jsonb NULL
  - processing_status: text NULL DEFAULT 'pending'::text
  - processing_started_at: timestamp with time zone NULL
  - processing_completed_at: timestamp with time zone NULL
  - processing_error: text NULL
  - retry_count: integer NULL DEFAULT 0
  - max_retries: integer NULL DEFAULT 3
  - data_type: text NULL
  - congress: integer NULL
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - govtrack_raw_pkey: UNIQUE CREATE UNIQUE INDEX govtrack_raw_pkey ON staging.govtrack_raw USING btree (id)
  - idx_staging_govtrack_congress: CREATE INDEX idx_staging_govtrack_congress ON staging.govtrack_raw USING btree (congress)
  - idx_staging_govtrack_retrieved: CREATE INDEX idx_staging_govtrack_retrieved ON staging.govtrack_raw USING btree (retrieved_at)
  - idx_staging_govtrack_status: CREATE INDEX idx_staging_govtrack_status ON staging.govtrack_raw USING btree (processing_status)
  - idx_staging_govtrack_type: CREATE INDEX idx_staging_govtrack_type ON staging.govtrack_raw USING btree (data_type)

---

### open_states_raw
**Schema:** staging
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - retrieved_at: timestamp with time zone NOT NULL
  - request_url: text NOT NULL
  - api_version: text NULL
  - etag: text NULL
  - payload: jsonb NOT NULL
  - md5_hash: text NULL
  - response_status: integer NULL
  - response_headers: jsonb NULL
  - processing_status: text NULL DEFAULT 'pending'::text
  - processing_started_at: timestamp with time zone NULL
  - processing_completed_at: timestamp with time zone NULL
  - processing_error: text NULL
  - retry_count: integer NULL DEFAULT 0
  - max_retries: integer NULL DEFAULT 3
  - data_type: text NULL
  - jurisdiction: text NULL
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - idx_staging_open_states_jurisdiction: CREATE INDEX idx_staging_open_states_jurisdiction ON staging.open_states_raw USING btree (jurisdiction)
  - idx_staging_open_states_retrieved: CREATE INDEX idx_staging_open_states_retrieved ON staging.open_states_raw USING btree (retrieved_at)
  - idx_staging_open_states_status: CREATE INDEX idx_staging_open_states_status ON staging.open_states_raw USING btree (processing_status)
  - idx_staging_open_states_type: CREATE INDEX idx_staging_open_states_type ON staging.open_states_raw USING btree (data_type)
  - open_states_raw_pkey: UNIQUE CREATE UNIQUE INDEX open_states_raw_pkey ON staging.open_states_raw USING btree (id)

---

### opensecrets_raw
**Schema:** staging
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - retrieved_at: timestamp with time zone NOT NULL
  - request_url: text NOT NULL
  - api_version: text NULL
  - etag: text NULL
  - payload: jsonb NOT NULL
  - md5_hash: text NULL
  - response_status: integer NULL
  - response_headers: jsonb NULL
  - processing_status: text NULL DEFAULT 'pending'::text
  - processing_started_at: timestamp with time zone NULL
  - processing_completed_at: timestamp with time zone NULL
  - processing_error: text NULL
  - retry_count: integer NULL DEFAULT 0
  - max_retries: integer NULL DEFAULT 3
  - data_type: text NULL
  - cycle: integer NULL
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Indexes:**
  - idx_staging_opensecrets_cycle: CREATE INDEX idx_staging_opensecrets_cycle ON staging.opensecrets_raw USING btree (cycle)
  - idx_staging_opensecrets_retrieved: CREATE INDEX idx_staging_opensecrets_retrieved ON staging.opensecrets_raw USING btree (retrieved_at)
  - idx_staging_opensecrets_status: CREATE INDEX idx_staging_opensecrets_status ON staging.opensecrets_raw USING btree (processing_status)
  - idx_staging_opensecrets_type: CREATE INDEX idx_staging_opensecrets_type ON staging.opensecrets_raw USING btree (data_type)
  - opensecrets_raw_pkey: UNIQUE CREATE UNIQUE INDEX opensecrets_raw_pkey ON staging.opensecrets_raw USING btree (id)

---

## STORAGE SCHEMA
Tables: 7

### buckets
**Schema:** storage
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: text NOT NULL
  - name: text NOT NULL
  - owner: uuid NULL -- Field is deprecated, use owner_id instead
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()
  - public: boolean NULL DEFAULT false
  - avif_autodetection: boolean NULL DEFAULT false
  - file_size_limit: bigint NULL
  - allowed_mime_types: text[] NULL
  - owner_id: text NULL
  - type: storage.buckettype NOT NULL DEFAULT 'STANDARD'::storage.buckettype

**Indexes:**
  - bname: UNIQUE CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name)
  - buckets_pkey: UNIQUE CREATE UNIQUE INDEX buckets_pkey ON storage.buckets USING btree (id)

---

### buckets_analytics
**Schema:** storage
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: text NOT NULL
  - type: storage.buckettype NOT NULL DEFAULT 'ANALYTICS'::storage.buckettype
  - format: text NOT NULL DEFAULT 'ICEBERG'::text
  - created_at: timestamp with time zone NOT NULL DEFAULT now()
  - updated_at: timestamp with time zone NOT NULL DEFAULT now()

**Indexes:**
  - buckets_analytics_pkey: UNIQUE CREATE UNIQUE INDEX buckets_analytics_pkey ON storage.buckets_analytics USING btree (id)

---

### migrations
**Schema:** storage
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: integer NOT NULL
  - name: character varying(100) NOT NULL
  - hash: character varying(40) NOT NULL
  - executed_at: timestamp without time zone NULL DEFAULT CURRENT_TIMESTAMP

**Indexes:**
  - migrations_name_key: UNIQUE CREATE UNIQUE INDEX migrations_name_key ON storage.migrations USING btree (name)
  - migrations_pkey: UNIQUE CREATE UNIQUE INDEX migrations_pkey ON storage.migrations USING btree (id)

---

### objects
**Schema:** storage
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - bucket_id: text NULL
  - name: text NULL
  - owner: uuid NULL -- Field is deprecated, use owner_id instead
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()
  - last_accessed_at: timestamp with time zone NULL DEFAULT now()
  - metadata: jsonb NULL
  - path_tokens: text[] NULL DEFAULT string_to_array(name, '/'::text) GENERATED string_to_array(name, '/'::text)
  - version: text NULL
  - owner_id: text NULL
  - user_metadata: jsonb NULL
  - level: integer NULL

**Foreign Keys:**
  - objects_bucketId_fkey: (bucket_id) -> storage.buckets(id)

**Indexes:**
  - bucketid_objname: UNIQUE CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name)
  - idx_name_bucket_level_unique: UNIQUE CREATE UNIQUE INDEX idx_name_bucket_level_unique ON storage.objects USING btree (name COLLATE "C", bucket_id, level)
  - idx_objects_bucket_id_name: CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C")
  - idx_objects_lower_name: CREATE INDEX idx_objects_lower_name ON storage.objects USING btree ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level)
  - name_prefix_search: CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops)
  - objects_bucket_id_level_idx: UNIQUE CREATE UNIQUE INDEX objects_bucket_id_level_idx ON storage.objects USING btree (bucket_id, level, name COLLATE "C")
  - objects_pkey: UNIQUE CREATE UNIQUE INDEX objects_pkey ON storage.objects USING btree (id)

---

### prefixes
**Schema:** storage
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** ['bucket_id', 'level', 'name']

**Columns:**
  - bucket_id: text NOT NULL
  - name: text NOT NULL
  - level: integer NOT NULL DEFAULT storage.get_level(name) GENERATED storage.get_level(name)
  - created_at: timestamp with time zone NULL DEFAULT now()
  - updated_at: timestamp with time zone NULL DEFAULT now()

**Foreign Keys:**
  - prefixes_bucketId_fkey: (bucket_id) -> storage.buckets(id)

**Indexes:**
  - idx_prefixes_lower_name: CREATE INDEX idx_prefixes_lower_name ON storage.prefixes USING btree (bucket_id, level, ((string_to_array(name, '/'::text))[level]), lower(name) text_pattern_ops)
  - prefixes_pkey: UNIQUE CREATE UNIQUE INDEX prefixes_pkey ON storage.prefixes USING btree (bucket_id, level, name)

---

### s3_multipart_uploads
**Schema:** storage
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: text NOT NULL
  - in_progress_size: bigint NOT NULL DEFAULT 0
  - upload_signature: text NOT NULL
  - bucket_id: text NOT NULL
  - key: text NOT NULL
  - version: text NOT NULL
  - owner_id: text NULL
  - created_at: timestamp with time zone NOT NULL DEFAULT now()
  - user_metadata: jsonb NULL

**Foreign Keys:**
  - s3_multipart_uploads_bucket_id_fkey: (bucket_id) -> storage.buckets(id)

**Indexes:**
  - idx_multipart_uploads_list: CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at)
  - s3_multipart_uploads_pkey: UNIQUE CREATE UNIQUE INDEX s3_multipart_uploads_pkey ON storage.s3_multipart_uploads USING btree (id)

---

### s3_multipart_uploads_parts
**Schema:** storage
**Rows:** -1
**RLS:** disabled
**Comment:** None

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - upload_id: text NOT NULL
  - size: bigint NOT NULL DEFAULT 0
  - part_number: integer NOT NULL
  - bucket_id: text NOT NULL
  - key: text NOT NULL
  - etag: text NOT NULL
  - owner_id: text NULL
  - version: text NOT NULL
  - created_at: timestamp with time zone NOT NULL DEFAULT now()

**Foreign Keys:**
  - s3_multipart_uploads_parts_bucket_id_fkey: (bucket_id) -> storage.buckets(id)
  - s3_multipart_uploads_parts_upload_id_fkey: (upload_id) -> storage.s3_multipart_uploads(id)

**Indexes:**
  - s3_multipart_uploads_parts_pkey: UNIQUE CREATE UNIQUE INDEX s3_multipart_uploads_parts_pkey ON storage.s3_multipart_uploads_parts USING btree (id)

---

## VAULT SCHEMA
Tables: 1

### secrets
**Schema:** vault
**Rows:** -1
**RLS:** disabled
**Comment:** Table with encrypted `secret` column for storing sensitive information on disk.

**Primary Key:** id

**Columns:**
  - id: uuid NOT NULL DEFAULT gen_random_uuid()
  - name: text NULL
  - description: text NOT NULL DEFAULT ''::text
  - secret: text NOT NULL
  - key_id: uuid NULL
  - nonce: bytea NULL DEFAULT vault._crypto_aead_det_noncegen()
  - created_at: timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
  - updated_at: timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP

**Indexes:**
  - secrets_name_idx: UNIQUE CREATE UNIQUE INDEX secrets_name_idx ON vault.secrets USING btree (name) WHERE (name IS NOT NULL) WHERE (name IS NOT NULL)
  - secrets_pkey: UNIQUE CREATE UNIQUE INDEX secrets_pkey ON vault.secrets USING btree (id)

---

