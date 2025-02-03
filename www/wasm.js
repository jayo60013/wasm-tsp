
export async function initWasm(NUM_POINTS) {

  let wasmMemory = new WebAssembly.Memory({
    initial: 256,
    maximum: 256
  });

  let importObject = {
    env: {
      memory: wasmMemory,
      print: (ptr, len) => {
        const memory = wasmModule.instance.exports.memory;
        const view = new Uint8Array(memory.buffer, ptr, len);
        const decodedString = new TextDecoder().decode(view);
        console.log(decodedString);
      },
      getCurrentTime: () => { return performance.now() }
    }
  };

  const response = await fetch("../main.wasm");
  const wasmModule = await WebAssembly.instantiateStreaming(response, importObject);
  const { initialisePoints, getPointOrder, memory } = wasmModule.instance.exports;

  return {
    initialisePoints,
    getPointOrder,
    memory
  }
}
