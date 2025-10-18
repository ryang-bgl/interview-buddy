package com.ls.controller;

import com.ls.dto.CreateUserDsaQuestionDto;
import com.ls.dto.UserDsaQuestionDto;
import com.ls.service.DsaService;
import jakarta.validation.Valid;
import org.springframework.stereotype.Controller;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;

@Controller
@RequestMapping("/api/dsa")
public class DsaController {

    private final DsaService dsaService;

    public DsaController(DsaService dsaService) {
        this.dsaService = dsaService;
    }

    @PostMapping("/questions")
    @ResponseBody
    @ResponseStatus(HttpStatus.CREATED)
    public UserDsaQuestionDto createUserQuestion(
        @Valid @RequestBody CreateUserDsaQuestionDto request
    ) {
        return dsaService.saveOrUpdateUserQuestion(request);
    }
}
