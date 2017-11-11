import test from 'ava'
import tag from '../index'

test('createTag should return a tag type', t => {
  const Foo = tag()
  const foo = Foo(0, 1, 2)

  t.is(Foo.is(foo), true)
  t.is(Foo.is(Foo), false)
  t.is(Foo.is(0), false)

  Foo.unwrap(foo, (x, y, z) => {
    t.is(x, 0)
    t.is(y, 1)
    t.is(z, 2)
  })
})

test('createTag should throw if provided displayName is not a string', t => {
  t.throws(() => {
    tag(4)
  }, /must be a string/)
})

test('Tag.is should return whether a value is of type Tag', t => {
  const Foo = tag()
  const foo = Foo()
  t.true(Foo.is(foo))
})

test('Tag.unwrap should throw if used on the wrong tag type', t => {
  const Foo = tag()
  const Bar = tag()
  const bar = Bar(0)

  t.throws(() => {
    Foo.unwrap(bar, () => t.fail())
  }, /Cannot unwrap/)
})

test('createTagUnion should return a union type', t => {
  const Foo = tag()
  const Bar = tag()
  const Msg = tag.union([Foo, Bar])

  const foo = Foo(12)
  const bar = Bar(18)

  t.is(Msg.has(foo), true)
  t.is(Msg.has(bar), true)

  const val = Msg.match(foo, [
    Foo, n => {
      t.is(n, 12)
      return 8
    },
    Bar, () => t.fail()
  ])

  t.is(val, 8)
})

test('createTagUnion should throw if any type is not a Tag', t => {
  const Foo = tag()

  t.throws(() => {
    tag.union([Foo, 4])
  }, /Invalid Tag/)
  t.throws(() => {
    tag.union([4, Foo])
  }, /Invalid Tag/)
  t.throws(() => {
    tag.union([1, Foo, 2])
  }, /Invalid Tag/)
})

test('createTagUnion should throw if there is a Tag duplicate', t => {
  const Foo = tag()
  t.throws(() => {
    tag.union([Foo, Foo])
  }, /Duplicate Tag/)
})

test('createTagUnion should throw if there is a duplicate Tag displayName', t => {
  const Foo = tag('Foo')
  const Bar = tag('Foo')
  t.throws(() => {
    tag.union([Foo, Bar])
  }, /display name/)
})

test('Union should throw if called directly', t => {
  t.throws(() => {
    const Msg = tag.union([])
    Msg()
  }, /cannot be created/)
})

test('Union.has should return whether a value is a tag of one of the Union types', t => {
  const Foo = tag()
  const Bar = tag()
  const Msg = tag.union([Foo])
  const foo = Foo()
  const bar = Bar()

  t.false(Msg.has(4))
  t.false(Msg.has(Foo))
  t.true(Msg.has(foo))
  t.false(Msg.has(Bar))
  t.false(Msg.has(bar))
})

test('Union.match should allow a catch-all', t => {
  const Foo = tag()
  const Bar = tag()
  const Msg = tag.union([Foo, Bar])

  const foo = Foo(12)

  Msg.match(foo, [
    () => t.pass()
  ])

  Msg.match(foo, [
    Bar, () => t.fail(),
    () => t.pass()
  ])
})

test('Union.match throws if catch-all is not a function', t => {
  const Foo = tag()
  const Msg = tag.union([Foo])
  const foo = Foo()

  t.throws(() => {
    Msg.match(foo, [
      Foo, () => {},
      4
    ])
  }, /catch-all must be/)
})

test('Union.match should throw if typeN is not a Tag', t => {
  const Foo = tag()
  const Msg = tag.union([Foo])
  const foo = Foo()

  t.throws(() => {
    Msg.match(foo, [
      undefined, () => {},
      4, () => {},
      () => {}
    ])
  }, /type must be a Tag/)
})

test('Union.match should throw if handlerN is not a function', t => {
  const Foo = tag()
  const Msg = tag.union([Foo])
  const foo = Foo()

  t.throws(() => {
    Msg.match(foo, [
      Foo, 4,
      () => {}
    ])
  }, /must be a function/)
})

test('Union.match should throw if typeN is a duplicate Tag', t => {
  const Foo = tag()
  const Msg = tag.union([Foo])
  const foo = Foo()

  t.throws(() => {
    Msg.match(foo, [
      Foo, () => {},
      Foo, () => {}
    ])
  }, /type can only be covered by one/)
})

test('Union.match should throw if there are missing cases and no catch-all', t => {
  const Foo = tag()
  const Bar = tag()
  const Msg = tag.union([Foo, Bar])

  const foo = Foo(12)

  t.throws(() => {
    Msg.match(foo, [
      Foo, () => {}
    ])
  }, /Not all cases are covered/)
})

test('Union.match should throw if all cases are handled and there is a catch-all', t => {
  const Foo = tag()
  const Msg = tag.union([Foo])

  const foo = Foo()

  t.throws(() => {
    Msg.match(foo, [
      Foo, () => {},
      () => {}
    ])
  }, /All cases are covered/)
})

test('Union.match should throw if a tag is not a member of the union', t => {
  const Foo = tag()
  const Stray = tag('Stray')
  const Msg = tag.union([Foo])

  t.throws(() => {
    Msg.match(Foo(1), [
      Foo, () => 2,
      Stray, () => 3
    ])
  }, /Stray/)

  t.throws(() => {
    Msg.match(Foo(1), [
      Foo, () => 2,
      Stray, () => 3
    ])
  }, /not in this union/)
})

test('createNamedTagUnion should create a union with tags assign to it', t => {
  const Msg = tag.namedUnion(['Foo', 'Bar'])
  t.is(Msg.has(Msg.Foo(1)), true)
  t.is(Msg.has(Msg.Bar(2)), true)

  t.is(Msg.Foo.is(Msg.Foo(8)), true)
  t.is(Msg.Bar.is(Msg.Bar(7)), true)
})

test('createNamedTagUnion should throw if names is not an array', t => {
  t.throws(() => {
    tag.namedUnion({hello: 'world'})
  }, /must be an array/)
})

test('createNamedTagUnion should throw if any name is not a string', t => {
  t.throws(() => {
    tag.namedUnion(['Hello', 2, 'World'])
  }, /must be a string/)
})

test('createNamedTagUnion should throw if any name conflicts with a previous property', t => {
  t.throws(() => {
    tag.namedUnion(['has'])
  }, /reserved/)
})

test('namedTagUnion.namedUnion should match with an object of handlers', t => {
  const Msg = tag.namedUnion(['Foo', 'Bar'])

  t.is(Msg.namedMatch(Msg.Foo(8), {
    Foo: n => n,
    Bar: n => 0
  }), 8)

  t.is(Msg.namedMatch(Msg.Foo(7), {}, () => 6), 6)
})
