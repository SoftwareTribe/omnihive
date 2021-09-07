import { describe, it } from "mocha";
import { expect } from "chai";
import { IsHelper } from "../helpers/IsHelper";

describe("IsHelper Tests", () => {
    describe("isArray", () => {
        it("Is Array", () => {
            expect(IsHelper.isArray([])).to.be.true;
        });

        it("Not Array", () => {
            expect(IsHelper.isArray(0)).to.be.false;
            expect(IsHelper.isArray("")).to.be.false;
            expect(IsHelper.isArray(true)).to.be.false;
            expect(IsHelper.isArray(new Date())).to.be.false;
            expect(IsHelper.isArray(() => {})).to.be.false;
            expect(IsHelper.isArray({})).to.be.false;
            expect(IsHelper.isArray(undefined)).to.be.false;
            expect(IsHelper.isArray(null)).to.be.false;
        });
    });

    describe("isBoolean", () => {
        it("Is Boolean", () => {
            expect(IsHelper.isBoolean(true)).to.be.true;
            expect(IsHelper.isBoolean(false)).to.be.true;
            expect(IsHelper.isBoolean("true")).to.be.true;
            expect(IsHelper.isBoolean("false")).to.be.true;
        });

        it("Not Boolean", () => {
            expect(IsHelper.isBoolean(0)).to.be.false;
            expect(IsHelper.isBoolean("")).to.be.false;
            expect(IsHelper.isBoolean(new Date())).to.be.false;
            expect(IsHelper.isBoolean(() => {})).to.be.false;
            expect(IsHelper.isBoolean({})).to.be.false;
            expect(IsHelper.isBoolean([])).to.be.false;
            expect(IsHelper.isBoolean(undefined)).to.be.false;
            expect(IsHelper.isBoolean(null)).to.be.false;
        });
    });

    describe("isDate", () => {
        it("Is Date", () => {
            expect(IsHelper.isDate(new Date())).to.be.true;
        });

        it("Not Date", () => {
            expect(IsHelper.isDate(0)).to.be.false;
            expect(IsHelper.isDate("")).to.be.false;
            expect(IsHelper.isDate(true)).to.be.false;
            expect(IsHelper.isDate(() => {})).to.be.false;
            expect(IsHelper.isDate({})).to.be.false;
            expect(IsHelper.isDate([])).to.be.false;
            expect(IsHelper.isDate(undefined)).to.be.false;
            expect(IsHelper.isDate(null)).to.be.false;
        });
    });

    describe("isEmptyArray", () => {
        it("Is Empty Array", () => {
            expect(IsHelper.isEmptyArray([])).to.be.true;
        });

        it("Not Empty Array", () => {
            expect(IsHelper.isEmptyArray(["NotEmpty"])).to.be.false;
            expect(IsHelper.isEmptyArray(0)).to.be.false;
            expect(IsHelper.isEmptyArray("")).to.be.false;
            expect(IsHelper.isEmptyArray(true)).to.be.false;
            expect(IsHelper.isEmptyArray(new Date())).to.be.false;
            expect(IsHelper.isEmptyArray(() => {})).to.be.false;
            expect(IsHelper.isEmptyArray({})).to.be.false;
            expect(IsHelper.isEmptyArray(undefined)).to.be.false;
            expect(IsHelper.isEmptyArray(null)).to.be.false;
        });
    });

    describe("isEmptyObject", () => {
        it("Is Empty Object", () => {
            expect(IsHelper.isEmptyObject({})).to.be.true;
            expect(IsHelper.isEmptyObject([])).to.be.true;
            expect(IsHelper.isEmptyObject(new Date())).to.be.true;
            expect(IsHelper.isEmptyObject(() => {})).to.be.true;
        });

        it("Not Empty Object", () => {
            expect(IsHelper.isEmptyObject({ not: "empty" }));
            expect(IsHelper.isEmptyObject(0)).to.be.false;
            expect(IsHelper.isEmptyObject("")).to.be.false;
            expect(IsHelper.isEmptyObject(true)).to.be.false;
            expect(IsHelper.isEmptyObject(undefined)).to.be.false;
            expect(IsHelper.isEmptyObject(null)).to.be.false;
        });
    });

    describe("isEmptyString", () => {
        it("Is Empty String", () => {
            expect(IsHelper.isEmptyString("")).to.be.true;
        });

        it("Not Empty String", () => {
            expect(IsHelper.isEmptyString("Not Empty")).to.be.false;
            expect(IsHelper.isEmptyString(0)).to.be.false;
            expect(IsHelper.isEmptyString(true)).to.be.false;
            expect(IsHelper.isEmptyString(new Date())).to.be.false;
            expect(IsHelper.isEmptyString(() => {})).to.be.false;
            expect(IsHelper.isEmptyString({})).to.be.false;
            expect(IsHelper.isEmptyString([])).to.be.false;
            expect(IsHelper.isEmptyString(undefined)).to.be.false;
            expect(IsHelper.isEmptyString(null)).to.be.false;
        });
    });

    describe("isEmptyStringOrWhitespace", () => {
        it("Is Empty String or Whitespace", () => {
            expect(IsHelper.isEmptyStringOrWhitespace("")).to.be.true;
            expect(IsHelper.isEmptyStringOrWhitespace(" ")).to.be.true;
        });

        it("Not Empty String or Whitespace", () => {
            expect(IsHelper.isEmptyStringOrWhitespace("Not Empty")).to.be.false;
            expect(IsHelper.isEmptyStringOrWhitespace(0)).to.be.false;
            expect(IsHelper.isEmptyStringOrWhitespace(true)).to.be.false;
            expect(IsHelper.isEmptyStringOrWhitespace(new Date())).to.be.false;
            expect(IsHelper.isEmptyStringOrWhitespace(() => {})).to.be.false;
            expect(IsHelper.isEmptyStringOrWhitespace({})).to.be.false;
            expect(IsHelper.isEmptyStringOrWhitespace([])).to.be.false;
            expect(IsHelper.isEmptyStringOrWhitespace(undefined)).to.be.false;
            expect(IsHelper.isEmptyStringOrWhitespace(null)).to.be.false;
        });
    });

    describe("isFunction", () => {
        it("Is Function", () => {
            expect(IsHelper.isFunction(() => {})).to.be.true;
        });

        it("Not Function", () => {
            expect(IsHelper.isFunction("")).to.be.false;
            expect(IsHelper.isFunction(0)).to.be.false;
            expect(IsHelper.isFunction(true)).to.be.false;
            expect(IsHelper.isFunction(new Date())).to.be.false;
            expect(IsHelper.isFunction({})).to.be.false;
            expect(IsHelper.isFunction([])).to.be.false;
            expect(IsHelper.isFunction(undefined)).to.be.false;
            expect(IsHelper.isFunction(null)).to.be.false;
        });
    });

    describe("isIpv4", () => {
        it("Is IPv4", () => {
            expect(IsHelper.isIpv4("127.0.0.1")).to.be.true;
        });

        it("Not IPv4", () => {
            expect(IsHelper.isIpv4("127.0.1")).to.be.false;
            expect(IsHelper.isIpv4("")).to.be.false;
            expect(IsHelper.isIpv4(0)).to.be.false;
            expect(IsHelper.isIpv4(true)).to.be.false;
            expect(IsHelper.isIpv4(new Date())).to.be.false;
            expect(IsHelper.isIpv4(() => {})).to.be.false;
            expect(IsHelper.isIpv4({})).to.be.false;
            expect(IsHelper.isIpv4([])).to.be.false;
            expect(IsHelper.isIpv4(undefined)).to.be.false;
            expect(IsHelper.isIpv4(null)).to.be.false;
        });
    });

    describe("isNull", () => {
        it("Is Null", () => {
            expect(IsHelper.isNull(null)).to.be.true;
        });

        it("Not Null", () => {
            expect(IsHelper.isNull("")).to.be.false;
            expect(IsHelper.isNull(0)).to.be.false;
            expect(IsHelper.isNull(true)).to.be.false;
            expect(IsHelper.isNull(new Date())).to.be.false;
            expect(IsHelper.isNull(() => {})).to.be.false;
            expect(IsHelper.isNull({})).to.be.false;
            expect(IsHelper.isNull([])).to.be.false;
            expect(IsHelper.isNull(undefined)).to.be.false;
        });
    });

    describe("isNullOrUndefined", () => {
        it("Is Null or Undefined", () => {
            expect(IsHelper.isNullOrUndefined(null)).to.be.true;
            expect(IsHelper.isNullOrUndefined(undefined)).to.be.true;
        });

        it("Not Null or Undefined", () => {
            expect(IsHelper.isNullOrUndefined("")).to.be.false;
            expect(IsHelper.isNullOrUndefined(0)).to.be.false;
            expect(IsHelper.isNullOrUndefined(true)).to.be.false;
            expect(IsHelper.isNullOrUndefined(new Date())).to.be.false;
            expect(IsHelper.isNullOrUndefined(() => {})).to.be.false;
            expect(IsHelper.isNullOrUndefined({})).to.be.false;
            expect(IsHelper.isNullOrUndefined([])).to.be.false;
        });
    });

    describe("isNullOrUndefinedOrEmptyStringOrWhitespace", () => {
        it("Is Null or Undefined or Empty String or Whitespace", () => {
            expect(IsHelper.isNullOrUndefinedOrEmptyStringOrWhitespace(null)).to.be.true;
            expect(IsHelper.isNullOrUndefinedOrEmptyStringOrWhitespace(undefined)).to.be.true;
            expect(IsHelper.isNullOrUndefinedOrEmptyStringOrWhitespace("")).to.be.true;
            expect(IsHelper.isNullOrUndefinedOrEmptyStringOrWhitespace(" ")).to.be.true;
        });

        it("Not Null or Undefined or Empty String or Whitespace", () => {
            expect(IsHelper.isNullOrUndefinedOrEmptyStringOrWhitespace("Not Empty")).to.be.false;
            expect(IsHelper.isNullOrUndefinedOrEmptyStringOrWhitespace(0)).to.be.false;
            expect(IsHelper.isNullOrUndefinedOrEmptyStringOrWhitespace(true)).to.be.false;
            expect(IsHelper.isNullOrUndefinedOrEmptyStringOrWhitespace(new Date())).to.be.false;
            expect(IsHelper.isNullOrUndefinedOrEmptyStringOrWhitespace(() => {})).to.be.false;
            expect(IsHelper.isNullOrUndefinedOrEmptyStringOrWhitespace({})).to.be.false;
            expect(IsHelper.isNullOrUndefinedOrEmptyStringOrWhitespace([])).to.be.false;
        });
    });

    describe("isNumber", () => {
        it("Is Number", () => {
            expect(IsHelper.isNumber(0)).to.be.true;
            expect(IsHelper.isNumber("0")).to.be.true;
        });

        it("Not Number", () => {
            expect(IsHelper.isNumber("")).to.be.false;
            expect(IsHelper.isNumber(true)).to.be.false;
            expect(IsHelper.isNumber(new Date())).to.be.false;
            expect(IsHelper.isNumber(() => {})).to.be.false;
            expect(IsHelper.isNumber({})).to.be.false;
            expect(IsHelper.isNumber([])).to.be.false;
            expect(IsHelper.isNumber(undefined)).to.be.false;
            expect(IsHelper.isNumber(null)).to.be.false;
        });
    });

    describe("isObject", () => {
        it("Is Object", () => {
            expect(IsHelper.isObject({})).to.be.true;
            expect(IsHelper.isObject(new Date())).to.be.true;
            expect(IsHelper.isObject(() => {})).to.be.true;
            expect(IsHelper.isObject([])).to.be.true;
        });

        it("Not Object", () => {
            expect(IsHelper.isObject(0)).to.be.false;
            expect(IsHelper.isObject("")).to.be.false;
            expect(IsHelper.isObject(true)).to.be.false;
            expect(IsHelper.isObject(undefined)).to.be.false;
            expect(IsHelper.isObject(null)).to.be.false;
        });
    });

    describe("isPlainObject", () => {
        it("Is Plain Object", () => {
            expect(IsHelper.isPlainObject({})).to.be.true;
        });

        it("Not Plain Object", () => {
            expect(IsHelper.isPlainObject(0)).to.be.false;
            expect(IsHelper.isPlainObject("")).to.be.false;
            expect(IsHelper.isPlainObject(true)).to.be.false;
            expect(IsHelper.isPlainObject(new Date())).to.be.false;
            expect(IsHelper.isPlainObject(() => {})).to.be.false;
            expect(IsHelper.isPlainObject([])).to.be.false;
            expect(IsHelper.isPlainObject(undefined)).to.be.false;
            expect(IsHelper.isPlainObject(null)).to.be.false;
        });
    });

    describe("isString", () => {
        it("Is String", () => {
            expect(IsHelper.isString("")).to.be.true;
        });

        it("Not Plain Object", () => {
            expect(IsHelper.isString(0)).to.be.false;
            expect(IsHelper.isString(true)).to.be.false;
            expect(IsHelper.isString(new Date())).to.be.false;
            expect(IsHelper.isString(() => {})).to.be.false;
            expect(IsHelper.isString({})).to.be.false;
            expect(IsHelper.isString([])).to.be.false;
            expect(IsHelper.isString(undefined)).to.be.false;
            expect(IsHelper.isString(null)).to.be.false;
        });
    });

    describe("isUndefined", () => {
        it("Is Undefined", () => {
            expect(IsHelper.isUndefined(undefined)).to.be.true;
        });

        it("Not Null", () => {
            expect(IsHelper.isUndefined("")).to.be.false;
            expect(IsHelper.isUndefined(0)).to.be.false;
            expect(IsHelper.isUndefined(true)).to.be.false;
            expect(IsHelper.isUndefined(new Date())).to.be.false;
            expect(IsHelper.isUndefined(() => {})).to.be.false;
            expect(IsHelper.isUndefined({})).to.be.false;
            expect(IsHelper.isUndefined([])).to.be.false;
            expect(IsHelper.isUndefined(null)).to.be.false;
        });
    });

    describe("isWhiteSpaceStringString", () => {
        it("Is White Space String", () => {
            expect(IsHelper.isWhiteSpaceString(" ")).to.be.true;
        });

        it("Not White Space String", () => {
            expect(IsHelper.isWhiteSpaceString("")).to.be.false;
            expect(IsHelper.isWhiteSpaceString("Not Empty")).to.be.false;
            expect(IsHelper.isWhiteSpaceString(0)).to.be.false;
            expect(IsHelper.isWhiteSpaceString(true)).to.be.false;
            expect(IsHelper.isWhiteSpaceString(new Date())).to.be.false;
            expect(IsHelper.isWhiteSpaceString(() => {})).to.be.false;
            expect(IsHelper.isWhiteSpaceString({})).to.be.false;
            expect(IsHelper.isWhiteSpaceString([])).to.be.false;
            expect(IsHelper.isWhiteSpaceString(undefined)).to.be.false;
            expect(IsHelper.isWhiteSpaceString(null)).to.be.false;
        });
    });
});
