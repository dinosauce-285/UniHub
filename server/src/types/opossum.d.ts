declare module 'opossum' {
  type CircuitBreakerOptions = {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    volumeThreshold?: number;
    name?: string;
  };

  class CircuitBreaker<TResult = unknown> {
    constructor(action: (...args: any[]) => Promise<TResult>, options?: CircuitBreakerOptions);
    fire(...args: any[]): Promise<TResult>;
    fallback(func: (...args: any[]) => TResult | Promise<TResult>): this;
    shutdown(): void;
    readonly opened: boolean;
    readonly halfOpen: boolean;
    readonly stats: Record<string, number>;
  }

  export = CircuitBreaker;
}
