package org.yellowcat.backend.product.color;

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
import org.yellowcat.backend.product.color.dto.ColorCreateDto;
import org.yellowcat.backend.product.color.dto.ColorRequestDto;
import org.yellowcat.backend.product.color.dto.ColorResponse;
import org.yellowcat.backend.product.color.mapper.ColorMapper;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.product.productvariant.ProductVariantRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ColorService {
    ColorRepository colorRepository;
    ProductVariantRepository productVariantRepository;
    ColorMapper colorMapper;
    SimpMessagingTemplate messagingTemplate;

    public Page<ColorResponse> getAllColors(int page, int size) {
        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Color> categories = colorRepository.findAll(pageable);
        return categories.map(colorMapper::toResponse);
    }

    public ColorResponse getColorById(Integer id) {
        Color color = colorRepository.findById(id).orElse(null);
        return colorMapper.toResponse(color);
    }

    public boolean deleteColor(Integer id) {
        if (colorRepository.existsById(id)) {
            Color color = colorRepository.findById(id).orElse(null);
            List<ProductVariant> productVariants = productVariantRepository.findByColorId(id);
            if (!productVariants.isEmpty() && color != null) {
                color.setStatus(false);
                colorRepository.save(color);

                return false;
            }
            messagingTemplate.convertAndSend("/topic/colors", new EntityMessage("Color deleted: ", getColorById(id)));
            colorRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public ColorResponse addColor(ColorCreateDto request) {
        Color color = colorMapper.toEntity(request);
        Color savedColor = colorRepository.save(color);
        messagingTemplate.convertAndSend("/topic/colors", new EntityMessage("add", colorMapper.toResponse(savedColor)));
        return colorMapper.toResponse(savedColor);
    }

    public ColorResponse updateColor(Integer id, ColorRequestDto request) {
        Color color = colorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Color not found with id: " + request.getId()));

        colorMapper.updateColor(color, request);
        colorRepository.save(color);
        messagingTemplate.convertAndSend("/topic/colors", new EntityMessage("Color updated: ", color));
        return colorMapper.toResponse(color);
    }

    public boolean updateStatus(Integer id) {
        if (colorRepository.existsById(id)) {
            Color color = colorRepository.findById(id).orElse(null);
            if (color != null) {
                color.setStatus(!color.getStatus());
                colorRepository.save(color);

                return true;
            }
        }
        return false;
    }
}