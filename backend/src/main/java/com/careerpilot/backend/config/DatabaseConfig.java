package com.careerpilot.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    @Value("${spring.datasource.url:}")
    private String configuredUrl;

    @Value("${spring.datasource.username:}")
    private String configuredUsername;

    @Value("${spring.datasource.password:}")
    private String configuredPassword;

    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties properties) {
        String url = configuredUrl;
        if (url == null || url.isBlank()) {
            url = System.getenv("DATABASE_URL");
        }
        if (url == null || url.isBlank()) {
            url = "jdbc:postgresql://localhost:5432/careerpilot_db";
        }

        String username = configuredUsername;
        String password = configuredPassword;

        // Automatically convert postgres:// or postgresql:// to jdbc:postgresql://
        if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
            try {
                URI uri = new URI(url);
                String host = uri.getHost();
                int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                String path = uri.getPath();
                String userInfo = uri.getUserInfo();

                if (userInfo != null && (username == null || username.isBlank())) {
                    String[] parts = userInfo.split(":", 2);
                    username = parts[0];
                    if (parts.length > 1) {
                        password = parts[1];
                    }
                }

                String query = uri.getQuery() != null ? "?" + uri.getQuery() : "";
                url = "jdbc:postgresql://" + host + ":" + port + path + query;
            } catch (Exception ignored) {
                if (!url.startsWith("jdbc:")) {
                    url = "jdbc:" + url;
                }
            }
        }

        properties.setUrl(url);
        if (username != null && !username.isBlank()) {
            properties.setUsername(username);
        }
        if (password != null && !password.isBlank()) {
            properties.setPassword(password);
        }
        return properties.initializeDataSourceBuilder().build();
    }
}
