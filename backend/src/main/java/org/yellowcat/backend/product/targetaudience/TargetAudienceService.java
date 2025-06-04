package org.yellowcat.backend.product.targetaudience;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.common.websocket.EntityMessage;
import org.yellowcat.backend.product.targetaudience.dto.TargetAudienceCreateDto;
import org.yellowcat.backend.product.targetaudience.dto.TargetAudienceRequestDto;
import org.yellowcat.backend.product.targetaudience.dto.TargetAudienceResponse;
import org.yellowcat.backend.product.targetaudience.mapper.TargetAudienceMapper;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TargetAudienceService {
    TargetAudienceRepository targetAudienceRepository;
    TargetAudienceMapper targetAudienceMapper;
    SimpMessagingTemplate messagingTemplate;

    public Page<TargetAudienceResponse> getAllTargetAudience(int page, int size) {
        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<TargetAudience> categories = targetAudienceRepository.findAll(pageable);
        return categories.map(targetAudienceMapper::toResponse);
    }

    public TargetAudienceResponse getTargetAudienceById(Integer id) {
        TargetAudience targetAudience = targetAudienceRepository.findById(id).orElse(null);
        return targetAudienceMapper.toResponse(targetAudience);
    }

    public boolean deleteTargetAudience(Integer id) {
        if (targetAudienceRepository.existsById(id)) {
            messagingTemplate.convertAndSend("/topic/target_audiences", new EntityMessage("TargetAudience deleted: ", getTargetAudienceById(id)));
            targetAudienceRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public TargetAudienceResponse addTargetAudience(TargetAudienceCreateDto request) {
        TargetAudience targetAudience = targetAudienceMapper.toEntity(request);
        TargetAudience savedTargetAudience = targetAudienceRepository.save(targetAudience);
        messagingTemplate.convertAndSend("/topic/target_audiences", new EntityMessage("add", targetAudienceMapper.toResponse(savedTargetAudience)));
        return targetAudienceMapper.toResponse(savedTargetAudience);
    }

    public TargetAudienceResponse updateTargetAudience(Integer id, TargetAudienceRequestDto request) {
        TargetAudience targetAudience = targetAudienceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("TargetAudience not found with id: " + request.getId()));

        targetAudienceMapper.updateTargetAudience(targetAudience, request);
        targetAudienceRepository.save(targetAudience);
        messagingTemplate.convertAndSend("/topic/target_audiences", new EntityMessage("TargetAudience updated: ", targetAudience));
        return targetAudienceMapper.toResponse(targetAudience);
    }
}