package org.yellowcat.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI yellowCatOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Yellow Cat Web API")
                        .description("Tài liệu API cho ứng dụng Yellow Cat Web")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Yellow Cat Team")
                                .email("nongtiensonpro@gmail.com")))
                .components(new Components()
                        .addSecuritySchemes("bearer-jwt",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Nhập JWT token của bạn")));
    }
}