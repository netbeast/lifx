var request = require('request')
var LifxClient = require('node-lifx').Client
var client = new LifxClient()

var devices = []

module.exports = function (callback) {
  var objects = []
  request.get(process.env.LOCAL_URL + '/api/resources?app=lifx',
  function (err, resp, body) {
    if (err) return callback(err, null)
    if (!body || body === '[]') return callback()

    body = JSON.parse(body)

    if (body.length > 0) {
      body.forEach(function (device) {
        if (objects.indexOf(device.hook) < 0) objects.push(device.hook)
      })
    }
  })

  client.on('light-new', function registerLight (light) {
    if (devices.indexOf(light) < 0) devices.push(light)
    var indx = objects.indexOf('/Lifx/' + light.id)
    if (indx >= 0) {
      objects.splice(indx, 1)
    } else {
      request.post({url: process.env.LOCAL_URL + '/resources',
      json: {
        app: 'lifx',
        location: 'none',
        topic: 'lights',
        groupname: 'none',
        hook: '/Lifx/' + light.id
      }},
      function (err, resp, body) {
        if (err) callback(err, null)
        else devices.push(light)
      })
    }
  })

  client.on('light-online', function (light) {
    if (devices.indexOf(light) < 0) devices.push(light)
    var indx = objects.indexOf('/Lifx/' + light.id)
    if (indx >= 0) {
      objects.splice(indx, 1)
    } else {
      request.post({url: process.env.LOCAL_URL + '/resources',
      json: {
        app: 'lifx',
        location: 'none',
        topic: 'lights',
        groupname: 'none',
        hook: '/Lifx/' + light.id
      }},
      function (err, resp, body) {
        if (err) callback(err, null)
        else devices.push(light)
      })
    }
  })

  client.on('light-offline', function (light) {
    request.del(process.env.LOCAL_URL + '/resources?hook=/Lifx/' + light.id,
    function (err, resp, body) {
      if (err) callback(err, null)
    })
  })

  client.init()

  client.startDiscovery()

  setTimeout(function () {
    client.stopDiscovery()
    if (objects.length > 0) {
      objects.forEach(function (hooks) {
        request.del(process.env.LOCAL_URL + '/api/resources?hook=' + hooks,
        function (err, resp, body) {
          if (err) callback(err, null)
        })
      })
    }
    callback(null, devices, client)
    client = null
    devices = []
  }, 7000)
}
