export const formatPaymentMethod = (method: string): string => {
    switch (method.toLowerCase()) {
      case "cod":
        return "Thanh toán khi nhận hàng (COD)";
      case "credit_card":
        return "Thẻ tín dụng";
      case "vnpay":
        return "VNPay";
      default:
        return "Không xác định";
    }
  };