package pl.netia.tests.ttapi.exception;

public class TroubleTicketNotFoundException extends RuntimeException {

    public TroubleTicketNotFoundException(String externalId) {
        super("Zgłoszenie nie istnieje albo nie jest widoczne w tenant scope: " + externalId);
    }
}
