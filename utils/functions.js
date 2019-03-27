
// 订单状态
const orderStatusTxt = function(code) {
	switch(code) {
      case 100:
        return '待付款'
        break;
      case 101:
        return '支付失败'
        break;
      case 102:
        return '已取消' // 未支付前用户取消订单
        break;
      case 103:
        return '订单失效' // 订单支付超时
        break;
      case 104:
        return '待商家审核' // 已支付前用户取消申请成功
        break;
      case 105:
        return '退款成功' // 订单已取消
        break;
      case 200:
        return '已付款' // 付款成功
        break;
      case 300:
        return '商家已接单' // 商家自动接单
        break;
      case 303:
        return '待取餐' // 商家确认制作完成
        break;
      case 400:
        return '取餐中' // 配送员手动接单
        break;
      case 401:
        return '配送中' // 配送员确认已取餐
        break;
      case 403:
        return '商家取消了订单' // 即时退款给用户
        break;
      case 500:
        return '已完成' // 配送员确认已完成
        break;
      default:
        return code
    }
}

// 支付方式
const payTypeTxt = function(val) {
return val === 'alipay' ? '支付宝' : '微信' 
}


module.exports = {
  orderStatusTxt: orderStatusTxt,
  payTypeTxt : payTypeTxt
}
