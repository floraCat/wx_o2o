const app = getApp()
Page({

  data: {
    pageTitle: '在线支付',
    /*订单信息*/
    info: {},
    /*支付方式*/
    payModes: [{
        "id": 2,
        "name": "微信支付",
        "code": "pay_weixin",
        "check": 1
      },
      // {"id":1,"name":"支付宝支付", "code": "alipay","check":0}
    ],
    payType: 'pay_weixin',
    setTimeObj: null,
    sumPrice: 0,
    mTime: 0,
    sTime: 0,
    paymentFlag:true
	},

  onLoad: function (options) {
    this.getInfo()
  },

  /*路由*/
  goHome () { wx.reLaunch({url: '/pages/home/home'})},

  /*获取订单信息*/
  getInfo() {
    let self = this
    let _opt = getCurrentPages()[getCurrentPages().length-1].options
    let _opts = {
      tenantId: wx.getStorageSync('xmTenantId'),
      userId: wx.getStorageSync('xmUserId'),
      // deliveryArea: wx.getStorageSync('xmDeliveryArea'),
      orderCode: _opt.orderCode || "",
      createDate: _opt.createDate || ""
    }
    wx.showLoading({title: '加载中'})
    wx.request({
      url: app.globalData.httpHost + '/business/customerorder/vistpayget' + app.globalData.suf,
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
            icon: 'none'
          })
        }
        if (res.data.status === 'success') {
          self.setData({
            sumPrice : res.data.jsonobject.sumprice,
            info : res.data.jsonobject,
            createDate : res.data.jsonobject.createdate
          })
          if (res.data.jsonobject.orderStatus!=100 && res.data.jsonobject.orderStatus!=101) {
            wx.reLaunch({url: '/pages/home/home'})
          }
          self.countTime()
        }
      },
      fail: function (res) {
        console.log(res)
        wx.hideLoading()
        wx.showToast({
          title: '请求失败',
          icon: 'none'
        })
      }
    })
  },

  /*剩余时间戳*/
  overTime() {
    let self = this
    var date = new Date();
    var now = date.getTime();
    var end = parseInt(this.data.createDate) + 1000 * 60 * 15;
    return end - now - 500;
  },

  /*倒计时*/
  countTime() {
    let self = this
    let _overTime = self.overTime()
    if(_overTime <= 0) { // 倒计完
      clearTimeout(self.data.setTimeObj)
      self.cancelOrder()
      return
    }
    if(_overTime > 0) {
      self.data.mTime = Math.floor(_overTime / 1000 / 60 % 60) + ":";
      self.data.sTime = Math.floor(_overTime / 1000 % 60);
      self.setData({
        mTime : self.data.mTime,
        sTime : self.data.sTime
      })
    }
    self.data.setTimeObj = setTimeout(self.countTime, 1000);
  },

  // 选择支付方式
  checkPay(e) {
    let index = e.currentTarget.dataset.opt
    let _payType = this.data.payType
    if(!_payType || (_payType != this.data.payModes[index].code)) {
      this.setData({
        payType: this.data.payModes[index].code
      })
      let _payCheck = 'this.payModes[i].check'
      for(let i = 0; i < this.data.payModes.length; i++) {
        if(i === index) {
          this.setData({
            [_payCheck]: true
          })
        } else {
          this.setData({
            [_payCheck]: false
          })
        }
      }
    }
  },

  // 取消订单
  cancelOrder() {
    let self = this;  
    let _opt = getCurrentPages()[getCurrentPages().length-1].options
    let _submitData = {
      tenantId: wx.getStorageSync('xmTenantId'),
      userId: wx.getStorageSync('xmUserId'),
      orderCode: _opt.orderCode,
      createDate: _opt.createDate
    }
    wx.showLoading({title: '支付超时处理'})
    wx.request({
      url: app.globalData.httpHost + '/business/order/vistordercancel' + app.globalData.suf,
      data: _submitData,
      method: 'POST',
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
            title: '超过支付时限，订单已取消',
            icon: 'none',
            duration: 2000
          })
          setTimeout(function () {
            wx.reLaunch({url: '/pages/home/home'})
          }, 2000)
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

  // 确认支付
  confirmPay() { 
    var that = this;  
    wx.login({
      success:function(loginRes){
        if (loginRes.code){
          that.requestPayment(loginRes.code);
        }else{
          wx.showToast({
            title: '登录获取CODE失败，请重新操作',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail:function(err){
        wx.showToast({
          title: '登录获取CODE失败，请重新操作',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  // 支付处理
  requestPayment(code){
    var that = this;
    console.log(that.data.paymentFlag)
    if (!that.data.paymentFlag){
      wx.showToast({
        title: '请不要重复提交',
        icon: 'none',
        duration: 2000
      })
      return;
    }
    wx.showLoading({ title: '处理中', mask:true })
    that.setData({
      paymentFlag:false
    })
    let self = this
    let _opt = getCurrentPages()[getCurrentPages().length - 1].options
    let _opts = {}
    if (_opt.createDate) {
      _opts = {
        tenantId: wx.getStorageSync('xmTenantId'),
        userId: wx.getStorageSync('xmUserId'),
        mac: wx.getStorageSync('xmMac'),
        payType: self.data.payType,
        createDate: _opt.createDate,
        code:code,
        xcxName: 'simple'
      }
    } else {
      _opts = {
        tenantId: wx.getStorageSync('xmTenantId'),
        userId: wx.getStorageSync('xmUserId'),
        mac: wx.getStorageSync('xmMac'),
        payType: self.data.payType,
        orderCode: _opt.orderCode,
        code: code,
        xcxName: 'simple'
      }
    }
    console.log("支付发给后台的参数：")
    console.log(_opts)
    wx.request({
      url: app.globalData.httpHost + '/business/customerorder/vistpaysave' + app.globalData.suf,
      method: 'POST',
      data: _opts,
      success: function (res) {
        console.log("支付后台返回数据：");
        console.log(res);
        wx.hideLoading();
        if (res.data.status === 'success' && res.data.weixinreturn) {
          wx.requestPayment({
            timeStamp: res.data.weixinreturn.timestamp,
            nonceStr: res.data.weixinreturn.nonce_str,
            package: res.data.weixinreturn.prepay_id,
            signType: res.data.weixinreturn.sing_type,
            paySign: res.data.weixinreturn.sign,
            success: function (payRes) {
              console.log(payRes)
              wx.showToast({
                title: '支付成功',
                icon: 'none',
                duration: 500
              })
              clearTimeout(self.data.setTimeObj)
              setTimeout(function () {
                wx.reLaunch({url: '/pages/paynote/paynote?sum=' + self.data.sumPrice})
              },550)
            },
            fail: function (res) {
              console.log(res);
              that.setData({
                paymentFlag: true
              })
            }
          })
        } else {
          that.setData({
            paymentFlag: true
          })
          wx.showToast({
            title: '获取参数失败，请重新请求',
            icon: 'none',
            duration: 2000
          })
        }

      },
      fail: function (err) {
        wx.hideLoading();
        that.setData({
          paymentFlag: true
        })
        wx.showToast({
          title: '请求服务器失败，请重新操作',
          icon: 'none',
          duration: 3000
        })
      }
    })
  }


})