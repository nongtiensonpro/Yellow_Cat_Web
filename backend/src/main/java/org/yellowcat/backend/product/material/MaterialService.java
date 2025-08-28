package org.yellowcat.backend.product.material;

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
import org.yellowcat.backend.product.Product;
import org.yellowcat.backend.product.ProductRepository;
import org.yellowcat.backend.product.material.dto.MaterialCreateDto;
import org.yellowcat.backend.product.material.dto.MaterialRequestDto;
import org.yellowcat.backend.product.material.dto.MaterialResponse;
import org.yellowcat.backend.product.material.mapper.MaterialMapper;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MaterialService {
    MaterialRepository materialRepository;
    ProductRepository productRepository;
    MaterialMapper materialMapper;
    SimpMessagingTemplate messagingTemplate;

    public Page<MaterialResponse> getAllMaterials(int page, int size) {
        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Material> categories = materialRepository.findAll(pageable);
        return categories.map(materialMapper::toResponse);
    }

    public MaterialResponse getMaterialById(Integer id) {
        Material material = materialRepository.findById(id).orElse(null);
        return materialMapper.toResponse(material);
    }

    public boolean deleteMaterial(Integer id) {
        if (materialRepository.existsById(id)) {
            Material material = materialRepository.findById(id).orElse(null);
            List<Product> products = productRepository.findByMaterialId(id);
            if (!products.isEmpty() && material != null) {
                material.setStatus(false);
                materialRepository.save(material);

                return false;
            }
            messagingTemplate.convertAndSend("/topic/materials", new EntityMessage("Material deleted: ", getMaterialById(id)));
            materialRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public MaterialResponse addMaterial(MaterialCreateDto request) {
        Material material = materialMapper.toEntity(request);
        Material savedMaterial = materialRepository.save(material);
        messagingTemplate.convertAndSend("/topic/materials", new EntityMessage("add", materialMapper.toResponse(savedMaterial)));
        return materialMapper.toResponse(savedMaterial);
    }

    public MaterialResponse updateMaterial(Integer id, MaterialRequestDto request) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Material not found with id: " + request.getId()));

        materialMapper.updateMaterial(material, request);
        materialRepository.save(material);
        messagingTemplate.convertAndSend("/topic/materials", new EntityMessage("Material updated: ", material));
        return materialMapper.toResponse(material);
    }

    public boolean updateStatus(Integer id) {
        if (materialRepository.existsById(id)) {
            Material material = materialRepository.findById(id).orElse(null);
            if (material != null) {
                material.setStatus(!material.getStatus());
                materialRepository.save(material);

                return true;
            }
        }
        return false;
    }
}