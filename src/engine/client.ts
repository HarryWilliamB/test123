import type { WorkerRequest, WorkerResponse } from './worker'

type Handler = (res: WorkerResponse) => void
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never
export type Request = DistributiveOmit<WorkerRequest, 'id'>

let worker: Worker | null = null
let nextId = 1
const handlers = new Map<number, Handler>()

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const h = handlers.get(e.data.id)
      if (!h) return
      h(e.data)
      if (e.data.type !== 'compare' || e.data.done) handlers.delete(e.data.id)
    }
  }
  return worker
}

/** Cancel all in-flight requests by recycling the worker. */
export function resetWorker() {
  worker?.terminate()
  worker = null
  handlers.clear()
}

export function request(req: Request, onMessage: Handler): () => void {
  const id = nextId++
  handlers.set(id, onMessage)
  getWorker().postMessage({ ...req, id } as WorkerRequest)
  return () => handlers.delete(id)
}
