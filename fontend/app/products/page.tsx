
"use client";

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { CldImage } from "next-cloudinary";
import Image from "next/image";

// --- Interfaces và Types ---
interface Product {
    productId: number;
    productName: string;
    description: string;
    purchases: number;
    createdAt: string;
    updatedAt: string;
    categoryId: number;
    categoryName: string;
    brandId: number;
    brandName: string;
    brandInfo: string;
    logoPublicId: string;
    minPrice: number | null;
    totalStock: number | null;
    thumbnail: string | null;
    activePromotions: string | null;
    isActive: boolean;
}

interface PageInfo {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
}

interface ApiResponseData {
    content: Product[];
    page: PageInfo;
}

interface ApiResponse {
    timestamp: string;
    status: number;
    message: string;
    data: ApiResponseData;
}
// --- Kết thúc Interfaces và Types ---


const ProductList = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // --- State cho các bộ lọc ---
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [minPriceFilter, setMinPriceFilter] = useState<string>('');
    const [maxPriceFilter, setMaxPriceFilter] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // Để xử lý radio cho category
    // --- Kết thúc State cho các bộ lọc ---

    // Dữ liệu giả định cho các bộ lọc (trong thực tế có thể lấy từ API)
    const brands = ["Nike", "Adidas", "Puma"];
    const colors = ["Trắng", "Đen"]; // Hiện tại chưa dùng đến, có thể thêm vào logic lọc sau
    const sizes = ["39", "40", "41", "42", "43", "44", "45"];
    const materials = ["Canvas", "Vải"]; // Hiện tại chưa dùng đến, có thể thêm vào logic lọc sau
    const categories = ["Running", "Sneaker", "Basketball"]; // Dữ liệu giả định cho category

    useEffect(() => {
        const fetchProducts = async (page: number) => {
            setLoading(true);
            try {
                const queryParams = new URLSearchParams();
                queryParams.append('page', (page - 1).toString());
                queryParams.append('size', '12');

                // Thêm tham số lọc thương hiệu
                if (selectedBrands.length > 0) {
                    selectedBrands.forEach(brand => queryParams.append('brandName', brand));
                }

                // Thêm tham số lọc kích thước
                if (selectedSizes.length > 0) {
                    selectedSizes.forEach(size => queryParams.append('size', size));
                }

                // Thêm tham số lọc giá
                if (minPriceFilter !== '') {
                    queryParams.append('minPrice', minPriceFilter);
                }
                if (maxPriceFilter !== '') {
                    queryParams.append('maxPrice', maxPriceFilter);
                }

                // Thêm tham số lọc Category (radio button)
                if (selectedCategory) {
                    queryParams.append('categoryName', selectedCategory);
                }

                // Tùy chọn: Thêm tham số sắp xếp (nếu bạn muốn triển khai)
                // const sortOrder = document.getElementById('sort').value;
                // if (sortOrder) {
                //     queryParams.append('sort', sortOrder);
                // }

                const response = await fetch(`http://localhost:8080/api/products?${queryParams.toString()}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }
                const data: ApiResponse = await response.json();
                if (data.status === 200 && data.data && data.data.content) {
                    const activeProducts = data.data.content.filter(product => product.isActive);
                    setProducts(activeProducts);
                    setTotalPages(data.data.page.totalPages); // Cập nhật tổng số trang
                } else {
                    throw new Error(data.message || 'Failed to fetch products');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts(currentPage);
        // Dependencies cho useEffect
    }, [currentPage, selectedBrands, selectedSizes, minPriceFilter, maxPriceFilter, selectedCategory]);

    // Format giá tiền
    const formatPrice = (price: number | null) => {
        if (price === null) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    // --- Hàm xử lý sự kiện cho các bộ lọc ---
    const handleCheckboxChange = (filterType: 'brand' | 'size' | 'color' | 'material', value: string, isChecked: boolean) => {
        setCurrentPage(1); // Reset về trang 1 khi áp dụng bộ lọc mới
        if (filterType === 'brand') {
            setSelectedBrands(prev =>
                isChecked ? [...prev, value] : prev.filter(item => item !== value)
            );
        } else if (filterType === 'size') {
            setSelectedSizes(prev =>
                isChecked ? [...prev, value] : prev.filter(item => item !== value)
            );
        }
        // Có thể thêm logic cho 'color' và 'material' nếu cần
    };

    const handleRadioChange = (filterType: 'category', value: string) => {
        setCurrentPage(1); // Reset về trang 1 khi áp dụng bộ lọc mới
        if (filterType === 'category') {
            setSelectedCategory(value);
        }
    };

    const handlePriceInputChange = (type: 'min' | 'max', event: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentPage(1); // Reset về trang 1 khi áp dụng bộ lọc mới
        const value = event.target.value;
        if (type === 'min') {
            setMinPriceFilter(value);
        } else {
            setMaxPriceFilter(value);
        }
    };
    // --- Kết thúc Hàm xử lý sự kiện cho các bộ lọc ---

    // Hàm render phần bộ lọc
    const renderFilterSection = (
        title: string,
        items: string[],
        type: 'checkbox' | 'radio',
        selectedValues: string[] | string | null, // Có thể là mảng hoặc string
        handler: (value: string, isChecked?: boolean) => void // Handler có thể có isChecked hoặc không
    ) => (
        <div className="filter-section">
            <h3 className="filter-title">{title}</h3>
            <div className="filter-options">
                {items.map((item, index) => (
                    <label key={index} className="filter-option">
                        <input
                            type={type}
                            name={title.toLowerCase().replace(/\s/g, '-')}
                            value={item}
                            // Logic kiểm tra checked cho cả checkbox và radio
                            checked={
                                type === 'checkbox'
                                    ? (selectedValues as string[]).includes(item)
                                    : (selectedValues as string) === item
                            }
                            onChange={(e) =>
                                type === 'checkbox'
                                    ? handler(item, e.target.checked)
                                    : handler(item)
                            }
                        />
                        <span className="ml-2">{item}</span>
                    </label>
                ))}
            </div>
        </div>
    );

    const renderPagination = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        if (startPage > 1) {
            pageNumbers.push(1);
            if (startPage > 2) {
                pageNumbers.push('...');
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageNumbers.push('...');
            }
            pageNumbers.push(totalPages);
        }

        return (
            <div className="pagination">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="pagination-button"
                >
                    &lt;
                </button>
                {pageNumbers.map((num, index) =>
                    num === '...' ? (
                        <span key={index} className="pagination-ellipsis">...</span>
                    ) : (
                        <button
                            key={index}
                            onClick={() => setCurrentPage(num as number)}
                            className={`pagination-button ${currentPage === num ? 'active' : ''}`}
                        >
                            {num}
                        </button>
                    )
                )}
                <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="pagination-button"
                >
                    &gt;
                </button>
            </div>
        );
    };


    if (loading) {
        return (
            <StyledWrapper>
                <div className="loading-container">
                    Đang tải sản phẩm...
                </div>
            </StyledWrapper>
        );
    }

    if (error) {
        return (
            <StyledWrapper>
                <div className="error-container">
                    Lỗi: {error}
                </div>
            </StyledWrapper>
        );
    }

    return (
        <StyledWrapper>
            <div className="full-width-banner-wrapper">
                <Image
                    src="/images/banner2.png"
                    alt="SneakerPeak Logo"
                    layout="responsive"
                    width={1000}
                    height={550}
                />
            </div>
            {/* Thêm phần tiêu đề trang và sắp xếp */}
            <div className="page-header">
                <div className="sort-by">
                    <label htmlFor="sort">Sắp xếp:</label>
                    <select id="sort" className="sort-select">
                        <option value="price-asc">Giá tăng dần</option>
                        <option value="price-desc">Giá giảm dần</option>
                    </select>
                </div>
            </div>

            <div className="main-content">
                <aside className="sidebar">
                    {/* Filter Thương hiệu */}
                    {renderFilterSection("THƯƠNG HIỆU", brands, 'checkbox', selectedBrands, (value, isChecked) => handleCheckboxChange('brand', value, isChecked!))}

                    {/* Filter Kích thước */}
                    {renderFilterSection("KÍCH THƯỚC", sizes, 'checkbox', selectedSizes, (value, isChecked) => handleCheckboxChange('size', value, isChecked!))}

                    {/* Filter Chất liệu (có thể bỏ qua hoặc thêm logic) */}
                    {/* {renderFilterSection("CHẤT LIỆU", materials, 'checkbox', selectedMaterials, (value, isChecked) => handleCheckboxChange('material', value, isChecked!))} */}

                    {/* Filter Giá */}
                    <div className="filter-section">
                        <h3 className="filter-title">GIÁ</h3>
                        <div className="filter-options filter-price">
                            <input
                                type="number"
                                placeholder="Giá từ"
                                value={minPriceFilter}
                                onChange={(e) => handlePriceInputChange('min', e)}
                            />
                            <input
                                type="number"
                                placeholder="Giá đến"
                                value={maxPriceFilter}
                                onChange={(e) => handlePriceInputChange('max', e)}
                            />
                        </div>
                    </div>
                </aside>

                <div className="product-display-area">
                    <div className="product-grid">
                        {products.map((product) => (
                            <div className="card" key={product.productId}>
                                {/* Sale and New badges */}
                                <div className="badge-container">
                                    {(product.activePromotions && product.activePromotions.includes("ONLINE_EXCLUSIVE")) && (
                                        <div className="badge online-exclusive">
                                            <img src="/online-exclusive-badge.png" alt="Online Exclusive" />
                                        </div>
                                    )}
                                    {(product.activePromotions && product.activePromotions.includes("NEW_ARRIVAL")) && (
                                        <div className="badge new-arrival">NEW</div>
                                    )}
                                    {(product.activePromotions && product.activePromotions.includes("SALE")) && (
                                        <div className="badge sale">SALE</div>
                                    )}
                                </div>

                                <div className="image-container">
                                    {product.thumbnail ? (
                                        <CldImage
                                            width={400}
                                            height={400}
                                            src={product.thumbnail}
                                            alt={product.productName}
                                            className="product-image"
                                        />
                                    ) : (
                                        <div className="product-image placeholder" />
                                    )}

                                </div>

                                <div className="content">
                                    <span className="product-brand">{product.brandName}</span>
                                    <Link href={`/products/${product.productId}`} className="title-link">
                                        <span className="product-name">
                                            {product.productName}
                                        </span>
                                    </Link>
                                    <div className="price-info">
                                        {product.activePromotions && product.activePromotions.includes("SALE") && (
                                            <>
                                                <p className="original-price">{formatPrice(product.minPrice ? product.minPrice * 1.28 : null)}</p>
                                                <p className="sale-percentage">-28%</p>
                                            </>
                                        )}
                                        <p className="current-price">{formatPrice(product.minPrice)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {renderPagination()}
                </div>
            </div>
        </StyledWrapper>
    );
};

const StyledWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
  font-family: Arial, sans-serif;
  color: #333;

  .full-width-banner-wrapper {
    margin-bottom: 2rem;
  }

  .section-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    text-align: center;
    display: none; /* Ẩn tiêu đề này vì đã có Page Header */
  }

  .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e0e0e0;
  }

  .page-title {
      font-size: 2.2rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0;
  }

  .sort-by {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      color: #555;
  }

  .sort-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid #ccc;
      border-radius: 0.25rem;
      background-color: #fff;
      cursor: pointer;
      font-size: 0.9rem;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      background-size: 0.8rem;
  }

  .main-content {
      display: flex;
      gap: 2rem;
  }

  .sidebar {
      width: 280px;
      flex-shrink: 0;
      background-color: #f7f7f7;
      border-radius: 0.5rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .filter-section {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #eee;

      &:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
      }
  }

  .filter-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #333;
      text-transform: uppercase;
      margin-bottom: 1rem;
      letter-spacing: 0.05em;
  }

  .filter-options {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
  }

  .filter-options.filter-price {
      flex-direction: row;
      gap: 0.75rem;
      input {
          width: 50%;
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 0.25rem;
          font-size: 0.9rem;
      }
  }

  .filter-option {
      display: flex;
      align-items: center;
      font-size: 0.9rem;
      color: #555;
      cursor: pointer;

      input[type="checkbox"],
      input[type="radio"] {
          margin-right: 0.5rem;
          accent-color: #3182ce;
          width: 1rem;
          height: 1rem;
      }
  }

  .product-display-area {
      flex-grow: 1;
  }

  .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1.5rem;
  }

  .card {
      background-color: #fff;
      border-radius: 0.5rem;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      overflow: hidden;
      position: relative;
  }

  .card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.12);
  }

  .badge-container {
      position: absolute;
      top: 0.75rem;
      left: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      z-index: 10;
  }

  .badge {
      padding: 0.25rem 0.6rem;
      border-radius: 0.25rem;
      font-size: 0.7rem;
      font-weight: 700;
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
  }

  .badge.online-exclusive {
      background: none;
      padding: 0;
      img {
          width: 60px;
          height: auto;
      }
  }

  .badge.new-arrival {
      background-color: #6a0dad;
  }

  .badge.sale {
      background-color: #e74c3c;
  }

  .image-container {
      position: relative;
      width: 100%;
      height: 200px;
      overflow: hidden;
      border-top-left-radius: 0.5rem;
      border-top-right-radius: 0.5rem;
  }

  .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
  }

  .product-image.placeholder {
      background-color: #f0f0f0;
  }

  .wishlist-icon {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      background-color: rgba(255, 255, 255, 0.8);
      border-radius: 50%;
      padding: 0.4rem;
      cursor: pointer;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);

      svg {
          width: 18px;
          height: 18px;
          color: #777;
      }
      &:hover svg {
          color: #e74c3c;
      }
  }

  .content {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      height: auto;
  }

  .product-brand {
      font-size: 0.75rem;
      color: #777;
      text-transform: uppercase;
      margin-bottom: 0.25rem;
  }

  .title-link {
      text-decoration: none;
      color: inherit;
  }

  .product-name {
      font-size: 0.95rem;
      font-weight: 600;
      line-height: 1.3;
      display: block;
      margin-bottom: 0.5rem;
      color: #333;
      min-height: 2.6em;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;

      &:hover {
          text-decoration: underline;
          text-decoration-color: #3182ce;
      }
  }

  .price-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: auto;
  }

  .original-price {
      font-size: 0.8rem;
      color: #999;
      text-decoration: line-through;
  }

  .current-price {
      font-weight: 700;
      color: #e74c3c;
      font-size: 1rem;
  }

  .sale-percentage {
      background-color: #e74c3c;
      color: #fff;
      padding: 0.1rem 0.4rem;
      border-radius: 0.25rem;
      font-size: 0.7rem;
      font-weight: 600;
  }

  .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
  }

  .pagination-button {
      background-color: #fff;
      border: 1px solid #ddd;
      border-radius: 0.25rem;
      padding: 0.6rem 1rem;
      cursor: pointer;
      font-size: 0.9rem;
      color: #555;
      transition: background-color 0.2s ease, border-color 0.2s ease;

      &:hover:not(:disabled),
      &.active {
          background-color: #3182ce;
          color: #fff;
          border-color: #3182ce;
      }

      &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
      }
  }

  .pagination-ellipsis {
      padding: 0.6rem 0.5rem;
      color: #777;
  }

  .loading-container, .error-container {
      text-align: center;
      font-size: 1.2rem;
      color: #666;
      margin-top: 50px;
      flex-grow: 1;
  }

  @media (max-width: 992px) {
      .main-content {
          flex-direction: column;
      }

      .sidebar {
          width: 100%;
          margin-bottom: 1.5rem;
      }

      .product-grid {
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      }
  }

  @media (max-width: 768px) {
      .page-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
      }
  }
`;

export default ProductList;