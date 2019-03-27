
Page({

  data: {
    pageTitle: '购物车',
    /*购物车缓存*/
    orderStorage: {
      sumNum: 0,
      sumPrice: 0,
      list: [],
      shopIds: []
    },
    /*滑动删除obj*/
    delObj: {
      x:null,
      y:null,
      X:null,
      Y:null,
      swipeX:null,
      swipeY:null
    },
    delOpen: [],
    /*订单列表*/
    orderLists: [],
    /*订单数*/
    orderLen: 0,
    /*店铺被选标记*/
    flagShops: [],
    /*商品被选标记*/
    flagGoods: [],
    /*总全选*/
    allSelect: false,
    /*判断购物车是否为空*/
    flag: false,
    /*合计总价格*/
    totalPrice: 0,
    /*合计总数量*/
    totalNumber: 0,
    /*添加最大数量*/
    // maxNum: 1000,
	},

  onShow: function () {

  },

  onLoad: function (options) {

    this.getOrderList();

    wx.showLoading({title: '加载中'})
    setTimeout(function() {wx.hideLoading()}, 1000)
    let self = this

    setTimeout(function () {
      self.checkAll()
    }, 0)
  },

  /*路由*/
  goHome () { wx.reLaunch({url: '/pages/home/home'})},
  goDetail (e) {
    let _id = e.currentTarget.dataset.opt
    wx.navigateTo({url: '/pages/detail/detail?id=' + _id})
  },

  /*缓存中创建订单列表*/
  getOrderList () {
    let _sList = []
    let _shopIds = []
    if (wx.getStorageSync('xmOrderStorage')) {
      this.data.orderStorage = wx.getStorageSync('xmOrderStorage')
      _sList = this.data.orderStorage.list
      _shopIds = this.data.orderStorage.shopIds
    }

    let _orderObj = {}
    _orderObj.sumNum = this.data.orderStorage.sumNum
    _orderObj.sumPrice = this.data.orderStorage.sumPrice
    _orderObj.list = []

    if (_shopIds.length > 0) {
      for (let i = 0; i <_shopIds.length; i ++) {
        _orderObj.list[i] = {}
        _orderObj.list[i].totalNumber = 0
        _orderObj.list[i].totalPrice = 0
        _orderObj.list[i].goodsList = []
        for (let j = 0; j < _sList.length; j ++) {
          if (parseInt(_sList[j].shopId) === _shopIds[i]) {
            _orderObj.list[i].shopId = parseInt(_sList[j].shopId)
            _orderObj.list[i].shopName = _sList[j].shopName
            _orderObj.list[i].shopLogo = _sList[j].shopLogo
            _orderObj.list[i].totalNumber += _sList[j].goodsNumber
            _orderObj.list[i].totalPrice += _sList[j].goodsPrice * _sList[j].goodsNumber
            _orderObj.list[i].goodsList.push(_sList[j])
          }
        }
      }
    }
    let _orderLists = _orderObj.list
    let _flag = _orderLists.length > 0 ? true : false
    this.setData({
      orderLists: _orderLists,
      flag: _flag,
      orderLen: _orderLists.length,
      totalNumber: this.data.orderStorage.sumNum,
      totalPrice: this.data.orderStorage.sumPrice
    })

    for (let i = 0; i < this.data.orderLen; i ++) {
      this.data.flagGoods[i] = []
    }
    this.setData({
      flagGoods: this.data.flagGoods
    })

    let _list = this.data.orderLists
    for (let x = 0; x < _list.length; x ++) {
      let _list2 = _list[x].goodsList
      for (let y = 0; y < _list2.length; y ++) {
        _list2[y].delOpen = false
      }
    }
  },

  /*添加数量*/
  addNum (e) {
    let _opt = e.currentTarget.dataset.opt.split(',')
    let num = _opt[0]
    let i1 = _opt[1]
    let i2 = _opt[2]
    let _info = this.data.orderLists[i1].goodsList[i2]
    if (num >= _info.inventory) {
      wx.showToast({
        title: '此规格没有库存了~',
        icon: 'none',
        duration: 2000
      })
    }
    else {
      _info.goodsNumber = num * 1 + 1;

      this.data.orderStorage.sumNum ++
      this.data.orderStorage.sumPrice += parseInt(_info.goodsPrice)
      let _sList = this.data.orderStorage.list
      for (let i = 0; i < _sList.length; i ++) {
        if (_sList[i].prodId === this.data.orderLists[i1].goodsList[i2].prodId) {
          _sList[i].goodsNumber = num * 1 + 1;
        }
      }

      let _list = this.data.orderLists[i1]
      _list.totalNumber += 1
      _list.totalPrice += _list.goodsList[i2].goodsPrice
      this.setData({
        orderLists: this.data.orderLists
      })
      wx.setStorageSync('xmOrderStorage',this.data.orderStorage) 
    }
    this.allSum();
  },

  /*减少数量*/
  subNum (e) {
    let _opt = e.currentTarget.dataset.opt.split(',')
    let num = _opt[0]
    let i1 = _opt[1]
    let i2 = _opt[2]
    if (2 > num ) { // 小于最小值
      this.data.orderLists[i1].goodsList[i2].goodsNumber = 1;
    }
    else {
      let _info = this.data.orderLists[i1].goodsList[i2]
      _info.goodsNumber = num * 1 - 1;

      this.data.orderStorage.sumNum --
      this.data.orderStorage.sumPrice -= parseInt(_info.goodsPrice)
      let _sList = this.data.orderStorage.list
      for (let i = 0; i < _sList.length; i ++) {
        if (_sList[i].prodId === this.data.orderLists[i1].goodsList[i2].prodId) {
          _sList[i].goodsNumber = num * 1 - 1;
        }
      }

      let _list = this.data.orderLists[i1]
      _list.totalNumber -= 1
      _list.totalPrice -= _list.goodsList[i2].goodsPrice

      this.setData({
        orderLists: this.data.orderLists
      })
      wx.setStorageSync('xmOrderStorage',this.data.orderStorage)
      this.allSum();
    }
  },

  /*删除商品*/
  delGood (e) {
    let _opt = e.currentTarget.dataset.opt.split(',')
    let i1 = _opt[0]
    let i2 = _opt[1]
    let self = this;
    if (confirm('确定删除此条目吗?')) {

      let _oObj = JSON.parse(JSON.stringify(this.data.orderLists[i1]))
      let _sObj = JSON.parse(JSON.stringify(this.data.orderStorage))
      let _olist = _oObj.goodsList
      let _sList = _sObj.list

      this.delShopId(this.data.orderStorage,_oObj.shopId)
      for (let i = 0; i < _sList.length; i ++) {
        if (_sList[i].prodId === _olist[i2].prodId) {
          this.data.orderStorage.sumNum -=_sList[i].goodsNumber
          this.data.orderStorage.sumPrice -= parseInt(_sList[i].goodsPrice * _sList[i].goodsNumber)
          this.data.orderStorage.list.splice(i,1)
          break          
        }
      }

      let _list = this.data.orderLists[i1]
      _list.totalNumber -= _list.goodsList[i2].goodsNumber
      _list.totalPrice -= _list.goodsList[i2].goodsPrice * _list.goodsList[i2].goodsNumber
      if (_olist.length <= 1) {
        if (this.data.orderLists.length <= 1) {
          this.data.orderLists = []
        } else {
          this.data.orderLists.splice(i1,1)
        }
      } else {
        this.data.orderLists[i1].goodsList.splice(i2,1)
      }

      if (!this.data.orderLists.length) { this.data.flag = 0}
      this.setData({
        orderLists: this.data.orderStorage,
        orderLen : this.data.orderLists.length,
        flag: this.data.flag
      })
      wx.setStorageSync('xmOrderStorage',this.data.orderStorage)
      this.allSum();
    }
  },

  // 缓存删除shopId
  delShopId (obj,shopId) {
    let _sList = obj.list
    let flag1 = 0
    if (_sList.length > 0) {
      for (let x = 0; x < _sList.length; x ++) {
        if (parseInt(_sList[x].shopId) === parseInt(shopId)) {
          flag1 ++
        }
      }
    }
    let _shopIds = obj.shopIds
    if (_shopIds.length > 0) {
      for (let z = 0; z < _shopIds.length; z ++) {
        if (parseInt(_shopIds[z]) === parseInt(shopId)) {
          if (flag1 < 2) { // 缓存list未删前有1条此shopId数据(即删后没记录)
            obj.shopIds.splice(z,1)
          }
        }
      }
    }
  },

  /*本店清空*/
  delShop (e) {
    let self = this
    let index = e.currentTarget.dataset.opt
    wx.showModal({
      content: "确定要清空此店铺的商品吗？",
      success: function (res) {
        if (res.confirm) {
          let newObj = wx.getStorageSync('xmOrderStorage')
          let _list = self.data.orderLists[index].goodsList
          for (let j = 0; j < _list.length; j ++) {
            let prodId = _list[j].prodId
            for (let x = 0; x < newObj.list.length; x ++) {
              if (prodId === newObj.list[x].prodId) {
                self.delShopId(newObj,newObj.list[x].shopId)
                newObj.sumNum -= newObj.list[x].goodsNumber
                newObj.sumPrice -= newObj.list[x].goodsPrice * newObj.list[x].goodsNumber
                self.data.totalNumber -= newObj.list[x].goodsNumber
                self.data.totalPrice -= newObj.list[x].goodsPrice * newObj.list[x].goodsNumber
                newObj.list.splice(x,1)
              }
            }
          }         
          self.data.orderLists.splice(index,1)
          self.data.orderLen --
          if (!self.data.orderLists.length) {
            self.data.flag = 0
            newObj = ''
          }
          self.setData({
            orderStorage: newObj,
            orderLists: self.data.orderLists,
            totalPrice: self.data.totalPrice,
            totalNumber: self.data.totalNumber,
            flag: self.data.flag
          })
          wx.setStorageSync('xmOrderStorage',newObj)
        }
      }
    })
  },


  /*勾选店铺*/
  checkShop (e) {
    let index = e.currentTarget.dataset.opt
    let _gFlag2 = this.data.flagGoods[index];
    let _sFlag = this.data.flagShops;
  
    let _list0 = this.data.orderLists[index]
    let _list = _list0.goodsList
    _list0.totalNumber = 0
    _list0.totalPrice = 0
    if (!_sFlag[index]) {
      for (let i = 0; i < _list.length; i ++) {
        _list0.totalNumber += _list[i].goodsNumber
        _list0.totalPrice += _list[i].goodsPrice * _list[i].goodsNumber
      }
    }
    for (let i = 0; i < _list.length; i ++) {
      _gFlag2[i] = !_sFlag[index]
    }
    _sFlag[index] = !_sFlag[index]
    this.setData({
      flagShops: this.data.flagShops,
      flagGoods: this.data.flagGoods
    })
    this.ifAllShopSel();
    this.allSum();
  },

  /*勾选商品*/
  checkGood (e) {
    let _opt = e.currentTarget.dataset.opt.split(',')
    let index = _opt[0]
    let i = _opt[1]
    let _gFlag = this.data.flagGoods;

    let _list0 = this.data.orderLists[index]
    let _list = _list0.goodsList[i]
    if (_gFlag[index][i]) {
      _list0.totalNumber -= _list.goodsNumber
      _list0.totalPrice -= _list.goodsPrice * _list.goodsNumber
    } else {
      _list0.totalNumber += _list.goodsNumber
      _list0.totalPrice += _list.goodsPrice * _list.goodsNumber
    }
    _gFlag[index][i] = !_gFlag[index][i]
    this.setData({
      flagGoods: this.data.flagGoods
    })
    this.ifCurShopSel(_gFlag,index);
    this.ifAllShopSel();
    this.allSum();
  },
  /*是否全选*/
  ifAllShopSel () {
    for (let i = 0; i < this.data.orderLen; i ++ ) {
      if (!this.data.flagShops[i]) {
        this.setData({
          allSelect: false
        })
        return false;
      }
    }
    this.setData({
      allSelect: true
    })
  },
  /*本店是否全选*/
  ifCurShopSel (flagGoods,index) {
    let len = flagGoods[index].length;
    for (let i = 0; i < len; i ++) {
      if (!flagGoods[index][i]) {
        this.data.flagShops[index] = false
        this.setData({
          flagShops: this.data.flagShops
        })
        return false;
      }
    }
    this.data.flagShops[index] = true
    this.setData({
      flagShops: this.data.flagShops
    })
  },
  /*合计*/
  allSum () {
    this.data.totalPrice = 0.00;
    this.data.totalNumber = 0;
    let _orders = this.data.orderLists
    for (let i = 0; i < this.data.orderLen; i ++ ) {
      for (let j = 0; j < _orders[i].goodsList.length; j ++) {
        let _orders2 = _orders[i].goodsList[j]
        if ( this.data.flagGoods[i][j] ) {
          this.data.totalPrice += _orders2.goodsPrice * _orders2.goodsNumber;
          this.data.totalNumber += _orders2.goodsNumber;
        }
      }
    }
    this.setData({
      totalNumber: this.data.totalNumber,
      totalPrice: this.data.totalPrice
    })
  },
  /*全选*/
  checkAll () {
    this.data.allSelect = !this.data.allSelect;
    this.setData({
      allSelect: this.data.allSelect
    })
    for (let j = 0; j < this.data.orderLen; j ++) {
      this.data.flagShops[j] = this.data.allSelect
      this.setData({
        flagShops: this.data.flagShops
      })
      
      let _list = this.data.orderLists[j]
      let _list2 = _list.goodsList
      _list.totalNumber = 0
      _list.totalPrice = 0
      if (this.data.allSelect) {
        for (let x = 0; x < _list2.length; x ++) {
          _list.totalNumber += _list2[x].goodsNumber
          _list.totalPrice += _list2[x].goodsPrice * _list2[x].goodsNumber
        }
      }
      for (let i = 0; i < _list2.length; i ++) {
        this.data.flagGoods[j][i] = this.data.allSelect
      }
      this.setData({
        flagGoods: this.data.flagGoods
      })
    }
    this.allSum();
  },

  /*结算*/
  settlement () {
    if ( 0 === this.data.totalNumber ) {
      wx.showToast({
        title: '至少选中一个商品',
        icon: 'none',
        duration: 2000
      })
      return false;
    }
    let self = this;
    let goods = self.data.flagGoods;
    let settleObj = wx.getStorageSync('xmOrderStorage')
    for (let i = 0; i < goods.length; i ++) {
      for (let j = 0; j < goods[i].length; j ++) {
        if ( false === goods[i][j] ) {
          let prodId = this.data.orderLists[i].goodsList[j].prodId
          for (let x = 0; x < settleObj.list.length; x ++) {
            if (prodId === settleObj.list[x].prodId) {
              self.delShopId(settleObj,settleObj.list[x].shopId)
              settleObj.sumNum -= settleObj.list[x].goodsNumber
              settleObj.sumPrice -= settleObj.list[x].goodsPrice * settleObj.list[x].goodsNumber
              settleObj.list.splice(x,1)
            }
          }
        }
      }
    }
    wx.setStorageSync('xmSettleStorage',settleObj)
    wx.navigateTo({url: '/pages/settle/settle'})
  },

})