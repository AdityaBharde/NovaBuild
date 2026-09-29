package com.aditya.intelligentservice.consumer;

import com.aditya.commonlib.enums.ChatEventStatus;
import com.aditya.commonlib.event.FileStoreResponseEvent;
import com.aditya.intelligentservice.repository.ChatEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class IntelligenceSagaResponseHandler {

    private final ChatEventRepository chatEventRepository;

    @Transactional
    @KafkaListener(topics = "file-store-responses", groupId = "intelligence-group")
    public void handleSagaResponse(FileStoreResponseEvent response) {

        chatEventRepository.findBySagaId(response.sagaId()).ifPresent(event -> {

            if (!ChatEventStatus.PENDING.equals(event.getStatus())) { //Idempotency
                log.info("Response for Saga {} already handled. Skipping.", response.sagaId());
                return;
            }

            if (response.success()) {
                event.setStatus(ChatEventStatus.CONFIRMED);
                log.info("Saga {} CONFIRMED", response.sagaId());
            } else {
                log.warn("Saga {} FAILED. Deleting event.", response.sagaId());
                event.setStatus(ChatEventStatus.FAILED);
            }
        });
    }
}