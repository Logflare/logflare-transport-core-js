import bigInteger from "big-integer"
import bigNumber from "bignumber.js"
import {Decimal} from "decimal.js"
import {applyTypecasting} from "./typecasting"

const typecastingUnit = {
    numberField: 100,
    numberField2: 100.001,
    bigInt: 100n,
    stringField: "random string",
    "big-integer": bigInteger(100),
    "bignumber.js": bigNumber(100),
    "decimal.js": new Decimal(100.0001),
}

const typecastedUnit = {
    "big-integer": "100",
    bigInt: "100",
    "bignumber.js": "100",
    "decimal.js": "100.0001",
    numberField: "100",
    numberField2: "100.001",
    stringField: "random string",
}

describe("Typecasting", () => {
    it("properly casts numbers", async (done) => {
        const event = {
            message: "message",
            metadata: {
                metrics: typecastingUnit,
                nested: {
                    array1: [
                        typecastingUnit,
                        {
                            nestedArray2: [typecastingUnit, typecastingUnit],
                        },
                    ],
                    nested1: {
                        nested2: {
                            nested3: typecastingUnit,
                        },
                    },
                },
            },
        }

        const {body: processedEvent, typecasts} = applyTypecasting(event)

        expect(processedEvent).toEqual({
            message: "message",
            metadata: {
                metrics: {
                    numberField: "100",
                    numberField2: "100.001",
                    bigInt: "100",
                    "big-integer": "100",
                    "bignumber.js": "100",
                    "decimal.js": "100.0001",
                    stringField: "random string",
                },
                nested: {
                    array1: [
                        typecastedUnit,
                        {
                            nestedArray2: [typecastedUnit, typecastedUnit],
                        },
                    ],
                    nested1: {
                        nested2: {
                            nested3: typecastedUnit,
                        },
                    },
                },
            },
        })

        expect(typecasts).toEqual([
            {
                keys: ["metadata", "metrics", "numberField"],
                from: "string",
                to: "number",
            },
            {
                keys: ["metadata", "metrics", "numberField2"],
                from: "string",
                to: "number",
            },
            {
                keys: ["metadata", "metrics", "bigInt"],
                from: "string",
                to: "number",
            },
            {
                keys: ["metadata", "metrics", "big-integer"],
                from: "string",
                to: "number",
            },
            {
                keys: ["metadata", "metrics", "bignumber.js"],
                from: "string",
                to: "number",
            },
            {
                keys: ["metadata", "metrics", "decimal.js"],
                from: "string",
                to: "number",
            },
            {
                keys: ["metadata", "nested", "array1", "numberField"],
                from: "string",
                to: "number",
            },
            {
                keys: ["metadata", "nested", "array1", "numberField2"],
                from: "string",
                to: "number",
            },
            {
                keys: ["metadata", "nested", "array1", "bigInt"],
                from: "string",
                to: "number",
            },
            {
                keys: ["metadata", "nested", "array1", "big-integer"],
                from: "string",
                to: "number",
            },
            {
                keys: ["metadata", "nested", "array1", "bignumber.js"],
                from: "string",
                to: "number",
            },
            {
                keys: ["metadata", "nested", "array1", "decimal.js"],
                from: "string",
                to: "number",
            },
            {
                keys: [
                    "metadata",
                    "nested",
                    "array1",
                    "nestedArray2",
                    "numberField",
                ],
                from: "string",
                to: "number",
            },
            {
                keys: [
                    "metadata",
                    "nested",
                    "array1",
                    "nestedArray2",
                    "numberField2",
                ],
                from: "string",
                to: "number",
            },
            {
                keys: [
                    "metadata",
                    "nested",
                    "array1",
                    "nestedArray2",
                    "bigInt",
                ],
                from: "string",
                to: "number",
            },
            {
                keys: [
                    "metadata",
                    "nested",
                    "array1",
                    "nestedArray2",
                    "big-integer",
                ],
                from: "string",
                to: "number",
            },
            {
                keys: [
                    "metadata",
                    "nested",
                    "array1",
                    "nestedArray2",
                    "bignumber.js",
                ],
                from: "string",
                to: "number",
            },
            {
                keys: [
                    "metadata",
                    "nested",
                    "array1",
                    "nestedArray2",
                    "decimal.js",
                ],
                from: "string",
                to: "number",
            },
            {
                keys: [
                    "metadata",
                    "nested",
                    "array1",
                    "nestedArray2",
                    "numberField",
                ],
                from: "string",
                to: "number",
            },
            {
                keys: [
                    "metadata",
                    "nested",
                    "array1",
                    "nestedArray2",
                    "numberField2",
                ],
                from: "string",
                to: "number",
            },
            {
                keys: [
                    "metadata",
                    "nested",
                    "array1",
                    "nestedArray2",
                    "bigInt",
                ],
                from: "string",
                to: "number",
            },
            {
                keys: [
                    "metadata",
                    "nested",
                    "array1",
                    "nestedArray2",
                    "big-integer",
                ],
                from: "string",
                to: "number",
            },
            {
                keys: [
                    "metadata",
                    "nested",
                    "array1",
                    "nestedArray2",
                    "bignumber.js",
                ],
                from: "string",
                to: "number",
            },
            {
                keys: [
                    "metadata",
                    "nested",
                    "array1",
                    "nestedArray2",
                    "decimal.js",
                ],
                from: "string",
                to: "number",
            },
            {
                keys: [
                    "metadata",
                    "nested",
                    "nested1",
                    "nested2",
                    "nested3",
                    "numberField",
                ],
                from: "string",
                to: "number",
            },
            {
                keys: [
                    "metadata",
                    "nested",
                    "nested1",
                    "nested2",
                    "nested3",
                    "numberField2",
                ],
                from: "string",
                to: "number",
            },
            {
                keys: [
                    "metadata",
                    "nested",
                    "nested1",
                    "nested2",
                    "nested3",
                    "bigInt",
                ],
                from: "string",
                to: "number",
            },
            {
                keys: [
                    "metadata",
                    "nested",
                    "nested1",
                    "nested2",
                    "nested3",
                    "big-integer",
                ],
                from: "string",
                to: "number",
            },
            {
                keys: [
                    "metadata",
                    "nested",
                    "nested1",
                    "nested2",
                    "nested3",
                    "bignumber.js",
                ],
                from: "string",
                to: "number",
            },
            {
                keys: [
                    "metadata",
                    "nested",
                    "nested1",
                    "nested2",
                    "nested3",
                    "decimal.js",
                ],
                from: "string",
                to: "number",
            },
        ])
        done()
    })
})
