package org.yellowcat.backend.product.attribute;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.common.websocket.EntityMessage;
import org.yellowcat.backend.product.attribute.dto.AttributesCreateDto;
import org.yellowcat.backend.product.attribute.dto.AttributesDto;

@Service
public class AttriburesService {

    private final AttributesRepository attributeRepository;
    private final SimpMessagingTemplate messagingTemplate;
    public AttriburesService(AttributesRepository attributeRepository, SimpMessagingTemplate messagingTemplate) {
        this.attributeRepository = attributeRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public AttributesDto findById(Integer id) {
        return attributeRepository.findById(id).map(AttributesDto::new).orElse(null);
    }

    public Page<AttributesDto> findAll(Pageable pageable) {
        Page<Attributes> attributesPage = attributeRepository.findAll(pageable);
        return attributesPage.map(AttributesDto::new);
    }

    public AttributesDto save(AttributesCreateDto attributesCreateDto) {
        Attributes attributes = new Attributes(null, attributesCreateDto.getAttributeName(), attributesCreateDto.getDataType());
        messagingTemplate.convertAndSend("/topic/attributes", new EntityMessage("add",attributes));
        return new AttributesDto(attributeRepository.save(attributes));
    }

    public AttributesDto update(AttributesDto attributesDto){
        Attributes attributes = attributeRepository.findById(attributesDto.getId()).orElse(null);
        if(attributes!= null){
            attributes.setAttributeName(attributesDto.getAttributeName());
            attributes.setDataType(attributesDto.getDataType());
            messagingTemplate.convertAndSend("/topic/attributes", new EntityMessage("update",attributes));
            return new AttributesDto(attributeRepository.save(attributes));
        }
        return null;
    }

    public void deleteById(Integer id) {
        attributeRepository.deleteById(id);
        messagingTemplate.convertAndSend("/topic/attributes", new EntityMessage("delete", id));
    }
}
