import {
    Type,
    nullableType,
    unknownType,
    arrayType,
    tupleNTypeType,
    recordType,
    stringType,
    boolType,
    numberType,
    bigIntType,
    Field
} from './AST.ts'

/** Takes a json content and understands the fields and its types.
 * The reason we recieve a string is to prevent trying to extract types from circular or non-serializable objects.
 * */
export function extractTypes(json: string): string {
    const struct = extractTypesHelper(JSON.parse(json))
    console.log(struct.toString())
    return json
}

function extractTypesHelper(json: any): Type {
    if (json === null) return nullableType(unknownType)

    switch (typeof json) {
        case 'object':
            if (Array.isArray(json)) {
                // can't tell the type of the elements
                if (!hasValues(json)) return arrayType(unknownType)
                return tupleNTypeType(json.map(extractTypesHelper)).narrow()
            } else {
                // empty object is treated like an empty record
                if (!hasValues(json)) return recordType([])
                const fields = toFields(json)
                return recordType(fields).narrow()
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
        .map(field => [field, extractTypesHelper(_j[field])])
    return fields
}
