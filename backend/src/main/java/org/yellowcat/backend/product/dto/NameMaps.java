package org.yellowcat.backend.product.dto;

import java.util.Map;

public class NameMaps {
    private final Map<Integer,String> categoryMap;
    private final Map<Integer,String> brandMap;
    private final Map<Integer,String> materialMap;
    private final Map<Integer,String> targetAudienceMap;

    public NameMaps(Map<Integer,String> categoryMap,
                    Map<Integer,String> brandMap,
                    Map<Integer,String> materialMap,
                    Map<Integer,String> targetAudienceMap) {
        this.categoryMap       = categoryMap;
        this.brandMap          = brandMap;
        this.materialMap       = materialMap;
        this.targetAudienceMap = targetAudienceMap;
    }

    public String getCategoryName(Integer id) {
        return id == null ? null : categoryMap.get(id);
    }
    public String getBrandName(Integer id) {
        return id == null ? null : brandMap.get(id);
    }
    public String getMaterialName(Integer id) {
        return id == null ? null : materialMap.get(id);
    }
    public String getTargetAudienceName(Integer id) {
        return id == null ? null : targetAudienceMap.get(id);
    }
}
