package pl.netia.tests.ttapi.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RestController;
import pl.netia.tests.ttapi.api.TroubleTicketApi;
import pl.netia.tests.ttapi.model.TroubleTicketCloseStatusRequestDto;
import pl.netia.tests.ttapi.model.TroubleTicketCreateRequestDto;
import pl.netia.tests.ttapi.model.TroubleTicketDto;
import pl.netia.tests.ttapi.model.TroubleTicketSummaryDto;
import pl.netia.tests.ttapi.security.TenantExtractor;
import pl.netia.tests.ttapi.service.CreateResult;
import pl.netia.tests.ttapi.service.TroubleTicketService;

import java.net.URI;
import java.util.List;

@RestController
public class TroubleTicketController implements TroubleTicketApi {

    private final TroubleTicketService service;
    private final TenantExtractor tenantExtractor;

    public TroubleTicketController(TroubleTicketService service, TenantExtractor tenantExtractor) {
        this.service = service;
        this.tenantExtractor = tenantExtractor;
    }

    @Override
    public ResponseEntity<TroubleTicketDto> createTroubleTicket(
            TroubleTicketCreateRequestDto troubleTicketCreateRequestDto) {
        String tenantId = tenantExtractor.extractTenantId(currentAuthentication());
        CreateResult<TroubleTicketDto> result = service.create(troubleTicketCreateRequestDto, tenantId);

        if (result.created()) {
            URI location = URI.create("/api/v1/troubleTicket/" + result.body().getExternalId());
            return ResponseEntity.created(location).body(result.body());
        }
        return ResponseEntity.ok(result.body());
    }

    @Override
    public ResponseEntity<List<TroubleTicketSummaryDto>> listTroubleTickets() {
        String tenantId = tenantExtractor.extractTenantId(currentAuthentication());
        return ResponseEntity.ok(service.list(tenantId));
    }

    @Override
    public ResponseEntity<TroubleTicketDto> getTroubleTicketById(String id) {
        String tenantId = tenantExtractor.extractTenantId(currentAuthentication());
        return ResponseEntity.ok(service.getByExternalId(id, tenantId));
    }

    @Override
    public ResponseEntity<TroubleTicketDto> closeTroubleTicket(String id,
            TroubleTicketCloseStatusRequestDto troubleTicketCloseStatusRequestDto) {
        String tenantId = tenantExtractor.extractTenantId(currentAuthentication());
        return ResponseEntity.ok(service.close(id, tenantId));
    }

    private Authentication currentAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }
}
