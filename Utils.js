class Utils {
  delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

module.exports = Utils