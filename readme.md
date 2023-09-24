# Introduction

Figures out the type of some json object.

I initially started out by just checking the types of the json data, but quickly realized that this wasn't a good solution.

What I'm thinking of doing is to eagerly traverse the json and produce wide types that can be narrowed down at the end.
Let's understand this with an example.

```json
const json = {
    signals: [
        { action: 1 },
        { action: 0 },
        { action: 1 }
    ],
    sender: 'mxvd'
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
This is true as well for this tooling.
