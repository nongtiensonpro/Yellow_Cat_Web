package org.yellowcat.backend.product.productvariant;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.productvariant.dto.ProductVariantHistoryDto;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Repository
public class ProductVariantHistoryRepository {
    private final JdbcTemplate jdbc;

    public ProductVariantHistoryRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<ProductVariantHistoryDto> MAPPER = new RowMapper<>() {
        @Override
        public ProductVariantHistoryDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            ProductVariantHistoryDto dto = new ProductVariantHistoryDto();
            dto.setHistoryId(rs.getInt("history_id"));
            dto.setSku(rs.getString("sku"));
            dto.setOperation(rs.getString("operation"));
            dto.setChangedAt(rs.getTimestamp("changed_at").toLocalDateTime());
            dto.setChangedBy(rs.getString("changed_by"));
            return dto;
        }
    };

    public List<ProductVariantHistoryDto> findByVariantId(int variantId) {
        String sql = """
                SELECT history_id, sku, operation, changed_at, changed_by
                FROM product_variants_history
                WHERE variant_id = ?
                ORDER BY changed_at DESC
                """;
        return jdbc.query(sql, MAPPER, variantId);
    }

    public void rollbackToHistory(int historyId) {
        String sql = """
                WITH h AS (
                  SELECT * FROM product_variants_history WHERE history_id = ?
                )
                UPDATE product_variants v
                SET
                  sku               = h.sku,
                  color_id          = h.color_id,
                  size_id           = h.size_id,
                  price             = h.price,
                  sale_price        = h.sale_price,
                  quantity_in_stock = h.quantity_in_stock,
                  sold              = h.sold,
                  image_url         = h.image_url,
                  weight            = h.weight,
                  updated_at        = CURRENT_TIMESTAMP
                FROM h
                WHERE v.variant_id = h.variant_id
                """;
        jdbc.update(sql, historyId);
    }
}
