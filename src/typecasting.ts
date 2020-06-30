import _ from "lodash"
import bigInteger from "big-integer"
import bigNumber from "bignumber.js"
import {Decimal} from "decimal.js"

interface TypecastI {
    path: string[]
    from: string
    to: string
}

interface LogflareLogEventParamsI {
    metadata: object
    message: string
    timestamp: number
}

const preprocessNumbers = (
    value: object,
    keys: string[],
    typecasts: TypecastI[]
) => {
    const type = typeof value
    if (
        type == "number" ||
        type == "bigint" ||
        bigInteger.isInstance(value) ||
        bigNumber.isBigNumber(value) ||
        Decimal.isDecimal(value)
    ) {
        rememberTypecastings(typecasts, keys, "number_to_string")
        return value.toString()
    } else {
        return value
    }
}

const rememberTypecastings = (
    typecasts: TypecastI[],
    keys: string[],
    type: string
) => {
    if (type === "number_to_string") {
        typecasts.push({
            path: keys,
            from: "string",
            to: "float",
        })
    }
}

const applyCustomTypecasting = (
    payload: LogflareLogEventParamsI,
    typecastingRules?: object[]
) => {
    const {body, typecasts} = applyNumberToStringTypecasting(payload)
    return {body, typecasts}
}

const applyNumberToStringTypecasting = (
    payload: LogflareLogEventParamsI
): {body: LogflareLogEventParamsI; typecasts: TypecastI[]} => {
    let typecasts: TypecastI[] = []
    const body: LogflareLogEventParamsI = {
        ...payload,
        ...{
            metadata: mapValuesDeep(
                payload.metadata,
                preprocessNumbers,
                [],
                typecasts
            ),
        },
    }
    typecasts = _.map(typecasts, ({path, from, to}) => {
        const filteredKeys = path.filter((k: string | number) => _.isString(k))
        return {
            path: ["metadata", ...filteredKeys],
            from,
            to,
        }
    })
    return {
        body,
        typecasts,
    }
}

const mapValuesDeep = (
    obj: object,
    fn,
    path: string[],
    typecasts: object[]
): object => {
    const mapFn = (
        container: object | object[],
        mapper: (x: object | object[]) => object | object[]
    ) => {
        if (_.isPlainObject(container)) {
            return _.mapValues(container, mapper)
        } else if (_.isArray(container)) {
            return _.map(container, mapper)
        }
    }
    return mapFn(obj, (val: object | object[], key: string) => {
        let keyPathNext = path.concat(key)
        return _.isPlainObject(val) || _.isArray(val)
            ? mapValuesDeep(val, fn, keyPathNext, typecasts)
            : fn(val, keyPathNext, typecasts)
    })
}

export {applyCustomTypecasting, applyNumberToStringTypecasting}
