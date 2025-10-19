package com.ls.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public record CreateUserDsaQuestionDto(
    @NotBlank String userId,
    @NotBlank String title,
    @NotBlank String titleSlug,
    @NotBlank String difficulty,
    @JsonProperty("isPaidOnly") boolean paidOnly,
    @NotBlank String description,
    String solution,
    String idealSolutionCode,
    String note,
    String exampleTestcases
) {
}
