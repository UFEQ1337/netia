package pl.netia.tests.ttapi.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "trouble_ticket_note")
@IdClass(TroubleTicketNoteId.class)
public class TroubleTicketNoteEntity {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Id
    @Column(name = "tenant_id", updatable = false, nullable = false)
    private String tenantId;

    @Column(name = "trouble_ticket_id", updatable = false, nullable = false)
    private UUID troubleTicketId;

    @Column(name = "note", nullable = false)
    private String note;

    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public UUID getTroubleTicketId() {
        return troubleTicketId;
    }

    public void setTroubleTicketId(UUID troubleTicketId) {
        this.troubleTicketId = troubleTicketId;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
