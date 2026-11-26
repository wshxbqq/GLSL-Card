const fullscreen = `#version 300 es
out vec2 v_uv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  v_uv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

function example(name, body, { definitions = "", vertex = fullscreen } = {}) {
  return {
    name,
    vertex,
    fragment: `#version 300 es
precision highp float;
in vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_pointer;
uniform sampler2D u_texture;
out vec4 fragColor;
${definitions}
void main() {
${body}
}
`,
  };
}

const space = "  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;";
const triangle = `#version 300 es
out vec2 v_uv;
const vec2 positions[3] = vec2[3](
  vec2(-0.75, -0.64), vec2(0.75, -0.64), vec2(0.0, 0.72)
);
const vec2 attributes[3] = vec2[3](
  vec2(0.0, 0.0), vec2(1.0, 0.0), vec2(0.5, 1.0)
);
void main() {
  v_uv = attributes[gl_VertexID];
  gl_Position = vec4(positions[gl_VertexID], 0.0, 1.0);
}`;

const noise = `float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
  vec2 s = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(cell), hash(cell + vec2(1.0, 0.0)), s.x),
    mix(hash(cell + vec2(0.0, 1.0)), hash(cell + 1.0), s.x),
    s.y
  );
}
`;

export const chapters = [
  {
    id: "first-pixel",
    title: "从一个像素开始",
    intro: "先让 GPU 为每个片元写入一个颜色，再把屏幕坐标变成渐变。你可以直接编辑代码并按「运行」。",
    examples: [
      example("双色渐变", `  vec3 left = vec3(0.18, 0.82, 0.63);
  vec3 right = vec3(0.46, 0.24, 0.82);
  fragColor = vec4(mix(left, right, v_uv.x), 1.0);`),
      example("纯色填充", "  fragColor = vec4(0.12, 0.62, 0.51, 1.0);"),
    ],
    paragraphs: [
      "|#version 300 es| 选择 GLSL ES 3.00。|precision highp float| 设定片元的默认浮点精度。|main| 为每个片元执行一次，|fragColor| 是声明的四通道输出。",
      "RGB 控制红、绿、蓝，第四个通道是 alpha。渐变示例以 |v_uv.x| 作为 |mix| 的权重，从左到右在两种颜色之间插值。",
      "JavaScript 创建 WebGL 2 上下文、编译两个着色器并提交绘制。默认的顶点着色器生成覆盖整个视口的三角形，第 8 章会直接修改顶点。",
    ],
  },
  {
    id: "coordinates",
    title: "坐标、分辨率与宽高比",
    intro: "对比像素坐标、归一化坐标和等比例坐标，找出圆在宽屏上被拉伸的原因。",
    examples: [
      example("等比例坐标", `${space}
  float circle = 1.0 - smoothstep(0.23, 0.235, length(p));
  fragColor = vec4(mix(vec3(0.06, 0.12, 0.18), vec3(0.33, 0.90, 0.76), circle), 1.0);`),
      example("UV 四象限", `  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 quadrant = step(vec2(0.5), uv);
  fragColor = vec4(0.12 + quadrant.x * 0.5, 0.22 + quadrant.y * 0.55, 0.46, 1.0);`),
    ],
    paragraphs: [
      "|gl_FragCoord.xy| 是片元在绘制缓冲区中的像素坐标，原点在左下。分别除以缓冲区的宽和高，结果会落在 0 到 1 之间。",
      "画圆时先减去视口中心，再让两个轴同时除以高度。x、y 的同一数值就代表相同的像素距离。|length(p)| 计算到中心的距离。",
      "四象限用 |step| 把连续坐标切为两档。缩放窗口时，象限仍占据相同的相对位置。",
    ],
  },
  {
    id: "types",
    title: "标量、向量与矩阵",
    intro: "先拆分并重排颜色通道，再用 2×2 矩阵旋转条纹的采样坐标。",
    examples: [
      example("通道重排", `  vec3 color = vec3(v_uv, 0.55);
  int band = int(floor(v_uv.x * 3.0));
  vec3 channels = color.rgb;
  if (band == 1) channels = color.gbr;
  if (band == 2) channels = color.bgr;
  fragColor = vec4(channels, 1.0);`),
      example("旋转条纹", `${space}
  float angle = radians(35.0);
  float c = cos(angle), s = sin(angle);
  mat2 rotation = mat2(c, s, -s, c);
  vec2 rotated = rotation * p;
  float stripe = step(0.5, fract(rotated.x * 9.0));
  fragColor = vec4(mix(vec3(0.08, 0.15, 0.23), vec3(0.95, 0.60, 0.38), stripe), 1.0);`),
    ],
    paragraphs: [
      "|float|、|int|、|bool| 是标量。|vec2| 到 |vec4| 是浮点向量。可以用 |.xyzw| 或 |.rgba| 访问分量，一次 swizzle 里使用同一套字母。",
      "先用 |floor| 得到浮点值，再用 |int(...)| 转换为区间编号。|vec3 * vec3| 做逐分量乘法，|mat2 * vec2| 按矩阵乘法计算。",
      "|mat2(c, s, -s, c)| 按列填入，结果是 (cx − sy, sx + cy)。这里旋转采样坐标，图案看起来会朝反方向转。",
    ],
  },
  {
    id: "masks",
    title: "遮罩、距离场与抗锯齿",
    intro: "用带符号距离定义形状，比较硬边和平滑边，再给圆形挖一个洞。",
    examples: [
      example("硬边与软边", `${space}
  vec2 center = vec2(p.x < 0.0 ? -0.23 : 0.23, 0.0);
  float d = length(p - center) - 0.15;
  float aa = fwidth(d);
  float hard = 1.0 - step(0.0, d);
  float soft = 1.0 - smoothstep(-aa, aa, d);
  float mask = p.x < 0.0 ? hard : soft;
  fragColor = vec4(mix(vec3(0.08, 0.12, 0.19), vec3(0.96, 0.73, 0.39), mask), 1.0);`),
      example("偏心圆环", `${space}
  float outer = length(p) - 0.32;
  float hole = length(p - vec2(0.06, 0.01)) - 0.20;
  float d = max(outer, -hole);
  float aa = fwidth(d);
  float shape = 1.0 - smoothstep(-aa, aa, d);
  fragColor = vec4(mix(vec3(0.10, 0.11, 0.18), vec3(0.45, 0.76, 1.0), shape), 1.0);`),
    ],
    paragraphs: [
      "圆的带符号距离 |length(p) - radius| 在圆内为负，在边界为零。|step| 给出硬边遮罩，|smoothstep| 在两个阈值之间平滑过渡。",
      "|fwidth(d)| 通过邻近片元的变化估计过渡宽度。计算导数后再选择硬边或软边，能避免在左右不同的控制流里单独求导。",
      "以内部为负时，|min(a, b)| 是并集，|max(a, b)| 是交集，|max(a, -b)| 则从 A 挖去 B。",
    ],
  },
  {
    id: "patterns",
    title: "重复、网格与图案",
    intro: "将画布切成重复单元，用格子编号选颜色，用格子内坐标控制形状。",
    examples: [
      example("棋盘格", `${space}
  vec2 cell = floor(p * 9.0);
  float checker = mod(cell.x + cell.y, 2.0);
  fragColor = vec4(mix(vec3(0.09, 0.17, 0.23), vec3(0.58, 0.84, 0.73), checker), 1.0);`),
      example("重复圆点", `${space}
  vec2 grid = p * 9.0;
  vec2 cell = floor(grid);
  vec2 local = fract(grid) - 0.5;
  float radius = mix(0.12, 0.38, mod(cell.x + cell.y, 2.0));
  float d = length(local) - radius;
  float mask = 1.0 - smoothstep(-0.015, 0.015, d);
  fragColor = vec4(mix(vec3(0.08, 0.11, 0.19), vec3(0.73, 0.56, 0.98), mask), 1.0);`),
    ],
    paragraphs: [
      "|floor(p)| 返回向下取整的格子坐标，负数同样适用。|fract(p)| 等于 |p - floor(p)|，可用作格子内的相对坐标。",
      "把格子编号相加再对 2 取模，会得到交错的奇偶值。棋盘用它选颜色，圆点用它选半径。",
      "先缩放再取小数能改变重复次数。要移动整张网格，在取整前给网格坐标加偏移。",
    ],
  },
  {
    id: "uniforms",
    title: "时间、指针与 uniform",
    intro: "把鼠标、触屏和时间传给着色器，绘制能跟随指针的光晕和会移动的波纹。",
    examples: [
      example("指针光晕", `  vec2 delta = (v_uv - u_pointer) * u_resolution / u_resolution.y;
  float glow = exp(-6.0 * length(delta));
  fragColor = vec4(vec3(0.04, 0.12, 0.18) + glow * vec3(0.24, 0.80, 0.65), 1.0);`),
      example("行进波纹", `${space}
  float wave = 0.5 + 0.5 * sin(26.0 * length(p) - 3.0 * u_time);
  fragColor = vec4(mix(vec3(0.06, 0.13, 0.28), vec3(0.32, 0.91, 0.84), wave), 1.0);`),
    ],
    paragraphs: [
      "|uniform| 由 JavaScript 设置，在一次绘制中对所有片元一致。教程提供 |u_resolution|、|u_time|、|u_pointer| 和 |u_texture|。",
      "鼠标和触屏事件的 y 朝下增长。JavaScript 将它反转，再将坐标归一化，用左下为原点的 |u_pointer| 传给 GLSL。",
      "|u_time| 的单位是秒。时间项让正弦波的相位移动，系数控制方向和速度。可以暂停动画观察单帧。",
    ],
  },
  {
    id: "textures",
    title: "纹理、采样与 UV",
    intro: "用采样器读取图案，通过变换 UV 来重复或扭曲同一张纹理。",
    examples: [
      example("原始纹理", "  fragColor = texture(u_texture, v_uv);"),
      example("偏移与重复采样", `  vec2 uv = v_uv * 2.0;
  uv.x += 0.14 * sin(10.0 * uv.y);
  fragColor = texture(u_texture, uv);`),
    ],
    paragraphs: [
      "JavaScript 生成示例纹理，用 |texImage2D| 上传 RGBA 像素，再将纹理单元 0 绑定到 |sampler2D|。|texture(u_texture, uv)| 依据 UV 返回颜色。",
      "示例设置了 |REPEAT|。UV 超出 0 到 1 后会重复图案。把采样方式设为 |CLAMP_TO_EDGE| 则会延伸边缘像素。",
      "屏幕片元留在原处，扭曲改变的是它读取纹理的位置。线性过滤会混合相邻纹素，减少像素块感。",
    ],
  },
  {
    id: "vertex",
    title: "顶点、裁剪空间与插值",
    intro: "打开「顶点」查看三个点的位置，再追踪颜色如何在顶点之间过渡。",
    examples: [
      example("三角形颜色插值", `  vec3 color = vec3(1.0 - v_uv.x, v_uv.y, v_uv.x);
  fragColor = vec4(color, 1.0);`, { vertex: triangle }),
      example("插值等值线", `  float line = step(0.20, fract(v_uv.y * 10.0));
  fragColor = vec4(mix(vec3(0.10, 0.23, 0.28), vec3(0.92, 0.70, 0.36), line), 1.0);`, { vertex: triangle }),
    ],
    paragraphs: [
      "|gl_Position| 写入 (x, y, z, w) 裁剪坐标。经过透视除法后，前三个分量各除以 w。示例中 w 恒为 1，x、y 因此与归一化设备坐标相同。",
      "|gl_VertexID| 提供顶点索引，例子据此读取三个顶点的位置和属性。改 |positions| 会改变三角形的边界。",
      "顶点的 |out vec2 v_uv| 匹配片元的 |in vec2 v_uv|。光栅化会在三角形内部对属性做插值。旧版中的 |varying| 对应这里的一对 |out| 和 |in|。",
    ],
  },
  {
    id: "noise",
    title: "随机、值噪声与叠加",
    intro: "从伪随机网格开始，用插值消除格子边界，再通过循环混合不同尺度的噪声。",
    examples: [
      example("网格随机与平滑噪声", `${space}
  vec2 grid = p * 10.0;
  float n = p.x < 0.0 ? hash(floor(grid)) : noise(grid);
  fragColor = vec4(vec3(n * 0.78, n * 0.92, n), 1.0);`, { definitions: noise }),
      example("多层噪声云纹", `${space}
  vec2 q = p * 3.6;
  float sum = 0.0;
  float amplitude = 0.5;
  for (int octave = 0; octave < 5; ++octave) {
    sum += amplitude * noise(q);
    q = q * 2.0 + vec2(12.4, 7.1);
    amplitude *= 0.5;
  }
  fragColor = vec4(mix(vec3(0.05, 0.14, 0.30), vec3(0.62, 0.92, 0.83), sum), 1.0);`, { definitions: noise }),
    ],
    paragraphs: [
      "|hash| 给网格整数坐标分配可复现的伪随机值。直接按格子采样会有硬边，用格子四角的值和局部坐标插值可以得到连续变化。",
      "例子用 |f * f * (3.0 - 2.0 * f)| 平滑插值权重，使插值在单元边缘的变化速率趋于零。",
      "多层例子反复提高频率并降低振幅。低频决定大块轮廓，高频补充纹理细节。更多迭代会增加每个片元的计算量。",
    ],
  },
  {
    id: "composition",
    title: "综合练习：程序化图形",
    intro: "把距离场、重复、时间和配色组合成轨道动画和极坐标花瓣。",
    examples: [
      example("轨道与移动卫星", `${space}
  float radius = length(p);
  float orbit = 1.0 - smoothstep(0.003, 0.009, abs(radius - 0.34));
  vec2 moon = 0.34 * vec2(cos(u_time), sin(u_time));
  float moonMask = 1.0 - smoothstep(0.035, 0.042, distance(p, moon));
  float planet = 1.0 - smoothstep(0.125, 0.135, radius);
  vec3 color = vec3(0.04, 0.08, 0.16) + vec3(0.17, 0.38, 0.51) * orbit;
  color = mix(color, vec3(0.17, 0.73, 0.61), planet);
  color = mix(color, vec3(1.0, 0.75, 0.47), moonMask);
  fragColor = vec4(color, 1.0);`),
      example("极坐标彩色花瓣", `${space}
  float r = length(p);
  float angle = r > 0.0 ? atan(p.y, p.x + 0.000001) : 0.0;
  float petals = 0.30 + 0.09 * cos(6.0 * angle - u_time);
  float flower = 1.0 - smoothstep(-0.003, 0.003, r - petals);
  vec3 tint = mix(vec3(0.34, 0.45, 1.0), vec3(1.0, 0.48, 0.59), clamp(r * 2.8, 0.0, 1.0));
  fragColor = vec4(mix(vec3(0.06, 0.10, 0.19), tint, flower), 1.0);`),
    ],
    paragraphs: [
      "先给定背景色，再按遮罩混合轨道、行星和卫星。|mix| 的顺序决定叠放关系，后混合的形状盖在前面。",
      "|cos|、|sin| 给出单位圆上的点。乘以轨道半径就得到卫星中心，角度随时间的变化率决定卫星速度。",
      "花瓣使用 |length| 和双参数 |atan| 得到半径与角度。让边界半径随角度周期变化，就能形成以中心为起点的花瓣。",
    ],
  },
];
