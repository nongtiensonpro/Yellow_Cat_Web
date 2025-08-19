"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Tooltip
} from "@heroui/react";
import { 
  History, 
  RotateCcw, 
  Eye, 
  RefreshCw,
  Package,
  Calendar,
  User,
  AlertCircle
} from "lucide-react";
import { toast } from "react-hot-toast";
import { 
  productHistoryService, 
  ProductHistoryDto, 
  ProductVariantHistoryDTO 
} from "@/services/productHistoryService";

export default function ProductHistoryPage() {
  const { data: session, status } = useSession();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // State cho dữ liệu chính
  const [productHistory, setProductHistory] = useState<ProductHistoryDto[]>([]);
  const [variantHistory, setVariantHistory] = useState<ProductVariantHistoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State cho pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // State cho modal chi tiết
  const [selectedHistoryGroupId, setSelectedHistoryGroupId] = useState<string>("");
  const [selectedProductName, setSelectedProductName] = useState<string>("");
  const [variantLoading, setVariantLoading] = useState(false);
  
  // State cho rollback
  const [rollbackLoading, setRollbackLoading] = useState<number | null>(null);

  // Kiểm tra quyền admin
  const checkAdminPermission = useCallback(() => {
    if (status === 'loading') return false;
    if (status === 'unauthenticated' || !session) return false;
    
    try {
      const accessToken = session.accessToken as string;
      if (!accessToken) return false;
      
      // Kiểm tra quyền Admin_Web
      const tokenData = JSON.parse(atob(accessToken.split('.')[1]));
      const clientRoles = tokenData.resource_access?.["YellowCatCompanyWeb"]?.roles || [];
      return clientRoles.includes('Admin_Web');
    } catch (error) {
      console.error('Error checking admin permission:', error);
      return false;
    }
  }, [session, status]);

  // Fetch dữ liệu lịch sử sản phẩm
  const fetchProductHistory = useCallback(async (page: number = 1) => {
    if (!checkAdminPermission()) {
      setError("Bạn không có quyền truy cập chức năng này");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await productHistoryService.getAllProductHistory(page - 1, pageSize);
      setProductHistory(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setCurrentPage(page);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Lỗi không xác định";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [checkAdminPermission, pageSize]);

  // Fetch dữ liệu lịch sử variant
  const fetchVariantHistory = useCallback(async (historyGroupId: string) => {
    try {
      setVariantLoading(true);
      const data = await productHistoryService.getProductVariantHistory(historyGroupId, 0, 100);
      setVariantHistory(data.content);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Lỗi không xác định";
      toast.error(errorMessage);
    } finally {
      setVariantLoading(false);
    }
  }, []);

  // Mở modal xem chi tiết variant
  const handleViewVariants = useCallback((historyGroupId: string, productName: string) => {
    setSelectedHistoryGroupId(historyGroupId);
    setSelectedProductName(productName);
    fetchVariantHistory(historyGroupId);
    onOpen();
  }, [fetchVariantHistory, onOpen]);

  // Thực hiện rollback
  const handleRollback = useCallback(async (historyId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn khôi phục sản phẩm về phiên bản này?")) {
      return;
    }

    try {
      setRollbackLoading(historyId);
      await productHistoryService.rollbackProduct(historyId);
      toast.success("Khôi phục sản phẩm thành công!");
      fetchProductHistory(currentPage); // Refresh lại dữ liệu
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Lỗi không xác định";
      toast.error(errorMessage);
    } finally {
      setRollbackLoading(null);
    }
  }, [fetchProductHistory, currentPage]);

  // Format operation text
  const formatOperation = (operation: string) => {
    switch (operation) {
      case 'U':
        return { text: 'Cập nhật', color: 'warning' as const };
      case 'D':
        return { text: 'Xóa', color: 'danger' as const };
      default:
        return { text: operation, color: 'default' as const };
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Effect khởi tạo
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!checkAdminPermission()) {
      setError("Bạn không có quyền truy cập chức năng này");
      setLoading(false);
      return;
    }
    
    fetchProductHistory(1);
  }, [status, checkAdminPermission, fetchProductHistory]);

  // Nếu không có quyền admin
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!checkAdminPermission()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardBody className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Không có quyền truy cập</h2>
            <p className="text-gray-600">Bạn cần quyền Admin_Web để truy cập chức năng này.</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="w-8 h-8 text-orange-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lịch sử sản phẩm</h1>
            <p className="text-gray-600">Theo dõi và quản lý lịch sử thay đổi sản phẩm</p>
          </div>
        </div>
        <Button
          color="primary"
          startContent={<RefreshCw className="w-4 h-4" />}
          onClick={() => fetchProductHistory(currentPage)}
          disabled={loading}
        >
          Làm mới
        </Button>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody className="text-center">
            <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{totalElements}</p>
            <p className="text-gray-600">Tổng số thay đổi</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{productHistory.length}</p>
            <p className="text-gray-600">Thay đổi hiện tại</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <User className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {new Set(productHistory.map(h => h.changedBy)).size}
            </p>
            <p className="text-gray-600">Người thực hiện</p>
          </CardBody>
        </Card>
      </div>

      {/* Bảng lịch sử */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Danh sách lịch sử thay đổi</h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
            </div>
          ) : productHistory.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Không có lịch sử thay đổi nào</p>
            </div>
          ) : (
            <Table aria-label="Product history table">
              <TableHeader>
                <TableColumn>SẢN PHẨM</TableColumn>
                <TableColumn>THÔNG TIN</TableColumn>
                <TableColumn>THAO TÁC</TableColumn>
                <TableColumn>NGƯỜI THỰC HIỆN</TableColumn>
                <TableColumn>THỜI GIAN</TableColumn>
                <TableColumn>HÀNH ĐỘNG</TableColumn>
              </TableHeader>
              <TableBody>
                {productHistory.map((history) => {
                  const operationInfo = formatOperation(history.operation);
                  return (
                    <TableRow key={history.historyId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {/*{history.thumbnail && (*/}
                          {/*  <img*/}
                          {/*    src={history.thumbnail}*/}
                          {/*    alt={history.productName}*/}
                          {/*    className="w-12 h-12 object-cover rounded-lg"*/}
                          {/*  />*/}
                          {/*)}*/}
                          <div>
                            <p className="font-semibold text-gray-900">{history.productName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {history.category && (
                            <p className="text-sm"><span className="font-medium">Danh mục:</span> {history.category}</p>
                          )}
                          {history.brand && (
                            <p className="text-sm"><span className="font-medium">Thương hiệu:</span> {history.brand}</p>
                          )}
                          {history.material && (
                            <p className="text-sm"><span className="font-medium">Chất liệu:</span> {history.material}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip color={operationInfo.color} variant="flat" size="sm">
                          {operationInfo.text}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{history.changedBy}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{formatDate(history.changedAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tooltip content="Xem chi tiết variant">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="primary"
                              onClick={() => handleViewVariants(history.historyGroupId, history.productName)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                          {history.operation === 'U' && (
                            <Tooltip content="Khôi phục về phiên bản này">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="success"
                                onClick={() => handleRollback(history.historyId)}
                                disabled={rollbackLoading === history.historyId}
                              >
                                {rollbackLoading === history.historyId ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <RotateCcw className="w-4 h-4" />
                                )}
                              </Button>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardBody>
        {totalPages > 1 && (
          <CardFooter className="flex justify-center">
            <Pagination
              total={totalPages}
              page={currentPage}
              onChange={setCurrentPage}
              showControls
              showShadow
              color="primary"
            />
          </CardFooter>
        )}
      </Card>

      {/* Modal chi tiết variant */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              <span>Chi tiết variant - {selectedProductName}</span>
            </div>
          </ModalHeader>
          <ModalBody>
            {variantLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : variantHistory.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Không có lịch sử variant nào</p>
              </div>
            ) : (
              <Table aria-label="Variant history table">
                <TableHeader>
                  <TableColumn>SKU</TableColumn>
                  <TableColumn>MÀU SẮC</TableColumn>
                  <TableColumn>KÍCH THƯỚC</TableColumn>
                  <TableColumn>GIÁ</TableColumn>
                  <TableColumn>GIÁ GIẢM</TableColumn>
                  <TableColumn>SỐ LƯỢNG</TableColumn>
                  <TableColumn>TRỌNG LƯỢNG</TableColumn>
                  {/*<TableColumn>THAO TÁC</TableColumn>*/}
                  {/*<TableColumn>NGƯỜI THỰC HIỆN</TableColumn>*/}
                  {/*<TableColumn>THỜI GIAN</TableColumn>*/}
                </TableHeader>
                <TableBody>
                  {variantHistory.map((variant) => {
                    // const operationInfo = formatOperation(variant.operation);
                    return (
                      <TableRow key={variant.historyId}>
                        <TableCell>{variant.sku}</TableCell>
                        <TableCell>{variant.color || 'N/A'}</TableCell>
                        <TableCell>{variant.size || 'N/A'}</TableCell>
                        <TableCell>{variant.price || '0'}</TableCell>
                        <TableCell>{variant.salePrice || '0'}</TableCell>
                        <TableCell>{variant.quantityInStock}</TableCell>
                        <TableCell>{variant.weight}g</TableCell>
                        {/*<TableCell>*/}
                        {/*  <Chip color={operationInfo.color} variant="flat" size="sm">*/}
                        {/*    {operationInfo.text}*/}
                        {/*  </Chip>*/}
                        {/*</TableCell>*/}
                        {/*<TableCell>*/}
                        {/*  <div className="flex items-center gap-2">*/}
                        {/*    <User className="w-4 h-4 text-gray-500" />*/}
                        {/*    <span className="text-sm">{variant.changedBy}</span>*/}
                        {/*  </div>*/}
                        {/*</TableCell>*/}
                        {/*<TableCell>*/}
                        {/*  <div className="flex items-center gap-2">*/}
                        {/*    <Calendar className="w-4 h-4 text-gray-500" />*/}
                        {/*    <span className="text-sm">{formatDate(variant.changedAt)}</span>*/}
                        {/*  </div>*/}
                        {/*</TableCell>*/}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Đóng
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
