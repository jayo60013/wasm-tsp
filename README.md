# Travelling salesman problem in WASM

This is just a fun project for playing around with Zig and WebGL.

## Usage
Compile `zig build-exe src/main.zig -target wasm32-freestanding -fno-entry -rdynamic -O ReleaseSmall`

## Benchmarking

### Brute force

Each run the algorithm is run 10 times with 1000 points

|run|time (ms)|
|---|---|
|1|15|
|2|27|
|3|30|
|4|21|
|5|26|
|6|21|
|7|26|
|8|22|
|9|16|
|10|18|
|avg|22.2|

## In action
[tsp in action](./dev_log/tsp.gif)
