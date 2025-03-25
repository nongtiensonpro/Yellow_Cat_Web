package org.yellowcat.backend.vnpay.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "vnpay")
public class VNPayConfig {
    private String payUrl;
    private String apiUrl;
    private String tmnCode;
    private String hashSecret;
    private String version;
    private String command;

    public VNPayConfig() {
    }

    public VNPayConfig(String payUrl, String apiUrl, String tmnCode, String hashSecret, String version, String command) {
        this.payUrl = payUrl;
        this.apiUrl = apiUrl;
        this.tmnCode = tmnCode;
        this.hashSecret = hashSecret;
        this.version = version;
        this.command = command;
    }

    public String getPayUrl() {
        return payUrl;
    }

    public void setPayUrl(String payUrl) {
        this.payUrl = payUrl;
    }

    public String getApiUrl() {
        return apiUrl;
    }

    public void setApiUrl(String apiUrl) {
        this.apiUrl = apiUrl;
    }

    public String getTmnCode() {
        return tmnCode;
    }

    public void setTmnCode(String tmnCode) {
        this.tmnCode = tmnCode;
    }

    public String getHashSecret() {
        return hashSecret;
    }

    public void setHashSecret(String hashSecret) {
        this.hashSecret = hashSecret;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getCommand() {
        return command;
    }

    public void setCommand(String command) {
        this.command = command;
    }
}