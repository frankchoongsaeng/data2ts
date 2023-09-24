export abstract class Type {
    abstract toString(): string
    narrow(): Type {
        return this
    }
}
export type Field = [string, Type]

class NumberType extends Type {
    toString(): string {
        return 'NumberType'
    }
}
export const numberType: NumberType = new NumberType()

class BigIntType extends Type {
    toString(): string {
        return 'BigIntType'
    }
}
export const bigIntType: BigIntType = new BigIntType()

class StringType extends Type {
    toString(): string {
        return 'StringType'
    }
}
export const stringType: StringType = new StringType()

class BoolType extends Type {
    toString(): string {
        return 'BoolType'
    }
}
export const boolType: BoolType = new BoolType()

class UnknownType extends Type {
    toString(): string {
        return 'UnknownType'
    }
}
export const unknownType: UnknownType = new UnknownType()

class NeverType extends Type {
    toString(): string {
        return 'NeverType'
    }
}
export const neverType: NeverType = new NeverType()

class NullableType extends Type {
    constructor(public tpe: Type) {
        super()
    }
    toString(): string {
        return `NullableType<${this.tpe.toString()}>`
    }
}
export const nullableType = (tpe: Type) => new NullableType(tpe)

class ArrayType extends Type {
    constructor(public tpe: Type) {
        super()
    }
    toString(): string {
        return `ArrayType<${this.tpe.toString()}>`
    }
}
export const arrayType = (tpe: Type) => new ArrayType(tpe)

class TupleNType extends Type {
    constructor(public tpes: Array<Type>) {
        super()
    }
    toString(): string {
        return `Tuple<${this.tpes.map(each => each.toString()).join(', ')}>`
    }
    narrow(): Type {
        const [first, ...rest] = this.tpes
        const _first = first.toString()
        const hasUniformTypes = rest.every(el => el.toString() === _first)
        return hasUniformTypes ? arrayType(first) : this
    }
}
export const tupleNTypeType = (tpes: Array<Type>) => new TupleNType(tpes)

class DictType extends Type {
    constructor(public valueType: Type) {
        super()
    }
    toString(): string {
        return `DictType<${this.valueType.toString()}>`
    }
}
export const dictType = (valTpe: Type) => new DictType(valTpe)

class RecordType extends Type {
    constructor(public fields: Array<Field>) {
        super()
    }

    toString(): string {
        return `RecordType(${this.fields.map(field => `${field[0]} -> ${field[1].toString()}`).join(', ')})`
    }

    narrow(): Type {
        const [first, ...rest] = this.fields
        const strTypeOfFirst = first[1].toString()
        const hasUniformValueTypes = rest.every(el => el[1].toString() === strTypeOfFirst)
        return hasUniformValueTypes ? dictType(first[1]) : this
    }
}
export const recordType = (fields: Array<Field>) => new RecordType(fields)
