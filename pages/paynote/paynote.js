
Page({

  data: {
    pageTitle: '支付成功',
    sumPrice: 0,
    openPush: false,
	},

  onLoad: function (options) {
    let self = this
    setTimeout(function () {
      wx.hideLoading()
      self.setData({
        openPush : true,
        sumPrice : options.sum
      })
    }, 400)
    
  },

  /*路由*/
  goOrder () { 
    wx.navigateTo({url: '/pages/order/order'})
  },

})