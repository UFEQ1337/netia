package pl.netia.tests.ttapi.exception;

public class InvalidStatusTransitionException extends RuntimeException {

    public InvalidStatusTransitionException(String from, String to) {
        super("Niedozwolone przejście statusu: " + from + " -> " + to);
    }
}
