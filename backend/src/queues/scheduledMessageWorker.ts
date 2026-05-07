/**
 * Scheduled Message Worker
 * Re-exports from the scheduler module for the folder structure required by the task spec.
 * The actual implementation lives in modules/scheduler/workers/message.worker.ts.
 */
export { startMessageWorker } from '../modules/scheduler/workers/message.worker';
