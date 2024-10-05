export async function initWasm(NUM_POINTS) {

  let wasmMemory = new WebAssembly.Memory({
    initial: 256,
    maximum: 256
  });

  let importObject = {
    env: {
      memory: wasmMemory,
    }
  };

  const response = await fetch("../main.wasm");
  const wasmModule = await WebAssembly.instantiateStreaming(response, importObject);
  const { initialisePoints, getPointOrder, memory } = wasmModule.instance.exports;

  return {
    initialisePoints,
    getPointOrder,
    memory,
    wasmMemory
  }
}
