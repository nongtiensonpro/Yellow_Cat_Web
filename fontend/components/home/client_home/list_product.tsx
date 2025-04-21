import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Link from 'next/link';

interface Brand {
  id: number;
  brandName: string;
}

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  productName: string;
  category: Category;
  brand: Brand;
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

const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data: ApiResponse = await response.json();
        if (data.status === 200 && data.data && data.data.content) {
          setProducts(data.data.content);
        } else {
          throw new Error(data.message || 'Failed to fetch products');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <div>Loading products...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <StyledWrapper>
      <h2 className="section-title">Our Products</h2>
      <div className="product-grid">
        {products.map((product) => (
          <div className="card" key={product.id}>
            <div className="image" />
            <div className="content">
              <Link href={`/products/${product.id}`}>
                <span className="title">
                  {product.productName}
                </span>
              </Link>
              <p className="desc">
                Category: {product.category.name} | Brand: {product.brand.brandName}
              </p>
              <Link className="action" href={`/products/${product.id}`}>
                View Details
                <span aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
    .section-title {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
        text-align: center;
    }

    .product-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.5rem;
        margin: 0 auto;
        max-width: 1200px;
    }

    .card {
        max-width: 100%;
        border-radius: 0.5rem;
        background-color: #fff;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        border: 1px solid transparent;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    .card a {
        text-decoration: none
    }

    .content {
        padding: 1.1rem;
    }

    .image {
        object-fit: cover;
        width: 100%;
        height: 200px;
        background-color: rgb(255, 239, 205);
        border-top-left-radius: 0.5rem;
        border-top-right-radius: 0.5rem;
    }

    .title {
        color: #111827;
        font-size: 1.125rem;
        line-height: 1.75rem;
        font-weight: 600;
        display: block;
        margin-bottom: 0.5rem;
    }

    .desc {
        margin-top: 0.5rem;
        color: #6B7280;
        font-size: 0.875rem;
        line-height: 1.25rem;
    }

    .action {
        display: inline-flex;
        margin-top: 1rem;
        color: #ffffff;
        font-size: 0.875rem;
        line-height: 1.25rem;
        font-weight: 500;
        align-items: center;
        gap: 0.25rem;
        background-color: #2563EB;
        padding: 4px 8px;
        border-radius: 4px;
    }

    .action span {
        transition: .3s ease;
    }

    .action:hover span {
        transform: translateX(4px);
    }
`;

export default ProductList;