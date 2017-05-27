String.prototype.trail = function (length) {
  return this.length > length ? this.substring(0, length) + "..." : this;
}

// collapse navbar toggle when clicking nav item
$(document).on('click', '.navbar-collapse.show', function (e) {
  if ($(e.target).is('a') && ($(e.target).attr('class') != 'dropdown-toggle')) {
    try {
      $(this).collapse('hide');
    } catch (e) {
      void (e);
    }
  }
});
