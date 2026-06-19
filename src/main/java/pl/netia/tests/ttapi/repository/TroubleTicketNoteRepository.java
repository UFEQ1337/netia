package pl.netia.tests.ttapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.netia.tests.ttapi.entity.TroubleTicketNoteEntity;
import pl.netia.tests.ttapi.entity.TroubleTicketNoteId;

public interface TroubleTicketNoteRepository extends JpaRepository<TroubleTicketNoteEntity, TroubleTicketNoteId> {
}
