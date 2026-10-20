package com.aditya.apigateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "jwt.secretKey=test-only-secret-key-for-context-load-123456"
})
class ApiGatewayApplicationTests {

    @Test
    void contextLoads() {
    }

}
