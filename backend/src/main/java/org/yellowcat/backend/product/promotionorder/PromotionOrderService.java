package org.yellowcat.backend.product.promotionorder;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.product.promotionorder.dto.PromotionOrderRequest;
import org.yellowcat.backend.product.promotionorder.dto.PromotionProgramDTO;
import org.yellowcat.backend.product.promotionorder.mapper.PromotionOrderMapper;
import org.yellowcat.backend.user.AppUser;

import java.util.Random;

@Service
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class PromotionOrderService {
    PromotionProgramRepository promotionProgramRepository;
    UsedPromotionRepository usedPromotionRepository;
    PromotionOrderMapper promotionOrderMapper;

    //Find all promotion programs
    public Page<PromotionProgramDTO> findAllPromotionPrograms(int page, int size) {
        Sort sort = Sort.by(Sort.Direction.DESC, "updatedAt");
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<PromotionProgram> promotionProgramPage = promotionProgramRepository.findAll(pageable);

        return promotionProgramPage.map(promotionOrderMapper::toDTO);
    }

    //Find promotion program by ID
    public PromotionProgramDTO findPromotionProgramById(Integer promotionProgramId) {
        PromotionProgram promotionProgram = promotionProgramRepository.findById(promotionProgramId)
                .orElseThrow(() -> new IllegalArgumentException("Promotion program not found with ID: " + promotionProgramId));

        return promotionOrderMapper.toDTO(promotionProgram);
    }

    //Create a promotion program
    public PromotionProgramDTO createPromotionProgram(PromotionOrderRequest request, AppUser user) {
        PromotionProgram promotionProgram = promotionOrderMapper.toEntity(request);
        promotionProgram.setPromotionCode(renderPromotionCode());
        promotionProgram.setCreatedBy(user);
        promotionProgram.setUpdatedBy(user);
        promotionProgramRepository.save(promotionProgram);

        return promotionOrderMapper.toDTO(promotionProgram);
    }

    public PromotionProgramDTO updatePromotionProgram(Integer promotionProgramId, PromotionOrderRequest request, AppUser user) {
        PromotionProgram promotionProgram = promotionProgramRepository.findById(promotionProgramId)
                .orElseThrow(() -> new IllegalArgumentException("Promotion program not found with ID: " + promotionProgramId));

        promotionOrderMapper.updateEntityFromRequest(promotionProgram, request);
        promotionProgram.setUpdatedBy(user);
        promotionProgramRepository.save(promotionProgram);

        return promotionOrderMapper.toDTO(promotionProgram);
    }

    public void deletePromotionProgram(Integer promotionProgramId) {
        PromotionProgram promotionProgram = promotionProgramRepository.findById(promotionProgramId)
                .orElseThrow(() -> new IllegalArgumentException("Promotion program not found with ID: " + promotionProgramId));

        // Check if the promotion program is used in any orders
        if (usedPromotionRepository.existsByPromotionProgram(promotionProgram)) {
            promotionProgram.setIsActive(false);

            promotionProgramRepository.save(promotionProgram);
        }

        // If not used, delete the promotion program
        else {
            promotionProgramRepository.delete(promotionProgram);
        }
    }

    public void changeStatus(Integer promotionProgramId) {
        PromotionProgram promotionProgram = promotionProgramRepository.findById(promotionProgramId)
                .orElseThrow(() -> new IllegalArgumentException("Promotion program not found with ID: " + promotionProgramId));

        // Toggle the active status of the promotion program
        Boolean currentStatus = promotionProgram.getIsActive();
        promotionProgram.setIsActive(!currentStatus);

        promotionProgramRepository.save(promotionProgram);
    }

    String renderPromotionCode() {
        Random random = new Random();
        int randomNum = 10000 + random.nextInt(90000); // Sinh số ngẫu nhiên 5 chữ số
        return String.format("KM%d", randomNum);
    }
}
