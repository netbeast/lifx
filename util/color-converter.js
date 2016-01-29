
const RGB_MAX = 255
const HUE_MAX = 360
const SV_MAX = 100

module.exports = {
  rgb2Hsv: function (r, g, b) {
    // It converts [0,255] format, to [0,1]
    r = r % RGB_MAX / parseFloat(RGB_MAX)
    g = g % RGB_MAX / parseFloat(RGB_MAX)
    b = b % RGB_MAX / parseFloat(RGB_MAX)

    var max = Math.max(r, g, b)
    var min = Math.min(r, g, b)
    var h
    var s
    var v = max

    var d = max - min

    s = max === 0 ? 0 : d / max

    if (max === min) {
      h = 0 // achromatic
    } else {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / d + 2
          break
        case b:
          h = (r - g) / d + 4
          break
      }
      h /= 6
    }

    return [{
      hue: Math.floor(h * 360),
      saturation: Math.floor(s * 100),
      brightness: Math.floor(v * 100)
    }]
  },

  hsv2Rgb: function (h, s, v) {
    h = h === HUE_MAX ? 1 : (h % HUE_MAX / parseFloat(HUE_MAX) * 6)
    s = s === SV_MAX ? 1 : (s % SV_MAX / parseFloat(SV_MAX))
    v = v === SV_MAX ? 1 : (v % SV_MAX / parseFloat(SV_MAX))

    var i = Math.floor(h)
    var f = h - i
    var p = v * (1 - s)
    var q = v * (1 - f * s)
    var t = v * (1 - (1 - f) * s)
    var mod = i % 6
    var r = [v, q, p, p, t, v][mod]
    var g = [t, v, v, q, p, p][mod]
    var b = [p, p, t, v, v, q][mod]

    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
  },

  rgb2Hex: function (r, g, b) {
    r = Math.round(r).toString(16)
    g = Math.round(g).toString(16)
    b = Math.round(b).toString(16)

    r = r.length === 1 ? '0' + r : r
    g = g.length === 1 ? '0' + g : g
    b = b.length === 1 ? '0' + b : b

    return '#' + r + g + b
  },

  hex2Rgb: function (hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  },

  hsv2Hex: function (h, s, v) {
    var rgb = this.hsv2Rgb(h, s, v)
    return this.rgb2Hex(rgb.r, rgb.g, rgb.b)
  },

  hex2Hsv: function (hex) {
    var rgb = this.hex2Rgb(hex)
    return this.rgb2Hsv(rgb.r, rgb.g, rgb.b)
  }
}
