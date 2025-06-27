package org.yellowcat.backend.product;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.dto.ProductHistoryDto;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Repository
public class ProductHistoryRepository {
    private final JdbcTemplate jdbc;

    public ProductHistoryRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<ProductHistoryDto> MAPPER = new RowMapper<>() {
        @Override
        public ProductHistoryDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            ProductHistoryDto dto = new ProductHistoryDto();
            dto.setHistoryId(rs.getInt("history_id"));
            dto.setProductName(rs.getString("product_name"));
            dto.setOperation(rs.getString("operation"));
            dto.setChangedAt(rs.getTimestamp("changed_at").toLocalDateTime());
            dto.setChangedBy(rs.getString("changed_by"));
            return dto;
        }
    };

    public List<ProductHistoryDto> findByProductId(int productId) {
        String sql = """
                SELECT history_id, product_name, operation, changed_at, changed_by
                FROM products_history
                WHERE product_id = ?
                ORDER BY changed_at DESC
                """;
        return jdbc.query(sql, MAPPER, productId);
    }

    public void rollbackToHistory(int historyId) {
        String sql = """
                WITH h AS (
                  SELECT * FROM products_history WHERE history_id = ?
                )
                UPDATE products p
                SET
                  product_name       = h.product_name,
                  description        = h.description,
                  category_id        = h.category_id,
                  brand_id           = h.brand_id,
                  material_id        = h.material_id,
                  target_audience_id = h.target_audience_id,
                  is_featured        = h.is_featured,
                  purchases          = h.purchases,
                  is_active          = h.is_active,
                  thumbnail          = h.thumbnail,
                  updated_at         = CURRENT_TIMESTAMP
                FROM h
                WHERE p.product_id = h.product_id
                """;
        jdbc.update(sql, historyId);
    }
}
