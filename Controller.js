const TinyQueue = require('tinyqueue')

class Controller {
  constructor(takenQueue, droppedQueue, occupancyChart) {
    this.takenQueue = takenQueue
    this.droppedQueue = droppedQueue
    this.occupancyChart = occupancyChart
  }

  // Assume all request have equal service time for now
  // sigma = 10 seconds
  handleRequest(request) {
    const { clientId, deadline } = request
    global.totalRequests = global.totalRequests + 1
    global.clients[clientId].totalRequests = global.clients[clientId].totalRequests + 1
    const currentTime = Date.now()
    // while R1 ≤ Tnow do
    // Remove S1 and re-number segments
    while (this.occupancyChart[0][1] < currentTime) {
      this.occupancyChart.shift()
    }

    //if L1 < Tnow then
    // L1 = Tnow
    if (this.occupancyChart[0][0] < currentTime) {
      this.occupancyChart[0][0] = currentTime
    }

    // Adding r to the occupancy chart

    // Add r to the taken queue
    this.takenQueue.push(request)

    // Find Sk, where dr, where Rk < dr < Lk+1 or
    // Lk ≤ dr ≤ Rk
    let i
    for (i = 0; i < this.occupancyChart.length; i++) {
      const segmentn = this.occupancyChart[i]
      const segmentn1 = this.occupancyChart[i + 1]

      if (deadline < this.occupancyChart[0][0]) {
        const newSegment = [deadline - 10, deadline]
        this.occupancyChart.splice(0, 0, newSegment)
        break
      } else if (segmentn[1] < deadline && deadline < segmentn1[0]) {
        const newSegment = [deadline - 10, deadline]
        this.occupancyChart.splice(i + 1, 0, newSegment)
        i = i + 1
        break
      } else if (segmentn[0] <= deadline && deadline <= segmentn[1]) {
        this.occupancyChart[i][0] = segmentn[0] - 10
        break
      }
    }

    // Merging the overlapping segments
    while(i > 0 && this.occupancyChart[i - 1][1] >= this.occupancyChart[i][0]) {
      this.occupancyChart[i-1][0] = this.occupancyChart[i-1][0] - (this.occupancyChart[i-1][1] - this.occupancyChart[i][0])
      this.occupancyChart[i-1][1] = this.occupancyChart[i][1]
      this.occupancyChart.splice(i, 1)
      i = i - 1
    }

    // Handling request overloading
    if (this.occupancyChart[0][0] < Date.now()) {
      // normally remove request based on condition below
      // for now just remove the request with earliest deadline in the first segment
      // Let i be the client with the highest si/qi value that
      // has a request rˆ in S1
      const droppedRequest = this.removeFromPriorityQueue(this.takenQueue, Math.ceil((this.occupancyChart[0][1] - this.occupancyChart[0][0]) / 10))
      this.droppedQueue.push(droppedRequest)
      this.occupancyChart[0][0] = this.occupancyChart[0][0] + 10
    }
  }

  removeFromPriorityQueue(queue, size) {
    const temp = []
    let ratio = -1
    let reqToDrop
    while (size) {
      const current = queue.pop()
      const { clientId, qi } = current
      const { si } = global.clients[clientId]
      if (si/qi > ratio) {
        if (reqToDrop) {
          temp.push(reqToDrop)
        }
        ratio = si/qi
        reqToDrop = current
      } else {
        temp.push(current)
      }
      size = size - 1
    }
    temp.forEach(item => queue.push(item))
    return reqToDrop
  }
}

module.exports = Controller