var loadResources = require('./resources')
var converter = require('../util/color-converter')

var express = require('express')
var router = express.Router()
var mqtt = require('mqtt')

var bulbvalues = {power: 'power', brightness: 'color.brightness', saturation: 'color.saturation', hue: 'color.hue'}

loadResources(function (err, devices, client) {
  if (err) throw err

  router.get('/Lifx/:id', function (req, res, next) {
    client.light(req.params.id).getState(function (err, data) {
      if (err) return res.status(404).send('Device not found')

      if (!Object.keys(req.query).length) return res.json(_parseLifx(data))
      var response = {}
      Object.keys(req.query).forEach(function (key) {
        if (key === 'color') {
          response['color'] = { hex: converter.hsv2Hex(data.hue, data.saturation, data.brightness),
            rgb: converter.hsv2Rgb(data.hue, data.saturation, data.brightness)
          }
        }
        if (bulbvalues[key]) response[key] = data[bulbvalues[key]]
      })
      if (Object.keys(response).length) return res.json(response)
      return res.status(202).send('Values not available on this philips-hue bulb')
    })
  })

  router.get('/discover', function (req, res, next) {
    loadResources(function (err, devices, client) {
      if (err) return res.status(500).send(err)
      return res.json(devices)
    })
  })

  router.post('/Lifx/:id', function (req, res, next) {

    if (req.body.power) {
      if (req.body['power']) client.light(req.params.id).on()
      else client.light(req.params.id).off()
    }
    if (req.body.color) {
      if (typeof (req.body.color) === 'string') {
        var hsv = converter.hex2Hsv(req.body.color)
        client.light(req.params.id).color(hsv[0].hue, hsv[0].saturation, hsv[0].brightness)
      } else if (typeof (req.body.color) === 'object') {
        if (req.body.color.r && req.body.color.g && req.body.color.b) {
          var hsv = converter.rgb2Hsv(req.body.color.r, req.body.color.g, req.body.color.b)
          client.light(req.params.id).color(hsv[0].hue, hsv[0].saturation, hsv[0].brightness)
        } else {
          return res.status(400).send('Incorrect color format')
        }
      } else return res.status(400).send('Incorrect color format')
    }
    if ((req.body.hue || req.body.saturation || req.body.brightness) && !req.body.color) {
      client.light(req.params.id).getState(function (err, data) {
        if (err) return res.status(404).send('Device not found')

        // data tiene los valores actuales
        data = _parseLifx(data)
        Object.keys(req.body).forEach(function (key) {
          data[key] = _parseKeyPost(key, req.body[key])
        })

        client.light(req.params.id).color(data.hue, data.saturation, data.brightness)
      })
    }
    if (!(req.body.power || req.body.hue || req.body.saturation || req.body.brightness || req.body.color)) {
      return res.status(202).send('Values not available on this lifx bulb')
    } else {
      var client = mqtt.connect()
      client.publish('lights', JSON.stringify(req.body))
      return res.status(200).send(req.body)
    }
  })
})

function _parseKeyPost (key, value) {
  switch (key) {
    case 'hue':
      if (value > 360) value = 360
      break
    case 'saturation':
    case 'brightness':
      if (value > 100) value = 100
      break
  }
  if (value < 0) value = 0
  return value
}

function _parseLifx (data) {
  return {
    power: data.power,
    hue: data.color.hue,
    saturation: data.color.saturation,
    brightness: data.color.brightness
  }
}

module.exports = router
