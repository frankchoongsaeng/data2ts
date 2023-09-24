# Introduction

This is a tool that ought to make encoding and decoding data in ts less painful (not to say it is because people don't really do that).
The tool would be in 3 parts:

1. TS types generator from json.
2. Codec generators from TS types
3. Codec generators from json (JSON -> TS types -> Codecs)

Should come with some additional utilities that enable you generate (part 1 or 3) directly from an http call that produces json.

## WIP

This was built overnight because I'm lazy. I want to be able to auto describe the response of some HTTP REST endpoint.
I initially started out by just traversing the json data and using `typeof x` to build an AST for the data in the JSON.
I've quickly realized that this isn't a good solution.

What I'm thinking of doing next is to traverse the json and eagerly produce wide types that can be narrowed down at the end.
In my mind, this is a much better solution because it allows the comparison to be done with a more controlled and consistent structure
which makes it easier.

Let's understand this with an example.

```json
{
    "signals": [{ "action": 1 }, { "action": 0 }, { "action": 1 }],
    "sender": "mxvd"
}
```

The type of the elements of signals are all the same so we could model the type like

```typescript
interface Signal {
    action: number
}
interface MyType {
    signals: Signal[]
    sender: string
}
```

This is apparent to us because we can see the consistency at a glance, but imagine a case where the object was much larger.
We would still be able to figure out that they are all the same but it would require a little bit more time because we would need to examine quite a lot of data.

The problem with JSON objects is that they can represent one of two types: a `Dictionary<K, V>` or a `Record`. As you can imagine, there's no straighforward way to
know if an object is a Record or a Dictionary early on. There are a couple of ways we could guess this information like checking if all the values in the object are of the same type.
However, assuming the wider type, in this case - Record, is always the safest choice.
