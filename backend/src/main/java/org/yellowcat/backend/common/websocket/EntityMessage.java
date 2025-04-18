package org.yellowcat.backend.common.websocket;

/**
 * Lớp generic để truyền thông điệp về các thay đổi của entity qua WebSocket.
 * Có thể sử dụng cho bất kỳ loại entity nào trong hệ thống.
 *
 * @param <T> Kiểu dữ liệu của entity
 */
public class EntityMessage<T> {
    private String action;
    private T entity;
    private String entityType;

    /**
     * Constructor đầy đủ
     *
     * @param action     Hành động thực hiện (CREATE, UPDATE, DELETE, ...)
     * @param entity     Đối tượng entity
     * @param entityType Tên loại entity
     */
    public EntityMessage(String action, T entity, String entityType) {
        this.action = action;
        this.entity = entity;
        this.entityType = entityType;
    }

    /**
     * Constructor không yêu cầu entityType
     *
     * @param action Hành động thực hiện (CREATE, UPDATE, DELETE, ...)
     * @param entity Đối tượng entity
     */
    public EntityMessage(String action, T entity) {
        this.action = action;
        this.entity = entity;
        this.entityType = entity.getClass().getSimpleName();
    }

    /**
     * Constructor mặc định
     */
    public EntityMessage() {
    }

    // Getters và Setters
    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public T getEntity() {
        return entity;
    }

    public void setEntity(T entity) {
        this.entity = entity;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }
}