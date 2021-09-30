import Decimal from "decimal.js";

export { }
declare global {
    export interface Number {
        toSD(): number;
    }
}
Number.prototype.toSD = function (): number  {
    return (new Decimal(this).toSD(5).toNumber())
};