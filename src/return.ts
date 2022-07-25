export class ReturnException {
  value: any;
  isReturn = true;

  constructor(value: any) {
    this.value = value;
  }
}
