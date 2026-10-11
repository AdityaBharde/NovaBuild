package com.aditya.intelligentservice.llm;

import com.aditya.commonlib.dto.FileNode;
import com.aditya.commonlib.dto.FileTreeDto;
import com.aditya.intelligentservice.client.WorkspaceClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class ToolRegistryTest {

    private WorkspaceClient workspaceClient;
    private CodeGenerationTools codeGenerationTools;
    private ToolRegistry toolRegistry;

    @BeforeEach
    void setUp() {
        workspaceClient = mock(WorkspaceClient.class);
        codeGenerationTools = new CodeGenerationTools(workspaceClient);
        toolRegistry = new ToolRegistry(codeGenerationTools);
    }

    @Test
    void testReadProjectStructureEmpty() {
        when(workspaceClient.getFileTree(1L)).thenReturn(new FileTreeDto(List.of()));

        ToolRegistry.ToolExecutionResult result = toolRegistry.executeTool(
                1L, "readProjectStructure", "", ""
        );

        assertTrue(result.success());
        assertTrue(result.result().contains("No files exist yet"));
        verify(workspaceClient, times(1)).getFileTree(1L);
    }

    @Test
    void testReadProjectStructureWithFiles() {
        when(workspaceClient.getFileTree(1L)).thenReturn(
                new FileTreeDto(List.of(new FileNode("index.html"), new FileNode("src/App.tsx")))
        );

        ToolRegistry.ToolExecutionResult result = toolRegistry.executeTool(
                1L, "readProjectStructure", "src", ""
        );

        assertTrue(result.success());
        assertTrue(result.result().contains("index.html"));
        assertTrue(result.result().contains("src/App.tsx"));
    }

    @Test
    void testReadFiles() {
        when(workspaceClient.getFileContent(1L, "index.html")).thenReturn("<h1>Hello</h1>");

        ToolRegistry.ToolExecutionResult result = toolRegistry.executeTool(
                1L, "readFiles", "index.html", ""
        );

        assertTrue(result.success());
        assertTrue(result.result().contains("<h1>Hello</h1>"));
        verify(workspaceClient, times(1)).getFileContent(1L, "index.html");
    }

    @Test
    void testSaveFile() {
        doNothing().when(workspaceClient).saveFile(1L, "index.html", "<h1>Hello</h1>");

        ToolRegistry.ToolExecutionResult result = toolRegistry.executeTool(
                1L, "saveFile", "{\"path\":\"index.html\"}", "<h1>Hello</h1>"
        );

        assertTrue(result.success());
        assertTrue(result.result().contains("successfully saved"));
        verify(workspaceClient, times(1)).saveFile(1L, "index.html", "<h1>Hello</h1>");
    }

    @Test
    void testPathTraversalRejected() {
        ToolRegistry.ToolExecutionResult result = toolRegistry.executeTool(
                1L, "saveFile", "{\"path\":\"../../etc/passwd\"}", "evil"
        );

        assertFalse(result.success());
        verify(workspaceClient, never()).saveFile(anyLong(), anyString(), anyString());
    }
}
