package org.yellowcat.backend.config;

public record LinkDTO(String rel, String href) {
    // No additional methods needed as records automatically provide
    // constructor, getters, equals, hashCode, and toString
}