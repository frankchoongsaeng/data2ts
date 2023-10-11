# Introduction

This is a tool that ought to encourage encoding and decoding of data in Typescript by auto generating types from json, and encoders and decoders for those types.

Simply put, if we have this json.

```json
{
    "signals": [{ "action": 1 }, { "action": null }, { "action": 1, "expectedResType": 2 }],
    "sender": "mxvd"
}
```

We want to produce

```typescript
type Root = {
    signals: Array<{
        action: number | null
        expectedResType: number | undefined
    }>
    sender: string
}
function encodeRoot(r: Root): string
function decodeRoot(json: string): Root
```

The tool would be in 3 parts:

1. TS types generator from json.
2. Codec generators from TS types
3. Codec generators from json (JSON -> TS types -> Codecs)

Should come with some additional utilities that enable you generate (part 1 or 3) directly from an http call that produces json.

## WIP

This project is still in development stage and has no stable release version yet. The rest of this documentation simply outlines the process, assumptions and any development related information about the work and progress so far.

The motivation behind this project is simply that I want to be able to auto describe the response of some HTTP REST endpoint because I'm lazy. This was built overnight so this initial version may be full of bugs.

### How the types are known

Keep the following JSON in mind, we'll call it refData.

```json
{
    "signals": [{ "action": 1 }, { "action": 0 }, { "action": 1 }],
    "sender": "mxvd"
}
```

The general approach to figuring out the types is to just traverse the refData and using `typeof x` to build an AST for the data.
That means the tooling would do the following for every item (every element of arrays and every value of a field) in refData:

1. Check the `typeof refData` - if it is an object, it would produce one of two things
    - a `Record` which is like an instance of a class with predefined set of fields.
    - or `{ [key: string]: T }`, i.e - a dictionary or maybe think of it like a `Map<string, T>`.
2. When `typeof refData` returns any of the primitive types, it returns the corresponding TS type.
3. In cases when `typeof refData` returns an object, it checks the data itself and if it is an Array it would produce one of two things
    - an `Array<T>`
    - or TupleN `[T1, T2, ...TN]` i.e - an array with different types at different positions.
4. When the data is `null` (`typeof null = 'object'`), it produces a `unknown | null`
5. If the data is an empty array then it produces `Array<unknown>`
6. If the data is an empty object then it produces an empty record `{}`

#### Approach 1: Brute Force

In steps 1 and 3, the way the eventual data type is decided is by checking the types of all the values of the object or array.
If the array contains all of the same type, the tool rules in favor of an `Array<T>` where `T` is the type of the values in the array.
If the array contains different types at different positions, then it assumes that the array is a tuple and uses the type `[T1,...TN]`
in the case of an object, where all values are of the same type, then tool assumes the object is of type `{ [key: string]:  T }`, and a `Record otherwise.

An issue arises with this approach when we have an array of objects and we need to decide if the array is an `Array<T>` or `Array<{ [key: string]:  T }>`.

> object comparison is acheived by checking that all the objects have the same fields or that the fields of one object is a subset of the fields of the other object.
> In most cases, when we have an array containing only objects, the objects should be merged into one structure i.e. the resulting object fields should
> be a union of all fields from all objects in that array.

This approach becomes inneficient because we need more traversal steps with each step potentially doing a nested traversal:

1. First, we traverse the array to figure out what kind of Array it is i.e. array or tuple.
2. Next, we traverse to produce the type of each object. This step is required to combine types in step 3.
3. Finally we traverse to create the final type for `T` in `Array<T>` or `Array<{ [key: string]:  T }>`.

#### Approach 2: Type Narrowing

The next implemented approach is to traverse the json and eagerly produce wide types that can be narrowed down at the end.
In my mind, this is a much better solution because it allows the comparison to be done with a more controlled and consistent structure which make things easier.
This approach adds a tweak to the brute force approach called narrowing which is essentially merging step 1 and 2 of the traversal steps.

This is apparent to us because we can see the consistency at a glance, but imagine a case where the object was much larger.
We would still be able to figure out that they are all the same but it would require a little bit more time because we would need to examine quite a lot of data.
As you've seen; there's no straighforward way to know if an object is a record or a dictionary early on, however, assuming the wider type (Tuple in this case arrays) is always the safest choice.

Let's examplify using the following.

```json
{
    "signals": [{ "action": 1 }, { "action": null }, { "action": 1, "expectedResType": 2 }],
    "sender": "mxvd"
}
```

The tooling would first assume that "signals" is an tuple. Here's what that looks like in typescript

```typescript
interface Root {
    signals: [{ action: number }, { action: unknown | null }, { action: number; expectedResType: number }]
    sender: string
}
```

The it applies another step that narrows the tuple to an `Array<T>`

```typescript
interface Root {
    signals: Array<{ action: number | null; expectedResType: number | undefined }>
    sender: string
}
```

## Usage

... coming next

## Contribution

clone and run the example with `npx ts-node src/example.ts`
