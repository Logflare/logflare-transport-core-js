import _ from "lodash"
import bigInteger from "big-integer"
import bigNumber from "bignumber.js"
import {Decimal} from "decimal.js"

const {isObject, isNumber, isArray, pickBy, compact, identity, mapValues} = _

const preprocessNumbers = (
    value: object,
    keys: string[],
    typecasts: object[]
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
    typecasts: object[],
    keys: string[],
    type: string
) => {
    if (type === "number_to_string") {
        typecasts.push({
            keys: keys,
            from: "string",
            to: "number",
        })
    }
}

const applyTypecasting = (payload: object) => {
    let typecasts: object[] = []
    const body = mapValuesDeep(payload, preprocessNumbers, [], typecasts)
    typecasts = _.map(typecasts, ({keys, from, to}) => {
        const filteredKeys = keys.filter((k: string | number) => _.isString(k))
        return {
            keys: filteredKeys,
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
    keys: string[],
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
    return mapFn(obj, (val, key) => {
        // console.log(keys)
        let keysNext = keys.concat(key)
        // if (_.isString(key)) {
        //     keysNext = (keys || []).concat(key)
        // }
        return _.isPlainObject(val) || _.isArray(val)
            ? mapValuesDeep(val, fn, keysNext, typecasts)
            : fn(val, keysNext, typecasts)
    })
}

export {applyTypecasting}
