package com.ib.service;

import com.ib.dto.CreateUserDsaQuestionDto;
import com.ib.dto.UserDsaQuestionDto;
import com.ib.repository.DsaRepository;
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
