package org.yellowcat.backend.product.attribute;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.product.attribute.dto.AttributesDto;

@Service
public class AttriburesService {

    private final AttributesRepository attributeRepository;

    public AttriburesService(AttributesRepository attributeRepository) {
        this.attributeRepository = attributeRepository;
    }

    public AttributesDto findById(Integer id) {
        return attributeRepository.findById(id).map(AttributesDto::new).orElse(null);
    }

    public Page<AttributesDto> findAll(Pageable pageable) {
        Page<Attributes> attributesPage = attributeRepository.findAll(pageable);
        return attributesPage.map(AttributesDto::new);
    }
}
