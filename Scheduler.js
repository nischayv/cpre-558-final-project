const _ = require('lodash')
const Utils = require('./Utils')
const utils = new Utils()

class Scheduler {
  constructor(takenQueue, droppedQueue, occupancyChart) {
    this.takenQueue = takenQueue
    this.droppedQueue = droppedQueue
    this.occupancyChart = occupancyChart
    this.results = []
    this.rejects = []
  }

  async run() {
    // const currentTime = Math.floor(Date.now() / 1000)
    const currentTime = Date.now()
    // Removing requests in the dropped queue with
    // deadlines cannot be guaranteed
    while (this.droppedQueue.peek()) {
      const { deadline } = this.droppedQueue.peek()
      if (currentTime + 10 > deadline) {
        const dq = this.droppedQueue.pop()
        const { clientId } = dq
        global.clients[clientId].si = global.clients[clientId].successfulRequests / global.clients[clientId].totalRequests
        // count dq as missed
        this.rejects.push(dq)
      } else {
        break
      }
    }

    const tq = this.takenQueue.peek()
    const dq = this.droppedQueue.peek()

    // might need error handling if queues are empty
    if (currentTime + 10 <= this.occupancyChart[0][0]) {
      if (dq) {
        // Work stealing
        const { clientId } = dq
        this.droppedQueue.pop()
        // schedule dq
        // if dq finishes within σ then
        // count dq as successful;
        // else
        // count dq as missed;
        await utils.delay(10)
        global.clients[clientId].successfulRequests = global.clients[clientId].successfulRequests + 1
        global.successfulRequests = global.successfulRequests + 1
        global.clients[clientId].si = global.clients[clientId].successfulRequests / global.clients[clientId].totalRequests
        this.results.push(dq)
      }
    } else {
      if (tq) {
        // Normal Scheduling
        const { clientId } = tq
        this.takenQueue.pop()
        // Schedule tq;
        // if tq finishes within σ then
        // count tq as successful;
        // else
        // count tq as missed;
        await utils.delay(10)
        global.clients[clientId].successfulRequests = global.clients[clientId].successfulRequests + 1
        global.successfulRequests = global.successfulRequests + 1
        global.clients[clientId].si = global.clients[clientId].successfulRequests / global.clients[clientId].totalRequests
        this.results.push(tq)
      }
    }

    setTimeout(this.run.bind(this), 1)
  }

  async getResponse(id) {
    return new Promise((resolve, reject) => {
      const timer = setInterval(() => {
        if (this.results.length) {
          const index = _.findIndex(this.results, ['id', id])
          if (index !== -1) {
            const removed = this.results.splice(index, 1)
            clearInterval(timer)
            resolve({ clientId: removed[0].clientId, deadline: removed[0].deadline, message: 'Successfully scheduled' })
            return
          }
        }

        if (this.rejects.length) {
          const index = _.findIndex(this.rejects, ['id', id])
          if (index !== -1) {
            const removed = this.rejects.splice(index, 1)
            clearInterval(timer)
            resolve({ clientId: removed[0].clientId, deadline: removed[0].deadline, message: 'Could not schedule' })
          }
        }
      }, 1)
    })
  }
}

module.exports = Scheduler