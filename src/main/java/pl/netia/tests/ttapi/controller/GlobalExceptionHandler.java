package pl.netia.tests.ttapi.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import pl.netia.tests.ttapi.exception.InvalidStatusTransitionException;
import pl.netia.tests.ttapi.exception.NoteAdditionNotAllowedException;
import pl.netia.tests.ttapi.exception.TroubleTicketNotFoundException;
import pl.netia.tests.ttapi.model.ErrorDto;

import java.util.UUID;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private static final String HEADER_REQUEST_ID = "X-Request-ID";

    @ExceptionHandler(TroubleTicketNotFoundException.class)
    public ResponseEntity<ErrorDto> handleNotFound(TroubleTicketNotFoundException ex,
                                                    HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(errorDto("TROUBLE_TICKET_NOT_FOUND", ex.getMessage(), resolveRequestId(request)));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorDto> handleNoResourceFound(NoResourceFoundException ex,
                                                           HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(errorDto("NOT_FOUND", "Zasób nie istnieje: " + request.getRequestURI(), resolveRequestId(request)));
    }

    @ExceptionHandler(InvalidStatusTransitionException.class)
    public ResponseEntity<ErrorDto> handleInvalidStatusTransition(InvalidStatusTransitionException ex,
                                                                   HttpServletRequest request) {
        return ResponseEntity.badRequest()
                .body(errorDto("STATUS_TRANSITION_ERROR", ex.getMessage(), resolveRequestId(request)));
    }

    @ExceptionHandler(NoteAdditionNotAllowedException.class)
    public ResponseEntity<ErrorDto> handleNoteAdditionNotAllowed(NoteAdditionNotAllowedException ex,
                                                                  HttpServletRequest request) {
        return ResponseEntity.badRequest()
                .body(errorDto("NOTE_ADDITION_NOT_ALLOWED", ex.getMessage(), resolveRequestId(request)));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorDto> handleValidation(MethodArgumentNotValidException ex,
                                                      HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest()
                .body(errorDto("VALIDATION_ERROR", message, resolveRequestId(request)));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorDto> handleMessageNotReadable(HttpMessageNotReadableException ex,
                                                              HttpServletRequest request) {
        return ResponseEntity.badRequest()
                .body(errorDto("VALIDATION_ERROR", "Nieprawidłowy format żądania", resolveRequestId(request)));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorDto> handleAccessDenied(AccessDeniedException ex,
                                                        HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(errorDto("FORBIDDEN", ex.getMessage(), resolveRequestId(request)));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorDto> handleUnexpected(Exception ex, HttpServletRequest request) {
        String requestId = resolveRequestId(request);
        log.error("Nieoczekiwany błąd [requestId={}] {} {}: {}",
                requestId,
                request.getMethod(),
                request.getRequestURI(),
                ex.getMessage(),
                ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorDto("INTERNAL_ERROR", "Wystąpił nieoczekiwany błąd", requestId));
    }

    private ErrorDto errorDto(String code, String message, String requestId) {
        ErrorDto dto = new ErrorDto(code, message);
        dto.setRequestId(requestId);
        return dto;
    }

    private String resolveRequestId(HttpServletRequest request) {
        String header = request.getHeader(HEADER_REQUEST_ID);
        return (header != null && !header.isBlank()) ? header : UUID.randomUUID().toString();
    }
}
