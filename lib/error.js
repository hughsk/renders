var previous

module.exports = error
module.exports.clear = clear

function error(message) {
  var element = document.createElement('div')

  clear()

  element.classList.add('error-message')
  element.innerHTML = message

  document.body.appendChild(element)
  previous = hide

  function hide() {
    if (element.parentNode) {
      element.parentNode.removeChild(element)
    }
  }
}

function clear() {
  if (!previous) return

  previous()
  previous = null
}
