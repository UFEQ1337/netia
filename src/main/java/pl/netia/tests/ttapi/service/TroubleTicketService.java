package pl.netia.tests.ttapi.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.netia.tests.ttapi.entity.TroubleTicketEntity;
import pl.netia.tests.ttapi.entity.TroubleTicketNoteEntity;
import pl.netia.tests.ttapi.exception.InvalidStatusTransitionException;
import pl.netia.tests.ttapi.exception.NoteAdditionNotAllowedException;
import pl.netia.tests.ttapi.exception.TroubleTicketNotFoundException;
import pl.netia.tests.ttapi.mapper.TroubleTicketMapper;
import pl.netia.tests.ttapi.model.NoteCreateRequestDto;
import pl.netia.tests.ttapi.model.NoteDto;
import pl.netia.tests.ttapi.model.TroubleTicketCreateRequestDto;
import pl.netia.tests.ttapi.model.TroubleTicketDto;
import pl.netia.tests.ttapi.model.TroubleTicketSummaryDto;
import pl.netia.tests.ttapi.repository.TroubleTicketNoteRepository;
import pl.netia.tests.ttapi.repository.TroubleTicketRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class TroubleTicketService {

    private static final Set<String> NOTE_BLOCKED_STATUSES = Set.of("resolved", "closed", "rejected");
    private static final Set<String> CLOSE_ALLOWED_FROM_STATUSES = Set.of("acknowledged", "inProgress");

    private final TroubleTicketRepository ticketRepo;
    private final TroubleTicketNoteRepository noteRepo;
    private final TroubleTicketMapper mapper;
    private final TicketStatusResolver statusResolver;

    public TroubleTicketService(
            TroubleTicketRepository ticketRepo,
            TroubleTicketNoteRepository noteRepo,
            TroubleTicketMapper mapper,
            TicketStatusResolver statusResolver) {
        this.ticketRepo = ticketRepo;
        this.noteRepo = noteRepo;
        this.mapper = mapper;
        this.statusResolver = statusResolver;
    }

    @Transactional
    public CreateResult<TroubleTicketDto> create(TroubleTicketCreateRequestDto request, String tenantId) {
        Optional<TroubleTicketEntity> existing = ticketRepo.findByTenantIdAndExternalId(
                tenantId, request.getExternalId());
        if (existing.isPresent()) {
            return new CreateResult<>(mapper.toDto(existing.get()), false);
        }

        UUID ticketUuid = UUID.randomUUID();
        TroubleTicketEntity ticket = new TroubleTicketEntity();
        ticket.setId(ticketUuid);
        ticket.setTenantId(tenantId);
        ticket.setExternalId(request.getExternalId());
        ticket.setServiceId(request.getServiceId());
        ticket.setDescription(request.getDescription());
        ticket.setStatus(statusResolver.resolveInitialStatus(request.getServiceId()));
        ticket.setCreatedAt(OffsetDateTime.now());
        ticketRepo.save(ticket);

        if (request.getNote() != null && !request.getNote().isBlank()) {
            TroubleTicketNoteEntity note = buildNote(tenantId, ticketUuid, request.getNote());
            noteRepo.save(note);
            ticket.getNotes().add(note);
        }

        return new CreateResult<>(mapper.toDto(ticket), true);
    }

    public List<TroubleTicketSummaryDto> list(String tenantId) {
        return ticketRepo.findByTenantId(tenantId).stream()
                .map(mapper::toSummaryDto)
                .toList();
    }

    public TroubleTicketDto getByExternalId(String externalId, String tenantId) {
        return ticketRepo.findByTenantIdAndExternalId(tenantId, externalId)
                .map(mapper::toDto)
                .orElseThrow(() -> new TroubleTicketNotFoundException(externalId));
    }

    @Transactional
    public TroubleTicketDto close(String externalId, String tenantId) {
        TroubleTicketEntity ticket = ticketRepo.findByTenantIdAndExternalId(tenantId, externalId)
                .orElseThrow(() -> new TroubleTicketNotFoundException(externalId));
        String previousStatus = ticket.getStatus();
        if (!CLOSE_ALLOWED_FROM_STATUSES.contains(previousStatus)) {
            throw new InvalidStatusTransitionException(previousStatus, "closed");
        }
        ticket.setStatus("closed");
        ticketRepo.save(ticket);
        TroubleTicketNoteEntity statusNote = buildNote(
                tenantId,
                ticket.getId(),
                "Zmiana statusu: " + previousStatus + " -> closed");
        noteRepo.save(statusNote);
        return mapper.toDto(ticket);
    }

    @Transactional
    public NoteDto addNote(String externalId, NoteCreateRequestDto request, String tenantId) {
        TroubleTicketEntity ticket = ticketRepo.findByTenantIdAndExternalId(tenantId, externalId)
                .orElseThrow(() -> new TroubleTicketNotFoundException(externalId));
        if (NOTE_BLOCKED_STATUSES.contains(ticket.getStatus())) {
            throw new NoteAdditionNotAllowedException(ticket.getStatus());
        }
        TroubleTicketNoteEntity note = buildNote(tenantId, ticket.getId(), request.getText());
        noteRepo.save(note);
        return mapper.toNoteDto(note);
    }

    private TroubleTicketNoteEntity buildNote(String tenantId, UUID ticketId, String text) {
        TroubleTicketNoteEntity note = new TroubleTicketNoteEntity();
        note.setId(UUID.randomUUID());
        note.setTenantId(tenantId);
        note.setTroubleTicketId(ticketId);
        note.setNote(text);
        note.setCreatedAt(OffsetDateTime.now());
        return note;
    }
}
