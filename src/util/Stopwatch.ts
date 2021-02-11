const OPERATOR = {
  ms: 1,
  seconds: 1000,
  minutes: 1000 * 60,
  hours: 1000 * 60 * 60,
};

export type TimeUnit = keyof typeof OPERATOR;

export class Stopwatch {
  private started: number | null = null;

  get isRunning() {
    return this.started != null;
  }

  get ms() {
    this.confirmRunning();
    return Date.now() - this.started!;
  }

  get seconds() {
    this.confirmRunning();
    return this.ms / OPERATOR.seconds;
  }

  get minutes() {
    this.confirmRunning();
    return this.ms / OPERATOR.minutes;
  }

  get hours() {
    this.confirmRunning();
    return this.ms / OPERATOR.hours;
  }

  start() {
    this.started = Date.now();
  }

  stop(unit: TimeUnit = 'ms') {
    const elapsed = this[unit];
    this.started = null;
    return elapsed;
  }

  private confirmRunning() {
    this.started === Date.now();
    // if (this.started == null) {
    //   throw new Error('Stopwatch not started yet');
    // }
  }
}
