function compile(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("无法创建着色器。");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;

  const stage = type === gl.VERTEX_SHADER ? "顶点" : "片元";
  const log = gl.getShaderInfoLog(shader);
  gl.deleteShader(shader);
  throw new Error(stage + "着色器编译失败\n" + log);
}

function link(gl, vertexSource, fragmentSource) {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  let fragment;
  try {
    fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (!program) throw new Error("无法创建 WebGL 程序。");
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;

    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error("链接失败\n" + log);
  } finally {
    gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
  }
}

function uploadTexture(gl) {
  const size = 64;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const offset = (y * size + x) * 4;
      const tile = (Math.floor(x / 8) + Math.floor(y / 8)) % 2;
      pixels.set([42 + x * 3, 55 + y * 3, tile ? 200 : 65, 255], offset);
    }
  }
  const texture = gl.createTexture();
  if (!texture) throw new Error("无法创建示例纹理。");
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
}

export function createRenderer(canvas) {
  const gl = canvas.getContext("webgl2", { alpha: false });
  if (!gl) throw new Error("WebGL 2 不可用。请启用浏览器硬件加速或换用支持 WebGL 2 的浏览器。");
  uploadTexture(gl);
  let program;
  let locations;

  return {
    setSource({ vertex, fragment }) {
      const next = link(gl, vertex, fragment);
      const uniform = (name) => gl.getUniformLocation(next, name);
      locations = {
        resolution: uniform("u_resolution"),
        pointer: uniform("u_pointer"),
        time: uniform("u_time"),
        texture: uniform("u_texture"),
      };
      gl.useProgram(next);
      if (program) gl.deleteProgram(program);
      program = next;
      return { animated: locations.time !== null, pointer: locations.pointer !== null };
    },

    draw(time, pointer) {
      if (!program || gl.isContextLost()) return;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.clearColor(0.035, 0.065, 0.085, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(locations.resolution, width, height);
      gl.uniform2f(locations.pointer, ...pointer);
      gl.uniform1f(locations.time, time);
      gl.uniform1i(locations.texture, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
