import { jsdom } from 'jsdom'

process.env.NODE_ENV = 'TESTING'
global.document = jsdom('<!doctype html><html><body></body></html>')
global.window = document.defaultView
global.navigator = global.window.navigator
