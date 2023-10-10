import {
    ArrayType,
    BigIntType,
    BoolType,
    DictType,
    NeverType,
    NumberType,
    RecordType,
    StringType,
    TupleNType,
    Type,
    UnknownType,
    Field,
    UnionType,
    NullType,
    UndefinedType
} from './ast'

type Doc = string

export function prettyPrintType(t: Type, indent: number): Doc {
    if (t instanceof StringType) return 'string'
    else if (t instanceof BoolType) return 'boolean'
    else if (t instanceof NumberType) return 'number'
    else if (t instanceof BigIntType) return 'bigint'
    else if (t instanceof NullType) return 'null'
    else if (t instanceof UndefinedType) return 'undefined'
    else if (t instanceof UnknownType) return 'unknown'
    else if (t instanceof NeverType) return 'never'
    else if (t instanceof UnionType) return prettyPrintUnionType(t, indent)
    else if (t instanceof ArrayType) return prettyPrintArrayType(t, indent)
    else if (t instanceof TupleNType) return prettyPrintTupleNType(t, indent)
    else if (t instanceof DictType) return prettyPrintDictType(t, indent)
    else if (t instanceof RecordType) return prettyPrintRecordType(t, indent)
    else throw Error('Unexpected Type: ' + t.constructor)
}

function prettyPrintUnionType(t: UnionType, indent: number): Doc {
    return t.tpes.map(tpe => prettyPrintType(tpe, indent)).join(' | ')
}

function prettyPrintArrayType(t: ArrayType, indent: number): Doc {
    return 'Array<' + prettyPrintType(t.tpe, indent) + '>'
}

function prettyPrintTupleNType(t: TupleNType, indent: number): Doc {
    return '[' + t.tpes.map(tpe => prettyPrintType(tpe, indent)).join(', ') + ']'
}

function prettyPrintDictType(t: DictType, indent: number): Doc {
    return `{ [string] : ${prettyPrintType(t.tpe, indent)} }`
}

function prettyPrintField(f: Field, indent: number): Doc {
    return `${printIndent(indent)}${f[0]}: ${prettyPrintType(f[1], indent)}`
}

function prettyPrintRecordType(t: RecordType, indent: number): Doc {
    if (t.fields.length === 0) return '{}'
    const nextIndent = indent + 1
    const fields = t.fields.map(field => prettyPrintField(field, nextIndent)).join(',\n')

    return `{\n${fields}\n${printIndent(indent)}}`
}

function printIndent(indent: number): Doc {
    return '  '.repeat(indent)
}
