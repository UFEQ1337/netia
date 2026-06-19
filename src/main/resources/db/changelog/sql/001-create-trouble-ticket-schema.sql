CREATE SCHEMA IF NOT EXISTS extensions;
REVOKE ALL ON SCHEMA extensions FROM PUBLIC;

create extension IF NOT EXISTS pgcrypto with schema extensions;

CREATE TABLE IF NOT EXISTS public.trouble_ticket (
    tenant_id varchar NOT NULL DEFAULT CURRENT_USER,
    id uuid NOT NULL DEFAULT uuidv7(),
    external_id varchar NOT NULL,
    service_id bigint NOT NULL,
    description text NOT NULL,
    status varchar NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_trouble_ticket PRIMARY KEY (tenant_id, id),
    CONSTRAINT uq_trouble_ticket_external_id UNIQUE (tenant_id, external_id),
    CONSTRAINT chk_trouble_ticket_status CHECK (status IN ('new', 'acknowledged', 'inProgress', 'resolved', 'closed', 'rejected')),
    CONSTRAINT chk_trouble_ticket_service_id CHECK (service_id >= 1),
    CONSTRAINT chk_trouble_ticket_external_id_not_blank CHECK (btrim(external_id) <> ''),
    CONSTRAINT chk_trouble_ticket_description_not_blank CHECK (btrim(description) <> '')
);

CREATE TABLE IF NOT EXISTS public.trouble_ticket_note (
    tenant_id varchar NOT NULL DEFAULT CURRENT_USER,
    id uuid NOT NULL DEFAULT uuidv7(),
    trouble_ticket_id uuid NOT NULL,
    note text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_trouble_ticket_note PRIMARY KEY (tenant_id, id),
    CONSTRAINT fk_trouble_ticket_note_ticket FOREIGN KEY (tenant_id, trouble_ticket_id)
        REFERENCES public.trouble_ticket (tenant_id, id)
        ON DELETE CASCADE,
    CONSTRAINT chk_trouble_ticket_note_note_not_blank CHECK (btrim(note) <> '')
);

CREATE INDEX IF NOT EXISTS idx_trouble_ticket_status
    ON public.trouble_ticket (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_trouble_ticket_note_ticket
    ON public.trouble_ticket_note (tenant_id, trouble_ticket_id, created_at);

REVOKE ALL ON TABLE public.trouble_ticket FROM PUBLIC;
REVOKE ALL ON TABLE public.trouble_ticket_note FROM PUBLIC;

REVOKE ALL ON SCHEMA public FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
