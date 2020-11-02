# MTNetNode

### What is callprop

Callprop is just a string with certain semantics. It contains a location part, a groups part and an event part:

- location pars is just a symbol - `#` or `@`.
  - `#` represents a local node (e.g. plugins which are running on this machine)
  - `@` represents a remote node (e.g. plugins which are running on a remote machine)
- groups part is again just a string, representing groups names, it`s up to you what logic should go under group part. It is there to impose difference between certain event and place where it is executed. Different groups can be used at once (see examples)
- event part is a string

Some examples of Callprop

- `"#:logger:log"` - targets all local plugins, which are in `logger` group and emit `log` event on them
- `"@:score:increment` - targets all remote nodes plugisn, which are in score group and emits `increment` event on them
- `@:tetris controller:remove_row` - targets all remote nodes plugins, which are in `tetris` and `controller` groups and emits `remove_row` event on them
