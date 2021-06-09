export class PromiseStatus<T> {
  private status: 'pending' | 'fulfilled' | 'rejected' = 'pending';
  private _value: T | null = null;
  private _reason: unknown = null;

  get isPending() {
    return this.status === 'pending';
  }

  get isFulfilled() {
    return this.status === 'fulfilled';
  }

  get isRejected() {
    return this.status === 'rejected';
  }

  get value() {
    if (!this.isFulfilled) {
      throw new Error('Promise not fulfilled yet');
    }

    return this._value;
  }

  get reason() {
    if (!this.isRejected) {
      throw new Error('Promise not rejected');
    }

    return this._reason;
  }

  constructor(promise: Promise<T>) {
    promise.then(
      value => {
        this._value = value;
        this.status = 'fulfilled';
      },
      reason => {
        this._reason = reason;
        this.status = 'rejected';
      },
    );
  }
}
