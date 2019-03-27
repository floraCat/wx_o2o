
/*axios加载前的loading图标*/

function Loading () {
	this.axiosIndex = 0
	this.axiosStoMin = null
	this.axiosStoMin_ = false
	this.axiosStoMax = null
}

Loading.prototype.resetLoading = function () {
	let temp = document.getElementById("axiosLoading")
	if (temp) { temp.parentNode.removeChild(temp)}
	clearTimeout(this.axiosStoMin)
	clearTimeout(this.axiosStoMax)
	this.axiosIndex = 0
	this.axiosStoMin = null
	this.axiosStoMin_ = false
	this.axiosStoMax = null
}

Loading.prototype.addLoading = function () {
	let self = this
	this.axiosIndex += 1
	if (!document.getElementById("axiosLoading")) {
		let child = document.createElement("div")
		child.id = 'axiosLoading'
		document.getElementsByTagName('body')[0].appendChild(child);
		this.axiosStoMin = setTimeout(function () {
			self.axiosStoMin_ = true
			if (self.axiosIndex === 0) {
				self.resetLoading()
			}
		}, 600)
		this.axiosStoMax = setTimeout(function () {
			self.resetLoading()
		}, 6000)
	}
}

Loading.prototype.delLoading = function () {
	this.axiosIndex -= 1
	if (this.axiosStoMin_) {
		if (this.axiosIndex === 0) {
			Loading.prototype.resetLoading()
		}
	}
}

let rs = new Loading()

export default rs