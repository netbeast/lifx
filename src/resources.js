var request = require('request')
var LifxClient = require('node-lifx').Client
var client = new LifxClient()

var devices = []

module.exports = function (callback) {
  var objects = []

  request.get('http://' + process.env.NETBEAST + '/api/resources?app=lifx',
  function (err, resp, body) {
    if (err) return callback(err, null)
    if (body || body !== '') {
      body = JSON.parse(body)

      if (body.length > 0) {
        body.forEach(function (device) {
          if (objects.indexOf(device.hook) < 0) objects.push(device.hook)
        })
      }
    }
    client.init()
    client.startDiscovery()
  })

  client.on('light-new', function registerLight (light) {
    if (devices.indexOf(light) < 0) devices.push(light)
    var indx = objects.indexOf('/Lifx/' + light.id)
    if (indx >= 0) {
      objects.splice(indx, 1)
    } else {
      request.post({url: 'http://' + process.env.NETBEAST + '/api/resources',
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
      request.post({url: 'http://' + process.env.NETBEAST + '/api/resources',
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
    request.del('http://' + process.env.NETBEAST + '/api/resources?hook=/Lifx/' + light.id,
    function (err, resp, body) {
      if (err) callback(err, null)
    })
  })

  setTimeout(function () {
    client.stopDiscovery()
    if (objects.length > 0) {
      objects.forEach(function (hooks) {
        request.del('http://' + process.env.NETBEAST + '/api/resources?hook=' + hooks,
        function (err, resp, body) {
          if (err) callback(err, null)
        })
      })
    }
    callback(null, devices, client)
    client = null
    devices = []
  }, 20000)
}
