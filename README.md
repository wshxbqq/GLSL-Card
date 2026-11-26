# GLSL 中文互动教程 · 开源书

用浏览器里的 WebGL 2 实验学习 GLSL ES 3.00。全书 10 章，每章有一张教学图、两个可运行示例和两个小节。每小节各有 3 道练习题，题目下可以展开提示。可以在页面上修改片元或顶点着色器，立即比较渲染结果，也能查看编译和链接错误。

[在线阅读与运行示例](https://wshxbqq.github.io/GLSL-Card/)

## 目录

| 章 | 主题 | 示例 |
| --- | --- | --- |
| 1 | [从一个像素开始](https://wshxbqq.github.io/GLSL-Card/#first-pixel) | 双色渐变、纯色填充 |
| 2 | [坐标、分辨率与宽高比](https://wshxbqq.github.io/GLSL-Card/#coordinates) | 等比例圆、UV 四象限 |
| 3 | [标量、向量与矩阵](https://wshxbqq.github.io/GLSL-Card/#types) | 通道重排、旋转条纹 |
| 4 | [遮罩、距离场与抗锯齿](https://wshxbqq.github.io/GLSL-Card/#masks) | 硬边与软边、偏心圆环 |
| 5 | [重复、网格与图案](https://wshxbqq.github.io/GLSL-Card/#patterns) | 棋盘格、重复圆点 |
| 6 | [时间、指针与 uniform](https://wshxbqq.github.io/GLSL-Card/#uniforms) | 指针光晕、行进波纹 |
| 7 | [纹理、采样与 UV](https://wshxbqq.github.io/GLSL-Card/#textures) | 原始纹理、偏移与重复采样 |
| 8 | [顶点、裁剪空间与插值](https://wshxbqq.github.io/GLSL-Card/#vertex) | 三角形颜色插值、插值等值线 |
| 9 | [随机、值噪声与叠加](https://wshxbqq.github.io/GLSL-Card/#noise) | 网格随机与平滑噪声、多层噪声云纹 |
| 10 | [综合练习](https://wshxbqq.github.io/GLSL-Card/#composition) | 轨道与移动卫星、极坐标彩色花瓣 |

## 本地阅读

在仓库根目录运行 Python 的静态服务器，再用支持 WebGL 2 的浏览器打开 <http://localhost:8000>。

```sh
python3 -m http.server 8000
```

在「示例」里切换实验，在源码区选择「片元」或「顶点」。编辑后点击「运行」，也可以在编辑器内按 Ctrl+Enter 或 Cmd+Enter。运行出错时会显示编译日志，并保留上一帧可用的渲染程序。「重置」恢复当前示例的源码。

章节正文和示例在 [book/chapters.js](book/chapters.js)，练习、提示和图注在 [book/study.js](book/study.js)，教学图在 [book/figures](book/figures)。配图由文生图模型生成，经逐张核对、裁切、缩放和 pngquant 压缩。

## 附录与规范

- [原始版本 · GLSL ES 1.00 中文手册](reference/glsl-es-100.md)收录项目最初的速查手册。
- [WebGL 2 规范](https://registry.khronos.org/webgl/specs/2.0/)与 [GLSL ES 3.00 规范](https://registry.khronos.org/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf)可用于查阅完整定义。

## 开源许可

新版章节正文、练习和图注采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。互动程序和着色器示例采用 [MIT](LICENSE)。原始版本、其中引用的材料以及生成配图按各自适用的权利与条款使用。

## 特别感谢

感谢**智审标（SmartBid）**。智审标提供招投标文件审查，支持核对资格条件、条款响应与报价，审查报告附原件页码供复核。

[智审标官网](https://biao.vvcut.cn/) · [智审标开源 Skill](https://github.com/wshxbqq/smartbid-tender-review)
