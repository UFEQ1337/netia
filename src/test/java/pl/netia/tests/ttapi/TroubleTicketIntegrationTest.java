package pl.netia.tests.ttapi;

import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import pl.netia.tests.ttapi.model.TroubleTicketCreateStatusDto;
import pl.netia.tests.ttapi.repository.TroubleTicketNoteRepository;
import pl.netia.tests.ttapi.repository.TroubleTicketRepository;

import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import({PostgreSqlContainerConfiguration.class, TestSecurityConfig.class})
class TroubleTicketIntegrationTest {

    private static final String BASE_URL = "/api/v1/troubleTicket";
    private static final String TENANT_A = "alpha";
    private static final String TENANT_B = "beta";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TroubleTicketRepository ticketRepository;

    @Autowired
    private TroubleTicketNoteRepository noteRepository;

    @BeforeEach
    void cleanDatabase() {
        noteRepository.deleteAllInBatch();
        ticketRepository.deleteAllInBatch();
    }

    @Test
    void shouldCreateTroubleTicket_returnsCreated() throws Exception {
        String payload = createRequestPayload("EXT-001", 100L, "Brak transmisji danych");

        mockMvc.perform(post(BASE_URL)
                        .with(jwt().jwt(j -> j.claim("tenant_id", TENANT_A)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", containsString("EXT-001")))
                .andExpect(jsonPath("$.externalId", is("EXT-001")))
                .andExpect(jsonPath("$.status", is("acknowledged")))
                .andExpect(jsonPath("$.notes", hasSize(1)));
    }

    @Test
    void shouldReturnExistingTicket_whenCreatedWithSameExternalId() throws Exception {
        String payload = createRequestPayload("EXT-002", 100L, "Opis zgłoszenia");

        mockMvc.perform(post(BASE_URL)
                        .with(jwt().jwt(j -> j.claim("tenant_id", TENANT_A)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated());

        mockMvc.perform(post(BASE_URL)
                        .with(jwt().jwt(j -> j.claim("tenant_id", TENANT_A)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.externalId", is("EXT-002")));
    }

    @Test
    void shouldListTroubleTickets_returnsOk() throws Exception {
        String payload1 = createRequestPayload("EXT-011", 100L, "Zgłoszenie pierwsze");
        String payload2 = createRequestPayload("EXT-012", 100L, "Zgłoszenie drugie");

        mockMvc.perform(post(BASE_URL)
                .with(jwt().jwt(j -> j.claim("tenant_id", TENANT_A)))
                .contentType(MediaType.APPLICATION_JSON).content(payload1));
        mockMvc.perform(post(BASE_URL)
                .with(jwt().jwt(j -> j.claim("tenant_id", TENANT_A)))
                .contentType(MediaType.APPLICATION_JSON).content(payload2));

        mockMvc.perform(get(BASE_URL)
                        .with(jwt().jwt(j -> j.claim("tenant_id", TENANT_A))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void shouldGetTroubleTicketById_returnsOk() throws Exception {
        String payload = createRequestPayload("EXT-021", 100L, "Opis");

        mockMvc.perform(post(BASE_URL)
                .with(jwt().jwt(j -> j.claim("tenant_id", TENANT_A)))
                .contentType(MediaType.APPLICATION_JSON).content(payload));

        mockMvc.perform(get(BASE_URL + "/EXT-021")
                        .with(jwt().jwt(j -> j.claim("tenant_id", TENANT_A))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.externalId", is("EXT-021")))
                .andExpect(jsonPath("$.notes", hasSize(1)));
    }

    @Test
    void shouldReturnNotFound_whenTicketDoesNotExist() throws Exception {
        mockMvc.perform(get(BASE_URL + "/NONEXISTENT")
                        .with(jwt().jwt(j -> j.claim("tenant_id", TENANT_A))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code", is("TROUBLE_TICKET_NOT_FOUND")))
                .andExpect(jsonPath("$.requestId", notNullValue()));
    }

    @Test
    void shouldCloseTicket_returnsOk() throws Exception {
        String payload = createRequestPayload("EXT-031", 100L, "Do zamknięcia");

        mockMvc.perform(post(BASE_URL)
                .with(jwt().jwt(j -> j.claim("tenant_id", TENANT_A)))
                .contentType(MediaType.APPLICATION_JSON).content(payload));

        String closePayload = objectMapper.writeValueAsString(Map.of("status", "closed"));

        mockMvc.perform(patch(BASE_URL + "/EXT-031")
                        .with(jwt().jwt(j -> j.claim("tenant_id", TENANT_A)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(closePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("closed")));
    }

    @Test
    void shouldAddNoteToTicket_returnsCreated() throws Exception {
        String payload = createRequestPayload("EXT-041", 100L, "Opis zgłoszenia");

        mockMvc.perform(post(BASE_URL)
                .with(jwt().jwt(j -> j.claim("tenant_id", TENANT_A)))
                .contentType(MediaType.APPLICATION_JSON).content(payload));

        String notePayload = objectMapper.writeValueAsString(Map.of("text", "Dodatkowa notatka"));

        mockMvc.perform(post(BASE_URL + "/EXT-041/note")
                        .with(jwt().jwt(j -> j.claim("tenant_id", TENANT_A)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(notePayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.text", is("Dodatkowa notatka")))
                .andExpect(jsonPath("$.date", notNullValue()));
    }

    @Test
    void shouldReturnBadRequest_whenRequestBodyIsInvalid() throws Exception {
        String invalidPayload = objectMapper.writeValueAsString(Map.of(
                "externalId", "EXT-051",
                "serviceId", 100,
                "description", "Opis",
                "status", "invalid_status",
                "note", "Notatka"
        ));

        mockMvc.perform(post(BASE_URL)
                        .with(jwt().jwt(j -> j.claim("tenant_id", TENANT_A)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldIsolateTenants_tenantBCannotSeeTenantATickets() throws Exception {
        String payload = createRequestPayload("EXT-061", 100L, "Izolacja tenant");

        mockMvc.perform(post(BASE_URL)
                .with(jwt().jwt(j -> j.claim("tenant_id", TENANT_A)))
                .contentType(MediaType.APPLICATION_JSON).content(payload));

        mockMvc.perform(get(BASE_URL + "/EXT-061")
                        .with(jwt().jwt(j -> j.claim("tenant_id", TENANT_B))))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldIsolateTenants_listReturnsOnlyOwnTickets() throws Exception {
        mockMvc.perform(post(BASE_URL)
                .with(jwt().jwt(j -> j.claim("tenant_id", TENANT_A)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(createRequestPayload("EXT-071", 100L, "Tenant A")));
        mockMvc.perform(post(BASE_URL)
                .with(jwt().jwt(j -> j.claim("tenant_id", TENANT_B)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(createRequestPayload("EXT-072", 100L, "Tenant B")));

        mockMvc.perform(get(BASE_URL)
                        .with(jwt().jwt(j -> j.claim("tenant_id", TENANT_A))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].externalId", is("EXT-071")));
    }

    @Test
    void shouldResolveStatus_evenServiceIdReturnsAcknowledged() throws Exception {
        String payload = createRequestPayload("EXT-081", 100L, "Parzyste serviceId");

        mockMvc.perform(post(BASE_URL)
                        .with(jwt().jwt(j -> j.claim("tenant_id", TENANT_A)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("acknowledged")));
    }

    @Test
    void shouldResolveStatus_oddServiceIdReturnsRejected() throws Exception {
        String payload = createRequestPayload("EXT-091", 101L, "Nieparzyste serviceId");

        mockMvc.perform(post(BASE_URL)
                        .with(jwt().jwt(j -> j.claim("tenant_id", TENANT_A)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("rejected")));
    }

    private String createRequestPayload(String externalId, long serviceId, String description) {
        return """
                {
                  "externalId": "%s",
                  "serviceId": %d,
                  "description": "%s",
                  "status": "new",
                  "note": "Zgłoszenie z testu integracyjnego."
                }
                """.formatted(externalId, serviceId, description);
    }
}
