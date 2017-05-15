String.prototype.trail = function (length) {
  return this.length > length ? this.substring(0, length) + "..." : this;
}
