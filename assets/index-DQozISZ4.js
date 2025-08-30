(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))o(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const s of t.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&o(s)}).observe(document,{childList:!0,subtree:!0});function r(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function o(e){if(e.ep)return;e.ep=!0;const t=r(e);fetch(e.href,t)}})();const l=`attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`,a=`precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_texture;

void main() {
  vec2 I = gl_FragCoord.xy;
  vec2 uv = I / u_resolution.xy;
  uv.y = 1.0 - uv.y; // Y軸を反転
  
  // まずはテクスチャをそのまま表示
  vec4 texColor = texture2D(u_texture, uv);
  
  // テクスチャが読み込まれていない場合のフォールバック（赤色）
  if (texColor.rgb == vec3(1.0, 0.0, 0.0)) {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // 赤色表示
    return;
  }
  
  // 元のShadertoyエフェクト（軽量版）
  vec4 O = vec4(u_resolution.x, u_resolution.y, u_resolution.y, 0.0);
  O.xy -= I + I;
  O.xy /= O.z;
  
  for (int iter = 0; iter < 20; iter++) { // ループを軽量化
    O.w = float(iter);
    if (O.w >= 20.0) break;
    O.xy *= 0.1 * mat2(6.0, 8.0, -8.0, 6.0);
    O += cos(9.0 * vec4(O.w, O.x, O.y, O.z) + u_time) / 20.0;
  }
  
  // 時間変化する歪み効果
  float time = u_time * 1.5;
  float slowTime = u_time * 0.5;
  
  // 複数の波を重ね合わせた複雑な歪み
  vec2 distortedUV = uv;
  distortedUV.x += sin(uv.y * 12.0 + time) * 0.03 * sin(slowTime);
  distortedUV.y += cos(uv.x * 9.0 + time * 1.2) * 0.025 * cos(slowTime * 0.8);
  distortedUV.x += sin(uv.y * 25.0 + time * 2.0) * 0.01;
  distortedUV.y += cos(uv.x * 18.0 + time * 1.8) * 0.015;
  
  // さらなる歪みレイヤー
  vec2 distortedUV2 = uv;
  distortedUV2.x += cos(uv.y * 8.0 - time * 0.7) * 0.02;
  distortedUV2.y += sin(uv.x * 6.0 - time * 0.9) * 0.02;
  
  // 歪んだテクスチャを取得
  vec4 distortedTexColor = texture2D(u_texture, distortedUV);
  vec4 distortedTexColor2 = texture2D(u_texture, distortedUV2);
  
  // 時間変化するカラーパターン
  vec3 pattern = abs(O.rgb) * (2.5 + 0.3 * sin(slowTime));
  
  // 時間とともに変化するカラーミックス
  float colorCycle = sin(u_time * 1.2) * 0.5 + 1.0;
  float colorCycle2 = cos(u_time * 0.8) * 0.5 + 1.0;
  float colorCycle3 = sin(u_time * 1.5 + 8.0) * 0.5 + 1.0;
  
  vec3 color1 = vec3(0.0, 0.5 + colorCycle * 0.3, 0.1); // 緑系
  vec3 color2 = vec3(0.15 + colorCycle2 * 0.1, 0.0, 0.2); // 紫系
  vec3 color3 = vec3(0.4, 0.1 + colorCycle3 * 0.15, 0.0); // オレンジ系
  
  pattern = pattern * mix(mix(color1, color2, colorCycle), color3, colorCycle2);
  
  // テクスチャのブレンド
  vec3 blendedTex = mix(distortedTexColor.rgb, distortedTexColor2.rgb, 0.3);
  
  // 時間変化する強度でエフェクトを適用
  float effectStrength = 0.5 + 0.2 * sin(u_time * 9.6);
  vec3 finalColor = blendedTex + pattern * effectStrength;
  
  gl_FragColor = vec4(finalColor, 1.0);
}`;class c{constructor(){if(this.canvas=document.getElementById("canvas"),this.gl=this.canvas.getContext("webgl"),!this.gl)throw new Error("WebGL not supported");this.init()}init(){this.resizeCanvas(),window.addEventListener("resize",()=>this.resizeCanvas()),this.program=this.createProgram(l,a),this.setupBuffers(),this.loadTexture(),this.startTime=Date.now(),this.animate()}resizeCanvas(){this.canvas.width=window.innerWidth,this.canvas.height=window.innerHeight,this.gl.viewport(0,0,this.canvas.width,this.canvas.height)}createShader(i,r){const o=this.gl.createShader(i);return this.gl.shaderSource(o,r),this.gl.compileShader(o),this.gl.getShaderParameter(o,this.gl.COMPILE_STATUS)?o:(console.error("Shader compilation error:",this.gl.getShaderInfoLog(o)),this.gl.deleteShader(o),null)}createProgram(i,r){const o=this.createShader(this.gl.VERTEX_SHADER,i),e=this.createShader(this.gl.FRAGMENT_SHADER,r),t=this.gl.createProgram();return this.gl.attachShader(t,o),this.gl.attachShader(t,e),this.gl.linkProgram(t),this.gl.getProgramParameter(t,this.gl.LINK_STATUS)?t:(console.error("Program linking error:",this.gl.getProgramInfoLog(t)),null)}setupBuffers(){this.gl.useProgram(this.program);const i=[-1,-1,1,-1,-1,1,1,1],r=this.gl.createBuffer();this.gl.bindBuffer(this.gl.ARRAY_BUFFER,r),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array(i),this.gl.STATIC_DRAW);const o=this.gl.getAttribLocation(this.program,"a_position");this.gl.enableVertexAttribArray(o),this.gl.vertexAttribPointer(o,2,this.gl.FLOAT,!1,0,0),this.resolutionLocation=this.gl.getUniformLocation(this.program,"u_resolution"),this.timeLocation=this.gl.getUniformLocation(this.program,"u_time"),this.textureLocation=this.gl.getUniformLocation(this.program,"u_texture")}loadTexture(){const i=this.gl.createTexture();this.gl.bindTexture(this.gl.TEXTURE_2D,i),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,new Uint8Array([255,0,0,255]));const r=new Image;r.crossOrigin="anonymous",r.onload=()=>{console.log("Image loaded successfully:",r.width,"x",r.height),this.gl.bindTexture(this.gl.TEXTURE_2D,i),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.RGBA,this.gl.RGBA,this.gl.UNSIGNED_BYTE,r),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR),console.log("Texture setup complete")},r.onerror=()=>{console.error("Failed to load image: scream.png"),console.log("Make sure scream.png is in the public directory")},r.src="./img/scream.png",this.texture=i}animate(){const i=(Date.now()-this.startTime)*.001;this.gl.clearColor(0,0,0,1),this.gl.clear(this.gl.COLOR_BUFFER_BIT),this.gl.uniform2f(this.resolutionLocation,this.canvas.width,this.canvas.height),this.gl.uniform1f(this.timeLocation,i),this.gl.uniform1i(this.textureLocation,0),this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_2D,this.texture),this.gl.drawArrays(this.gl.TRIANGLE_STRIP,0,4),requestAnimationFrame(()=>this.animate())}}new c;
