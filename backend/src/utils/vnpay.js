const crypto = require('crypto');

const VNP_CONFIG = {
  tmnCode: 'DEMOV210',
  hashSecret: 'RAOEXHYVSDDIIENLDKAWISO',
  payUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  returnUrl: 'http://localhost:5000/api/payments/vnpay/return'
};

/**
 * Sắp xếp object theo key alphabet và loại bỏ key rỗng
 */
function _sortObject(obj) {
  return Object.keys(obj)
    .filter(k => obj[k] !== '' && obj[k] !== null && obj[k] !== undefined)
    .sort()
    .reduce((acc, k) => { acc[k] = obj[k]; return acc; }, {});
}

/**
 * Chuyển sorted object thành query string theo đúng chuẩn VNPay (không encode)
 */
function _toQueryString(obj) {
  return Object.keys(obj)
    .map(k => `${k}=${obj[k]}`)
    .join('&');
}

/**
 * Tạo chữ ký HMAC-SHA256 cho VNPay / Webhook
 */
function _signData(data, secret) {
  return crypto.createHmac('sha256', secret).update(data, 'utf-8').digest('hex');
}

/**
 * Tạo URL thanh toán để redirect người dùng sang VNPay
 */
function createPaymentUrl(orderId, amount, orderInfo, ipAddr, customReturnUrl) {
  // Định dạng ngày giờ VNPay: YYYYMMDDHHmmss (UTC+7)
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000); // Chuyển sang UTC+7
  const pad = n => String(n).padStart(2, '0');
  const createDate = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;

  const params = {
    vnp_Version:    '2.1.0',
    vnp_Command:    'pay',
    vnp_TmnCode:    VNP_CONFIG.tmnCode,
    vnp_Locale:     'vn',
    vnp_CurrCode:   'VND',
    vnp_TxnRef:     String(orderId),
    vnp_OrderInfo:  String(orderInfo).replace(/[^a-zA-Z0-9 ]/g, ''), // Chỉ ký tự an toàn
    vnp_OrderType:  'other',
    vnp_Amount:     String(Math.round(Number(amount) * 100)),
    vnp_ReturnUrl:  customReturnUrl || VNP_CONFIG.returnUrl,
    vnp_IpAddr:     ipAddr || '127.0.0.1',
    vnp_CreateDate: createDate,
  };

  const sortedParams = _sortObject(params);
  const signData = _toQueryString(sortedParams);
  const secureHash = _signData(signData, VNP_CONFIG.hashSecret);

  // Thêm hash vào cuối (không đưa vào sort)
  const finalParams = { ...sortedParams, vnp_SecureHash: secureHash };
  const paymentUrl = `${VNP_CONFIG.payUrl}?${_toQueryString(finalParams)}`;
  return paymentUrl;
}

/**
 * Xác minh chữ ký callback trả về từ VNPay
 */
function verifyReturnUrl(vnpParams) {
  const params = { ...vnpParams };
  const secureHash = params['vnp_SecureHash'];

  delete params['vnp_SecureHash'];
  delete params['vnp_SecureHashType'];

  const sortedParams = _sortObject(params);
  const signData = _toQueryString(sortedParams);
  const calculatedHash = _signData(signData, VNP_CONFIG.hashSecret);

  const isValid = calculatedHash === secureHash;
  const responseCode = params['vnp_ResponseCode'] || '';
  const transactionStatus = params['vnp_TransactionStatus'] || '';

  return { isValid, responseCode, transactionStatus };
}

module.exports = { VNP_CONFIG, createPaymentUrl, verifyReturnUrl };
