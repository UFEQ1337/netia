package pl.netia.tests.ttapi.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class TroubleTicketNoteId implements Serializable {

    private String tenantId;
    private UUID id;

    public TroubleTicketNoteId() {}

    public TroubleTicketNoteId(String tenantId, UUID id) {
        this.tenantId = tenantId;
        this.id = id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public UUID getId() {
        return id;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TroubleTicketNoteId that)) return false;
        return Objects.equals(tenantId, that.tenantId) && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(tenantId, id);
    }
}
