package com.ls.config;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataDirectoryConfig {

    private static final Logger log = LoggerFactory.getLogger(DataDirectoryConfig.class);
    private static final Path DATA_DIRECTORY = Path.of("data");

    @PostConstruct
    public void ensureDataDirectoryExists() {
        try {
            Files.createDirectories(DATA_DIRECTORY);
        } catch (IOException e) {
            log.error("Failed to create data directory at {}", DATA_DIRECTORY.toAbsolutePath(), e);
            throw new IllegalStateException("Unable to create SQLite data directory", e);
        }
    }
}
