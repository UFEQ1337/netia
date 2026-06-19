package pl.netia.tests.ttapi.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RestController;
import pl.netia.tests.ttapi.api.TroubleTicketNoteApi;
import pl.netia.tests.ttapi.model.NoteCreateRequestDto;
import pl.netia.tests.ttapi.model.NoteDto;
import pl.netia.tests.ttapi.security.TenantExtractor;
import pl.netia.tests.ttapi.service.TroubleTicketService;

@RestController
public class TroubleTicketNoteController implements TroubleTicketNoteApi {

    private final TroubleTicketService service;
    private final TenantExtractor tenantExtractor;

    public TroubleTicketNoteController(TroubleTicketService service, TenantExtractor tenantExtractor) {
        this.service = service;
        this.tenantExtractor = tenantExtractor;
    }

    @Override
    public ResponseEntity<NoteDto> addTroubleTicketNote(String id,
            NoteCreateRequestDto noteCreateRequestDto) {
        String tenantId = tenantExtractor.extractTenantId(currentAuthentication());
        NoteDto note = service.addNote(id, noteCreateRequestDto, tenantId);
        return ResponseEntity.status(201).body(note);
    }

    private Authentication currentAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }
}
