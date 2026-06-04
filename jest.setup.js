import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import { ReadableStream } from 'node:stream/web'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.ReadableStream = ReadableStream

process.env.MONGODB_URI = "mongodb://localhost:27017/test"
process.env.MONGODB_DB = "test"

if (!global.Response) {
  global.Response = class Response {};
}
if (!global.Response.json) {
  global.Response.json = (body, init = {}) => ({
    status: init.status ?? 200,
    json: async () => body,
    headers: new Map(Object.entries(init.headers || {})),
  });
}
