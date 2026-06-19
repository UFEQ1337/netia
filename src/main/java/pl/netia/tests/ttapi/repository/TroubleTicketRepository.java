package pl.netia.tests.ttapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.netia.tests.ttapi.entity.TroubleTicketEntity;
import pl.netia.tests.ttapi.entity.TroubleTicketId;

import java.util.List;
import java.util.Optional;

public interface TroubleTicketRepository extends JpaRepository<TroubleTicketEntity, TroubleTicketId> {

    Optional<TroubleTicketEntity> findByTenantIdAndExternalId(String tenantId, String externalId);

    List<TroubleTicketEntity> findByTenantId(String tenantId);
}
