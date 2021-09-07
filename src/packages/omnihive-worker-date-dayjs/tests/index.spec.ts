import { describe, it } from "mocha";
import { AwaitHelper } from "@withonevision/omnihive-core/helpers/AwaitHelper";
import { expect } from "chai";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import DayJsDateWorker from "..";
import faker from "faker";
import { IDateWorker } from "@withonevision/omnihive-core/interfaces/IDateWorker";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(tz);

const testValues = {
    conversionUnit: "hour",
    dateFormatInvalid: "YYYY-MM-DDTHH:mm:ssX",
    dateFormatValid: "MM/DD/YYYY hh:mma",
    dateFormatValidAlternate: "YYYY-MM-DDTHH:mm:ssZ",
    homeTimezone: "America/New_York",
    invalidTimezone: "Bad Timezone",
    otherTimezone: "Asia/Tokyo",
    workerName: "testDateDayJSDateWorker",
};

const initWorker = async (dateFormat: string): Promise<IDateWorker> => {
    const worker: DayJsDateWorker = new DayJsDateWorker();
    await AwaitHelper.execute(worker.init(testValues.workerName, { dateFormat }));
    return worker;
};

describe("Worker Test - Date - DayJS", () => {
    describe("Init Functions", () => {
        it("Test Init - Valid Date Format", async () => {
            await AwaitHelper.execute(initWorker(testValues.dateFormatValid));
        });

        it("Test Init - Invalid Date Format", async () => {
            try {
                await AwaitHelper.execute(initWorker(testValues.dateFormatInvalid));
                expect.fail("Method Expected to Fail");
            } catch (err) {
                expect(err).to.be.an.instanceOf(Error);
            }
        });
    });

    describe("Worker Functions", () => {
        it("Convert Between Timezones", async () => {
            const worker = await AwaitHelper.execute(initWorker(testValues.dateFormatValid));
            const testDate: Date = faker.date.soon();
            const result = worker.convertDateBetweenTimezones(
                testDate,
                testValues.otherTimezone,
                testValues.homeTimezone
            );
            expect(result).to.equal(dayjs(testDate).tz(testValues.otherTimezone).format(testValues.dateFormatValid));
        });

        it("Convert Between Timezones - Invalid From", async () => {
            try {
                const worker = await AwaitHelper.execute(initWorker(testValues.dateFormatValid));
                const testDate: Date = faker.date.soon();
                worker.convertDateBetweenTimezones(testDate, testValues.invalidTimezone, testValues.homeTimezone);

                expect.fail("Method Expected To Fail");
            } catch (err) {
                expect(err).to.be.an.instanceOf(Error);
            }
        });

        it("Convert Between Timezones - Invalid To", async () => {
            try {
                const worker = await AwaitHelper.execute(initWorker(testValues.dateFormatValid));
                const testDate: Date = faker.date.soon();
                worker.convertDateBetweenTimezones(testDate, testValues.otherTimezone, testValues.invalidTimezone);

                expect.fail("Method Expected To Fail");
            } catch (err) {
                expect(err).to.be.an.instanceOf(Error);
            }
        });

        it("Convert Between Timezones - No From Timezone", async () => {
            const worker = await AwaitHelper.execute(initWorker(testValues.dateFormatValid));
            const testDate: Date = faker.date.soon();
            const result = worker.convertDateBetweenTimezones(testDate, testValues.otherTimezone);
            expect(result).to.equal(dayjs(testDate).tz(testValues.otherTimezone).format(testValues.dateFormatValid));
        });

        it("Format Date", async () => {
            const worker = await AwaitHelper.execute(initWorker(testValues.dateFormatValid));
            const testDate: Date = faker.date.soon();
            const dateString = worker.getFormattedDateString(testDate, testValues.dateFormatValidAlternate);
            expect(dateString).to.equal(dayjs(testDate).format(testValues.dateFormatValidAlternate));
        });

        it("Format Date - No Format Specified", async () => {
            const worker = await AwaitHelper.execute(initWorker(testValues.dateFormatValid));
            const testDate: Date = faker.date.soon();
            const dateString = worker.getFormattedDateString(testDate);
            expect(dateString).to.equal(dayjs(testDate).format(testValues.dateFormatValid));
        });
    });
});
