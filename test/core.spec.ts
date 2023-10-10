import { extractTypesHelper as e } from '../src/core'
import * as ast from '../src/core/ast'

const json = JSON.stringify

describe('json2ts core - extractTypesHelper', () => {
    test('number', () => {
        expect(e(1).toString()).toEqual(ast.numberType.toString())
    })

    // BigInt literals are not available when targeting lower than ES2020.
    test('bigint', () => {
        expect(e(BigInt(0xfffffffffffffff)).toString()).toEqual(ast.bigIntType.toString())
    })

    test('string', () => {
        expect(e('foo').toString()).toEqual(ast.stringType.toString())
    })

    test('boolean', () => {
        expect(e(true).toString()).toEqual(ast.boolType.toString())
    })

    test('null', () => {
        expect(e(null).toString()).toEqual(ast.nullType.toString())
    })

    test('undefined', () => {
        expect(() => e(undefined)).toThrow('Unsupported Type!!! undefined')
    })

    test('empty array', () => {
        expect(e([]).toString()).toBe(ast.arrayType(ast.unknownType).toString())
    })

    test('empty object', () => {
        expect(e({}).toString()).toBe(ast.dictType(ast.unknownType).toString())
    })

    test('array of numbers', () => {
        expect(e([1, 5, 2, 4, 3]).toString()).toBe(ast.arrayType(ast.numberType).toString())
    })

    test('tuple (string, number)', () => {
        expect(e(['foo', 3]).toString()).toBe(ast.tupleNTypeType([ast.stringType, ast.numberType]).toString())
    })

    test('tuple (string, number, boolean)', () => {
        expect(e(['foo', 3, true]).toString()).toBe(
            ast.tupleNTypeType([ast.stringType, ast.numberType, ast.boolType]).toString()
        )
    })

    test('array of tuple (string, number)', () => {
        expect(
            e([
                ['foo', 3],
                ['hello', 4],
                ['world', 5],
                ['sabbath', 7]
            ]).toString()
        ).toBe(ast.arrayType(ast.tupleNTypeType([ast.stringType, ast.numberType])).toString())
    })

    test('array of tuple (string, number)', () => {
        expect(
            e([
                ['foo', 3],
                ['hello', 4],
                ['world', 5],
                ['sabbath', 7]
            ]).toString()
        ).toBe(ast.arrayType(ast.tupleNTypeType([ast.stringType, ast.numberType])).toString())
    })

    test('dictionary', () => {
        expect(e({ John: 23, Jane: 19 }).toString()).toBe(ast.dictType(ast.numberType).toString())
    })

    test('record', () => {
        expect(e({ name: 'John', age: 23 }).toString()).toBe(
            ast
                .recordType([
                    ['age', ast.numberType],
                    ['name', ast.stringType]
                ])
                .toString()
        )
    })

    test('array of record', () => {
        expect(
            e([
                { name: 'John', age: 23 },
                { name: 'Jane', age: 19 }
            ]).toString()
        ).toBe(
            ast
                .arrayType(
                    ast.recordType([
                        ['age', ast.numberType],
                        ['name', ast.stringType]
                    ])
                )
                .toString()
        )
    })

    test('array of record with optional fields', () => {
        expect(
            e([
                { name: 'John', age: 23 },
                { name: 'Jane', age: 19 },
                { name: 'Johnson', age: 45, address: 'crimson street' }
            ]).toString()
        ).toBe(
            ast
                .arrayType(
                    ast.recordType([
                        ['address', ast.optionalType(ast.stringType)],
                        ['age', ast.numberType],
                        ['name', ast.stringType]
                    ])
                )
                .toString()
        )
    })

    test('array of record with nullable fields', () => {
        expect(
            e([
                { name: 'John', age: 23 },
                { name: 'Jane', age: null },
                { name: 'Johnson', age: 45 }
            ]).toString()
        ).toBe(
            ast
                .arrayType(
                    ast.recordType([
                        ['age', ast.nullableType(ast.numberType)],
                        ['name', ast.stringType]
                    ])
                )
                .toString()
        )
    })

    test('array of record with optional nullable fields', () => {
        expect(e([{ name: 'John', age: 23, isAdmin: true }, { name: 'Jane', age: null, isAdmin: true }, { name: 'Johnson', isAdmin: false }]).toString()).toBe(
            ast
                .arrayType(
                    ast.recordType([
                        ['age', ast.optionalType(ast.nullableType(ast.numberType))],
                        ['isAdmin', ast.boolType],
                        ['name', ast.stringType]
                    ])
                )
                .toString()
        )
    })

    test('array of record with optional nullable fields', () => {
        expect(e([{ name: 'John', age: 23, }, { name: 'Jane', age: null }, { name: 'Johnson' }]).toString()).toBe(
            ast
                .arrayType(
                    ast.recordType([
                        ['age', ast.optionalType(ast.nullableType(ast.numberType))],
                        ['name', ast.stringType]
                    ])
                )
                .toString()
        )
    })
})
