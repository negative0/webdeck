interface WakeLock {
  request(type: 'screen'): Promise<WakeLockSentinel>;
}

interface WakeLockSentinel extends EventTarget {
  readonly released: boolean;
  readonly type: 'screen';
  release(): Promise<void>;
}

interface Navigator {
  wakeLock?: WakeLock;
}
