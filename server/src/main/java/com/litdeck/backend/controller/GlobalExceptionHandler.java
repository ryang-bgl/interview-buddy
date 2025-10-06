package com.litdeck.backend.controller;

import com.litdeck.backend.dto.ErrorResponseDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handle ResponseStatusException (thrown by controllers)
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponseDto> handleResponseStatusException(
            ResponseStatusException ex, HttpServletRequest request) {

        String errorCode = mapStatusToErrorCode(ex.getStatusCode().value());

        ErrorResponseDto error = new ErrorResponseDto(
                errorCode,
                ex.getReason() != null ? ex.getReason() : "An error occurred",
                request.getRequestURI()
        );

        logger.warn("ResponseStatusException: {} - {} at {}",
                ex.getStatusCode(), ex.getReason(), request.getRequestURI());

        return ResponseEntity.status(ex.getStatusCode()).body(error);
    }

    /**
     * Handle validation errors for @Valid annotations
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDto> handleValidationExceptions(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        Map<String, String> validationErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            validationErrors.put(fieldName, errorMessage);
        });

        String errorMessage = validationErrors.entrySet().stream()
                .map(entry -> entry.getKey() + ": " + entry.getValue())
                .collect(Collectors.joining(", "));

        ErrorResponseDto error = new ErrorResponseDto(
                "validation_error",
                "Validation failed: " + errorMessage,
                request.getRequestURI()
        );

        logger.warn("Validation error: {} at {}", errorMessage, request.getRequestURI());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * Handle constraint violation exceptions
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponseDto> handleConstraintViolation(
            ConstraintViolationException ex, HttpServletRequest request) {

        String errorMessage = ex.getConstraintViolations().stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.joining(", "));

        ErrorResponseDto error = new ErrorResponseDto(
                "validation_error",
                "Constraint violation: " + errorMessage,
                request.getRequestURI()
        );

        logger.warn("Constraint violation: {} at {}", errorMessage, request.getRequestURI());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * Handle method argument type mismatch (e.g., invalid UUID format)
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponseDto> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {

        String errorMessage = String.format("Invalid value '%s' for parameter '%s'. Expected type: %s",
                ex.getValue(), ex.getName(), ex.getRequiredType().getSimpleName());

        ErrorResponseDto error = new ErrorResponseDto(
                "validation_error",
                errorMessage,
                request.getRequestURI()
        );

        logger.warn("Type mismatch error: {} at {}", errorMessage, request.getRequestURI());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * Handle IllegalArgumentException
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponseDto> handleIllegalArgument(
            IllegalArgumentException ex, HttpServletRequest request) {

        ErrorResponseDto error = new ErrorResponseDto(
                "validation_error",
                ex.getMessage() != null ? ex.getMessage() : "Invalid argument provided",
                request.getRequestURI()
        );

        logger.warn("IllegalArgumentException: {} at {}", ex.getMessage(), request.getRequestURI());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * Handle business logic exceptions that should result in conflict status
     */
    @ExceptionHandler(BusinessConflictException.class)
    public ResponseEntity<ErrorResponseDto> handleBusinessConflict(
            BusinessConflictException ex, HttpServletRequest request) {

        ErrorResponseDto error = new ErrorResponseDto(
                "conflict",
                ex.getMessage(),
                request.getRequestURI()
        );

        logger.warn("Business conflict: {} at {}", ex.getMessage(), request.getRequestURI());

        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    /**
     * Handle resource not found exceptions
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponseDto> handleResourceNotFound(
            ResourceNotFoundException ex, HttpServletRequest request) {

        ErrorResponseDto error = new ErrorResponseDto(
                "not_found",
                ex.getMessage(),
                request.getRequestURI()
        );

        logger.warn("Resource not found: {} at {}", ex.getMessage(), request.getRequestURI());

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    /**
     * Handle unauthorized access exceptions
     */
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponseDto> handleUnauthorized(
            UnauthorizedException ex, HttpServletRequest request) {

        ErrorResponseDto error = new ErrorResponseDto(
                "unauthorized",
                ex.getMessage(),
                request.getRequestURI()
        );

        logger.warn("Unauthorized access: {} at {}", ex.getMessage(), request.getRequestURI());

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    /**
     * Handle forbidden access exceptions
     */
    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ErrorResponseDto> handleForbidden(
            ForbiddenException ex, HttpServletRequest request) {

        ErrorResponseDto error = new ErrorResponseDto(
                "forbidden",
                ex.getMessage(),
                request.getRequestURI()
        );

        logger.warn("Forbidden access: {} at {}", ex.getMessage(), request.getRequestURI());

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    /**
     * Handle general exceptions (fallback)
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDto> handleGeneral(
            Exception ex, HttpServletRequest request) {

        ErrorResponseDto error = new ErrorResponseDto(
                "server_error",
                "An unexpected error occurred",
                request.getRequestURI()
        );

        logger.error("Unexpected error at {}: {}", request.getRequestURI(), ex.getMessage(), ex);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    /**
     * Map HTTP status codes to error codes
     */
    private String mapStatusToErrorCode(int statusCode) {
        return switch (statusCode) {
            case 400 -> "validation_error";
            case 401 -> "unauthorized";
            case 403 -> "forbidden";
            case 404 -> "not_found";
            case 409 -> "conflict";
            case 422 -> "unprocessable_entity";
            case 500 -> "server_error";
            case 502 -> "proxy_error";
            case 503 -> "service_unavailable";
            default -> "error";
        };
    }

    // Custom exception classes
    public static class BusinessConflictException extends RuntimeException {
        public BusinessConflictException(String message) {
            super(message);
        }
    }

    public static class ResourceNotFoundException extends RuntimeException {
        public ResourceNotFoundException(String message) {
            super(message);
        }
    }

    public static class UnauthorizedException extends RuntimeException {
        public UnauthorizedException(String message) {
            super(message);
        }
    }

    public static class ForbiddenException extends RuntimeException {
        public ForbiddenException(String message) {
            super(message);
        }
    }
}