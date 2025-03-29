package org.yellowcat.backend.response;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Lớp PageResponse cung cấp một cấu trúc phản hồi chuẩn cho dữ liệu phân trang.
 * Lớp này được sử dụng để bao bọc kết quả phân trang từ Spring Data.
 */
public class PageResponse<T> {
    private List<T> content;
    private int currentPage;
    private long totalItems;
    private int totalPages;
    private int size;
    private boolean first;
    private boolean last;

    public PageResponse() {
    }

    /**
     * Tạo PageResponse từ đối tượng Page của Spring Data
     *
     * @param page Đối tượng Page chứa dữ liệu phân trang
     */
    public PageResponse(Page<T> page) {
        this.content = page.getContent();
        this.currentPage = page.getNumber();
        this.totalItems = page.getTotalElements();
        this.totalPages = page.getTotalPages();
        this.size = page.getSize();
        this.first = page.isFirst();
        this.last = page.isLast();
    }

    public List<T> getContent() {
        return content;
    }

    public void setContent(List<T> content) {
        this.content = content;
    }
    
    // Các phương thức getData() và setData() đã được loại bỏ để làm sạch API

    public int getCurrentPage() {
        return currentPage;
    }

    public void setCurrentPage(int currentPage) {
        this.currentPage = currentPage;
    }

    public long getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(long totalItems) {
        this.totalItems = totalItems;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public boolean isFirst() {
        return first;
    }

    public void setFirst(boolean first) {
        this.first = first;
    }

    public boolean isLast() {
        return last;
    }

    public void setLast(boolean last) {
        this.last = last;
    }
}