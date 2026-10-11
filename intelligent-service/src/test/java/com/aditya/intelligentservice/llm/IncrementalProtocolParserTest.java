package com.aditya.intelligentservice.llm;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class IncrementalProtocolParserTest {

    @Test
    void testSplitsAcrossChunksAndNoRawProtocolMarkupLeak() {
        List<String> statuses = new ArrayList<>();
        List<String> textDeltas = new ArrayList<>();
        List<String> filesGenerated = new ArrayList<>();
        List<String> fileContents = new ArrayList<>();
        List<String> tools = new ArrayList<>();

        IncrementalProtocolParser.ProtocolEventListener listener = new IncrementalProtocolParser.ProtocolEventListener() {
            @Override
            public void onStatus(String status) {
                statuses.add(status);
            }

            @Override
            public void onToolCall(String toolName, String rawArgs, String body) {
                tools.add(toolName);
            }

            @Override
            public void onFileGenerating(String path) {
                statuses.add("Generating " + path);
            }

            @Override
            public void onFileCompleted(String path, String content) {
                filesGenerated.add(path);
                fileContents.add(content);
            }

            @Override
            public void onTextDelta(String text) {
                textDeltas.add(text);
            }

            @Override
            public void onError(String error) {
            }
        };

        IncrementalProtocolParser parser = new IncrementalProtocolParser(listener);

        // Feed chunks that split tags across boundaries
        parser.processChunk("<mess");
        parser.processChunk("age phase=\"plan");
        parser.processChunk("ning\">I will create index.html</mes");
        parser.processChunk("sage>\n");

        parser.processChunk("<fi");
        parser.processChunk("le path=\"ind");
        parser.processChunk("ex.html\">\n");
        parser.processChunk("<!DOCTYPE html>\n<html>\n<head><title>Test</title></head>\n");
        parser.processChunk("<body><div><button>Click</button></div></body>\n</html>\n");
        parser.processChunk("</fi");
        parser.processChunk("le>\n");

        parser.processChunk("<mess");
        parser.processChunk("age phase=\"completed\">");
        parser.processChunk("Successfully created ");
        parser.processChunk("the HTML page.");
        parser.processChunk("</message>");

        parser.finish();

        // 1. Verify no raw protocol wrappers leaked into text deltas
        String combinedText = String.join("", textDeltas);
        assertFalse(combinedText.contains("<message"), "Raw <message> tag leaked to user text");
        assertFalse(combinedText.contains("</message>"), "Raw </message> tag leaked to user text");
        assertFalse(combinedText.contains("<file"), "Raw <file> tag leaked to user text");
        assertFalse(combinedText.contains("</file>"), "Raw </file> tag leaked to user text");
        assertFalse(combinedText.contains("<tool"), "Raw <tool> tag leaked to user text");
        assertEquals("Successfully created the HTML page.", combinedText.trim());

        // 2. Verify file was generated properly with complete HTML inside
        assertEquals(1, filesGenerated.size());
        assertEquals("index.html", filesGenerated.get(0));
        assertTrue(fileContents.get(0).contains("<!DOCTYPE html>"));
        assertTrue(fileContents.get(0).contains("<button>Click</button>"));

        // 3. Verify planning status was captured
        assertTrue(statuses.stream().anyMatch(s -> s.contains("Planning: I will create index.html")));
    }

    @Test
    void testToolCallParsedAcrossChunks() {
        List<String> tools = new ArrayList<>();
        List<String> argsList = new ArrayList<>();

        IncrementalProtocolParser parser = new IncrementalProtocolParser(new IncrementalProtocolParser.ProtocolEventListener() {
            @Override
            public void onStatus(String status) {}

            @Override
            public void onToolCall(String toolName, String rawArgs, String body) {
                tools.add(toolName);
                argsList.add(rawArgs);
            }

            @Override
            public void onFileGenerating(String path) {}

            @Override
            public void onFileCompleted(String path, String content) {}

            @Override
            public void onTextDelta(String text) {}

            @Override
            public void onError(String error) {}
        });

        parser.processChunk("<to");
        parser.processChunk("ol name=\"readProject");
        parser.processChunk("Structure\" args=\"src\">");
        parser.processChunk("</to");
        parser.processChunk("ol>");
        parser.finish();

        assertEquals(1, tools.size());
        assertEquals("readProjectStructure", tools.get(0));
        assertEquals("src", argsList.get(0));
    }

    @Test
    void testSelfClosingToolAndSingleQuotes() {
        List<String> tools = new ArrayList<>();
        List<String> argsList = new ArrayList<>();
        List<String> files = new ArrayList<>();

        IncrementalProtocolParser parser = new IncrementalProtocolParser(new IncrementalProtocolParser.ProtocolEventListener() {
            @Override
            public void onStatus(String status) {}

            @Override
            public void onToolCall(String toolName, String rawArgs, String body) {
                tools.add(toolName);
                argsList.add(rawArgs);
            }

            @Override
            public void onFileGenerating(String path) {}

            @Override
            public void onFileCompleted(String path, String content) {
                files.add(path);
            }

            @Override
            public void onTextDelta(String text) {}

            @Override
            public void onError(String error) {}
        });

        // Test self-closing tool with single quotes
        parser.processChunk("<tool name='readProjectStructure' args='{\"path\":\"src\"}' />\n");
        assertEquals(1, tools.size());
        assertEquals("readProjectStructure", tools.get(0));
        assertEquals("{\"path\":\"src\"}", argsList.get(0));

        // Test file with single quotes
        parser.processChunk("<file path='index.html'><h1>Hello</h1></file>");
        parser.finish();
        assertEquals(1, files.size());
        assertEquals("index.html", files.get(0));
    }
}
