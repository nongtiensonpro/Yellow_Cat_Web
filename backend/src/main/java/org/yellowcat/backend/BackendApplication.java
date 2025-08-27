package org.yellowcat.backend;

import org.flywaydb.core.Flyway;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
public class BackendApplication {

    public static void main(String[] args) {
        Flyway.configure()
                .dataSource("jdbc:postgresql://localhost:5432/", "postgres", "changemeinprod")
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .load()
                .repair();
        SpringApplication.run(BackendApplication.class, args);
    }

}
