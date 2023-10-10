export class Def {
    constructor(public name: string) {}
}

export class TypeAlias extends Def {
    constructor(name: string, public tpe: Type) {
        super(name)
    }
}

export class InterfaceDef extends Def {
    constructor(name: string, public fields: Array<[string, Type]>) {
        super(name)
    }
}

export abstract class Type {
    abstract toString(): string
    narrow(): Type {
        return this
    }

    /**
     * Compares objects on a type level.
     * @param other
     * @returns boolean
     */
    equalsType(other: Type): boolean {
        return other.constructor === this.constructor
    }

    /**
     * Compares objects on a structural level.
     * @param other
     * @returns boolean
     */
    equalsStruct(other: Type): boolean {
        return this.toString() === other.toString()
    }
}

export type Field = [string, Type]

export class NumberType extends Type {
    toString(): string {
        return 'NumberType'
    }
}
export const numberType: NumberType = new NumberType()

export class BigIntType extends Type {
    toString(): string {
        return 'BigIntType'
    }
}
export const bigIntType: BigIntType = new BigIntType()

export class StringType extends Type {
    toString(): string {
        return 'StringType'
    }
}
export const stringType: StringType = new StringType()

export class BoolType extends Type {
    toString(): string {
        return 'BoolType'
    }
}
export const boolType: BoolType = new BoolType()

export class UnknownType extends Type {
    toString(): string {
        return 'UnknownType'
    }
}
export const unknownType: UnknownType = new UnknownType()

export class NeverType extends Type {
    toString(): string {
        return 'NeverType'
    }
}
export const neverType: NeverType = new NeverType()

export class UnionType extends Type {
    constructor(public tpes: Array<Type>) {
        super()
        this.normalize()
    }

    /**
     * Flattens nested union types.
     */
    private normalize() {
        let flattened: Type[] = []
        for (let tpe of this.tpes) {
            if (tpe instanceof UnionType) {
                tpe.normalize()
                flattened = flattened.concat(tpe.tpes)
            } else {
                flattened.push(tpe)
            }
        }
        const set = new Set<Type>(flattened)
        this.tpes = [...set]
        this.tpesStr = this.tpes.map(t => t.toString()).join(' | ')
    }

    tpesStr?: string
    toString(): string {
        if (this.tpesStr === undefined) this.tpesStr = this.tpes.map(t => t.toString()).join(' | ')
        return this.tpesStr
    }
}
export const unionType = (tpes: Array<Type>) => new UnionType(tpes)

export class UndefinedType extends Type {
    constructor() {
        super()
    }
    toString(): string {
        return 'undefined'
    }
}
export const undefinedType = new UndefinedType()

export type OptionalType = UnionType
export const optionalType = (tpe: Type) => unionType([tpe, undefinedType])

export class NullType extends Type {
    constructor() {
        super()
    }
    toString(): string {
        return `null`
    }
}
export const nullType = new NullType()
export type NullableType = UnionType
export const nullableType = (tpe: Type) => unionType([tpe, nullType])

export class ArrayType extends Type {
    constructor(public tpe: Type) {
        super()
    }
    tpeStr?: string
    toString(): string {
        if (this.tpeStr === undefined) this.tpeStr = this.tpe.toString()
        return `ArrayType<${this.tpe.toString()}>`
    }
}
export const arrayType = (tpe: Type) => new ArrayType(tpe)

export class TupleNType extends Type {
    constructor(public tpes: Array<Type>) {
        super()
    }
    tpesStr?: string
    toString(): string {
        if (this.tpesStr === undefined) this.tpesStr = this.tpes.map(each => each.toString()).join(', ')
        return `Tuple<${this.tpesStr}>`
    }
    narrow(): Type {
        const [first, ...rest] = this.tpes
        let isUniform = true
        let prevType: Type = first
        let mergedWiderRecord: RecordType | undefined

        for (let tpe of rest) {
            // exit as soon as we meet types that don't match
            if (!isUniform) break

            if (prevType instanceof RecordType && tpe instanceof RecordType) {
                if (mergedWiderRecord === undefined) mergedWiderRecord = prevType.merge(tpe)
                else mergedWiderRecord = mergedWiderRecord.merge(tpe)
            } else if (prevType instanceof RecordType && tpe instanceof DictType) {
                isUniform = true
            } else isUniform = tpe.equalsStruct(prevType)

            prevType = tpe
        }

        return isUniform ? arrayType(mergedWiderRecord ?? first) : this
    }
}
export const tupleNTypeType = (tpes: Array<Type>) => new TupleNType(tpes)

export class DictType extends Type {
    constructor(public tpe: Type) {
        super()
    }
    tpeStr?: string
    toString(): string {
        if (this.tpeStr === undefined) this.tpeStr = this.tpe.toString()
        return `DictType<${this.tpeStr}>`
    }
}
export const dictType = (valTpe: Type) => new DictType(valTpe)

export class RecordType extends Type {
    constructor(public fields: Array<Field>) {
        super()
    }
    // optimization: reuses the previously computed string to avoid calling toString() again
    fieldsStr?: string
    toString(): string {
        if (this.fieldsStr === undefined)
            this.fieldsStr = this.fields.map(field => `${field[0]} -> ${field[1].toString()}`).join(', ')
        return `RecordType(${this.fieldsStr})`
    }

    narrow(): Type {
        const [first, ...rest] = this.fields
        const hasUniformValueTypes = rest.every(el => el[1].equalsStruct(first[1]))
        return hasUniformValueTypes ? dictType(first[1]) : this
    }

    asObject(): { [key: string]: Type } {
        return this.fields.reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})
    }

    /**
     * Merges the fields and types of two records.
     *
     * ex:
     *
     * const rec1 = { foo: string }
     * const rec2 = { foo: number, bar: string }
     * console.log(rec1.merge(rec2)) // { foo: string | number, bar: string | undefined }
     *
     * @param right
     */
    merge(right: RecordType): RecordType {
        const newFields: Field[] = []
        const thisObj = this.asObject()
        const rightObj = right.asObject()
        const allFields = { ...thisObj, ...rightObj }

        for (let k in allFields) {
            const tpe1 = thisObj[k]
            const tpe2 = rightObj[k]

            let fieldType = tpe1

            // only exists in one record
            if (tpe1 === undefined || tpe2 === undefined) fieldType = optionalType(tpe1 ?? tpe2)
            // exists in both, but have different types
            else if (tpe1.constructor !== tpe2.constructor) fieldType = unionType([tpe1, tpe2])

            newFields.push([k, fieldType])
        }

        newFields.sort((a, b) => (a[0] > b[0] ? 1 : b[0] > a[0] ? -1 : 0))
        return recordType(newFields)
    }
}

export const recordType = (fields: Array<Field>) => new RecordType(fields)
