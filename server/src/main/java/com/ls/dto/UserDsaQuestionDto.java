package com.ls.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record UserDsaQuestionDto(
    Long id,
    String userId,
    String title,
    String titleSlug,
    String difficulty,
    @JsonProperty("isPaidOnly") boolean paidOnly,
    String description,
    String solution,
    String idealSolutionCode,
    String note,
    String exampleTestcases
) {
}
