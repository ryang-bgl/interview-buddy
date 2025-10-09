package com.litdeck.backend.capture;

import static org.junit.jupiter.api.Assertions.fail;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CaptureApiContractTest {

    @Test
    @DisplayName("POST /api/v1/captures enforces contract and validation rules")
    void saveCapture_contract() {
        fail("Contract test not implemented yet – add MockMvc scenario matching capture-openapi.yaml");
    }

    @Test
    @DisplayName("Duplicate capture returns 200 with duplicate status")
    void duplicateCapture_contract() {
        fail("Contract test not implemented yet – expect duplicate response body with reauthenticate=false");
    }

    @Test
    @DisplayName("Invalid API key returns 401 with reauthenticate prompt")
    void invalidApiKey_contract() {
        fail("Contract test not implemented yet – expect AuthErrorResponse schema");
    }
}
