package com.litdeck.backend.controller;

import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/proxy")
public class ProxyController {

    private static final String LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql/";

    /**
     * LeetCode GraphQL API proxy endpoint
     * POST /api/proxy/leetcode
     */
    @PostMapping("/leetcode")
    public String leetcodeProxy(@RequestBody String requestBody) {
        try {
            // Create connection to LeetCode GraphQL API
            URL url = new URL(LEETCODE_GRAPHQL_URL);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();

            // Set request method and properties
            connection.setRequestMethod("POST");
            connection.setDoOutput(true);
            connection.setDoInput(true);
            connection.setRequestProperty("Content-Type", "application/json");

            // Write request body
            try (OutputStream os = connection.getOutputStream();
                 OutputStreamWriter writer = new OutputStreamWriter(os, "UTF-8")) {
                writer.write(requestBody);
                writer.flush();
            }

            // Read and return response body
            InputStream inputStream;
            int responseCode = connection.getResponseCode();
            if (responseCode >= 200 && responseCode < 300) {
                inputStream = connection.getInputStream();
            } else {
                inputStream = connection.getErrorStream();
            }

            return readInputStream(inputStream);

        } catch (Exception e) {
            throw new RuntimeException("Error making proxy request: " + e.getMessage(), e);
        }
    }

    /**
     * Copy headers from the original request to the proxy request
     */
    private void copyRequestHeaders(HttpServletRequest request, HttpURLConnection connection) {
        java.util.Enumeration<String> headerNames = request.getHeaderNames();

        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            String headerValue = request.getHeader(headerName);

            // Skip certain headers that shouldn't be forwarded
            if (shouldForwardHeader(headerName)) {
                connection.setRequestProperty(headerName, headerValue);
            }
        }
    }

    /**
     * Copy headers from the proxy response to the client response
     */
    private void copyResponseHeaders(HttpURLConnection connection, HttpServletResponse response) {
        Map<String, List<String>> headers = connection.getHeaderFields();

        for (Map.Entry<String, List<String>> entry : headers.entrySet()) {
            String headerName = entry.getKey();
            List<String> headerValues = entry.getValue();

            if (headerName != null && headerValues != null && shouldForwardResponseHeader(headerName)) {
                for (String headerValue : headerValues) {
                    response.addHeader(headerName, headerValue);
                }
            }
        }
    }

    /**
     * Determine if a request header should be forwarded to the target server
     */
    private boolean shouldForwardHeader(String headerName) {
        if (headerName == null) {
            return false;
        }

        String lowerCaseHeaderName = headerName.toLowerCase();

        // Skip headers that are connection-specific or should be set by the proxy
        return !lowerCaseHeaderName.equals("host") &&
               !lowerCaseHeaderName.equals("connection") &&
               !lowerCaseHeaderName.equals("content-length") &&
               !lowerCaseHeaderName.equals("transfer-encoding") &&
               !lowerCaseHeaderName.equals("upgrade") &&
               !lowerCaseHeaderName.startsWith("proxy-");
    }

    /**
     * Determine if a response header should be forwarded to the client
     */
    private boolean shouldForwardResponseHeader(String headerName) {
        if (headerName == null) {
            return false;
        }

        String lowerCaseHeaderName = headerName.toLowerCase();

        // Skip headers that are connection-specific
        return !lowerCaseHeaderName.equals("connection") &&
               !lowerCaseHeaderName.equals("transfer-encoding") &&
               !lowerCaseHeaderName.equals("upgrade") &&
               !lowerCaseHeaderName.startsWith("proxy-");
    }

    /**
     * Read the entire content of an InputStream as a String
     */
    private String readInputStream(InputStream inputStream) throws IOException {
        if (inputStream == null) {
            return "";
        }

        StringBuilder result = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, "UTF-8"))) {
            String line;
            while ((line = reader.readLine()) != null) {
                result.append(line).append("\n");
            }
        }

        return result.toString();
    }
}