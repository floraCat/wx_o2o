var _funs = require("../../utils/functions.js")

Page({
  data: {
    pageTitle: '订单详情',
    list: [],
    cancelImage: null,
    createDate: null
  },
  
  onShow: function (options) {
    let _opts = getCurrentPages()[getCurrentPages().length-1].options
    this.data.createDate = _opts.createDate
    this.getInfo()
  },

  onLoad: function (option) {
    if (option.tenantId) {
      wx.setStorageSync('xmTenantId',option.tenantId)
    }
  },

  /*路由*/
  goHome () { wx.reLaunch({url: '/pages/home/home'})},
  goDetail (e) {
    let _id = e.currentTarget.dataset.opt
    wx.navigateTo({url: '/pages/detail/detail?id=' + _id})
  },

  // 获取订单信息
  getInfo () {
    let self = this
    let _opts = {
      tenantId: wx.getStorageSync('xmTenantId'),
      userId: wx.getStorageSync('xmUserId'),
      createDate: this.data.createDate
    }
    wx.showLoading({title: '加载中'})
    wx.request({
      url: getApp().globalData.httpHost + '/business/shopping/orders' + getApp().globalData.suf,
      data: _opts,
      success: function (res) {
        console.log("获取订单信息")
        console.log(res)
        wx.hideLoading()
        if (res.data.status === '') {
          // window.location.href = ''
        }
        if (res.data.status === 'failure') {
          console.log('错误提示：' + res.data.message)
          wx.showToast({
            title: '获取订单信息失败',
            icon: 'none',
            duration: 3000
          })
        }
        if (res.data.status === 'success') {
          let _rs = res.data.list
          for (let i = 0; i < _rs.length; i ++) {
            /*增加订单状态中文字段*/
            _rs[i]["statusTxt"] = _funs.orderStatusTxt(_rs[i].orderStatus)
            /*增加支付方式中文字段*/
            _rs[i]["payTypeTxt"] = _funs.payTypeTxt(_rs[i].payType)
            self.setData({
              list : _rs
            })
          }
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