var _funs = require("../../utils/functions.js")

Page({

  data: {
    pageTitle: '订单',
    orders: [],
    openCancel: false,
    cancelImage: null,
    handleIndex: null
	},

  onShow: function () {
    this.getData()
  },

  /*路由*/
  goHome () { wx.reLaunch({url: '/pages/home/home'})},
  goOrderlist (e) {
    let _tab = e.currentTarget.dataset.opt
    wx.navigateTo({url: '/pages/orderlist/orderlist?tab=' + _tab})
  },
  goOrderinfo (e) {
    let _code = e.currentTarget.dataset.opt
    wx.navigateTo({url: '/pages/orderinfo/orderinfo?orderCode=' + _code})
  },
  goPay (e) {
    let _code = e.currentTarget.dataset.opt
    wx.navigateTo({url: '/pages/pay/pay?orderCode=' + _code})
  },
  goShop (e) {
    let _id = e.currentTarget.dataset.opt
    wx.navigateTo({url: '/pages/shop/shop?shopId=' + _id})
  },

  getData: function () {
    let self = this
    let _opts = {
      tenantId: wx.getStorageSync('xmTenantId'),
      userId: wx.getStorageSync('xmUserId')
    }
    wx.showLoading({title: '加载中'})
    wx.request({
      url: getApp().globalData.httpHost + '/business/order/vistorderlast' + getApp().globalData.suf,
      data: _opts,
      success: function (res) {
        console.log("最近订单")
        console.log(res)
        wx.hideLoading()
        if (res.data.status === '') {
          // window.location.href = ''
        }
        if (res.data.status === 'failure') {
          console.log('错误提示：' + res.data.message)
          wx.showToast({
            title: '获取最近订单失败',
            icon: 'none',
            duration: 3000
          })
        }
        if (res.data.status === 'success') {
          let _list = res.data.list
          /*增加订单状态中文字段*/
          for (let i = 0; i < _list.length; i ++) {
            _list[i]["statusTxt"] = _funs.orderStatusTxt(_list[i].orderStatus)
          }
          self.setData({
            orders: res.data.list
          })
        }
      },
      fail: function (res) {
        console.log(res)
        wx.hideLoading()
        wx.showToast({
          title: '请求失败',
          icon: 'none',
          duration: 3000
        })
      }
    })
  },

  /*取消订单*/
  cancelOrder: function (e) {
    let _index = e.currentTarget.dataset.opt
    this.setData({
      openCancel: true,
      handleIndex: _index,
      cancelImage: this.data.orders[_index].goodsList[0].thumbnailName
    })
  },

  /*关闭弹窗*/
  closeWin () {
    this.setData({
      openCancel: false
    })
  },

  /*确认取消订单*/
  confirmCancel () {
    let self = this
    let _opts = {
      tenantId: wx.getStorageSync('xmTenantId'),
      userId: wx.getStorageSync('xmUserId'),
      orderCode: self.data.orders[self.data.handleIndex].orderCode
    }
    wx.showLoading({title: '取消中'})
    wx.request({
      url: getApp().globalData.httpHost + '/business/order/vistordercancel' + getApp().globalData.suf,
      method: 'POST',
      data: _opts,
      success: function (res) {
        console.log("取消订单")
        console.log(res)
        wx.hideLoading()
        if (res.data.status === '') {
          // window.location.href = ''
        }
        if (res.data.status === 'failure') {
          console.log('错误提示：' + res.data.message)
          wx.showToast({
            title: '取消订单失败',
            icon: 'none',
            duration: 3000
          })
        }
        if (res.data.status === 'success') {
          wx.showToast({
            title: '订单取消成功',
            icon: 'none',
            duration: 2000
          })
          self.data.orders.splice(self.data.handleIndex,1)
          self.setData({
            orders: self.data.orders,
            openCancel : false
          })
        }
      },
      fail: function (res) {
        console.log(res)
        wx.hideLoading()
        wx.showToast({
          title: '请求失败',
          icon: 'none',
          duration: 3000
        })
      }
    })
  },

})