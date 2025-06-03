package org.yellowcat.backend.product.size;

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
import org.yellowcat.backend.product.size.dto.SizeCreateDto;
import org.yellowcat.backend.product.size.dto.SizeRequestDto;
import org.yellowcat.backend.product.size.dto.SizeResponse;
import org.yellowcat.backend.product.size.mapper.SizeMapper;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SizeService {
    SizeRepository sizeRepository;
    SizeMapper sizeMapper;
    SimpMessagingTemplate messagingTemplate;

    public Page<SizeResponse> getAllSize(int page, int size) {
        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Size> categories = sizeRepository.findAll(pageable);
        return categories.map(sizeMapper::toResponse);
    }

    public SizeResponse getSizeById(Integer id) {
        Size size = sizeRepository.findById(id).orElse(null);
        return sizeMapper.toResponse(size);
    }

    public boolean deleteSize(Integer id) {
        if (sizeRepository.existsById(id)) {
            messagingTemplate.convertAndSend("/topic/sizes", new EntityMessage("Size deleted: ", getSizeById(id)));
            sizeRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public SizeResponse addSize(SizeCreateDto request) {
        Size size = sizeMapper.toEntity(request);
        Size savedSize = sizeRepository.save(size);
        messagingTemplate.convertAndSend("/topic/sizes", new EntityMessage("add", sizeMapper.toResponse(savedSize)));
        return sizeMapper.toResponse(savedSize);
    }

    public SizeResponse updateSize(Integer id, SizeRequestDto request) {
        Size size = sizeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Size not found with id: " + request.getId()));

        sizeMapper.updateSize(size, request);
        sizeRepository.save(size);
        messagingTemplate.convertAndSend("/topic/sizes", new EntityMessage("Size updated: ", size));
        return sizeMapper.toResponse(size);
    }
}