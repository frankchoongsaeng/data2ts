import * as ts from 'typescript'

abstract class Type {
    abstract toString(): string
}
type Field = [string, Type]
class NumberType extends Type {
    toString(): string {
        return 'NumberType'
    }
}
const numberType: NumberType = new NumberType()
class BigIntType extends Type {
    toString(): string {
        return 'BigIntType'
    }
}
const bigIntType: BigIntType = new BigIntType()
class StringType extends Type {
    toString(): string {
        return 'StringType'
    }
}
const stringType: StringType = new StringType()
class BoolType extends Type {
    toString(): string {
        return 'BoolType'
    }
}
const boolType: BoolType = new BoolType()
class UnknownType extends Type {
    toString(): string {
        return 'UnknownType'
    }
}
const unknownType: UnknownType = new UnknownType()
class NeverType extends Type {
    toString(): string {
        return 'NeverType'
    }
}
const neverType: NeverType = new NeverType()
class NullableType extends Type {
    constructor(public tpe: Type) {
        super()
    }
    toString(): string {
        return `NullableType<${this.tpe.toString()}>`
    }
}
const nullableType = (tpe: Type) => new NullableType(tpe)
class ArrayType extends Type {
    constructor(public tpe: Type) {
        super()
    }
    toString(): string {
        return `ArrayType<${this.tpe.toString()}>`
    }
}
const arrayType = (tpe: Type) => new ArrayType(tpe)
class TupleNType extends Type {
    constructor(public tpes: Array<Type>) {
        super()
    }
    toString(): string {
        return `Tuple<${this.tpes.map(each => each.toString()).join(', ')}>`
    }
}
const tupleNTypeType = (tpes: Array<Type>) => new TupleNType(tpes)
class DictType extends Type {
    constructor(public valueType: Type) {
        super()
    }
    toString(): string {
        return `DictType<${this.valueType.toString()}>`
    }
}
const dictType = (valTpe: Type) => new DictType(valTpe)
class RecordType extends Type {
    constructor(public fields: Array<Field>) {
        super()
    }
    toString(): string {
        return `RecordType(${this.fields.map(field => `${field[0]} -> ${field[1].toString()}`).join(', ')})`
    }
}
const recordType = (fields: Array<Field>) => new RecordType(fields)

function to(node: Type): string {
    return ''
}

/** Takes a json content and understands the fields and its types.
 * The reason we recieve a string is to prevent trying to grok circular or non-serializable objects.
 * */
export function grok(json: string): string {
    const struct = parseAndExtract(JSON.parse(json))
    console.log(struct.toString())
    return json
}

export function parseAndExtract(json: any): Type {
    if (json === null) return nullableType(unknownType)

    switch (typeof json) {
        case 'object':
            if (Array.isArray(json)) {
                if (!hasValues(json)) {
                    // can't tell the type of the elements
                    return arrayType(unknownType)
                }
                if (hasUniformValues(json)) {
                    // if all elements are the same, use the type of the first element
                    const innerType = parseAndExtract(json[0])
                    return arrayType(innerType)
                }

                // This is the case of a TupleN
                return tupleNTypeType(json.map(parseAndExtract))
            } else {
                // empty object is treated like an empty array because it's elements are unknown
                if (!hasValues(json)) {
                    dictType(unknownType)
                } else if (hasUniformValues(json)) {
                    for (let k in json) {
                        if (json.hasOwnProperty(k)) {
                            return dictType(typeof k)
                        }
                    }
                }
                const fields = toFields(json)
                return recordType(fields)
            }
        case 'string':
            return stringType
        case 'boolean':
            return boolType
        case 'number':
            return numberType
        case 'bigint':
            return bigIntType

        // unsupported data types
        case 'symbol':
            throw Error(`Unsupported Type!!! ${typeof json}`)
        case 'function':
            throw Error(`Unsupported Type!!! ${typeof json}`)
        case 'undefined':
            throw Error(`Unsupported Type!!! ${typeof json}`)
        default:
            throw Error(`Unsupported Type!!! ${typeof json}`)
    }
}

// checks if the values are of a uniform type
// in the case of where the values are objects, we want to compare an ordered set of the keys
function hasUniformValues<T>(input: Array<T> | object): boolean {
    if (Array.isArray(input)) {
        if (!hasValues(input)) return true // a vacuous truth
        const first = typeof input[0]
        return input.every(el => typeof el === first)
    } else {
        let firstTpe: string = ''
        for (let key in input) {
            if (input.hasOwnProperty(key)) {
                if (firstTpe !== '' && typeof (input as any)[key] !== firstTpe) {
                    return false
                } else firstTpe = typeof (input as any)[key]
            }
        }
        return true
    }
}

function hasValues<T>(input: Array<T> | object): boolean {
    if (Array.isArray(input)) return input.length > 0
    else
        for (let key in input) {
            if (input.hasOwnProperty(key)) return true
        }
    return false
}

/**
 * Converts an object into an array of fields, keeping the fields sorted.
 * This is a step that will aid in optimization of object-structure comparisons.
 * This uses the defaul JS sort.
 * @param json object
 */
function toFields(json: object): Field[] {
    const _j: any = json //
    const fields: Field[] = Object.keys(_j)
        .sort((a, b) => (a > b ? 1 : b > a ? -1 : 0))
        .map(field => [field, parseAndExtract(_j[field])])
    return fields
}
