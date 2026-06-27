package com.quizgame.backend.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.messaging.converter.DefaultContentTypeResolver;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.converter.MessageConverter;
import org.springframework.util.MimeTypeUtils;

import java.util.List;
@Configuration
@EnableWebSocketMessageBroker

// @EnableWebSocket vs @EnableWebSocketMessageBroker:
//* */ @EnableWebSocket is used for simple WebSocket communication without the need for a message broker
//* */ @EnableWebSocketMessageBroker is used when you want to use a message broker (like RabbitMQ, ActiveMQ, 
//* */ or the simple in-memory broker) to handle messaging between clients and the server. 
//* */ It provides additional features like message routing, topic subscriptions, and more complex messaging patterns.
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws") //* declare websocket endpoint to connect to ws */
                .setAllowedOriginPatterns("*") //! Allows cross-origin requests must be restrict in production*/
                .withSockJS(); //*Enables SockJS fallback so clients that don’t support native WebSocket can use alternatives */
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app"); //* Message sent from client to destination with /app are routed to @MessageMapping methods on server controller*/
        registry.enableSimpleBroker("/topic"); //* Enables a simple in-memory message broker to carry messages back to the client on destinations prefixed with /topic */
    }
    private final ObjectMapper objectMapper;

    public WebSocketConfig(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean configureMessageConverters(List<MessageConverter> messageConverters) {
        DefaultContentTypeResolver resolver = new DefaultContentTypeResolver();
        resolver.setDefaultMimeType(MimeTypeUtils.APPLICATION_JSON);
        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        converter.setObjectMapper(objectMapper);
        converter.setContentTypeResolver(resolver);
        messageConverters.add(converter);
        return false;
    }
}
