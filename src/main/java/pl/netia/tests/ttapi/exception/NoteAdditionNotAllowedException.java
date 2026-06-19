package pl.netia.tests.ttapi.exception;

/**
 * Rzucany gdy próba dodania notatki dotyczy zgłoszenia w statusie
 * uniemożliwiającym tę operację (resolved, closed, rejected).
 */
public class NoteAdditionNotAllowedException extends RuntimeException {

    public NoteAdditionNotAllowedException(String ticketStatus) {
        super("Dodanie notatki nie jest dozwolone dla zgłoszenia w statusie: " + ticketStatus);
    }
}
