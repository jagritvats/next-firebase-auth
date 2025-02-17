// Allow importing firebase-admin as wildcard.
/* eslint-disable no-import-assign */

import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app'
import { setConfig } from 'src/config'
import createMockConfig from 'src/testHelpers/createMockConfig'
import logDebug from 'src/logDebug'

jest.mock('firebase-admin')
jest.mock('src/config')
jest.mock('src/logDebug')

beforeEach(() => {
  const mockConfig = createMockConfig({ clientSide: false })
  setConfig(mockConfig)

  getApps.mockReturnValue([])
  cert.mockImplementation((obj) => ({
    ...obj,
    _mockFirebaseCert: true,
  }))
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('initFirebaseAdminSDK', () => {
  it('calls initializeApp with the expected values', () => {
    expect.assertions(1)
    const initFirebaseAdminSDK = require('src/initFirebaseAdminSDK').default
    initFirebaseAdminSDK()
    expect(initializeApp).toHaveBeenCalledWith({
      credential: {
        _mockFirebaseCert: true,
        clientEmail: 'my-example-app@example.com',
        privateKey: 'fakePrivateKey123',
        projectId: 'my-example-app',
      },
      databaseURL: 'https://my-example-app.firebaseio.com',
    })
  })

  it('calls initializeApp with application default credentials if useFirebaseAdminDefaultCredential set to true', () => {
    expect.assertions(2)
    const mockConfig = createMockConfig({ clientSide: false })
    setConfig({
      ...mockConfig,
      firebaseAdminInitConfig: undefined,
      useFirebaseAdminDefaultCredential: true,
    })
    const initFirebaseAdminSDK = require('src/initFirebaseAdminSDK').default
    applicationDefault.mockReturnValue({
      _mockFirebaseDefaultCred: true,
    })
    initFirebaseAdminSDK()
    expect(applicationDefault).toHaveBeenCalled()
    expect(initializeApp).toHaveBeenCalledWith({
      credential: {
        _mockFirebaseDefaultCred: true,
      },
    })
  })

  it('returns undefined', () => {
    expect.assertions(1)
    const initFirebaseAdminSDK = require('src/initFirebaseAdminSDK').default
    const response = initFirebaseAdminSDK()
    expect(response).toBeUndefined()
  })

  it('does not call initializeApp if Firebase already has an initialized app', () => {
    expect.assertions(1)
    getApps.mockReturnValue([{ some: 'app' }])
    const initFirebaseAdminSDK = require('src/initFirebaseAdminSDK').default
    initFirebaseAdminSDK()
    expect(initializeApp).not.toHaveBeenCalled()
  })

  it('throws if config.firebaseAdminInitConfig is not set and no app is initialized', () => {
    expect.assertions(1)
    const mockConfig = createMockConfig({ clientSide: false })
    setConfig({
      ...mockConfig,
      firebaseAdminInitConfig: undefined,
    })
    const initFirebaseAdminSDK = require('src/initFirebaseAdminSDK').default
    expect(() => {
      initFirebaseAdminSDK()
    }).toThrow(
      'Missing firebase-admin credentials in next-firebase-auth. Set "firebaseAdminInitConfig", "useFirebaseAdminDefaultCredential", or initialize firebase-admin yourself.'
    )
  })

  it('does not throw if config.firebaseAdminInitConfig is not set but a Firebase app is already initialized', () => {
    expect.assertions(1)
    const mockConfig = createMockConfig({ clientSide: false })
    setConfig({
      ...mockConfig,
      firebaseAdminInitConfig: undefined,
    })
    getApps.mockReturnValue([{ some: 'app' }])
    const initFirebaseAdminSDK = require('src/initFirebaseAdminSDK').default
    expect(() => {
      initFirebaseAdminSDK()
    }).not.toThrow()
  })

  it('calls logDebug when initializing the admin app', () => {
    expect.assertions(1)
    const initFirebaseAdminSDK = require('src/initFirebaseAdminSDK').default
    initFirebaseAdminSDK()
    expect(logDebug).toHaveBeenCalledWith(
      '[init] Initialized the Firebase admin SDK.'
    )
  })

  it('does not call logDebug when not initializing a new app', () => {
    expect.assertions(1)
    getApps.mockReturnValue([{ some: 'app' }])
    const initFirebaseAdminSDK = require('src/initFirebaseAdminSDK').default
    initFirebaseAdminSDK()
    expect(logDebug).not.toHaveBeenCalled()
  })
})
