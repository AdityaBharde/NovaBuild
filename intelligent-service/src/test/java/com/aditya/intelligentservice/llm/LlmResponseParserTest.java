package com.aditya.intelligentservice.llm;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class LlmResponseParserTest {

    private final LlmResponseParser parser = new LlmResponseParser();

    @Test
    void testExtractUserFacingMessageFromCompleted() {
        String fullResponse = """
                <message phase="planning">
                I will build an HTML page.
                </message>
                <file path="index.html">
                <html><body>Hello</body></html>
                </file>
                <message phase="completed">
                Created the HTML page with interactive features.
                </message>
                """;

        String clean = parser.extractUserFacingMessage(fullResponse);
        assertEquals("Created the HTML page with interactive features.", clean);
        assertFalse(clean.contains("<message"));
        assertFalse(clean.contains("<file"));
    }

    @Test
    void testExtractUserFacingMessageFromGeneralProse() {
        String fullResponse = """
                <message phase="planning">
                Planning steps...
                </message>
                <file path="index.html">
                <html></html>
                </file>
                Here is your landing page with hero and navbar.
                """;

        String clean = parser.extractUserFacingMessage(fullResponse);
        assertEquals("Here is your landing page with hero and navbar.", clean);
    }

    @Test
    void testInternalOnlyResponseReturnsEmptyString() {
        String fullResponse = """
                <message phase="planning">
                Planning steps...
                </message>
                <tool name="readProjectStructure">
                src
                </tool>
                """;

        String clean = parser.extractUserFacingMessage(fullResponse);
        assertEquals("", clean, "Should return empty string instead of false 'Completed task successfully.'");
    }
}
