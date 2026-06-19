DO $$
DECLARE
    tenants text[] := ARRAY['alpha', 'beta', 'gamma'];
    statuses text[] := ARRAY['acknowledged', 'inProgress', 'resolved', 'closed', 'rejected'];
    issue_types text[] := ARRAY[
        'Brak synchronizacji ONT',
        'Niska przepustowosc lacza',
        'Przerwa w dostepie do Internetu',
        'Podwyzszone opoznienia',
        'Problem z aktywacja uslugi',
        'Niestabilne polaczenie VPN',
        'Brak adresacji IP',
        'Degradacja uslugi glosowej',
        'Awaria portu dostepowego',
        'Brak potwierdzenia konfiguracji CPE'
    ];
    note_templates text[] := ARRAY[
        'Zgloszenie przyjete do analizy przez backoffice.',
        'Zweryfikowano dane uslugi w systemie CRM.',
        'Potwierdzono korelacje z alarmem z CMDB.',
        'Przekazano do realizacji zespolowi utrzymaniowemu.',
        'Oczekiwanie na potwierdzenie po stronie uzytkownika korzystajacego.',
        'Zamkniecie techniczne potwierdzone przez operatora infrastruktury.'
    ];
    ticket_idx integer;
    note_idx integer;
    notes_count integer;
    tenant_value text;
    status_value text;
    issue_value text;
    ticket_id uuid;
    created_at_value timestamptz;
BEGIN
    DELETE FROM public.trouble_ticket_note
    WHERE tenant_id = ANY (tenants);

    DELETE FROM public.trouble_ticket
    WHERE tenant_id = ANY (tenants);

    FOR ticket_idx IN 1..30 LOOP
        tenant_value := tenants[((ticket_idx - 1) % array_length(tenants, 1)) + 1];
        status_value := statuses[((ticket_idx - 1) % array_length(statuses, 1)) + 1];
        issue_value := issue_types[((ticket_idx - 1) % array_length(issue_types, 1)) + 1];
        created_at_value := CURRENT_TIMESTAMP - make_interval(hours => ticket_idx * 4);

        INSERT INTO public.trouble_ticket (
            tenant_id,
            external_id,
            service_id,
            description,
            status,
            created_at
        )
        VALUES (
            tenant_value,
            format('TT-2026-%s', lpad(ticket_idx::text, 4, '0')),
            100000 + ticket_idx,
            format('%s dla uslugi %s w tenant %s.', issue_value, 100000 + ticket_idx, tenant_value),
            status_value,
            created_at_value
        )
        RETURNING id INTO ticket_id;

        notes_count := floor(random() * 6)::integer;

        FOR note_idx IN 1..notes_count LOOP
            INSERT INTO public.trouble_ticket_note (
                tenant_id,
                trouble_ticket_id,
                note,
                created_at
            )
            VALUES (
                tenant_value,
                ticket_id,
                format(
                    '%s Status na etapie notatki: %s. Notatka %s/%s.',
                    note_templates[((ticket_idx + note_idx - 2) % array_length(note_templates, 1)) + 1],
                    status_value,
                    note_idx,
                    notes_count
                ),
                created_at_value + make_interval(mins => note_idx * 17)
            );
        END LOOP;
    END LOOP;
END
$$;
