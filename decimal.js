(function(window){
    // Simple Decimal class for large-number formatting and basic arithmetic
    class Decimal {
        constructor(mantissa, exponent){
            // mantissa is a Number between [1,10) or 0
            this.m = Number(mantissa);
            this.e = Number.isFinite(exponent) ? Math.trunc(exponent) : 0;
            // Never allow NaN/Infinity into normalize(), which would otherwise loop forever.
            if (!Number.isFinite(this.m) || this.m === 0) {
                this.m = 0;
                this.e = 0;
            }
            this.normalize();
        }

        static fromNumber(n){
            if (!isFinite(n) || isNaN(n)) return new Decimal(0,0);
            if (n === 0) return new Decimal(0,0);
            let e = Math.floor(Math.log10(Math.abs(n)));
            let m = n / Math.pow(10, e);
            return new Decimal(m, e);
        }

        static fromString(s){
            // parse scientific or normal
            const v = Number(s);
            return Decimal.fromNumber(v);
        }

        normalize(){
            if (!Number.isFinite(this.m) || !Number.isFinite(this.e)) {
                this.m = 0;
                this.e = 0;
                return;
            }
            if (this.m === 0) { this.e = 0; return; }
            while (Math.abs(this.m) >= 10){ this.m /= 10; this.e += 1; }
            while (Math.abs(this.m) < 1 && this.m !== 0){ this.m *= 10; this.e -= 1; }
        }

        toNumber(){
            return this.m * Math.pow(10, this.e);
        }

        isZero(){ return this.m === 0; }

        add(other){
            if (!(other instanceof Decimal)) other = Decimal.fromNumber(other);
            // align exponents
            if (this.isZero()) return new Decimal(other.m, other.e);
            if (other.isZero()) return new Decimal(this.m, this.e);
            let a = this, b = other;
            if (a.e < b.e){ [a,b] = [b,a]; }
            const diff = a.e - b.e;
            if (diff > 20){ // b negligible
                return new Decimal(a.m, a.e);
            }
            const m = a.m + b.m * Math.pow(10, -diff);
            return new Decimal(m, a.e);
        }

        sub(other){
            if (!(other instanceof Decimal)) other = Decimal.fromNumber(other);
            return this.add(new Decimal(-other.m, other.e));
        }

        mul(other){
            if (!(other instanceof Decimal)) other = Decimal.fromNumber(other);
            return new Decimal(this.m * other.m, this.e + other.e);
        }

        mulNumber(n){
            if (!Number.isFinite(n)) return new Decimal(0, 0);
            if (n === 0 || this.isZero()) return new Decimal(0, 0);
            const factor = Decimal.fromNumber(Math.abs(n));
            const sign = n < 0 ? -1 : 1;
            return new Decimal(this.m * factor.m * sign, this.e + factor.e);
        }

        div(other){
            if (!(other instanceof Decimal)) other = Decimal.fromNumber(other);
            if (other.isZero()) throw new RangeError("Decimal division by zero");
            return new Decimal(this.m / other.m, this.e - other.e);
        }

        cmp(other){
            if (!(other instanceof Decimal)) other = Decimal.fromNumber(other);
            if (this.e !== other.e) return this.e - other.e;
            if (this.m === other.m) return 0;
            return this.m > other.m ? 1 : -1;
        }

        toString(){
            if (this.isZero()) return '0';
            // Use suffixes for readable format up to very large exponents, else scientific
            const num = this.toNumber();
            if (isFinite(num) && Math.abs(num) < 1000000){
                return Math.floor(num).toLocaleString();
            }
            const suffixes = ['million','billion','trillion','quadrillion','quintillion','sextillion','septillion','octillion','nonillion','decillion'];
            const index = Math.floor(this.e / 3) - 2;
            if (index >= 0 && index < suffixes.length){
                const divisorExp = 3 * (index + 2);
                const value = this.toNumber() / Math.pow(10, divisorExp);
                if (value >= 100) return Math.floor(value).toLocaleString() + ' ' + suffixes[index];
                if (value >= 10) return value.toFixed(1) + ' ' + suffixes[index];
                return value.toFixed(2) + ' ' + suffixes[index];
            }
            // fallback scientific
            return this.m.toFixed(3) + 'e' + this.e;
        }
    }

    window.Decimal = Decimal;
})(window);