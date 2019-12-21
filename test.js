process.env.NODE_ENV = 'test'

const chai = require('chai')
const expect = chai.expect
const server = require('./index')

const getSchedule = (currentTime, clientInfo, deadlines) => {
  return deadlines.map(deadline => ({ ...clientInfo, deadline: currentTime + deadline }))
}

// to run a test, replace it with it.only
// don't run all tests together at once right now as they make use of file scope and globals
// if all tests are run together, state from previous tests will persist and give unexpected results/failing tests

describe('Tests', () => {
  beforeEach(() => {
    global.totalRequests = 0
    global.successfulRequests = 0
    global.clients = {}
  })

  it.only('Schedule 1 - no overload', async () => {
    const currentTime = Date.now()
    const schedule = getSchedule(currentTime, { clientId: 'A', qi: 1 }, [10, 20]).map(request => server(request))
    const responses = await Promise.all([...schedule])
    return responses.map(response => {
      expect(response).to.have.property('message','Successfully scheduled')
    })
  })

  it('Schedule 2 - simple overload', async () => {
    const currentTime = Date.now()
    const schedule1 = getSchedule(currentTime, { clientId: 'A', qi: 0.1 }, [15]).map(request => server(request))
    const schedule2 = getSchedule(currentTime, { clientId: 'B', qi: 1 }, [15]).map(request => server(request))
    const responses = await Promise.all([...schedule1, ...schedule2])
    return responses.map(response => {
      if (response.clientId === 'A') {
        expect(response).to.have.property('message','Could not schedule')
      } else {
        expect(response).to.have.property('message','Successfully scheduled')
      }
    })
  })

  it('Schedule 3 - overload example from paper', async () => {
    const currentTime = Date.now()
    const schedule1 = getSchedule(currentTime, { clientId: 'A', qi: 1 }, [30, 70, 100, 100, 140]).map(request => server(request))
    const schedule2 = getSchedule(currentTime, { clientId: 'B', qi: 1 }, [45, 50, 145, 150]).map(request => server(request))
    const schedule3 = getSchedule(currentTime, { clientId: 'C', qi: 1 }, [25, 40]).map(request => server(request))
    const responses = await Promise.all([...schedule1, ...schedule2, ...schedule3])
    return responses.map(response => {
      if (response.clientId === 'C' && response.deadline === currentTime + 25) {
        expect(response).to.have.property('message','Could not schedule')
      } else {
        expect(response).to.have.property('message','Successfully scheduled')
      }
    })
  })

  it('Schedule 4 - overload example from paper with different qi', async () => {
    const currentTime = Date.now()
    const schedule1 = getSchedule(currentTime, { clientId: 'A', qi: 0.5 }, [30, 70, 100, 100, 140]).map(request => server(request))
    const schedule2 = getSchedule(currentTime, { clientId: 'B', qi: 0.5 }, [45, 50, 145, 150]).map(request => server(request))
    const schedule3 = getSchedule(currentTime, { clientId: 'C', qi: 1 }, [25, 40]).map(request => server(request))
    const responses = await Promise.all([...schedule1, ...schedule2, ...schedule3])
    return responses.map(response => {
      if (response.clientId === 'C' && response.deadline === currentTime + 25) {
        expect(response).to.have.property('message','Could not schedule')
      } else {
        expect(response).to.have.property('message','Successfully scheduled')
      }
    })
  })

  it('Schedule 5 - overload with different qi', async () => {
    const currentTime = Date.now()
    global.totalRequests = 10
    global.successfulRequests = 10
    global.clients = {
      'A': {
        totalRequests: 0,
        successfulRequests: 0,
        si: 0
      },
      'B': {
        totalRequests: 10,
        successfulRequests: 10,
        si: 1
      }}
    const schedule1 = getSchedule(currentTime, { clientId: 'A', qi: 1 }, [15, 25]).map(request => server(request))
    const schedule2 = getSchedule(currentTime, { clientId: 'B', qi: 0.5 }, [20, 25]).map(request => server(request))
    const responses = await Promise.all([...schedule1, ...schedule2])
    return responses.map(response => {
      if (response.clientId === 'B') {
        expect(response).to.have.property('message','Could not schedule')
      } else {
        expect(response).to.have.property('message','Successfully scheduled')
      }
    })
  })
})