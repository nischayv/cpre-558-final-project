// uncomment this for running server
// const express = require('express')
// uncomment this for running server
// const cors = require('cors')

const TinyQueue = require('tinyqueue')
const { uuid } = require('uuidv4')
const Controller = require('./Controller')
const Scheduler = require('./Scheduler')

// uncomment this for running server
// const app = express()
// app.use(express.json())
// app.use(cors())
// const port = 3000

global.totalRequests = 0
global.successfulRequests = 0
global.clients = {}

const takenQueue = new TinyQueue([], (a, b) => {
  return a.deadline - b.deadline
})
const droppedQueue = new TinyQueue([], (a, b) => {
  return a.deadline - b.deadline
})
const occupancyChart = [[Infinity, Infinity]]
const controller = new Controller(takenQueue, droppedQueue, occupancyChart)
const scheduler = new Scheduler(takenQueue, droppedQueue, occupancyChart)
scheduler.run()

// uncomment this for running server
// app.post('/', async (req, res) => {
//   const request = req.body
// if (!global.clients[request.clientId]) {
//   global.clients[request.clientId] = {
//     totalRequests: 0,
//     successfulRequests: 0,
//     si: 0
//   }
// }
//   request.id = uuid()
//   controller.handleRequest(request)
//   const result = await scheduler.getResponse(request.id)
//   if (result.error) {
//     res.sendStatus(400)
//   } else {
//     res.sendStatus(200)
//   }
// })

// app.listen(port, () => console.log(`Application listening on port ${port}!`))

// comment this for running server
const fakeServer = async (request) => {
  if (!global.clients[request.clientId]) {
    global.clients[request.clientId] = {
      totalRequests: 0,
      successfulRequests: 0,
      si: 0
    }
  }
  request.id = uuid()
  controller.handleRequest(request)
  return scheduler.getResponse(request.id)
}

// uncomment this for running server
// module.exports = app

// comment this for running server
module.exports = fakeServer