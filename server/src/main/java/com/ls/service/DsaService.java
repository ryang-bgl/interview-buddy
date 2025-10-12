package com.ls.service;

import com.ls.dto.CreateUserDsaQuestionDto;
import com.ls.dto.UserDsaQuestionDto;
import com.ls.repository.DsaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DsaService {

    private final DsaRepository dsaRepository;

    @Autowired
    public DsaService(DsaRepository dsaRepository) {
        this.dsaRepository = dsaRepository;
    }

    @Transactional
    public UserDsaQuestionDto saveUserQuestion(CreateUserDsaQuestionDto request) {
        return dsaRepository.saveUserQuestion(request);
    }
}
